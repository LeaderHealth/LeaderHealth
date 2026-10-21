import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { loadUncommissionedPendingOrders, markPendingOrderCommissioned, pendingAffiliateCode, recordAffiliateConversion } from "./store";
import { getPaidOrder, listPaidOrders, type PaidOrder } from "@/lib/genhealth/payment";

async function recordPaidOrder(order: PaidOrder, code: string) {
  await recordAffiliateConversion({
    code,
    orderId: order.orderId,
    amount: order.amountCents == null ? null : order.amountCents / 100,
    productName: order.productName,
    dryRun: false,
    createdAt: order.createdAt,
  });
}

async function affiliateIds() {
  const ids = new Set<string>();
  const snapshot = await affiliateFirestore().collection("affiliates").get();
  for (const doc of snapshot.docs) {
    const code = normalizeAffiliateCode(doc.id);
    if (code) ids.add(code);
  }
  return ids;
}

export async function attributePaidGenHealthOrder(orderId: string) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const id = orderId.trim();
  if (!id) return "ignored" as const;
  const pending = await pendingAffiliateCode(id);
  const ids = await affiliateIds();
  const order = await getPaidOrder(id);
  if (!order) return "unpaid" as const;
  const code = pending && ids.has(pending) ? pending : order.source && ids.has(order.source) ? order.source : "";
  if (!code) return "unmatched" as const;
  await recordPaidOrder(order, code);
  if (pending) await markPendingOrderCommissioned(order.orderId);
  return "recorded" as const;
}

export async function attributeWebhookPaidOrder(input: { orderId: string; amountCents: number | null; occurredAt?: Date }) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const id = input.orderId.trim();
  if (!id) return "ignored" as const;
  const pending = await pendingAffiliateCode(id);
  const ids = await affiliateIds();
  if (!pending || !ids.has(pending)) return "unmatched" as const;
  const amount = input.amountCents == null ? null : input.amountCents / 100;
  await recordAffiliateConversion({
    code: pending,
    orderId: id,
    amount,
    productName: "Order",
    dryRun: false,
    createdAt: input.occurredAt,
  });
  await markPendingOrderCommissioned(id);
  return "recorded" as const;
}

export async function syncAttributedGenHealthSales() {
  if (!affiliateFirebaseConfigured()) return;
  let ids: Set<string>;
  try {
    ids = await affiliateIds();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
    return;
  }

  try {
    const pending = await loadUncommissionedPendingOrders();
    const orders = await listPaidOrders();
    for (const order of orders) {
      const pendingCode = pending.get(order.orderId) ?? "";
      const fallback = pendingCode ? "" : order.source;
      const code = pendingCode && ids.has(pendingCode) ? pendingCode : fallback && ids.has(fallback) ? fallback : "";
      if (!code) continue;
      await recordPaidOrder(order, code);
      if (pendingCode) await markPendingOrderCommissioned(order.orderId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
  }

  try {
    const remaining = await loadUncommissionedPendingOrders();
    for (const [orderId, code] of remaining) {
      if (!ids.has(code)) continue;
      try {
        const order = await getPaidOrder(orderId);
        if (!order) continue;
        await recordPaidOrder(order, code);
        await markPendingOrderCommissioned(order.orderId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        console.error("[affiliate] Gen Health order lookup failed", orderId, message);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
  }
}
