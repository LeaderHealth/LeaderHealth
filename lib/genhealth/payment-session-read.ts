export type PaymentSession = {
  id: string;
  token: string;
  processor: string;
  subscribing: boolean;
};

export type CompletedPayment = {
  orderId: string;
  paymentStatus: string;
  subscriptionStatus: string;
  magicLink: string | null;
  amount: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function sessionRecord(data: unknown) {
  const root = asRecord(data);
  if (!root) return null;
  return asRecord(root.paymentSession) ?? asRecord(root.session) ?? root;
}

export function readPaymentSession(data: unknown): PaymentSession | null {
  const record = sessionRecord(data);
  if (!record) return null;
  const id = text(record.paymentSessionId) || text(record.sessionId);
  const token = text(record.paymentSessionToken) || text(record.sessionToken);
  if (!id || !token) return null;
  return {
    id,
    token,
    processor: text(record.paymentProcessor).toLowerCase(),
    subscribing: record.subscribing === true,
  };
}

export function readNmiTokenizationKey(data: unknown) {
  const root = asRecord(data);
  if (!root) return "";
  const config = asRecord(root.publicConfig);
  const processor = text(root.paymentProcessor).toLowerCase();
  if (processor && processor !== "nmi") return "";
  return text(config?.tokenizationKey);
}

export function readCompletedPayment(data: unknown): CompletedPayment | null {
  const record = sessionRecord(data);
  if (!record) return null;
  const orderIds = [text(record.orderId), text(record.productOrderId)];
  if (Array.isArray(record.orders)) {
    for (const entry of record.orders) {
      const row = asRecord(entry);
      if (row) orderIds.push(text(row.orderId) || text(row.id));
    }
  }
  const orderId = orderIds.find(Boolean) ?? "";
  if (!orderId) return null;
  const statuses = [text(asRecord(record.subscription)?.status).toLowerCase()];
  if (Array.isArray(record.subscriptions)) {
    for (const entry of record.subscriptions) {
      const row = asRecord(entry);
      if (row) statuses.push(text(row.status).toLowerCase());
    }
  }
  const subscriptionStatus = statuses.includes("needs_payment_method")
    ? "needs_payment_method"
    : statuses.includes("active")
      ? "active"
      : statuses.includes("failed")
        ? "failed"
        : statuses.find(Boolean) ?? "";
  const amountCents = record.amountCents;
  const amount =
    typeof amountCents === "number" && Number.isFinite(amountCents) ? Math.round(amountCents) / 100 : null;
  return {
    orderId,
    paymentStatus: text(record.status).toLowerCase() || text(record.paymentStatus).toLowerCase() || "paid",
    subscriptionStatus,
    magicLink: text(record.magicLink) || null,
    amount,
  };
}
