import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";

export type SocialOnboarding = "pending" | "skipped" | "done";

export async function readSocialOnboarding(code: string): Promise<SocialOnboarding> {
  if (!affiliateFirebaseConfigured()) return "skipped";
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return "skipped";
  const snap = await affiliateFirestore().collection("affiliates").doc(normalized).get();
  const value = snap.data()?.socialOnboarding;
  if (value === "pending" || value === "done") return value;
  return "skipped";
}

export async function setSocialOnboarding(code: string, state: SocialOnboarding) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return;
  await affiliateFirestore().collection("affiliates").doc(normalized).update({ socialOnboarding: state });
}
