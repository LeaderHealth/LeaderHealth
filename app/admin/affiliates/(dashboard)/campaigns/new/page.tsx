import type { Metadata } from "next";
import { CampaignCreate, type CampaignPerformanceRates } from "@/components/affiliate/CampaignCreate";
import { formatCents } from "@/lib/affiliate/format";
import { rateFor, standingViewRateCents } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Create campaign",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  let affiliates: { code: string; name: string; email: string }[] = [];
  let loadError = "";
  try {
    const overview = await loadAffiliateOverview();
    affiliates = [...overview.affiliates]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((affiliate) => ({ code: affiliate.code, name: affiliate.name, email: affiliate.email }));
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Campaigns are unavailable right now.";
  }

  const unset: CampaignPerformanceRates = { views: "Not set", engagements: "Not set", clicks: "Not set", pageViews: "Not set" };
  let rates = unset;
  try {
    const saved = await loadPaymentRates();
    const views = standingViewRateCents(saved);
    const each = (cents: number, unit: string) => (cents > 0 ? `${formatCents(cents)} ${unit}` : "Not set");
    rates = {
      views: views ? `${formatCents(views)} per 1,000` : "Not set",
      engagements: each(rateFor(saved, "engagements"), "each"),
      clicks: each(rateFor(saved, "clicks"), "each"),
      pageViews: each(rateFor(saved, "pageViews"), "per 1,000"),
    };
  } catch {
    rates = unset;
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;
  return <CampaignCreate affiliates={affiliates} rates={rates} />;
}
