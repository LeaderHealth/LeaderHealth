import { nmiPublicConfig, nmiSecurityKey } from "./env";

const REQUEST_TIMEOUT_MS = 20000;

const GATEWAY_UNAVAILABLE_MESSAGE =
  "We're unable to process payments right now. Please try again shortly — if it keeps happening, contact support and no charge will have been made.";

const OUTCOME_UNKNOWN_MESSAGE =
  "We couldn't confirm whether your payment went through. Please contact support before trying again so we don't charge you twice.";

const DUPLICATE_TRANSACTION_MESSAGE =
  "This looks like a repeat of a payment we've already received. Please check your email for a confirmation, or contact support, before trying again.";

export type NmiChargeResult = {
  ok: boolean;
  outcomeUnknown: boolean;
  transactionId: string;
  processorStatus: "approved" | "unknown" | "error" | "declined";
  code: string;
  customerMessage: string;
};

function centsToAmount(cents: number) {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error("Refusing to charge a non-finite amount.");
  }
  return (Math.round(cents) / 100).toFixed(2);
}

export function dollarsToCents(amount: number | null | undefined) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function parseNmiResponse(text: string) {
  return Object.fromEntries(new URLSearchParams(text).entries());
}

function isDuplicateRejection(code: string, text: string) {
  if (code.trim() === "430") return true;
  return /duplicate/i.test(text);
}

function declineMessage(code: string) {
  switch (code.trim()) {
    case "202":
    case "222":
      return "Insufficient funds. Please try a different card.";
    case "223":
    case "224":
      return "That card has expired. Please use a different card.";
    case "225":
      return "The security code (CVV) is incorrect. Please check and try again.";
    default:
      return "Your card could not be processed. Please try a different card.";
  }
}

export async function chargeNmi(input: {
  amountCents: number;
  paymentToken: string;
  orderId: string;
  billing: {
    firstName: string;
    lastName: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone: string;
  };
}): Promise<NmiChargeResult> {
  const key = nmiSecurityKey();
  if (!key) {
    throw Object.assign(new Error("Payment is temporarily unavailable."), { status: 503 });
  }

  const { gatewayBaseUrl } = nmiPublicConfig();
  const form = new URLSearchParams({
    security_key: key,
    type: "sale",
    payment_token: input.paymentToken,
    amount: centsToAmount(input.amountCents),
    orderid: input.orderId,
    currency: "USD",
    country: "US",
  });

  const billingMap: Record<string, string> = {
    first_name: input.billing.firstName,
    last_name: input.billing.lastName,
    address1: input.billing.street1,
    city: input.billing.city,
    state: input.billing.state,
    zip: input.billing.zip,
    email: input.billing.email,
    phone: input.billing.phone,
  };
  for (const [field, value] of Object.entries(billingMap)) {
    const trimmed = value.trim();
    if (trimmed) form.set(field, trimmed);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let raw = "";
  let httpStatus = 0;
  try {
    const response = await fetch(`${gatewayBaseUrl}/api/transact.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: controller.signal,
    });
    httpStatus = response.status;
    raw = await response.text();
  } finally {
    clearTimeout(timer);
  }

  const parsed = parseNmiResponse(raw);
  const code = parsed.response_code || "";
  const ok = parsed.response === "1" && code === "100";
  const isIssuerDecline = /^2\d\d$/.test(code);
  const gatewayError = !ok && !isIssuerDecline;
  const duplicate = !ok && isDuplicateRejection(code, parsed.responsetext || "");
  const outcomeUnknown = !ok && (!code || httpStatus < 200 || httpStatus > 299);

  console.info("[nmi] charge result", {
    orderId: input.orderId,
    ok,
    outcomeUnknown,
    duplicate,
    httpStatus,
    responseCode: code,
    transactionId: parsed.transactionid || "",
  });

  return {
    ok,
    outcomeUnknown,
    transactionId: parsed.transactionid || "",
    processorStatus: ok ? "approved" : outcomeUnknown ? "unknown" : gatewayError ? "error" : "declined",
    code,
    customerMessage: ok
      ? ""
      : outcomeUnknown
        ? OUTCOME_UNKNOWN_MESSAGE
        : duplicate
          ? DUPLICATE_TRANSACTION_MESSAGE
          : gatewayError
            ? GATEWAY_UNAVAILABLE_MESSAGE
            : declineMessage(code),
  };
}
