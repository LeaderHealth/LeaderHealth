import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { affiliateCampaign } from "@/lib/affiliate/link";
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
  productIds: string[];
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

function affiliatesFromRecord(record: Record<string, unknown>) {
  const listed = affiliatesOf(record.affiliates);
  if (listed.length) return listed;
  const utmSlug = str(record.utmSlug);
  if (!utmSlug) return [];
  return [{ affiliateId: str(record.affiliateId), utmSlug }];
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

function productIdsOf(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of value) {
    const id = str(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function scopeOf(value: unknown) {
  const count = productIdsOf(value).length;
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
  const affiliates = affiliatesFromRecord(record);
  return {
    code,
    affiliates,
    slugs: affiliates.map((affiliate) => affiliate.utmSlug),
    mode: modeOf(record.assignmentType),
    discount: discountOf(record.discount),
    scope: scopeOf(record.eligibleClientProductIds),
    productIds: productIdsOf(record.eligibleClientProductIds),
    usage: usageOf(record.usageCount, record.maxUsage),
    validUntil: until.label,
    statusLabel: !active ? "Inactive" : until.expired ? "Expired" : "Active",
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
  return { mode, affiliates: affiliatesFromRecord(promo) };
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

export type PromoAssignmentResult = {
  releasedCodes: string[];
  replacedAffiliates: string[];
};

export async function assignPromoCode(code: unknown, affiliateCode: unknown): Promise<PromoAssignmentResult> {
  const { promoCode, affiliate } = requireAssignment(code, affiliateCode);
  const catalog = await listPromoCodes();
  const current = promoByCode(catalog, promoCode);
  const currentSlugs = current ? lockedSlugs(current) : [];
  const alreadySole = current?.mode === "Locked" && currentSlugs.length === 1 && currentSlugs[0] === affiliate;
  const released = catalog.filter(
    (promo) => !sameSlug(promo.code, promoCode) && promo.affiliates.some((item) => sameSlug(item.utmSlug, affiliate)),
  );
  const replaced = alreadySole
    ? []
    : (current?.affiliates ?? []).flatMap((item) => {
        const slug = normalizeAffiliateCode(item.utmSlug);
        return slug && slug !== affiliate ? [slug] : [];
      });

  for (const previous of released) {
    await unassignPromoCode(previous.code, affiliate);
  }
  if (!alreadySole) {
    await patchPromoCode(promoCode, {
      assignmentType: "locked",
      utmSlug: affiliate,
      affiliateId: affiliate,
      affiliates: [{ affiliateId: affiliate, utmSlug: affiliate }],
    });
  }
  return { releasedCodes: released.map((promo) => promo.code), replacedAffiliates: replaced };
}

export async function unassignPromoCode(code: unknown, affiliateCode: unknown) {
  const { promoCode, affiliate } = requireAssignment(code, affiliateCode);
  const current = await loadPromoAssignment(promoCode);
  const assigned = current.affiliates.some((item) => sameSlug(item.utmSlug, affiliate));
  if (!assigned) throw new PromoCodeError("clear", "That affiliate is not assigned to this promo code.");

  const kept = current.affiliates.filter((item) => !sameSlug(item.utmSlug, affiliate));
  const patch = promoRemovalPatch(kept);
  if (!patch) throw new PromoCodeError("assign", "Could not update that promo code.");
  await patchPromoCode(promoCode, patch);
}

export function promoRemovalPatch(kept: PromoAffiliate[]): Record<string, unknown> | null {
  if (kept.length === 0) {
    return { assignmentType: "locked", affiliates: [], utmSlug: null, affiliateId: null };
  }
  if (kept.length === 1) {
    const holder = kept[0];
    const slug = holder.utmSlug.trim();
    if (!slug) return null;
    return {
      assignmentType: "locked",
      affiliates: [assignmentRow(holder)],
      utmSlug: slug,
      affiliateId: holder.affiliateId.trim() || slug,
    };
  }
  return { affiliates: kept.map(assignmentRow) };
}

export function promoRowsForAffiliate(codes: PromoCodeRow[], affiliateCode: string) {
  const affiliate = normalizeAffiliateCode(affiliateCode);
  if (!affiliate) return [];
  return codes
    .filter(
      (promo) =>
        promo.statusLabel !== "Inactive" &&
        promo.mode === "Locked" &&
        lockedSlugs(promo).length === 1 &&
        lockedSlugs(promo)[0] === affiliate,
    )
    .sort((left, right) => left.code.localeCompare(right.code, "en"));
}

export function promoCodesForAffiliate(codes: PromoCodeRow[], affiliateCode: string) {
  return promoRowsForAffiliate(codes, affiliateCode).map((promo) => promo.code);
}

function lockedSlugs(promo: PromoCodeRow) {
  const slugs = promo.affiliates.flatMap((item) => {
    const slug = normalizeAffiliateCode(item.utmSlug);
    return slug ? [slug] : [];
  });
  return [...new Set(slugs)];
}

export function promoByCode(codes: PromoCodeRow[], code: string) {
  const wanted = code.trim().toLowerCase();
  if (!wanted) return null;
  return codes.find((promo) => promo.code.trim().toLowerCase() === wanted) ?? null;
}

export function personalAffiliateForCode(promo: PromoCodeRow | null, activeIds: ReadonlySet<string>) {
  if (!promo || promo.mode !== "Locked") return null;
  const slugs = lockedSlugs(promo);
  if (slugs.length !== 1 || !activeIds.has(slugs[0])) return null;
  return slugs[0];
}

export function personalPromoForAffiliate(codes: PromoCodeRow[], affiliateCode: string) {
  return promoRowsForAffiliate(codes, affiliateCode)[0] ?? null;
}

export function creditedAffiliate(personal: string | null, tracked: string | null) {
  if (personal) return personal;
  return tracked || "";
}

export function assignedCampaign(codes: PromoCodeRow[], affiliateCode: string, campaign: unknown) {
  const affiliate = normalizeAffiliateCode(affiliateCode);
  const requested = affiliateCampaign(campaign);
  if (!affiliate || !requested) return null;
  const match = promoRowsForAffiliate(codes, affiliate).find((promo) => sameSlug(promo.code, requested));
  return match?.code ?? null;
}

export async function assignedCampaignForAffiliate(affiliateCode: string, campaign: unknown) {
  if (!affiliateCampaign(campaign)) return null;
  try {
    return assignedCampaign(await listPromoCodes(), affiliateCode, campaign);
  } catch {
    return null;
  }
}

export function assignmentNames(promo: PromoCodeRow, accounts: { code: string; name: string }[]) {
  return promo.affiliates.map((item) => {
    const account = accounts.find((entry) => sameSlug(entry.code, item.utmSlug));
    return account?.name || item.utmSlug;
  });
}
