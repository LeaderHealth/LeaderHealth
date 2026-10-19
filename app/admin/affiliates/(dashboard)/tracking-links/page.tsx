import type { Metadata } from "next";
import { TrackingLinks } from "@/components/affiliate/TrackingLinks";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { AffiliateStoreError, loadAffiliateDashboard, type AffiliateSummary } from "@/lib/affiliate/store";
import { campaignForAffiliate, listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";

export const metadata: Metadata = {
  title: "Tracking links",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrackingLinksPage() {
  let affiliates: AffiliateSummary[] | null = null;
  let loadError = "";
  try {
    affiliates = (await loadAffiliateDashboard()).affiliates;
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
  }
  if (!affiliates) {
    return <p className="text-ink">{loadError || "Could not load affiliate records."}</p>;
  }

  let catalog: PromoCodeRow[] = [];
  try {
    catalog = await listPromoCodes();
  } catch {
    catalog = [];
  }

  return (
    <TrackingLinks
      links={affiliates.map((affiliate) => ({
        code: affiliate.code,
        name: affiliate.name,
        active: affiliate.active,
        url: affiliateTrackingLink(affiliate.code, campaignForAffiliate(catalog, affiliate.code)),
        promos: promoRowsForAffiliate(catalog, affiliate.code).map((promo) => ({
          code: promo.code,
          url: affiliateTrackingLink(affiliate.code, promo.code),
        })),
      }))}
    />
  );
}
