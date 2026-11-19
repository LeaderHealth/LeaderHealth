import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AffiliateCampaigns } from "@/components/affiliate/AffiliateCampaigns";
import { affiliateCampaignBoard, type AffiliateCampaignPost } from "@/lib/affiliate/affiliate-campaigns";
import { DEFAULT_CAMPAIGN_DISCLOSURE } from "@/lib/affiliate/campaign-record";
import { viewPayTerms } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { standingViewRateCents } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { DISCLOSURE_LINE, loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { loadAffiliateAgreements, utcAgreementToday } from "@/lib/affiliate/agreements";
import { postingAgreement } from "@/lib/affiliate/post-agreement";
import { memo } from "@/lib/affiliate/memo";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "My campaigns",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  disclosure: "Include the sponsorship disclosure in the caption.",
  link: "Put your tracking link in the caption. A link in your bio is not enough.",
  file: "Use a PNG, JPEG, or WebP image under 8 MB, or an MP4, MOV, or WebM video under 200 MB.",
  url: "Paste the link to the live post.",
  fee: "The social rate is not set yet.",
  terms: "Accept the rate and payment terms before sending the post.",
  choose: "That campaign is not assigned to you.",
  status: "That post can no longer be changed that way.",
  invalid: "Add a caption and a picture or video.",
  unavailable: "That could not be saved right now.",
  agreement: "A signed agreement has to be on your account before you can send a post.",
  month: "Choose a full month of this agreement that still has room for these posts.",
};

export default async function AffiliateCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; campaign?: string; error?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  let unavailable = false;
  let submissions: ContentSubmission[] = [];
  let posts: AffiliateCampaignPost[] = [];
  let records: Awaited<ReturnType<typeof loadMarketingCampaignRecords>> = [];
  try {
    [records, submissions] = await Promise.all([
      memo("campaign-records", () => loadMarketingCampaignRecords()),
      memo(`submissions:${affiliate.code}`, () => loadContentSubmissions(affiliate.code)),
    ]);
    posts = submissions.map((post) => ({
      id: post.id,
      campaign: post.campaign,
      caption: post.caption,
      contentStatus: post.contentStatus,
      publicationStatus: post.publicationStatus,
      format: post.format,
      reviewNote: post.reviewNote,
      hasFile: Boolean(post.filePath || post.files.length),
      createdAt: post.createdAt,
    }));
  } catch {
    unavailable = true;
  }
  const board = affiliateCampaignBoard({ records, posts, code: affiliate.code });
  const [agreementRows, rates] = await Promise.all([
    memo(`agreements:${affiliate.code}`, () => loadAffiliateAgreements(affiliate.code)).catch(() => null),
    memo("payment-rates", () => loadPaymentRates()).catch(() => null),
  ]);
  const posting = agreementRows ? postingAgreement(agreementRows, utcAgreementToday(), submissions) : null;
  const viewRate = rates ? standingViewRateCents(rates) : null;
  const name = query.campaign?.trim() ?? "";
  const toast =
    query.notice === "accepted"
      ? `You accepted ${name || "the campaign"}. It’s now in Active campaigns.`
      : query.notice === "declined"
        ? `${name || "The campaign"} declined.`
        : query.notice === "post"
          ? "Sent for review. Status: Pending review."
          : query.notice === "tracked"
            ? "Link added. The live post is verified."
            : query.notice === "pending"
              ? "Link added. Status: Published, pending verification."
              : query.notice === "check"
                ? "We could not confirm that post."
                : "";

  return (
    <>
      {unavailable ? <p className="mb-4 text-sm text-ink">Campaigns are unavailable right now.</p> : null}
      <AffiliateCampaigns
        invites={board.invites}
        active={board.active}
        past={board.past}
        disclosure={DISCLOSURE_LINE || DEFAULT_CAMPAIGN_DISCLOSURE}
        trackingUrl={affiliateTrackingLink(affiliate.code)}
        terms={viewRate == null ? "" : `I accept ${viewPayTerms(viewRate, affiliate.deliverableMaxPayCents, affiliate.deliverableTrackingDays)}. These terms lock when I send the post.`}
        canSend={viewRate != null}
        posting={posting}
        toast={toast}
        error={query.error ? errors[query.error] ?? "That could not be saved right now." : ""}
      />
    </>
  );
}
