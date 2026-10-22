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
  promoCode: string;
};

export type OrderRefund = {
  id: string;
  amountCents: number;
};

export type ClientOrder = PaidOrder & {
  paymentStatus: string;
  refundedAmountCents: number | null;
  refunds: OrderRefund[];
  fullyRefunded: boolean;
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

function orderPromoCode(order: Record<string, unknown>) {
  const fields = asRecord(order.customFields);
  const promo = asRecord(order.promo) ?? asRecord(order.promocode);
  const values = [
    order.promoCode,
    order.promocode,
    order.promo_code,
    order.couponCode,
    order.discountCode,
    promo?.code,
    promo?.promoCode,
    fields?.promoCode,
    fields?.promo,
  ];
  for (const value of values) {
    const code = asString(value);
    if (code) return code;
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

function refundsOf(order: Record<string, unknown>): OrderRefund[] {
  const rows: OrderRefund[] = [];
  for (const list of [order.refunds, order.refundList]) {
    if (!Array.isArray(list)) continue;
    list.forEach((item, index) => {
      const record = asRecord(item);
      if (!record) return;
      const amount =
        amountCents(record.amount) ??
        amountCents(record.amountCents) ??
        amountCents(record.refundedAmount) ??
        amountCents(record.refundAmount);
      if (amount == null || amount <= 0) return;
      const id = asString(record.id) || asString(record.refundId) || asString(record.refund_id) || `refund-${index + 1}`;
      rows.push({ id, amountCents: amount });
    });
  }
  return rows;
}

function refundedAmountOf(order: Record<string, unknown>) {
  for (const key of ["refundedAmount", "refunded_amount", "refundAmount", "amountRefunded", "totalRefunded", "refundedAmountCents"]) {
    const amount = amountCents(order[key]);
    if (amount != null) return amount;
  }
  return null;
}

function fullyRefunded(status: string, refunded: number | null, original: number | null) {
  if (status === "refunded" || status === "fully_refunded" || status === "full_refund") return true;
  return original != null && original > 0 && refunded != null && refunded >= original;
}

export function attributableOrderStatus(status: string) {
  return status === "paid" || status === "partially_refunded" || status === "partial_refund" || status === "partially refunded";
}

function mapClientOrder(order: Record<string, unknown>): ClientOrder | null {
  const paymentStatus = asString(order.paymentStatus).toLowerCase();
  const orderId = asString(order.orderId);
  const createdAt = orderTime(order);
  if (!orderId || !createdAt) return null;
  const amount = amountCents(order.amount);
  const refunds = refundsOf(order);
  const refundedAmountCents = refundedAmountOf(order);
  const refundedFromList = refunds.reduce((sum, refund) => sum + refund.amountCents, 0);
  const hasRefund = paymentStatus.includes("refund") || (refundedAmountCents != null && refundedAmountCents > 0) || refunds.length > 0;
  if (!attributableOrderStatus(paymentStatus) && !hasRefund) return null;
  return {
    orderId,
    amountCents: amount,
    productName: productName(order),
    createdAt,
    source: fallbackSource(order),
    promoCode: orderPromoCode(order),
    paymentStatus,
    refundedAmountCents,
    refunds,
    fullyRefunded: fullyRefunded(paymentStatus, refundedAmountCents ?? (refundedFromList > 0 ? refundedFromList : null), amount),
  };
}

export async function listClientOrders(): Promise<ClientOrder[]> {
  const rows: ClientOrder[] = [];
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
      const row = mapClientOrder(order);
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

export async function listPaidOrders(): Promise<PaidOrder[]> {
  const orders = await listClientOrders();
  return orders.filter((order) => attributableOrderStatus(order.paymentStatus));
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

async function fetchClientOrder(orderId: string): Promise<ClientOrder | null> {
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
    return mapClientOrder(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health order lookup failed", id, message);
    return null;
  }
}

export async function getPaidOrder(orderId: string): Promise<PaidOrder | null> {
  const order = await fetchClientOrder(orderId);
  return order && attributableOrderStatus(order.paymentStatus) ? order : null;
}

export async function getOrderSettlement(orderId: string): Promise<ClientOrder | null> {
  return fetchClientOrder(orderId);
}
