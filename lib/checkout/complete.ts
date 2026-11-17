import { chargeNmi, dollarsToCents } from "@/lib/nmi/charge";
import { nmiSecurityKey } from "@/lib/nmi/env";
import { ALLOW_LIVE_NMI_CHARGES } from "@/lib/nmi/flags";
import { ALLOW_LIVE_GENHEALTH_ORDERS } from "@/lib/genhealth/flags";
import {
  ensureCheckoutPatient,
  loadCheckoutItem,
  parseCheckoutInput,
  placeCheckoutOrder,
  type CheckoutInput,
  type CheckoutResult,
} from "@/lib/genhealth/checkout";
import type { CatalogItem } from "@/lib/genhealth/types";
import { patchOrderPaid } from "@/lib/genhealth/payment";
import {
  completeTherapyPaymentSession,
  createTherapyPaymentSession,
  readCompletedPayment,
  readTherapyPaymentStatus,
} from "@/lib/genhealth/payment-session";

export type CheckoutPaymentInput = CheckoutInput & {
  paymentToken?: string;
  clientProductIds?: string[];
};

export type SettledCheckout = CheckoutResult & {
  charged: boolean;
  chargesEnabled: boolean;
  transactionId: string | null;
  patchPaidFailed: boolean;
  subscriptionStatus: string | null;
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
  const clientProductIds = Array.isArray(record.clientProductIds)
    ? record.clientProductIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim())
    : [];
  return {
    ok: true as const,
    value: { ...parsed.value, paymentToken: paymentToken || undefined, clientProductIds },
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewCheckout(item: CatalogItem): SettledCheckout {
  return {
    dryRun: true,
    orderId: `preview-${item.clientProductId}`,
    patientId: "",
    patientStatus: "not_sent",
    productName: item.displayName || item.name,
    amount: item.amount,
    magicLink: null,
    paymentStatus: "not_sent",
    charged: false,
    chargesEnabled: false,
    transactionId: null,
    patchPaidFailed: false,
    subscriptionStatus: null,
  };
}

function failureCode(response: { code: string | null; data: unknown }) {
  if (response.code) return response.code;
  const data = response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : null;
  return typeof data?.code === "string" ? data.code : null;
}

async function settleTherapy(
  input: CheckoutPaymentInput,
  products: CatalogItem[],
  affiliateCode?: string | null,
): Promise<SettledCheckout> {
  if (!input.paymentToken) {
    throw new CheckoutHttpError("Please check your card details and try again.", 400, true);
  }
  const item = products[0];
  if (!item) throw new CheckoutHttpError("Choose a treatment.", 400);

  const patient = await ensureCheckoutPatient(input);
  let lines = products.map((product) => ({ clientProductId: product.clientProductId, subscribing: true }));
  if (products.length > 1) {
    const resolved = [];
    for (const product of products) {
      const trial = await createTherapyPaymentSession({
        patientId: patient.patientId,
        clientProductId: product.clientProductId,
        affiliateCode,
        subscribing: true,
      });
      if (!trial.response.success && failureCode(trial.response) === "SUBSCRIPTION_NOT_OFFERED") {
        resolved.push({ clientProductId: product.clientProductId, subscribing: false });
        continue;
      }
      if (!trial.response.success) {
        throw new CheckoutHttpError("Could not complete checkout. Try again in a moment.", trial.response.status || 502);
      }
      resolved.push({ clientProductId: product.clientProductId, subscribing: true });
    }
    lines = resolved;
  }

  let opened = await createTherapyPaymentSession({
    patientId: patient.patientId,
    lines,
    affiliateCode,
  });
  if (products.length === 1 && !opened.response.success && failureCode(opened.response) === "SUBSCRIPTION_NOT_OFFERED") {
    opened = await createTherapyPaymentSession({
      patientId: patient.patientId,
      clientProductId: item.clientProductId,
      affiliateCode,
      subscribing: false,
    });
  }
  if (!opened.response.success || !opened.session) {
    throw new CheckoutHttpError("Could not complete checkout. Try again in a moment.", opened.response.status || 502);
  }

  const completed = await completeTherapyPaymentSession({
    session: opened.session,
    paymentToken: input.paymentToken,
    billing: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone.replace(/\D/g, ""),
      street1: input.street1,
      city: input.city,
      state: input.state,
      zip: input.zip,
    },
  });
  if (!completed.success) {
    const completedCode = failureCode(completed);
    const declined = completed.status === 402 || completedCode === "PAYMENT_DECLINED";
    const unknown = completedCode === "PAYMENT_RECONCILIATION_REQUIRED" || completedCode === "PAYMENT_PROCESSING";
    throw new CheckoutHttpError(
      declined
        ? "Your card could not be processed. Please try a different card."
        : unknown
          ? "We couldn't confirm whether your payment went through. Please contact support before trying again so we don't charge you twice."
          : "Could not complete checkout. Try again in a moment.",
      declined ? 402 : 502,
      declined,
    );
  }

  let paid = readCompletedPayment(completed.data);
  if (!paid) {
    throw new CheckoutHttpError("Could not complete checkout. Try again in a moment.", 502);
  }
  if (lines.some((line) => line.subscribing) && paid.subscriptionStatus !== "active" && paid.subscriptionStatus !== "needs_payment_method") {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await sleep(1000);
      const next = await readTherapyPaymentStatus(opened.session);
      if (!next) continue;
      paid = next;
      if (paid.subscriptionStatus === "active" || paid.subscriptionStatus === "needs_payment_method" || paid.subscriptionStatus === "failed") {
        break;
      }
    }
  }
  if (paid.subscriptionStatus === "needs_payment_method") {
    console.error("[checkout] paid order has no saved card for renewal", paid.orderId);
  }

  return {
    dryRun: false,
    orderId: paid.orderId,
    patientId: patient.patientId,
    patientStatus: patient.patientStatus,
    productName: products.map((product) => product.displayName || product.name).join(", "),
    amount: paid.amount ?? products.reduce((sum, product) => sum + (product.amount ?? 0), 0),
    magicLink: paid.magicLink || patient.magicLink,
    paymentStatus: "paid",
    charged: true,
    chargesEnabled: true,
    transactionId: null,
    patchPaidFailed: false,
    subscriptionStatus: paid.subscriptionStatus || null,
  };
}

function checkoutProductIds(input: CheckoutPaymentInput) {
  return [...new Set([input.clientProductId, ...(input.clientProductIds ?? [])].map((id) => id.trim()).filter(Boolean))].slice(0, 10);
}

export async function settleCheckout(input: CheckoutPaymentInput, affiliateCode?: string | null): Promise<SettledCheckout> {
  const loaded: CatalogItem[] = [];
  for (const clientProductId of checkoutProductIds(input)) {
    loaded.push(await loadCheckoutItem({ ...input, clientProductId }));
  }
  const item = loaded[0];
  if (!item) throw new CheckoutHttpError("Choose a treatment.", 400);
  const products = loaded.filter((entry) => entry.kind !== "lab");
  const labs = loaded.filter((entry) => entry.kind === "lab");
  if (!ALLOW_LIVE_GENHEALTH_ORDERS) {
    console.info("[checkout] dry-run: catalog matched, no GenHealth patient or order write");
    return previewCheckout(products[0] ?? item);
  }
  if (products.length) {
    const paid = await settleTherapy(input, products, affiliateCode);
    for (const lab of labs) {
      try {
        await placeCheckoutOrder({ ...input, clientProductId: lab.clientProductId }, affiliateCode);
      } catch (error) {
        console.error("[checkout] therapy paid but the lab order was not created", error instanceof Error ? error.message : "unknown");
      }
    }
    return paid;
  }

  const chargesEnabled = ALLOW_LIVE_NMI_CHARGES;
  if (chargesEnabled && !input.paymentToken) {
    throw new CheckoutHttpError("Please check your card details and try again.", 400, true);
  }
  if (chargesEnabled && !nmiSecurityKey()) {
    throw new CheckoutHttpError("Payment is temporarily unavailable.", 503);
  }

  const order = await placeCheckoutOrder(input, affiliateCode);
  const base: SettledCheckout = {
    ...order,
    charged: false,
    chargesEnabled,
    transactionId: null,
    patchPaidFailed: false,
    subscriptionStatus: null,
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
