import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { getAffiliate, type AffiliateSummary } from "@/lib/affiliate/store";

export async function currentAffiliate(): Promise<AffiliateSummary | null> {
  const code = await portalAffiliateCode();
  if (!code || !affiliateFirebaseConfigured()) return null;
  try {
    const affiliate = await getAffiliate(code);
    return affiliate?.active ? affiliate : null;
  } catch (error) {
    console.error("[affiliate] portal load failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
}
