import type { Metadata } from "next";
import { AdminOffersBoard } from "@/components/affiliate/AdminOffersBoard";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { loadMarketingOffers, offerExpiresLabel, offerKindLabel } from "@/lib/affiliate/marketing-offers";
import { loadMarketingCampaigns } from "@/lib/affiliate/roi-store";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { standingViewRateCents } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Monthly plans",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  sent: "Offer sent.",
  revised: "Revised offer sent.",
  accepted: "Counter accepted. Terms are locked.",
  declined: "Offer closed.",
  withdrawn: "Offer withdrawn.",
};

export default async function MarketingOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; offer?: string; code?: string }>;
}) {
  const query = await searchParams;
  const actor = await adminSessionActor();
  const canSave = Boolean(actor && adminHasFullAccess(actor));
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const affiliateCode = normalizeAffiliateCode(query.code) ?? "";
  let loadError = "";
  let socialViewRateCents: number | null = null;
  try {
    socialViewRateCents = standingViewRateCents(await loadPaymentRates());
  } catch {
    socialViewRateCents = null;
  }
  let affiliates: { code: string; name: string; feeCents: number | null; maxPayCents: number | null; trackingDays: number }[] = [];
  let offers: Awaited<ReturnType<typeof loadMarketingOffers>> = [];
  let campaigns: string[] = [];
  try {
    const overview = await loadAffiliateOverview();
    affiliates = [...overview.affiliates]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((affiliate) => ({
        code: affiliate.code,
        name: affiliate.name,
        feeCents: affiliate.deliverableFeeCents,
        maxPayCents: affiliate.deliverableMaxPayCents,
        trackingDays: affiliate.deliverableTrackingDays,
      }));
    offers = await loadMarketingOffers();
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Monthly plans are unavailable right now.";
  }
  try {
    campaigns = await loadMarketingCampaigns();
  } catch {
    campaigns = [];
  }
  const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const toast = [notices[query.notice ?? ""] ?? "", error, loadError].filter(Boolean).join(" ");

  return (
    <AdminOffersBoard
      canSave={canSave}
      toast={toast}
      selectedId={query.offer ?? ""}
      affiliateCode={affiliateCode}
      affiliates={affiliates}
      socialViewRateCents={socialViewRateCents}
      campaigns={campaigns}
      offers={offers.map((offer) => ({
        id: offer.id,
        code: offer.code,
        name: names.get(offer.code) ?? offer.code,
        kind: offer.kind,
        kindLabel: offerKindLabel(offer.kind),
        campaign: offer.campaign,
        publishBy: offer.publishBy,
        amountCents: offer.amountCents,
        maxPayCents: offer.maxPayCents,
        trackingDays: offer.trackingDays,
        brief: offer.brief,
        status: offer.status,
        counterAmountCents: offer.counterAmountCents,
        counterPublishBy: offer.counterPublishBy,
        counterNote: offer.counterNote,
        expiresLabel: offerExpiresLabel(offer.expiresAt),
        history: offer.history,
      }))}
    />
  );
}
