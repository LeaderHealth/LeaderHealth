import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { attributeWebhookPaidOrder } from "@/lib/affiliate/sales";
import { deliverPreviousWeekSalesNotices } from "@/lib/affiliate/weekly-sales";

export const runtime = "nodejs";

const PAYMENT_EVENT = "order.payment_succeeded";
const SIGNATURE_HEADERS = ["x-genhealth-signature", "x-gen-health-signature", "x-webhook-signature", "webhook-signature"];

function webhookSecret() {
  return process.env.GEN_HEALTH_WEBHOOK_SECRET?.trim() ?? "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function webhookEvent(request: Request, body: unknown) {
  const fromBody = text(asRecord(body)?.event);
  if (fromBody) return fromBody;
  return request.headers.get("x-webhook-event")?.trim() ?? "";
}

function amountCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function occurredAt(value: unknown) {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function paymentEvent(body: unknown) {
  const record = asRecord(body);
  if (!record) return null;
  return {
    orderId: text(record.orderId),
    paymentStatus: text(record.paymentStatus).toLowerCase(),
    amountCents: amountCents(record.amount),
    occurredAt: occurredAt(record.occurredAt),
  };
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

function signatureMatches(raw: string, header: string, secret: string) {
  const hex = createHmac("sha256", secret).update(raw).digest("hex");
  const base64 = createHmac("sha256", secret).update(raw).digest("base64");
  return signatureValues(header).some((value) => {
    const hexSignature = /^[0-9a-f]+$/i.test(value);
    const actual = hexSignature ? value.toLowerCase() : value;
    const expected = hexSignature ? hex : base64;
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}

function signed(request: Request, raw: string, secret: string) {
  return SIGNATURE_HEADERS.some((name) => {
    const header = request.headers.get(name)?.trim();
    return Boolean(header && signatureMatches(raw, header, secret));
  });
}

export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Gen Health webhooks are not configured." }, { status: 503 });
  }

  const raw = await request.text();
  if (!signed(request, raw, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid webhook payload." }, { status: 400 });
    }
  }

  if (webhookEvent(request, body) !== PAYMENT_EVENT) return NextResponse.json({ ok: true, ignored: true });

  const payment = paymentEvent(body);
  if (!payment?.orderId || payment.paymentStatus !== "paid") {
    return NextResponse.json({ ok: true, result: payment?.orderId ? "unpaid" : "ignored" });
  }

  try {
    const result = await attributeWebhookPaidOrder(payment);
    if (result === "unavailable") {
      return NextResponse.json({ ok: false, error: "Affiliate recording is unavailable." }, { status: 503 });
    }
    await deliverPreviousWeekSalesNotices().catch((error: unknown) => {
      console.error("[affiliate] weekly sales notice failed", error instanceof Error ? error.message : "unknown");
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[affiliate] Gen Health webhook failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not record the sale." }, { status: 502 });
  }
}
