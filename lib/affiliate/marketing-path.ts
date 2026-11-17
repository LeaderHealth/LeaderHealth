const EXACT = new Set([
  "/",
  "/shop-all-products",
  "/shop-men-products",
  "/shop-women-products",
  "/products",
  "/aboutus",
  "/faq",
  "/contact-us",
  "/blogs",
  "/articles",
  "/energy-longevity",
  "/advanced-peptides",
  "/labs",
]);

function allowedPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function marketingPayPath(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("..")) return null;
  const path = raw.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.length > 200) return null;
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (normalized.startsWith("/checkout") || normalized.startsWith("/admin") || normalized.startsWith("/affiliates") || normalized.startsWith("/api")) return null;
  if (EXACT.has(normalized)) return normalized;
  if (allowedPrefix(normalized, "/products") || allowedPrefix(normalized, "/articles") || allowedPrefix(normalized, "/labs")) return normalized;
  return null;
}

export function marketingVisitorAllowed(userAgent: unknown) {
  if (typeof userAgent !== "string") return false;
  const agent = userAgent.trim();
  if (agent.length < 12 || agent.length > 400) return false;
  return !/bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|python|headless/i.test(agent);
}

export function marketingEventId(input: { code: string; visitorId: string; kind: string; path: string; day: string; placement?: string }) {
  const place = input.kind === "impression" ? input.placement || "site" : input.path.replace(/\//g, "_");
  return `${input.code}_${input.visitorId}_${input.kind}_${place}_${input.day}`.slice(0, 700);
}

export function shouldRecordMarketingEvent(input: { alreadyRecorded: boolean; kind: string; clickRecorded: boolean }) {
  if (input.alreadyRecorded) return false;
  if (input.kind === "page_view" && input.clickRecorded) return false;
  return true;
}

export function marketingPlacementId(value: unknown) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[a-z0-9-]{2,40}$/.test(raw) ? raw : null;
}
