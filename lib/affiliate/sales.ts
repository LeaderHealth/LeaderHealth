import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { recordAffiliateConversion } from "./store";
import { listAttributedOrders } from "@/lib/genhealth/payment";

async function affiliateIds() {
  const ids = new Set<string>();
  const snapshot = await affiliateFirestore().collection("affiliates").get();
  for (const doc of snapshot.docs) {
    const code = normalizeAffiliateCode(doc.id);
    if (code) ids.add(code);
  }
  return ids;
}

export async function syncAttributedGenHealthSales() {
  if (!affiliateFirebaseConfigured()) return;
  try {
    const orders = await listAttributedOrders(await affiliateIds());
    for (const order of orders) {
      await recordAffiliateConversion({
        code: order.code,
        orderId: order.orderId,
        amount: order.amountCents == null ? null : order.amountCents / 100,
        productName: order.productName,
        dryRun: false,
        createdAt: order.createdAt,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[affiliate] Gen Health sales sync failed", message);
  }
}
