import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AffiliateOffers } from "@/components/affiliate/AffiliateOffers";
import { formatPublishDate, viewPayTerms } from "@/lib/affiliate/format";
import { loadMarketingOffers, offerExpiresLabel, offerKindLabel } from "@/lib/affiliate/marketing-offers";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "My monthly plan",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the rate, publish-by date, and note, then try again.",
  status: "That offer can no longer be changed.",
  missing: "That offer could not be found.",
  unavailable: "Monthly plans are unavailable right now.",
};

function expiresSoon(expiresAt: string | null) {
  if (!expiresAt) return false;
  const days = Math.ceil((Date.parse(expiresAt) - Date.now()) / (24 * 60 * 60 * 1000));
  return Number.isFinite(days) && days <= 1;
}

function offerPostLink(offerId: string, posts: ContentSubmission[]) {
  const linked = posts.filter((post) => post.offerId === offerId && post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected");
  const post = linked.find((item) => item.contentStatus !== "draft") ?? linked[0];
  const create = { stageLabel: "Not started", stageBg: "#EFEAE9", stageFg: "#4A3A37", ctaLabel: "Create post", ctaHref: `/affiliates/posts?offer=${encodeURIComponent(offerId)}`, ctaPrimary: true };
  if (!post) return create;
  const href = `/affiliates/posts?post=${encodeURIComponent(post.id)}`;
  if (post.contentStatus === "draft") return { ...create, stageLabel: "Draft", ctaLabel: "Continue post", ctaHref: `/affiliates/posts?offer=${encodeURIComponent(offerId)}` };
  if (post.contentStatus === "submitted" || post.contentStatus === "revision_requested") {
    return { stageLabel: "Post in review", stageBg: "#FBEFD6", stageFg: "#7A4E00", ctaLabel: "View post", ctaHref: href, ctaPrimary: false };
  }
  if (post.publicationStatus === "tracking_active") {
    return { stageLabel: "Live", stageBg: "#DDF0E4", stageFg: "#1D6340", ctaLabel: "View post", ctaHref: href, ctaPrimary: false };
  }
  return { stageLabel: "Approved", stageBg: "#F3E6E3", stageFg: "#5A2A24", ctaLabel: "View post", ctaHref: href, ctaPrimary: false };
}

export default async function AffiliateOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; offer?: string; error?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  let loadError = "";
  let offers: Awaited<ReturnType<typeof loadMarketingOffers>> = [];
  let posts: ContentSubmission[] = [];
  try {
    [offers, posts] = await Promise.all([
      loadMarketingOffers(affiliate.code),
      loadContentSubmissions(affiliate.code),
    ]);
  } catch {
    loadError = "Monthly plans are unavailable right now.";
  }
  const selected = offers.find((offer) => offer.id === query.offer);
  const notice =
    query.notice === "accepted" && selected
      ? `Accepted. ${viewPayTerms(selected.amountCents, selected.maxPayCents, selected.trackingDays)} is locked in. Create your post when you're ready.`
      : query.notice === "declined"
        ? "Offer declined."
        : query.notice === "countered"
          ? "Counter sent. We'll let you know when Leader Health responds."
          : "";
  const toast = [notice, query.error ? errors[query.error] ?? "" : "", loadError].filter(Boolean).join(" ");

  return (
    <AffiliateOffers
      toast={toast}
      offers={offers.map((offer) => ({
        id: offer.id,
        kindLabel: offerKindLabel(offer.kind),
        campaign: offer.campaign,
        publishBy: offer.publishBy,
        publishLabel: formatPublishDate(offer.publishBy),
        amountCents: offer.amountCents,
        maxPayCents: offer.maxPayCents,
        trackingDays: offer.trackingDays,
        brief: offer.brief,
        status: offer.status,
        expiresLabel: offerExpiresLabel(offer.expiresAt),
        expiresSoon: expiresSoon(offer.expiresAt),
        counterAmountCents: offer.counterAmountCents,
        counterPublishLabel: formatPublishDate(offer.counterPublishBy || offer.publishBy),
        ...offerPostLink(offer.id, posts),
      }))}
    />
  );
}
