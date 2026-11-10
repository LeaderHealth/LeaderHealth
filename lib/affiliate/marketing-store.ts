import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { reportMonth, socialNetwork, type MarketingReportFields } from "./marketing";

export class MarketingReportError extends Error {
  code: "invalid" | "missing" | "unavailable";

  constructor(code: MarketingReportError["code"]) {
    super(code);
    this.name = "MarketingReportError";
    this.code = code;
  }
}

export type MarketingReport = MarketingReportFields & {
  updatedAt: string | null;
};

export type AffiliateChoice = {
  code: string;
  name: string;
};

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function asCount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

const ACCOUNT_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function marketingReportDocumentId(fields: Pick<MarketingReportFields, "code" | "network" | "accountId" | "month">) {
  const account = fields.accountId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  if (!account) return null;
  return `${fields.code}_${fields.network}_${account}_${fields.month}`;
}

function accountName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  return text ? text.slice(0, 120) : fallback;
}

function reportFrom(data: DocumentData | undefined): MarketingReport | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const month = typeof data.month === "string" ? data.month : "";
  const network = socialNetwork(data.network);
  const accountId = typeof data.accountId === "string" && ACCOUNT_ID.test(data.accountId) ? data.accountId : null;
  if (!code || !network || !accountId || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  return {
    code,
    month,
    network,
    accountId,
    accountName: accountName(data.accountName, accountId),
    impressions: asCount(data.impressions),
    reach: asCount(data.reach),
    likes: asCount(data.likes),
    comments: asCount(data.comments),
    shares: asCount(data.shares),
    saves: asCount(data.saves),
    spendCents: 0,
    updatedAt: asDate(data.updatedAt)?.toISOString() ?? null,
  };
}

function requireDb() {
  if (!affiliateFirebaseConfigured()) throw new MarketingReportError("unavailable");
  return affiliateFirestore();
}

export async function listAffiliateChoices() {
  const db = requireDb();
  const snap = await db.collection("affiliates").get();
  return snap.docs
    .flatMap((doc) => {
      const code = normalizeAffiliateCode(doc.id);
      if (!code) return [];
      const name = typeof doc.data().name === "string" && doc.data().name.trim() ? doc.data().name.trim() : code;
      return [{ code, name }];
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
}

export async function saveMarketingReport(fields: MarketingReportFields) {
  const db = requireDb();
  const id = marketingReportDocumentId(fields);
  if (!id) throw new MarketingReportError("invalid");
  const affiliate = await db.collection("affiliates").doc(fields.code).get();
  if (!affiliate.exists) throw new MarketingReportError("missing");
  await db.collection("marketingReports").doc(id).set({
    code: fields.code,
    month: fields.month,
    network: fields.network,
    accountId: fields.accountId,
    accountName: fields.accountName,
    impressions: fields.impressions,
    reach: fields.reach,
    likes: fields.likes,
    comments: fields.comments,
    shares: fields.shares,
    saves: fields.saves,
    spendCents: 0,
    updatedAt: new Date(),
  });
}

export async function loadMarketingReports(code?: string) {
  const db = requireDb();
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const query = normalized
    ? db.collection("marketingReports").where("code", "==", normalized)
    : db.collection("marketingReports");
  const snap = await query.get();
  return snap.docs
    .map((doc) => reportFrom(doc.data()))
    .filter((report): report is MarketingReport => report != null)
    .sort((left, right) => right.month.localeCompare(left.month) || left.code.localeCompare(right.code));
}

export async function visitCountsForAffiliate(code: string) {
  const counts = new Map<string, number>();
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return counts;
  const snap = await affiliateFirestore().collection("clicks").where("code", "==", normalized).get();
  for (const doc of snap.docs) {
    const createdAt = asDate(doc.data().createdAt)?.toISOString() ?? null;
    const month = reportMonth(createdAt);
    if (!month) continue;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return counts;
}
