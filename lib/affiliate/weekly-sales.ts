import type { DocumentData } from "firebase-admin/firestore";
import { normalizeAffiliateCode, normalizeAffiliateEmail } from "./code";
import { affiliateEmailConfigured, sendAffiliateWeeklySalesEmail } from "./email";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { formatCents } from "./format";
import { instantInWeek, previousUtcWeek } from "./week";

type WeekSale = {
  amountCents: number | null;
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
  const amountCents = typeof data.amountCents === "number" && Number.isFinite(data.amountCents) ? data.amountCents : null;
  const commissionCents = typeof data.commissionCents === "number" && Number.isFinite(data.commissionCents) ? data.commissionCents : 0;
  return { code, sale: { amountCents, commissionCents, createdAt: createdAtIso(data.createdAt) } };
}

function saleLine(sale: WeekSale) {
  const when = sale.createdAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(sale.createdAt))
    : "Unknown date";
  const amount = sale.amountCents == null ? "—" : formatCents(sale.amountCents);
  return `${when}: ${amount} sale, ${formatCents(sale.commissionCents)} commission`;
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
    const salesCents = rows.every((row) => row.amountCents == null) ? null : rows.reduce((sum, row) => sum + (row.amountCents ?? 0), 0);
    try {
      await sendAffiliateWeeklySalesEmail({
        email,
        weekLabel: week.label,
        orderCount: rows.length,
        salesCents,
        commissionCents: rows.reduce((sum, row) => sum + row.commissionCents, 0),
        lines: rows.map(saleLine),
      });
    } catch (error) {
      await notice.ref.delete().catch(() => undefined);
      console.error("[affiliate] weekly sales email failed", code, error instanceof Error ? error.message : "unknown");
    }
  }
}
