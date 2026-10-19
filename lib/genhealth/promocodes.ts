import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { genHealthRequest } from "./client";
import { formatPrice } from "./types";

export type PromoAffiliate = {
  affiliateId: string;
  utmSlug: string;
};

export type PromoCodeRow = {
  code: string;
  affiliates: PromoAffiliate[];
  slugs: string[];
  mode: "Locked" | "Shared" | "Unassigned";
  discount:
    | { kind: "percent"; label: string }
    | { kind: "price"; amount: string }
    | { kind: "unknown"; label: string };
  scope: string;
  usage: string;
  validUntil: string;
  statusLabel: "Active" | "Inactive" | "Expired";
  activeInGenHealth: boolean;
};

export class PromoCodeError extends Error {
  code: "promo" | "affiliate" | "assign" | "clear";

  constructor(code: PromoCodeError["code"], message: string) {
    super(message);
    this.name = "PromoCodeError";
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function modeOf(value: unknown): PromoCodeRow["mode"] {
  const mode = str(value).toLowerCase();
  if (mode === "locked") return "Locked";
  if (mode === "shared") return "Shared";
  return "Unassigned";
}

function affiliatesOf(value: unknown): PromoAffiliate[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const affiliates: PromoAffiliate[] = [];
  for (const item of value) {
    const record = asRecord(item);
    const utmSlug = str(record?.utmSlug);
    const key = utmSlug.toLowerCase();
    if (!utmSlug || seen.has(key)) continue;
    seen.add(key);
    affiliates.push({ affiliateId: str(record?.affiliateId), utmSlug });
  }
  return affiliates;
}

function sameSlug(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function promoPath(code: string) {
  return `/v2/client/promocodes/${encodeURIComponent(code)}`;
}

function normalizePromoCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim();
  if (!code || code.length > 80 || /[\u0000-\u001f]/.test(code)) return null;
  return code;
}

function assignmentRow(affiliate: PromoAffiliate) {
  const row: { utmSlug: string; affiliateId?: string } = { utmSlug: affiliate.utmSlug };
  if (affiliate.affiliateId) row.affiliateId = affiliate.affiliateId;
  return row;
}

function discountOf(value: unknown): PromoCodeRow["discount"] {
  const discount = asRecord(value);
  const type = str(discount?.type).toLowerCase();
  const amount = num(discount?.value);
  if (type === "percentage_off" && amount != null) return { kind: "percent", label: `${amount}%` };
  if (type === "set_price" && amount != null) return { kind: "price", amount: formatPrice(amount) };
  return { kind: "unknown", label: type || "—" };
}

function scopeOf(value: unknown) {
  const count = Array.isArray(value) ? value.length : 0;
  return `${count} ${count === 1 ? "product" : "products"}`;
}

function usageOf(usageCount: unknown, maxUsage: unknown) {
  const used = num(usageCount) ?? 0;
  const cap = num(maxUsage);
  return `${used} used · ${cap == null ? "Unlimited" : cap}`;
}

function validUntil(value: unknown) {
  const endsAt = str(asRecord(value)?.endsAt);
  if (!endsAt) return { label: "Unlimited", expired: false };
  const date = new Date(endsAt);
  if (Number.isNaN(date.getTime())) return { label: "Unlimited", expired: false };
  const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  return { label, expired: date.getTime() < Date.now() };
}

function mapRow(raw: unknown): PromoCodeRow | null {
  const record = asRecord(raw);
  const code = str(record?.code);
  if (!record || !code) return null;
  const status = str(record.status).toLowerCase();
  const until = validUntil(record.validity);
  const active = status === "active";
  const affiliates = affiliatesOf(record.affiliates);
  return {
    code,
    affiliates,
    slugs: affiliates.map((affiliate) => affiliate.utmSlug),
    mode: modeOf(record.assignmentType),
    discount: discountOf(record.discount),
    scope: scopeOf(record.eligibleClientProductIds),
    usage: usageOf(record.usageCount, record.maxUsage),
    validUntil: until.label,
    statusLabel: until.expired ? "Expired" : active ? "Active" : "Inactive",
    activeInGenHealth: until.expired && active,
  };
}

export async function listPromoCodes(): Promise<PromoCodeRow[]> {
  const rows: PromoCodeRow[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const response = await genHealthRequest<Record<string, unknown>>("/v2/client/promocodes", {
      query: { limit: "200", startAfter: cursor },
    });
    if (!response.success || !response.data) {
      if (page === 0 && response.status === 404) return [];
      throw new Error(response.error || "Failed to load promo codes.");
    }

    const batch = response.data.promocodes;
    if (Array.isArray(batch)) {
      for (const item of batch) {
        const row = mapRow(item);
        if (!row || seen.has(row.code)) continue;
        seen.add(row.code);
        rows.push(row);
      }
    }

    const pagination = asRecord(response.data.pagination);
    const next = str(pagination?.nextCursor || pagination?.nextStartAfter || pagination?.startAfter);
    const hasMore = pagination?.hasMore === true || (pagination?.hasMore == null && Boolean(next));
    if (!hasMore || !next || !Array.isArray(batch) || batch.length === 0) break;
    cursor = next;
  }

  return rows;
}

async function loadPromoAssignment(code: string) {
  const response = await genHealthRequest<Record<string, unknown>>(promoPath(code));
  if (!response.success || !response.data) {
    if (response.status === 404) throw new PromoCodeError("promo", "That promo code was not found.");
    throw new PromoCodeError("assign", response.error || "Could not update that promo code.");
  }
  const promo = asRecord(response.data.promocode) ?? response.data;
  const assignmentType = str(promo.assignmentType).toLowerCase();
  const mode = assignmentType === "locked" || assignmentType === "shared" ? assignmentType : "unassigned";
  return { mode, affiliates: affiliatesOf(promo.affiliates) };
}

async function patchPromoCode(code: string, body: Record<string, unknown>) {
  const response = await genHealthRequest(promoPath(code), { method: "PATCH", body });
  if (!response.success) {
    if (response.status === 404) throw new PromoCodeError("promo", "That promo code was not found.");
    throw new PromoCodeError("assign", response.error || "Could not update that promo code.");
  }
}

function requireAssignment(code: unknown, affiliateCode: unknown) {
  const promoCode = normalizePromoCode(code);
  const affiliate = normalizeAffiliateCode(affiliateCode);
  if (!promoCode) throw new PromoCodeError("promo", "That promo code was not found.");
  if (!affiliate) throw new PromoCodeError("affiliate", "Choose an affiliate account.");
  return { promoCode, affiliate };
}

export async function assignPromoCode(code: unknown, affiliateCode: unknown) {
  const { promoCode, affiliate } = requireAssignment(code, affiliateCode);
  const current = await loadPromoAssignment(promoCode);
  const already = current.affiliates.some((item) => sameSlug(item.utmSlug, affiliate));

  if (current.mode === "shared") {
    if (already) return;
    await patchPromoCode(promoCode, {
      assignmentType: "shared",
      affiliates: [...current.affiliates.map(assignmentRow), { affiliateId: affiliate, utmSlug: affiliate }],
    });
    return;
  }

  if (already && current.affiliates.length === 1) return;
  await patchPromoCode(promoCode, { utmSlug: affiliate, affiliateId: affiliate });
}

export async function unassignPromoCode(code: unknown, affiliateCode: unknown) {
  const { promoCode, affiliate } = requireAssignment(code, affiliateCode);
  const current = await loadPromoAssignment(promoCode);
  const assigned = current.affiliates.some((item) => sameSlug(item.utmSlug, affiliate));
  if (!assigned) throw new PromoCodeError("clear", "That affiliate is not assigned to this promo code.");

  if (current.mode === "shared") {
    await patchPromoCode(promoCode, {
      assignmentType: "shared",
      affiliates: current.affiliates.filter((item) => !sameSlug(item.utmSlug, affiliate)).map(assignmentRow),
    });
    return;
  }

  await patchPromoCode(promoCode, { utmSlug: "" });
}

export function campaignForAffiliate(codes: PromoCodeRow[], affiliateCode: string) {
  const campaigns = promoCodesForAffiliate(codes, affiliateCode)
    .map((code) => code.trim())
    .filter((code) => code.length > 0 && code.length <= 80 && !/[\u0000-\u001f]/.test(code))
    .sort((left, right) => left.localeCompare(right, "en"));
  return campaigns[0] ?? null;
}

export async function campaignForAffiliateCode(affiliateCode: string) {
  try {
    return campaignForAffiliate(await listPromoCodes(), affiliateCode);
  } catch {
    return null;
  }
}

export function promoCodesForAffiliate(codes: PromoCodeRow[], affiliateCode: string) {
  return codes
    .filter((promo) => promo.affiliates.some((item) => sameSlug(item.utmSlug, affiliateCode)))
    .map((promo) => promo.code);
}

export function assignmentNames(promo: PromoCodeRow, accounts: { code: string; name: string }[]) {
  return promo.affiliates.map((item) => {
    const account = accounts.find((entry) => sameSlug(entry.code, item.utmSlug));
    return account?.name || item.utmSlug;
  });
}
