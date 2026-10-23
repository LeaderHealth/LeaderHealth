import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYMENT_EVENT = "order.payment_succeeded";
export const STATUS_EVENT = "order.status_updated";

const SIGNATURE_HEADERS = ["x-genhealth-signature", "x-gen-health-signature", "x-webhook-signature", "webhook-signature"];

type HeaderSource = { get(name: string): string | null };

export type WebhookOrder = {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  amountCents: number | null;
  occurredAt?: Date;
  present: {
    orderId: boolean;
    paymentStatus: boolean;
    orderStatus: boolean;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function payloadRecords(body: unknown) {
  const record = asRecord(body);
  if (!record) return [];
  const data = asRecord(record.data);
  const order = asRecord(record.order) ?? (data ? asRecord(data.order) : null);
  return [record, data, order].filter((item): item is Record<string, unknown> => item != null);
}

function firstText(body: unknown, keys: string[]) {
  for (const record of payloadRecords(body)) {
    for (const key of keys) {
      const value = text(record[key]);
      if (value) return value;
    }
  }
  return "";
}

function amountCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function firstAmount(body: unknown) {
  for (const record of payloadRecords(body)) {
    const amount = amountCents(record.amount);
    if (amount != null) return amount;
  }
  return null;
}

function occurredAt(value: unknown) {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function webhookEvent(body: unknown, headerEvent: string | null) {
  const record = asRecord(body);
  return text(record?.event) || text(record?.type) || headerEvent?.trim() || "";
}

export function webhookOrder(body: unknown): WebhookOrder {
  const orderId = firstText(body, ["orderId", "order_id"]);
  const paymentStatus = firstText(body, ["paymentStatus", "payment_status"]).toLowerCase();
  const orderStatus = firstText(body, ["orderStatus", "order_status"]).toLowerCase();
  const occurred = payloadRecords(body).map((record) => occurredAt(record.occurredAt)).find((value) => value);
  return {
    orderId,
    paymentStatus,
    orderStatus,
    amountCents: firstAmount(body),
    occurredAt: occurred,
    present: {
      orderId: Boolean(orderId),
      paymentStatus: Boolean(paymentStatus),
      orderStatus: Boolean(orderStatus),
    },
  };
}

export function refundSignal(event: string, order: WebhookOrder) {
  return /refund/i.test(event) || order.paymentStatus.includes("refund") || order.orderStatus.includes("refund");
}

export function settlesOrder(event: string, order: WebhookOrder) {
  return event === STATUS_EVENT || refundSignal(event, order);
}

function signatureValues(header: string) {
  return header
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .flatMap((part) => {
      if (!part || part === "v1") return [];
      const value = part.startsWith("sha256=") ? part.slice("sha256=".length) : part.startsWith("v1=") ? part.slice("v1=".length) : part.startsWith("v1,") ? part.slice("v1,".length) : part;
      return value ? [value] : [];
    });
}

function sameSignature(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function rawBodyMatches(raw: string, header: string, secret: string) {
  const hex = createHmac("sha256", secret).update(raw).digest("hex");
  const base64 = createHmac("sha256", secret).update(raw).digest("base64");
  return signatureValues(header).some((value) => {
    const hexSignature = /^[0-9a-f]+$/i.test(value);
    const actual = hexSignature ? value.toLowerCase() : value;
    return sameSignature(actual, hexSignature ? hex : base64);
  });
}

function standardWebhooksMatch(headers: HeaderSource, raw: string, secret: string) {
  if (!secret.startsWith("whsec_")) return false;
  const id = headers.get("webhook-id")?.trim();
  const timestamp = headers.get("webhook-timestamp")?.trim();
  const header = headers.get("webhook-signature")?.trim();
  if (!id || !timestamp || !header) return false;
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  return signatureValues(header).some((value) => sameSignature(value, expected));
}

export function webhookSigned(headers: HeaderSource, raw: string, secret: string) {
  if (standardWebhooksMatch(headers, raw, secret)) return true;
  return SIGNATURE_HEADERS.some((name) => {
    const header = headers.get(name)?.trim();
    return Boolean(header && rawBodyMatches(raw, header, secret));
  });
}
