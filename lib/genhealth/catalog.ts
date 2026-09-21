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

async function paginate(path: string, collectionKey: "products" | "labs"): Promise<unknown[]> {
  const items: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page += 1) {
    const response = await genHealthRequest<Record<string, unknown>>(path, {
            query: { limit: "100", startAfter: cursor },
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
