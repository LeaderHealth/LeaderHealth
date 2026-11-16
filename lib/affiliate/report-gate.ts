import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { manualReportDue, networkConnectedForPost, trackingDaysOf } from "./manual-checkpoint";
import { postFormat, type PostFormat } from "./post-format";
import { SocialError, loadSocialAccounts } from "./social-store";

const PUBLICATION_STATUSES = ["awaiting_publication", "verification_pending", "tracking_active", "verification_failed"] as const;

type GateRow = {
  code: string;
  format: PostFormat | null;
  publicationStatus: string | null;
  publishedAt: string | null;
  metricsRecordedAt: string | null;
  metricsSource: "automatic" | "manual" | null;
  trackingDays: number | null;
};

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function rowFrom(data: DocumentData | undefined): GateRow | null {
  if (!data || data.contentStatus !== "approved") return null;
  const code = normalizeAffiliateCode(data.code);
  if (!code) return null;
  return {
    code,
    format: postFormat(data.format),
    publicationStatus: PUBLICATION_STATUSES.find((status) => status === data.publicationStatus) ?? null,
    publishedAt: asDate(data.publishedAt),
    metricsRecordedAt: asDate(data.metricsRecordedAt),
    metricsSource: data.metricsSource === "automatic" || data.metricsSource === "manual" ? data.metricsSource : null,
    trackingDays: trackingDaysOf(data.trackingDays),
  };
}

async function accountsFor(code: string) {
  try {
    return await loadSocialAccounts(code);
  } catch (error) {
    if (error instanceof SocialError) return [];
    throw error;
  }
}

function due(row: GateRow, accounts: readonly { network: string; needsReconnect: boolean }[]) {
  return manualReportDue({
    publicationStatus: row.publicationStatus,
    publishedAt: row.publishedAt,
    metricsRecordedAt: row.metricsRecordedAt,
    metricsSource: row.metricsSource,
    connected: networkConnectedForPost(row.format, accounts),
    trackingDays: row.trackingDays,
  });
}

export async function postCheckpointOpen(postId: string) {
  if (!affiliateFirebaseConfigured()) return false;
  const snap = await affiliateFirestore().collection("contentSubmissions").doc(postId).get();
  const row = rowFrom(snap.data());
  if (!row) return false;
  return due(row, await accountsFor(row.code));
}

export async function affiliateCheckpointOpen(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return false;
  const snapshot = await affiliateFirestore().collection("contentSubmissions").where("code", "==", normalized).get();
  const rows = snapshot.docs.map((doc) => rowFrom(doc.data())).filter((row): row is GateRow => row != null);
  if (rows.length === 0) return false;
  const accounts = await accountsFor(normalized);
  return rows.some((row) => due(row, accounts));
}
