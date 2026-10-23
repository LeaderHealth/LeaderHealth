import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { refundObservations } from "./refunds";
import { applyOrderRefund, loadUncommissionedPendingOrders, markPendingOrderCommissioned, pendingAffiliateCode, recordAffiliateConversion } from "./store";
import { attributableOrderStatus, getOrderSettlement, listClientOrders, type ClientOrder, type PaidOrder } from "@/lib/genhealth/payment";
import { creditedAffiliate, listPromoCodes, personalAffiliateForCode, promoByCode, type PromoCodeRow } from "@/lib/genhealth/promocodes";

function trackedAffiliate(order: PaidOrder, pendingCode: string, activeIds: Set<string>) {
  if (order.source && activeIds.has(order.source)) return order.source;
  return pendingCode && activeIds.has(pendingCode) ? pendingCode : "";
}

function affiliateForPaidOrder(order: PaidOrder, pendingCode: string, activeIds: Set<string>, promos: PromoCodeRow[]) {
  const personal = personalAffiliateForCode(promoByCode(promos, order.promoCode), activeIds);
  return creditedAffiliate(personal, trackedAffiliate(order, pendingCode, activeIds));
}

async function settleRecordedOrder(order: ClientOrder) {
  const incoming = refundObservations(order);
  if (incoming.length === 0) return;
  await applyOrderRefund({ orderId: order.orderId, incoming });
}

async function recordPaidOrder(order: PaidOrder, code: string) {
  await recordAffiliateConversion({
    code,
    orderId: order.orderId,
    amount: order.amountCents == null ? null : order.amountCents / 100,
    productName: order.productName,
    dryRun: false,
    createdAt: order.createdAt,
    promoCode: order.promoCode,
  });
}

async function activeAffiliateIds() {
  const ids = new Set<string>();
  const snapshot = await affiliateFirestore().collection("affiliates").get();
  for (const doc of snapshot.docs) {
    const code = normalizeAffiliateCode(doc.id);
    if (code && doc.data()?.active === true) ids.add(code);
  }
  return ids;
}

async function promoCatalog() {
  try {
    return await listPromoCodes();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] promo lookup failed", message);
    return [];
  }
}

export async function attributePaidGenHealthOrder(orderId: string) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const id = orderId.trim();
  if (!id) return "ignored" as const;
  const pending = await pendingAffiliateCode(id);
  const ids = await activeAffiliateIds();
  const order = await getOrderSettlement(id);
  if (!order) return "unpaid" as const;
  if (attributableOrderStatus(order.paymentStatus)) {
    const code = affiliateForPaidOrder(order, pending && ids.has(pending) ? pending : "", ids, await promoCatalog());
    if (code) {
      await recordPaidOrder(order, code);
      if (pending) await markPendingOrderCommissioned(order.orderId);
      await settleRecordedOrder(order);
      return "recorded" as const;
    }
  }
  await settleRecordedOrder(order);
  return attributableOrderStatus(order.paymentStatus) ? "unmatched" as const : "unpaid" as const;
}

export async function syncOrderRefund(orderId: string) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const id = orderId.trim();
  if (!id) return "ignored" as const;
  const order = await getOrderSettlement(id);
  if (!order) return "ignored" as const;
  const incoming = refundObservations(order);
  if (incoming.length === 0) return "unchanged" as const;
  const applied = await applyOrderRefund({ orderId: order.orderId, incoming });
  return applied ? "adjusted" as const : "unchanged" as const;
}

export async function attributeWebhookPaidOrder(input: { orderId: string; amountCents: number | null; occurredAt?: Date }) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const id = input.orderId.trim();
  if (!id) return "ignored" as const;
  const pending = await pendingAffiliateCode(id);
  const ids = await activeAffiliateIds();
  const order = await getOrderSettlement(id);
  if (order && attributableOrderStatus(order.paymentStatus)) {
    const code = affiliateForPaidOrder(order, pending && ids.has(pending) ? pending : "", ids, await promoCatalog());
    if (!code) return "unmatched" as const;
    await recordPaidOrder(order, code);
    if (pending) await markPendingOrderCommissioned(id);
    await settleRecordedOrder(order);
    return "recorded" as const;
  }
  if (order) {
    await settleRecordedOrder(order);
    return "unpaid" as const;
  }
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
    ids = await activeAffiliateIds();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
    return;
  }

  try {
    const pending = await loadUncommissionedPendingOrders();
    const orders = await listClientOrders();
    const promos = await promoCatalog();
    for (const order of orders) {
      if (!attributableOrderStatus(order.paymentStatus)) continue;
      const pendingCode = pending.get(order.orderId) ?? "";
      const code = affiliateForPaidOrder(order, pendingCode && ids.has(pendingCode) ? pendingCode : "", ids, promos);
      if (!code) continue;
      await recordPaidOrder(order, code);
      if (pendingCode) await markPendingOrderCommissioned(order.orderId);
    }
    for (const order of orders) await settleRecordedOrder(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
  }

  try {
    const remaining = await loadUncommissionedPendingOrders();
    const promos = await promoCatalog();
    for (const [orderId, pendingCode] of remaining) {
      try {
        const order = await getOrderSettlement(orderId);
        if (!order) continue;
        if (attributableOrderStatus(order.paymentStatus)) {
          const code = affiliateForPaidOrder(order, ids.has(pendingCode) ? pendingCode : "", ids, promos);
          if (code) {
            await recordPaidOrder(order, code);
            await markPendingOrderCommissioned(order.orderId);
          }
        }
        await settleRecordedOrder(order);
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
