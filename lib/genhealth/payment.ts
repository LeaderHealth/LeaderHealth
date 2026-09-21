import { genHealthRequest } from "./client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function patchOrderPaid(orderId: string, transactionId: string) {
  const id = orderId.trim();
  if (!id) throw new Error("Order id is required to record payment.");

  const body: Record<string, string> = { payment_status: "paid" };
  const tx = transactionId.trim();
  if (tx) body.transaction_id = tx;

  let lastError = "Could not record payment on the order.";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await genHealthRequest(`/v2/client/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
    if (response.success) return;

    lastError = response.error || lastError;
    if (response.status === 409 || /cannot be marked as paid/i.test(lastError)) {
      throw Object.assign(new Error(lastError), { status: response.status });
    }
    if (attempt < 3) await sleep(400 * attempt);
  }

    throw Object.assign(new Error(lastError), { status: 502 });
}
