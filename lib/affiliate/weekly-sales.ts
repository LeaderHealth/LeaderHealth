import type { DocumentData } from "firebase-admin/firestore";
import { normalizeAffiliateCode, normalizeAffiliateEmail } from "./code";
import { affiliateEmailConfigured, sendAffiliateWeeklySalesEmail } from "./email";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { LAB_COMMISSIONS_ENABLED } from "./code";
import { adjustedCommissionCents } from "./refunds";
import { instantInWeek, previousUtcWeek } from "./week";

type WeekSale = {
  orderKind: "lab" | "treatment";
  commissionCents: number;
  createdAt: string | null;
};

function createdAtIso(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function saleFrom(data: DocumentData): { code: string; sale: WeekSale } | null {
  const code = normalizeAffiliateCode(data.code);
  if (!code || data.dryRun === true) return null;
  const originalCommission = typeof data.commissionCents === "number" && Number.isFinite(data.commissionCents) ? data.commissionCents : 0;
  const refundedCommission = typeof data.commissionRefundedCents === "number" && Number.isFinite(data.commissionRefundedCents) ? data.commissionRefundedCents : 0;
  const commissionCents = data.orderKind === "lab" ? adjustedCommissionCents(originalCommission, refundedCommission) : 0;
  return {
    code,
    sale: { orderKind: data.orderKind === "lab" ? "lab" : "treatment", commissionCents, createdAt: createdAtIso(data.createdAt) },
  };
}

async function claimNotice(code: string, weekId: string) {
  const db = affiliateFirestore();
  const ref = db.collection("salesNotices").doc(`${code}_${weekId}`);
  const claimed = await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) return false;
    tx.set(ref, { code, week: weekId, sentAt: new Date() });
    return true;
  });
  return { ref, claimed };
}

export async function deliverPreviousWeekSalesNotices(now = new Date()) {
  if (!affiliateFirebaseConfigured() || !affiliateEmailConfigured()) return;
  const week = previousUtcWeek(now);
  const db = affiliateFirestore();
  const [affiliates, conversions] = await Promise.all([
    db.collection("affiliates").get(),
    db.collection("conversions").where("createdAt", ">=", week.start).where("createdAt", "<", week.end).get(),
  ]);

  const emails = new Map<string, string>();
  for (const doc of affiliates.docs) {
    const code = normalizeAffiliateCode(doc.id);
    const email = normalizeAffiliateEmail(doc.data()?.email);
    if (code && email && doc.data()?.active === true) emails.set(code, email);
  }

  const sales = new Map<string, WeekSale[]>();
  for (const doc of conversions.docs) {
    const row = saleFrom(doc.data());
    if (!row || !instantInWeek(row.sale.createdAt, week) || !emails.has(row.code)) continue;
    const rows = sales.get(row.code) ?? [];
    rows.push(row.sale);
    sales.set(row.code, rows);
  }

  for (const [code, rows] of sales) {
    const email = emails.get(code);
    if (!email || rows.length === 0) continue;
    rows.sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""));
    const notice = await claimNotice(code, week.id);
    if (!notice.claimed) continue;
    const labCommissionCents = LAB_COMMISSIONS_ENABLED
      ? rows.reduce((sum, row) => sum + (row.orderKind === "lab" ? row.commissionCents : 0), 0)
      : null;
    try {
      await sendAffiliateWeeklySalesEmail({
        email,
        weekLabel: week.label,
        orderCount: rows.length,
        labCommissionCents,
      });
    } catch (error) {
      await notice.ref.delete().catch(() => undefined);
      console.error("[affiliate] weekly sales email failed", code, error instanceof Error ? error.message : "unknown");
    }
  }
}
