import { absoluteUrl } from "@/lib/seo/schema";
import { normalizeAffiliateCode } from "./code";

function distinctPromo(value: string | null, affiliate: string | null) {
  if (!value) return null;
  if (affiliate && value.toLowerCase() === affiliate) return null;
  return value;
}

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

/**
 * Which promo, if any, this checkout should prefill.
 *
 * A promo link sets `utm_campaign` to the assigned code. A tracking link sets it
 * to the affiliate id, which is not a promo. A code saved from a promo link is
 * used after the query string is gone. A tracking-link value never wins over a
 * promo, and a promo the affiliate is not assigned is dropped by the caller.
 */
export function checkoutCampaignCandidate(
  ref: string,
  cookieCode: string | null,
  cookieCampaign: string | null,
  queryCampaign?: unknown,
) {
  const affiliate = normalizeAffiliateCode(ref);
  const fromQuery = affiliateCampaign(queryCampaign);
  // The tracking link's campaign is the affiliate id. That visit does not
  // carry a promo, and it must not revive a code saved from an older link.
  if (fromQuery && affiliate && fromQuery.toLowerCase() === affiliate) return null;
  const queryPromo = distinctPromo(fromQuery, affiliate);
  if (queryPromo) return queryPromo;
  if (cookieCode !== ref) return null;
  return distinctPromo(affiliateCampaign(cookieCampaign), affiliate);
}
