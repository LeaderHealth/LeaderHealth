import { affiliateCampaign, applyAffiliateTracking } from "@/lib/affiliate/link";

export type HandoffLine = {
  slug: string;
  name: string;
  variant?: string;
  clientProductId?: string;
};

export type CheckoutProduct = {
  clientProductId: string;
  name: string;
  displayName: string;
  categoryNames: string[];
};

export type HandoffResult =
  | { ok: true; ids: string[] }
  | { ok: false; item: string; error: string };

const NOISE = new Set([
  "weight",
  "loss",
  "health",
  "sexual",
  "longevity",
  "hormone",
  "therapy",
  "trt",
  "hrt",
  "the",
  "and",
  "for",
  "with",
  "from",
  "starting",
  "online",
  "products",
  "product",
  "month",
  "months",
]);

function fold(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function words(value: string) {
  return fold(value).split(" ").filter((token) => token.length >= 2 && !NOISE.has(token));
}

type Audience = "men" | "women" | "both" | "none";

function audienceOf(text: string): Audience {
  const tokens = new Set(fold(text).split(" ").filter(Boolean));
  const women = tokens.has("women") || tokens.has("woman") || tokens.has("female");
  const men = tokens.has("men") || tokens.has("male");
  if (women && men) return "both";
  if (women) return "women";
  if (men) return "men";
  return "none";
}

function lineAudience(line: HandoffLine): Audience {
  if (line.slug.startsWith("men-")) return "men";
  if (line.slug.startsWith("women-")) return "women";
  return audienceOf(`${line.variant ?? ""} ${line.name}`);
}

function conflicts(wanted: Audience, found: Audience) {
  return (wanted === "men" && found === "women") || (wanted === "women" && found === "men");
}

function productText(product: CheckoutProduct) {
  return [product.name, product.displayName, product.clientProductId, ...product.categoryNames].join(" ");
}

function scoreProduct(query: string, queryTokens: string[], product: CheckoutProduct, wanted: Audience) {
  const text = productText(product);
  const found = audienceOf(text);
  if (conflicts(wanted, found)) return 0;

  const fields = [product.name, product.displayName, product.clientProductId.replace(/[_-]+/g, " ")].map(fold);
  if (fields.some((field) => field === query)) return 1000 + (found === wanted ? 50 : 0);

  const blobTokens = new Set(fold(text).split(" ").filter(Boolean));
  if (!queryTokens.length || !queryTokens.every((token) => blobTokens.has(token))) return 0;

  const extras = [...blobTokens].filter(
    (token) => token.length > 2 && !queryTokens.includes(token) && !NOISE.has(token),
  );
  let score = 700 - extras.length * 25;
  if (/\b3 months?\b|\bpif\b/.test(fold(text)) && !/\b3 months?\b/.test(query)) score -= 120;
  if (found === wanted && wanted !== "none") score += 100;
  return score;
}

export function matchCheckoutProduct(line: HandoffLine, products: CheckoutProduct[]) {
  const id = line.clientProductId?.trim();
  if (id && products.some((product) => product.clientProductId === id)) return id;

  const label = (line.variant || line.name).trim();
  const query = fold(label);
  const queryTokens = [...new Set([...words(label), ...words(line.slug)])];
  const wanted = lineAudience(line);
  let best: { id: string; score: number } | undefined;
  let second = 0;
  for (const product of products) {
    const score = scoreProduct(query, queryTokens, product, wanted);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      second = best?.score ?? 0;
      best = { id: product.clientProductId, score };
    } else if (score > second) {
      second = score;
    }
  }
  if (!best || best.score < 500) return null;
  if (second > 0 && best.score - second < 80) return null;
  return best.id;
}

export function resolveCartHandoff(
  lines: HandoffLine[],
  products: CheckoutProduct[],
): HandoffResult {
  const ids: string[] = [];
  for (const line of lines) {
    const item = line.name.trim() || line.slug;
    const id = matchCheckoutProduct(line, products);
    if (!id) return { ok: false, item, error: `Couldn't match ${item} to a checkout product.` };
    ids.push(id);
  }
  return { ok: true, ids };
}

const INTERNAL_CHECKOUT_ORIGIN =
  "https://leader-health-internal-checkout-page-git-main-leader-health.vercel.app";

function configuredStorefrontOrigin() {
  const configured =
    process.env.STOREFRONT_APP_ORIGIN?.trim() || process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN?.trim();
  if (!configured) return "";
  return configured.replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function storefrontAppOrigin() {
  const configured = configuredStorefrontOrigin();
  if (process.env.NODE_ENV === "development") {
    return configured && !isLocalOrigin(configured) ? configured : "http://localhost:8888";
  }
  if (configured && !isLocalOrigin(configured)) return configured;
  return INTERNAL_CHECKOUT_ORIGIN;
}

function applyCheckoutTracking(params: URLSearchParams, ref?: string, campaign?: string | null) {
  applyAffiliateTracking(params, ref, campaign);
  if (!affiliateCampaign(campaign)) params.delete("utm_campaign");
  params.delete("promo");
}

export function storefrontCheckoutUrl(ids: string[], ref?: string, campaign?: string | null) {
  const params = new URLSearchParams();
  for (const id of ids) params.append("product", id);
  applyCheckoutTracking(params, ref, campaign);
  const query = params.toString();
  return query ? `/checkout?${query}` : "/checkout";
}

export function embeddedCheckoutSrc(product: string | string[] | undefined, ref?: string, campaign?: string | null) {
  const params = new URLSearchParams();
  const ids = (Array.isArray(product) ? product : product ? [product] : []).filter(Boolean);
  for (const id of ids) params.append("product", id);
  applyCheckoutTracking(params, ref, campaign);
  params.set("embed", "1");
  return `${storefrontAppOrigin()}/checkout?${params.toString()}`;
}
