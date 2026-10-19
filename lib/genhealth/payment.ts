import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { genHealthRequest } from "./client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function patchOrderPaid(orderId: string, transactionId: string) {
  const id = orderId.trim();
  if (!id) throw new Error("Order id is required to record payment.");

  const body: Record<string, string> = { payment_status: "paid" };
  const tx = transactionId.trim();
  if (tx) body.transaction_id = tx;

  let lastError = "Could not record payment on the order.";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await genHealthRequest(`/v2/client/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
    if (response.success) return;

    lastError = response.error || lastError;
    if (response.status === 409 || /cannot be marked as paid/i.test(lastError)) {
      throw Object.assign(new Error(lastError), { status: response.status });
    }
    if (attempt < 3) await sleep(400 * attempt);
  }

    throw Object.assign(new Error(lastError), { status: 502 });
}

export type AttributedOrder = {
  orderId: string;
  code: string;
  amountCents: number | null;
  productName: string;
  createdAt: Date;
};

const ATTRIBUTION_KEYS = ["tracking", "utm", "utms", "attribution"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasAttributionField(order: Record<string, unknown>) {
  if (asString(order.utm_source)) return true;
  return ATTRIBUTION_KEYS.some((key) => asRecord(order[key]));
}

function utmSource(order: Record<string, unknown>) {
  const direct = asString(order.utm_source);
  if (direct) return direct;
  for (const key of ATTRIBUTION_KEYS) {
    const bag = asRecord(order[key]);
    if (!bag) continue;
    const source = asString(bag.utm_source) || asString(bag.source);
    if (source) return source;
    const nested = asRecord(bag.utm);
    const nestedSource = nested ? asString(nested.utm_source) || asString(nested.source) : "";
    if (nestedSource) return nestedSource;
  }
  return "";
}

function amountCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Number.isInteger(value) ? value : Math.round(value * 100);
}

function productName(order: Record<string, unknown>) {
  const direct = asString(order.productName) || asString(order.displayName);
  if (direct) return direct;
  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    const record = asRecord(item);
    const name = record ? asString(record.productName) || asString(record.displayName) : "";
    if (name) return name;
  }
  return "Order";
}

function orderTime(order: Record<string, unknown>) {
  for (const key of ["paymentDate", "purchaseDate", "createdAt"] as const) {
    const value = asString(order[key]);
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function mapPaidOrder(order: Record<string, unknown>, affiliateIds: ReadonlySet<string>): AttributedOrder | null {
  if (asString(order.paymentStatus).toLowerCase() !== "paid") return null;
  const code = normalizeAffiliateCode(utmSource(order));
  if (!code || !affiliateIds.has(code)) return null;
  const orderId = asString(order.orderId);
  const createdAt = orderTime(order);
  if (!orderId || !createdAt) return null;
  return {
    orderId,
    code,
    amountCents: amountCents(order.amount),
    productName: productName(order),
    createdAt,
  };
}

export async function listAttributedOrders(affiliateIds: ReadonlySet<string>): Promise<AttributedOrder[]> {
  const rows: AttributedOrder[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;

  for (let page = 0; page < 20; page += 1) {
    const response = await genHealthRequest<Record<string, unknown>>("/v2/client/orders", {
      query: { limit: "200", startAfter: cursor },
    });
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to load Gen Health orders.");
    }

    const batch = response.data.orders;
    const orders = Array.isArray(batch) ? batch.flatMap((item) => {
      const record = asRecord(item);
      return record ? [record] : [];
    }) : [];

    if (page === 0 && orders.length > 0 && !orders.some(hasAttributionField)) {
      console.warn("[affiliate] Gen Health order payload has no affiliate source");
      return [];
    }

    for (const order of orders) {
      const row = mapPaidOrder(order, affiliateIds);
      if (!row || seen.has(row.orderId)) continue;
      seen.add(row.orderId);
      rows.push(row);
    }

    const pagination = asRecord(response.data.pagination);
    const next = asString(pagination?.nextCursor || pagination?.nextStartAfter || pagination?.startAfter);
    const hasMore = pagination?.hasMore === true || (pagination?.hasMore == null && Boolean(next));
    if (!hasMore || !next || orders.length === 0) break;
    cursor = next;
  }

  return rows;
}
