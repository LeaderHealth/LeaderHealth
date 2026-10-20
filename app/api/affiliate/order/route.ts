import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { savePendingAffiliateOrder } from "@/lib/affiliate/store";

export const runtime = "nodejs";

function orderSecret() {
  return process.env.AFFILIATE_ORDER_SECRET?.trim() ?? "";
}

function secretMatches(header: string, expected: string) {
  if (!header || !expected) return false;
  const actual = createHash("sha256").update(header).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actual, wanted);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const expected = orderSecret();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Affiliate order recording is not configured." }, { status: 503 });
  }
  const header = request.headers.get("x-affiliate-secret")?.trim() ?? "";
  if (!secretMatches(header, expected)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "orderId and utm_source are required." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const orderId = text(record.orderId);
  const code = normalizeAffiliateCode(record.utm_source);
  if (!orderId || !code) {
    return NextResponse.json({ ok: false, error: "orderId and utm_source are required." }, { status: 400 });
  }

  try {
    const result = await savePendingAffiliateOrder({ code, orderId });
    if (result === "saved" || result === "exists") return NextResponse.json({ ok: true });
    if (result === "inactive") {
      return NextResponse.json({ ok: false, error: "Unknown affiliate." }, { status: 404 });
    }
    if (result === "unavailable") {
      return NextResponse.json({ ok: false, error: "Affiliate recording is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "orderId and utm_source are required." }, { status: 400 });
  } catch (error) {
    console.error("[affiliate] pending order failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not save the order." }, { status: 502 });
  }
}
