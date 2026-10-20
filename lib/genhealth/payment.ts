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

export type PaidOrder = {
  orderId: string;
  amountCents: number | null;
  productName: string;
  createdAt: Date;
  source: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function customFieldSource(order: Record<string, unknown>) {
  const fields = asRecord(order.customFields);
  return fields ? asString(fields.utm_source) : "";
}

function fallbackSource(order: Record<string, unknown>) {
  return normalizeAffiliateCode(asString(order.utm_source)) || normalizeAffiliateCode(customFieldSource(order)) || "";
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

function mapPaidOrder(order: Record<string, unknown>): PaidOrder | null {
  if (asString(order.paymentStatus).toLowerCase() !== "paid") return null;
  const orderId = asString(order.orderId);
  const createdAt = orderTime(order);
  if (!orderId || !createdAt) return null;
  return {
    orderId,
    amountCents: amountCents(order.amount),
    productName: productName(order),
    createdAt,
    source: fallbackSource(order),
  };
}

export async function listPaidOrders(): Promise<PaidOrder[]> {
  const rows: PaidOrder[] = [];
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

    for (const order of orders) {
      const row = mapPaidOrder(order);
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

function orderRecord(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return null;
  const nested = asRecord(data.order);
  if (nested) return nested;
  if (Array.isArray(data.orders)) {
    const first = asRecord(data.orders[0]);
    if (first) return first;
  }
  if (asString(data.orderId) || asString(data.paymentStatus)) return data;
  return null;
}

export async function getPaidOrder(orderId: string): Promise<PaidOrder | null> {
  const id = orderId.trim();
  if (!id) return null;

  try {
    const response = await genHealthRequest<Record<string, unknown>>(
      `/v2/client/orders/${encodeURIComponent(id)}`,
    );
    if (!response.success || !response.data) {
      console.error("[affiliate] Gen Health order lookup failed", id, response.error || response.status);
      return null;
    }
    const record = orderRecord(response.data);
    if (!record) return null;
    const order = asString(record.orderId) ? record : { ...record, orderId: id };
    return mapPaidOrder(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health order lookup failed", id, message);
    return null;
  }
}
