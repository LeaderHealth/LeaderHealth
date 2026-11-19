import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { agreementMonthEarning, type AgreementPayoutSnapshot } from "./agreement-earnings";
import { loadAffiliateAgreements } from "./agreements";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { loadContentSubmissions } from "./post-review";

const COLLECTION = "agreementPayouts";
const PERIOD = /^\d{4}-\d{2}$/;

export type AgreementPayoutRow = AgreementPayoutSnapshot & {
  code: string;
  period: string;
  approvedAt: string | null;
  paidAt: string | null;
  reference: string;
};

function asIso(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
  }
  return "";
}

function rowFrom(data: DocumentData | undefined): AgreementPayoutRow | null {
  if (!data || (data.status !== "approved" && data.status !== "paid")) return null;
  const code = normalizeAffiliateCode(data.code);
  const period = typeof data.period === "string" ? data.period : "";
  if (!code || !PERIOD.test(period)) return null;
  const count = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0);
  return {
    code,
    period,
    agreementId: typeof data.agreementId === "string" ? data.agreementId : "",
    rateCents: count(data.rateCents),
    requiredPosts: count(data.requiredPosts),
    verifiedPosts: count(data.verifiedPosts),
    amountCents: count(data.amountCents),
    status: data.status,
    approvedAt: asIso(data.approvedAt) || null,
    paidAt: asIso(data.paidAt) || null,
    reference: typeof data.reference === "string" ? data.reference.trim().slice(0, 80) : "",
  };
}

export async function loadAgreementPayouts(period: string) {
  if (!PERIOD.test(period) || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection(COLLECTION).where("period", "==", period).get();
  return snap.docs.map((doc) => rowFrom(doc.data())).filter((row): row is AgreementPayoutRow => row != null);
}

export async function loadAgreementPayoutsForCode(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection(COLLECTION).where("code", "==", normalized).get();
  return snap.docs.map((doc) => rowFrom(doc.data())).filter((row): row is AgreementPayoutRow => row != null);
}

export async function loadAllAgreementPayouts() {
  if (!affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection(COLLECTION).get();
  return snap.docs.map((doc) => rowFrom(doc.data())).filter((row): row is AgreementPayoutRow => row != null);
}

export async function approveAgreementPayout(code: string, period: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !PERIOD.test(period)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const ref = affiliateFirestore().collection(COLLECTION).doc(`${normalized}_${period}`);
  if (rowFrom((await ref.get()).data())) return null;
  const [agreements, posts] = await Promise.all([loadAffiliateAgreements(normalized), loadContentSubmissions(normalized)]);
  const earning = agreementMonthEarning({ agreements, posts, code: normalized, period });
  if (earning.status !== "earned") throw new Error("status");
  await ref.set({
    code: normalized,
    period,
    agreementId: earning.agreementId,
    rateCents: earning.rateCents,
    requiredPosts: earning.requiredPosts,
    verifiedPosts: earning.verifiedPosts,
    amountCents: earning.earnedCents,
    status: "approved",
    approvedAt: new Date(),
  });
  return earning.earnedCents;
}

export async function markAgreementPayoutPaid(input: { code: string; period: string; paidCents: number; paidAt: Date; reference: string }) {
  const normalized = normalizeAffiliateCode(input.code);
  if (!normalized || !PERIOD.test(input.period)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const ref = affiliateFirestore().collection(COLLECTION).doc(`${normalized}_${input.period}`);
  const current = rowFrom((await ref.get()).data());
  if (!current || current.status === "paid") throw new Error("status");
  await ref.set({ status: "paid", paidCents: input.paidCents, paidAt: input.paidAt, reference: input.reference }, { merge: true });
}
