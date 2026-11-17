import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { genHealthRequest } from "./client";
import {
  readCompletedPayment,
  readNmiTokenizationKey,
  readPaymentSession,
  type PaymentSession,
} from "./payment-session-read";

export { readCompletedPayment, readNmiTokenizationKey, readPaymentSession };
export type { CompletedPayment, PaymentSession } from "./payment-session-read";

function sessionHeaders(session: PaymentSession) {
  return {
    "X-Payment-Session-Id": session.id,
    "X-Payment-Session-Token": session.token,
  };
}

export async function createTherapyPaymentSession(input: {
  patientId: string;
  clientProductId?: string;
  lines?: { clientProductId: string; subscribing: boolean }[];
  affiliateCode?: string | null;
  subscribing?: boolean;
}) {
  const tracking: Record<string, string> = { source: "leaderhealth_web" };
  const code = normalizeAffiliateCode(input.affiliateCode);
  if (code) tracking.utmSource = code;
  const lines = input.lines ?? [];
  const body: Record<string, unknown> = {
    patientId: input.patientId,
    tracking,
  };
  if (lines.length > 1) {
    body.items = lines.map((line) => ({
      clientProductId: line.clientProductId,
      subscribing: line.subscribing,
      checkoutFlow: "product_first",
    }));
  } else {
    body.clientProductId = lines[0]?.clientProductId ?? input.clientProductId;
    body.checkoutFlow = "product_first";
    body.subscribing = lines[0]?.subscribing ?? input.subscribing ?? true;
  }
  if (code) body.customFields = { utm_source: code };

  const response = await genHealthRequest("/v2/client/payments/sessions", { method: "POST", body });
  return { response, session: response.success ? readPaymentSession(response.data) : null };
}

export async function completeTherapyPaymentSession(input: {
  session: PaymentSession;
  paymentToken: string;
  billing: {
    firstName: string;
    lastName: string;
    phone: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
  };
}) {
  const skipCard = input.session.processor === "zero_dollar" || input.session.processor === "demo";
  const body: Record<string, unknown> = {
    paymentSessionId: input.session.id,
    paymentSessionToken: input.session.token,
    billingInfo: input.billing,
    send_email: false,
  };
  if (!skipCard) body.paymentData = { paymentToken: input.paymentToken };

  return genHealthRequest("/v2/client/payments/session-completions", {
    method: "POST",
    omitApiKey: true,
    headers: sessionHeaders(input.session),
    body,
  });
}

export async function readTherapyPaymentStatus(session: PaymentSession) {
  const response = await genHealthRequest("/v2/client/payments/session-status", {
    omitApiKey: true,
    headers: sessionHeaders(session),
  });
  return response.success ? readCompletedPayment(response.data) : null;
}

export async function nmiTokenizationKeyFromGenHealth() {
  const response = await genHealthRequest("/v2/client/payments/processor-config");
  if (!response.success) return "";
  return readNmiTokenizationKey(response.data);
}
