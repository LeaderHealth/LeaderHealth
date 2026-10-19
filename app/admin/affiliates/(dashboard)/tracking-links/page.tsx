import type { Metadata } from "next";
import { TrackingLinks } from "@/components/affiliate/TrackingLinks";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { AffiliateStoreError, loadAffiliateDashboard } from "@/lib/affiliate/store";
import { campaignForAffiliate, listPromoCodes, type PromoCodeRow } from "@/lib/genhealth/promocodes";

export const metadata: Metadata = {
  title: "Tracking links",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrackingLinksPage() {
  try {
    const { affiliates } = await loadAffiliateDashboard();
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
        }))}
      />
    );
  } catch (error) {
    const message = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
    return <p className="text-ink">{message}</p>;
  }
}
