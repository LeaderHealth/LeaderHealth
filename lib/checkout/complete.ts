import { chargeNmi, dollarsToCents } from "@/lib/nmi/charge";
import { nmiSecurityKey } from "@/lib/nmi/env";
import { ALLOW_LIVE_NMI_CHARGES } from "@/lib/nmi/flags";
import { parseCheckoutInput, placeCheckoutOrder, type CheckoutInput, type CheckoutResult } from "@/lib/genhealth/checkout";
import { patchOrderPaid } from "@/lib/genhealth/payment";

export type CheckoutPaymentInput = CheckoutInput & {
  paymentToken?: string;
};

export type SettledCheckout = CheckoutResult & {
  charged: boolean;
  chargesEnabled: boolean;
  transactionId: string | null;
  patchPaidFailed: boolean;
};

export class CheckoutHttpError extends Error {
  status: number;
  retokenize: boolean;

  constructor(message: string, status: number, retokenize = false) {
    super(message);
    this.name = "CheckoutHttpError";
    this.status = status;
    this.retokenize = retokenize;
  }
}

export function parseCheckoutPaymentInput(body: unknown) {
  const parsed = parseCheckoutInput(body);
  if (!parsed.ok) return parsed;
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const paymentToken = typeof record.paymentToken === "string" ? record.paymentToken.trim() : "";
  return { ok: true as const, value: { ...parsed.value, paymentToken: paymentToken || undefined } };
}

export async function settleCheckout(input: CheckoutPaymentInput): Promise<SettledCheckout> {
  const chargesEnabled = ALLOW_LIVE_NMI_CHARGES;
  if (chargesEnabled && !input.paymentToken) {
    throw new CheckoutHttpError("Please check your card details and try again.", 400, true);
  }
  if (chargesEnabled && !nmiSecurityKey()) {
    throw new CheckoutHttpError("Payment is temporarily unavailable.", 503);
  }

  const order = await placeCheckoutOrder(input);
  const base: SettledCheckout = {
    ...order,
    charged: false,
    chargesEnabled,
    transactionId: null,
    patchPaidFailed: false,
  };

  if (!chargesEnabled || order.dryRun) {
    return base;
  }

  const amountCents = dollarsToCents(order.amount);
  if (amountCents == null) {
    throw new CheckoutHttpError("This treatment does not have a chargeable price.", 400);
  }

  let charge;
  try {
    charge = await chargeNmi({
      amountCents,
      paymentToken: input.paymentToken || "",
      orderId: order.orderId,
      billing: {
        firstName: input.firstName,
        lastName: input.lastName,
        street1: input.street1,
        city: input.city,
        state: input.state,
        zip: input.zip,
        email: input.email,
        phone: input.phone,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't confirm whether your payment went through. Please contact support before trying again so we don't charge you twice.";
    const status = typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : 502;
    throw new CheckoutHttpError(message, status);
  }

  if (charge.outcomeUnknown) {
    throw new CheckoutHttpError(charge.customerMessage, 502);
  }
  if (!charge.ok) {
    throw new CheckoutHttpError(
      charge.customerMessage || "Payment declined. Please try a different card.",
      charge.processorStatus === "error" ? 502 : 402,
      true,
    );
  }

  try {
    await patchOrderPaid(order.orderId, charge.transactionId);
  } catch (error) {
    console.error("[checkout] captured payment but could not mark the order paid", {
      orderId: order.orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ...base,
      charged: true,
      paymentStatus: "paid",
      transactionId: charge.transactionId,
      patchPaidFailed: true,
    };
  }

  return {
    ...base,
    charged: true,
    paymentStatus: "paid",
    transactionId: charge.transactionId,
    patchPaidFailed: false,
  };
}
