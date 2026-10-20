import { genHealthRequest } from "./client";
import type { CatalogItem, CatalogKind } from "./types";

export type { CatalogItem, CatalogKind } from "./types";
export { formatPrice } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dollars(pricing: unknown): number | null {
  const record = asRecord(pricing);
  const amount = record?.amount ?? record?.lineTotal;
  if (typeof amount === "number" && Number.isFinite(amount)) return amount;
  if (typeof amount === "string" && amount.trim()) {
    const parsed = Number(amount);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function excludedStates(raw: unknown) {
  const record = asRecord(raw);
  const list = record?.excludedStates ?? record?.excluded_states;
  if (!Array.isArray(list)) return [];
  return list
    .map((code) => String(code).trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
}

function offerable(raw: Record<string, unknown>) {
  const status = str(raw.status).toLowerCase();
  if (status === "inactive" || status === "archived") return false;
  if (raw.showPatient === false) return false;
  if (raw.storefrontEligible === false) return false;
  return true;
}

function mapItem(raw: unknown, kind: CatalogKind): CatalogItem | null {
  const record = asRecord(raw);
  if (!record || !offerable(record)) return null;
  const clientProductId = str(record.clientProductId);
  if (!clientProductId) return null;
  const name = str(record.displayName) || str(record.name) || clientProductId;
  return {
    clientProductId,
    name,
    displayName: str(record.displayName) || name,
    kind,
    amount: dollars(record.pricing),
    status: str(record.status) || null,
    excludedStates: excludedStates(record),
  };
}

async function paginate(
  path: string,
  collectionKey: "products" | "labs",
  query: Record<string, string | undefined> = {},
): Promise<unknown[]> {
  const items: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const response = await genHealthRequest<Record<string, unknown>>(path, {
      query: { limit: "100", startAfter: cursor, ...query },
    });
    if (!response.success || !response.data) {
      if (page === 0 && response.status === 404) return [];
      if (page === 0) {
        throw new Error(response.error || `Failed to load ${collectionKey}.`);
      }
      break;
    }
    const batch = response.data[collectionKey];
    if (Array.isArray(batch)) items.push(...batch);
    const pagination = asRecord(response.data.pagination);
    const next = str(pagination?.nextStartAfter || pagination?.startAfter);
    if (!next || !Array.isArray(batch) || batch.length === 0) break;
    cursor = next;
  }
  return items;
}

function namedProduct(raw: unknown) {
  const record = asRecord(raw);
  const clientProductId = str(record?.clientProductId);
  if (!record || !clientProductId) return null;
  const name = str(record.displayName) || str(record.name);
  return name ? { clientProductId, name } : null;
}

export async function catalogProductNames(): Promise<Record<string, string>> {
  const [products, labs] = await Promise.all([
    paginate("/v2/client/products", "products"),
    paginate("/v2/client/labs", "labs"),
  ]);
  const names: Record<string, string> = {};
  for (const item of [...products, ...labs]) {
    const named = namedProduct(item);
    if (named) names[named.clientProductId] = named.name;
  }
  return names;
}

export type CatalogProductLabel = {
  name: string;
  category: string;
};

const categoryOrder = [
  "Hormone Therapy - Men",
  "Hormone Therapy - Women",
  "Sexual Health",
  "Weight Loss",
  "Longevity",
  "Peptides",
  "Labs",
];

function looksLikeId(value: string) {
  return /^prod_[a-z0-9_]+$/i.test(value) || /^[A-Za-z0-9]{16,}$/.test(value);
}

function readableName(record: Record<string, unknown>) {
  const name = str(record.displayName) || str(record.name);
  return name && !looksLikeId(name) ? name : "";
}

function preferLabel(
  current: (CatalogProductLabel & { active: boolean; months: number | null }) | undefined,
  next: CatalogProductLabel & { active: boolean; months: number | null },
) {
  if (!current?.name) return next;
  if (!next.name) return current;
  if (current.active !== next.active) return next.active ? next : current;
  if ((current.months === 1) !== (next.months === 1)) return next.months === 1 ? next : current;
  return current;
}

function rememberLabel(
  labels: Map<string, CatalogProductLabel & { active: boolean; months: number | null }>,
  key: string,
  label: CatalogProductLabel & { active: boolean; months: number | null },
) {
  if (!key) return;
  labels.set(key, preferLabel(labels.get(key), label));
}

/**
 * Names and categories for promo eligible-product ids.
 * Those ids are Gen Health productIds, including products that are no longer
 * storefront-active, so this list includes inactive rows.
 */
export async function catalogProductLabels(): Promise<Map<string, CatalogProductLabel>> {
  const [products, labs, categoryResponse] = await Promise.all([
    paginate("/v2/client/products", "products", { includeInactive: "true" }),
    paginate("/v2/client/labs", "labs", { includeInactive: "true" }),
    genHealthRequest<Record<string, unknown>>("/v2/client/categories"),
  ]);
  const categoryNames = new Map<string, string>();
  const categoryRows = asRecord(categoryResponse.data)?.categories;
  if (Array.isArray(categoryRows)) {
    for (const row of categoryRows) {
      const record = asRecord(row);
      const id = str(record?.categoryId);
      const name = str(record?.categoryName);
      if (id && name) categoryNames.set(id, name);
    }
  }

  const labels = new Map<string, CatalogProductLabel & { active: boolean; months: number | null }>();
  for (const item of [...products, ...labs]) {
    const record = asRecord(item);
    if (!record) continue;
    const name = readableName(record);
    if (!name) continue;
    const categoryIds = Array.isArray(record.displayCategoryIds) ? record.displayCategoryIds.map((id) => String(id)) : [];
    const category = categoryIds.map((id) => categoryNames.get(id)).find((value): value is string => Boolean(value)) || "";
    const months = typeof record.quantityMonths === "number" ? record.quantityMonths : null;
    const label = { name, category, active: str(record.status).toLowerCase() === "active", months };
    const keys = [str(record.productId), str(record.clientProductId), str(record.sourceProductId)];
    for (const key of keys) rememberLabel(labels, key, label);
  }

  const published = new Map<string, CatalogProductLabel>();
  for (const [key, label] of labels) published.set(key, { name: label.name, category: label.category });
  return published;
}

export function groupProductsByCategory(products: { id: string; name: string; category: string }[]) {
  const groups = new Map<string, { id: string; name: string }[]>();
  for (const product of products) {
    const category = product.category || "Other";
    const items = groups.get(category) ?? [];
    if (!items.some((item) => item.name === product.name)) items.push({ id: product.id, name: product.name });
    groups.set(category, items);
  }
  return [...groups.entries()]
    .sort((left, right) => {
      const rank = (name: string) => (name === "Other" ? categoryOrder.length + 1 : categoryOrder.indexOf(name) === -1 ? categoryOrder.length : categoryOrder.indexOf(name));
      return rank(left[0]) - rank(right[0]) || left[0].localeCompare(right[0], "en");
    })
    .map(([category, items]) => ({
      category,
      items: items.sort((left, right) => left.name.localeCompare(right.name, "en")),
    }));
}

export async function listCatalog(): Promise<CatalogItem[]> {
  const [products, labs] = await Promise.all([
    paginate("/v2/client/products", "products"),
    paginate("/v2/client/labs", "labs"),
  ]);
  const mapped = [
    ...products.map((item) => mapItem(item, "product")),
    ...labs.map((item) => mapItem(item, "lab")),
  ].filter((item): item is CatalogItem => Boolean(item));

  const byId = new Map<string, CatalogItem>();
  for (const item of mapped) byId.set(item.clientProductId, item);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type CheckoutCatalogProduct = {
  clientProductId: string;
  name: string;
  displayName: string;
  categoryNames: string[];
};

/**
 * Products the local checkout can sell.
 * That app ignores Gen Health's storefrontEligible flag, so this list keeps
 * products listCatalog() would drop for storefrontEligible or showPatient.
 * Inactive or uncategorized rows are still left out.
 * Lab panels that checkout can sell are product records, included here by id.
 */
export async function listCheckoutProducts(): Promise<CheckoutCatalogProduct[]> {
  const [rawProducts, categoryResponse] = await Promise.all([
    paginate("/v2/client/products", "products"),
    genHealthRequest<Record<string, unknown>>("/v2/client/categories"),
  ]);
  if (!categoryResponse.success || !categoryResponse.data) {
    throw new Error(categoryResponse.error || "Failed to load categories.");
  }
  const categoryRows = categoryResponse.data.categories;
  const categoryNames = new Map<string, string>();
  if (Array.isArray(categoryRows)) {
    for (const row of categoryRows) {
      const record = asRecord(row);
      if (!record || record.archived === true) continue;
      const id = str(record.categoryId);
      const name = str(record.categoryName);
      if (id && name) categoryNames.set(id, name);
    }
  }
  if (categoryNames.size === 0) throw new Error("Failed to load categories.");

  const items: CheckoutCatalogProduct[] = [];
  const seen = new Set<string>();
  for (const raw of rawProducts) {
    const record = asRecord(raw);
    if (!record) continue;
    const status = str(record.status).toLowerCase();
    if (status === "inactive" || status === "archived") continue;
    const clientProductId = str(record.clientProductId);
    if (!clientProductId || seen.has(clientProductId)) continue;
    const categoryIds = Array.isArray(record.categories) ? record.categories.map((id) => String(id)) : [];
    const names = categoryIds
      .map((id) => categoryNames.get(id))
      .filter((name): name is string => Boolean(name));
    if (names.length === 0) continue;
    seen.add(clientProductId);
    const displayName = str(record.displayName);
    const name = displayName || str(record.name) || clientProductId;
    items.push({
      clientProductId,
      name,
      displayName: displayName || name,
      categoryNames: names,
    });
  }
  return items;
}
