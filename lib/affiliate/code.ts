export const AFFILIATE_CODE = /^[a-z0-9-]{3,24}$/;

export function normalizeAffiliateCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().toLowerCase();
  return AFFILIATE_CODE.test(code) ? code : null;
}

export type AffiliateAttribution = {
  code: string | null;
  update: boolean;
};

// utm_source is the affiliate id. ref is used when utm_source is missing.
// When those two disagree, a stored id is left in place.
export function resolveAffiliateAttribution(ref: unknown, utmSource: unknown, stored?: unknown): AffiliateAttribution {
  const fromRef = normalizeAffiliateCode(ref);
  const fromSource = normalizeAffiliateCode(utmSource);
  const cookieCode = normalizeAffiliateCode(stored);

  if (fromSource && fromRef && fromSource !== fromRef) {
    if (cookieCode) return { code: cookieCode, update: false };
    return { code: fromSource, update: true };
  }

  if (fromSource) return { code: fromSource, update: true };
  if (fromRef) return { code: fromRef, update: true };

  if (cookieCode) return { code: cookieCode, update: false };
  return { code: null, update: false };
}

export function affiliatePath(value: unknown) {
  if (typeof value !== "string") return "/";
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("..")) return "/";
  if (/[\s?#]/.test(path) || !/^\/[A-Za-z0-9/_-]*$/.test(path)) return "/";
  return path.slice(0, 200);
}

export function affiliateReferrer(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  return `${url.origin}${url.pathname}`.slice(0, 200);
}

export function normalizeAffiliateName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) return null;
  return name;
}

export function normalizeAffiliateEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizeAffiliatePassword(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.length < 8 || value.length > 128 || !value.trim()) return null;
  return value;
}

export function normalizeCommissionPercent(value: unknown, fallback: number | null = 10) {
  if (value == null || value === "") return fallback;
  const percent = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  return Math.round(percent * 100) / 100;
}

export const DEFAULT_COMMISSION_PERCENT = 15;

export type CommissionMode = "default" | "percent" | "fixed";

export function normalizeCommissionMode(value: unknown): CommissionMode | null {
  if (value === "default" || value === "percent" || value === "fixed") return value;
  return null;
}

export function normalizeFixedCommissionCents(value: unknown) {
  if (value == null || value === "") return null;
  const raw = typeof value === "number" ? String(value) : String(value).trim().replace(/^\$/, "");
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars < 0 || dollars > 10000) return null;
  return Math.round(dollars * 100);
}

export function commissionForOrder(input: {
  mode: CommissionMode;
  percent: number;
  fixedCents: number;
  amountCents: number | null;
}) {
  if (input.amountCents == null) return 0;
  if (input.mode === "fixed") return Math.max(0, Math.round(input.fixedCents));
  return Math.round((input.amountCents * input.percent) / 100);
}
