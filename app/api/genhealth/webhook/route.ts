import { NextResponse } from "next/server";
import { attributePaidGenHealthOrder, attributeWebhookPaidOrder, syncOrderRefund } from "@/lib/affiliate/sales";
import { PAYMENT_EVENT, settlesOrder, webhookEvent, webhookOrder, webhookSigned } from "@/lib/genhealth/webhook";

export const runtime = "nodejs";

function webhookSecret() {
  return process.env.GEN_HEALTH_WEBHOOK_SECRET?.trim() ?? "";
}

function ignored(event: string, present: { orderId: boolean; paymentStatus: boolean; orderStatus: boolean }) {
  console.warn("[affiliate] Gen Health webhook ignored", event, present);
  return NextResponse.json({ ok: true, ignored: true });
}

async function settleOrder(orderId: string) {
  const attributed = await attributePaidGenHealthOrder(orderId);
  if (attributed === "unavailable") {
    return NextResponse.json({ ok: false, error: "Affiliate recording is unavailable." }, { status: 503 });
  }
  const refunded = await syncOrderRefund(orderId);
  if (refunded === "unavailable") {
    return NextResponse.json({ ok: false, error: "Affiliate recording is unavailable." }, { status: 503 });
  }
  if (refunded === "adjusted") return NextResponse.json({ ok: true, result: "adjusted" });
  if (attributed === "recorded") return NextResponse.json({ ok: true, result: "recorded" });
  return NextResponse.json({ ok: true, result: refunded });
}

export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Gen Health webhooks are not configured." }, { status: 503 });
  }

  const raw = await request.text();
  if (!webhookSigned(request.headers, raw, secret)) {
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

  const event = webhookEvent(body, request.headers.get("x-webhook-event"));
  const order = webhookOrder(body);
  if (settlesOrder(event, order)) {
    if (!order.orderId) return ignored(event, order.present);
    try {
      return await settleOrder(order.orderId);
    } catch (error) {
      console.error("[affiliate] Gen Health refund webhook failed", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ ok: false, error: "Could not record the refund." }, { status: 502 });
    }
  }

  if (event !== PAYMENT_EVENT) return NextResponse.json({ ok: true, ignored: true });

  if (!order.orderId || order.paymentStatus !== "paid") {
    return NextResponse.json({ ok: true, result: order.orderId ? "unpaid" : "ignored" });
  }

  try {
    const result = await attributeWebhookPaidOrder(order);
    if (result === "unavailable") {
      return NextResponse.json({ ok: false, error: "Affiliate recording is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[affiliate] Gen Health webhook failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not record the sale." }, { status: 502 });
  }
}
