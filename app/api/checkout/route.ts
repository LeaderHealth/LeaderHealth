import { NextResponse } from "next/server";
import { CheckoutHttpError, parseCheckoutPaymentInput, settleCheckout } from "@/lib/checkout/complete";
import { genHealthConfigured } from "@/lib/genhealth/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!genHealthConfigured()) {
    return NextResponse.json(
      { success: false, error: "Checkout is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid checkout payload." }, { status: 400 });
  }

  const parsed = parseCheckoutPaymentInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  try {
    const result = await settleCheckout(parsed.value);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof CheckoutHttpError) {
      return NextResponse.json(
        { success: false, error: error.message, retokenize: error.retokenize },
        { status: error.status },
      );
    }
    const raw = error instanceof Error ? error.message : "Could not complete checkout.";
    const message = /genhealth/i.test(raw) ? "Could not complete checkout. Try again in a moment." : raw;
    const status = typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 502;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
