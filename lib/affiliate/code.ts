export const AFFILIATE_CODE = /^[a-z0-9-]{3,24}$/;

export function normalizeAffiliateCode(value: unknown) {
  if (typeof value !== "string") return null;
  const code = value.trim().toLowerCase();
  return AFFILIATE_CODE.test(code) ? code : null;
}

export function affiliatePath(value: unknown) {
  if (typeof value !== "string") return "/";
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("..")) return "/";
  if (/[\s?#]/.test(path) || !/^\/[A-Za-z0-9/_-]*$/.test(path)) return "/";
  return path.slice(0, 200);
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

export function normalizeCommissionPercent(value: unknown, fallback = 10) {
  if (value == null || value === "") return fallback;
  const percent = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  return Math.round(percent * 100) / 100;
}
