import { checkoutCampaignCandidate } from "@/lib/affiliate/link";
import { affiliateCampaignFromCookies, affiliateCodeFromCookies } from "@/lib/affiliate/store";
import { assignedCampaignForAffiliate } from "@/lib/genhealth/promocodes";

export async function campaignForCheckout(ref?: string | null, queryCampaign?: unknown) {
  if (!ref) return null;
  const cookieCode = await affiliateCodeFromCookies();
  const cookieCampaign = await affiliateCampaignFromCookies();
  const candidate = checkoutCampaignCandidate(ref, cookieCode, cookieCampaign, queryCampaign);
  if (!candidate) return null;
  return assignedCampaignForAffiliate(ref, candidate);
}
