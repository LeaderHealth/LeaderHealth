import type { CatalogItem } from "./types";

const STOP_WORDS = new Set([
  "weight",
  "loss",
  "men",
  "women",
  "health",
  "sexual",
  "longevity",
  "hormone",
  "therapy",
  "products",
  "labs",
  "lab",
  "complete",
  "advanced",
  "trt",
  "hrt",
  "all",
  "and",
  "the",
  "for",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function matchCatalogItem(
  items: CatalogItem[],
  query: { product?: string; variant?: string; clientProductId?: string },
) {
  const list = Array.isArray(items) ? items : [];
  const id = query.clientProductId?.trim();
  if (id) {
    const exact = list.find((item) => item.clientProductId === id);
    if (exact) return exact;
  }

  const haystackQuery = [query.variant, query.product].filter(Boolean).join(" ");
  const queryTokens = tokens(haystackQuery);
  if (queryTokens.length === 0) return undefined;

  let best: { item: CatalogItem; score: number } | undefined;
  for (const item of list) {
    const hay = `${item.name} ${item.displayName} ${item.clientProductId}`.toLowerCase();
    const score = queryTokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0);
    if (score === 0) continue;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item;
}
