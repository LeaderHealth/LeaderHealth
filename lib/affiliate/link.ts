import { absoluteUrl } from "@/lib/seo/schema";
import { normalizeAffiliateCode } from "./code";

export function affiliateCampaign(value: unknown) {
  if (typeof value !== "string") return null;
  const campaign = value.trim();
  if (!campaign || campaign.length > 80 || /[\u0000-\u001f]/.test(campaign)) return null;
  return campaign;
}

export function affiliateTrackingParams(code: string, campaign?: string | null) {
  return {
    ref: code,
    utm_source: code,
    utm_medium: "affiliate",
    utm_campaign: affiliateCampaign(campaign) ?? code,
  };
}

export function affiliateTrackingPath(code: string, campaign?: string | null) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return "/";
  return `/?${new URLSearchParams(affiliateTrackingParams(normalized, campaign)).toString()}`;
}

export function affiliateTrackingLink(code: string, campaign?: string | null) {
  return absoluteUrl(affiliateTrackingPath(code, campaign));
}

export function applyAffiliateTracking(params: URLSearchParams, code: string | null | undefined, campaign?: string | null) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return;
  for (const [key, value] of Object.entries(affiliateTrackingParams(normalized, campaign))) {
    params.set(key, value);
  }
}

export function checkoutCampaignCandidate(
  ref: string,
  cookieCode: string | null,
  cookieCampaign: string | null,
  queryCampaign?: unknown,
) {
  if (cookieCode === ref) return affiliateCampaign(cookieCampaign);
  return affiliateCampaign(queryCampaign);
}
