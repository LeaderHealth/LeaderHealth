import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { acknowledgeDisclosureAction } from "../../compliance-actions";
import { PostsHub, type HubPost } from "@/components/affiliate/PostsHub";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { deliverableDetail, deliverablePhase, deliverableStatusLabel, holdEndsAt } from "@/lib/affiliate/deliverable-flow";
import { resolvedTrackingDays, viewPayCents } from "@/lib/affiliate/manual-checkpoint";
import { loadDeliverablePayments, type DeliverablePayment } from "@/lib/affiliate/deliverable-payments";
import { formatCents, formatPublishDate, formatWhen, viewPayTerms } from "@/lib/affiliate/format";
import { standingViewRateCents } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { loadMarketingOffer, offerKindLabel } from "@/lib/affiliate/marketing-offers";
import { formatForOfferKind, offerSlideBounds, postSourceLabel } from "@/lib/affiliate/offer-post";
import { DISCLOSURE_LINE, instagramCheckCopy, instagramLinkChecks, loadContentSubmissions, manualReportDue, metricLines, metricsOriginLabel, networkConnectedForPost, type ContentSubmission } from "@/lib/affiliate/post-review";
import { affiliateCanAttachCampaign } from "@/lib/affiliate/campaign-record";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { instagramConfigured, tiktokConfigured } from "@/lib/affiliate/social-oauth";
import { loadSocialAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";
import { loadAffiliateAgreements, utcAgreementToday } from "@/lib/affiliate/agreements";
import { agreementPostMonth } from "@/lib/affiliate/agreement-earnings";
import { postingAgreement, type PostingAgreement } from "@/lib/affiliate/post-agreement";
import { memo } from "@/lib/affiliate/memo";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const postErrors: Record<string, string> = {
  acknowledge: "Confirm the sponsorship disclosure before continuing.",
  invalid: "Add a caption and a picture or video.",
  disclosure: "Include “Paid partnership with Leader Health” in the caption.",
  link: "Put your tracking link in the caption. A link in your bio is not enough.",
  url: "Paste the link from the TikTok, Instagram post, or Instagram reel you published.",
  file: "Use a PNG, JPEG, or WebP image under 8 MB, or an MP4, MOV, or WebM video under 200 MB. A saved TikTok video is usually an MP4.",
  storage: "Post storage is not set up. Set FIREBASE_STORAGE_BUCKET.",
  status: "That post can no longer be changed that way.",
  counts: "Enter views, likes, comments, shares, or saves as a whole number.",
  unavailable: "That could not be saved right now.",
  fee: "A full admin needs to set your rate per 1,000 views before you can send a post.",
  offer: "That marketing offer is already attached to a post.",
  terms: "Accept the rate and payment terms before sending the post.",
  campaign: "Choose a campaign assigned to you, or leave it blank.",
  date: "Choose a proposed publishing date in the month these posts count toward.",
  agreement: "A signed agreement has to be on your account before you can send a post.",
  month: "Choose a full month of this agreement that still has room for these posts.",
};

const notices: Record<string, string> = {
  acknowledged: "Disclosure acknowledged.",
  post: "Sent for review. We’ll email you when it’s approved.",
  campaign: "Campaign saved.",
  revised: "Sent back for review. We’ll email you when it’s approved.",
  tracked: "Your post is live.",
  pending: "Link saved. An admin will confirm the TikTok.",
  check: "We could not confirm that Instagram post.",
  withdrawn: "Post withdrawn.",
  drafts: "Drafts saved.",
  counts: "Numbers saved.",
  change: "Change requested. A sub-admin or admin updates the numbers.",
  "change-cancelled": "Change request cancelled.",
};

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleOf(caption: string) {
  const lines = caption
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
  const line = lines.find((part) => part.toLowerCase() !== DISCLOSURE_LINE.toLowerCase() && !/^https?:\/\//i.test(part));
  const chosen = line || lines.find((part) => !/^https?:\/\//i.test(part)) || "";
  if (!chosen) return "Untitled post";
  return chosen.length > 80 ? `${chosen.slice(0, 77)}...` : chosen;
}

function excerptOf(caption: string) {
  const line = caption.replace(/\s+/g, " ").trim();
  if (!line) return "Untitled post";
  return line.length > 64 ? `${line.slice(0, 61)}...` : line;
}

function historyFor(post: ContentSubmission): HubPost["history"] {
  const when = (value: string | null) => (value ? formatWhen(value) : "");
  if (post.contentStatus === "draft") return [{ label: "Draft, not sent yet", when: when(post.createdAt), note: "", tone: "neutral" }];
  const events: HubPost["history"] = [{ label: "You sent it for review", when: when(post.createdAt), note: "", tone: "neutral" }];
  if (post.contentStatus === "revision_requested") events.push({ label: "Changes requested", when: when(post.reviewedAt), note: post.reviewNote, tone: "bad" });
  if (post.contentStatus === "rejected") events.push({ label: "Not approved", when: when(post.reviewedAt), note: post.reviewNote, tone: "bad" });
  if (post.contentStatus === "withdrawn") events.push({ label: "You withdrew it", when: when(post.reviewedAt), note: "", tone: "neutral" });
  if (post.contentStatus === "approved") events.push({ label: "Approved", when: when(post.reviewedAt), note: "", tone: "neutral" });
  if (post.postUrl) events.push({ label: post.format === "tiktok" ? "You added the TikTok link" : post.format === "instagram_reel" ? "You added the reel link" : "You added the Instagram link", when: "", note: post.postUrl, tone: "neutral" });
  if (post.publicationStatus === "tracking_active") events.push({ label: "Live. Disclosure and tracking link found", when: "", note: "", tone: "good" });
  if (post.publicationStatus === "verification_failed") events.push({ label: "The Instagram check needs a fix", when: "", note: post.verificationNote, tone: "bad" });
  return events;
}

function captionsForSlides(post: ContentSubmission, count: number) {
  if (post.slideCaptions.length === count) return post.slideCaptions;
  const split = post.caption.split(/\n\n/).map((item) => item.trim()).filter(Boolean);
  if (count > 1 && split.length === count) return split;
  if (count <= 1) return [post.caption];
  return [post.caption, ...Array.from({ length: Math.max(count - 1, 0) }, () => "")];
}

function paymentCopy(post: ContentSubmission, payment: DeliverablePayment | undefined) {
  const snapshot = {
    contentStatus: post.contentStatus,
    publicationStatus: post.publicationStatus,
    agreedFeeCents: post.agreedFeeCents,
    viewRateCents: post.viewRateCents,
    maxPayCents: post.maxPayCents,
    trackingDays: post.trackingDays,
    views: post.views,
    publishedAt: post.publishedAt,
    deliverableHoldStartedAt: post.deliverableHoldStartedAt,
    deliverableRecheckedAt: post.deliverableRecheckedAt,
    deliverableForfeitedAt: post.deliverableForfeitedAt,
  };
  const status = payment?.status === "paid" || payment?.status === "approved" ? payment.status : deliverablePhase(snapshot, Date.now());
  if (!status) return { payLabel: "", payDetail: "", payAmount: "" };
  const ends = holdEndsAt(snapshot);
  const calculated = post.viewRateCents != null && post.views != null ? viewPayCents(post.views, post.viewRateCents, post.maxPayCents) : null;
  const payAmount = status === "closed"
    ? "Closed"
    : status === "paid"
      ? formatCents((payment?.paidCents ?? 0) + (payment?.adjustmentCents ?? 0))
      : post.viewRateCents != null
        ? status === "pending" && calculated != null
          ? formatCents(calculated)
          : viewPayTerms(post.viewRateCents, post.maxPayCents, resolvedTrackingDays(post.trackingDays))
        : post.agreedFeeCents == null
          ? ""
          : formatCents(post.agreedFeeCents);
  const detail = deliverableDetail(status, ends ? formatWhen(ends) : null);
  return {
    payLabel: deliverableStatusLabel(status, payment?.adjustmentCents != null),
    payDetail: status === "paid" && payment?.adjustmentReason ? `${detail} ${payment.adjustmentReason}` : detail,
    payAmount,
  };
}

function hubPost(post: ContentSubmission, accounts: SocialAccountView[], payment: DeliverablePayment | undefined): HubPost {
  const copy = instagramCheckCopy(post.publicationStatus, post.verificationNote);
  const files = post.files.length ? post.files : post.filePath ? [{ path: post.filePath, contentType: post.contentType }] : [];
  const captions = captionsForSlides(post, files.length);
  const connected = networkConnectedForPost(post.format, accounts);
  const connectHref = post.format === "tiktok" ? (tiktokConfigured() ? "/api/affiliate/social/tiktok/start" : null) : instagramConfigured() ? "/api/affiliate/social/instagram/start" : null;
  return {
    id: post.id,
    title: titleOf(post.caption),
    excerpt: excerptOf(post.caption),
    caption: post.caption,
    status: post.contentStatus,
    publication: post.publicationStatus,
    sent: formatDay(post.createdAt),
    reviewNote: post.reviewNote,
    postUrl: post.postUrl,
    fileHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}`,
    downloadHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&download=1`,
    hasFile: Boolean(post.filePath),
    media: post.contentType.startsWith("video/") ? "video" : "photo",
    slides: files.map((file, index) => ({
      href: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=${index + 1}`,
      downloadHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=${index + 1}&download=1`,
      media: file.contentType.startsWith("video/") ? "video" as const : "photo" as const,
      caption: captions[index] ?? "",
    })),
    checks: instagramLinkChecks(post.publicationStatus, post.verificationNote),
    headline: copy.headline,
    detail: copy.detail,
    metrics: post.publicationStatus === "tracking_active" ? metricLines(post, post.format === "tiktok" ? "Not available yet" : undefined) : [],
    metricsNote: metricsOriginLabel(post.metricsSource, post.metricsRecordedAt),
    counts: { views: post.views, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves },
    hasManual: post.metricsSource === "manual",
    changeRequest: post.metricChange
      ? { views: post.metricChange.views, likes: post.metricChange.likes, comments: post.metricChange.comments, shares: post.metricChange.shares, saves: post.metricChange.saves, note: post.metricChange.note }
      : null,
    askManual: manualReportDue({ ...post, connected }),
    connectHref,
    history: historyFor(post),
    batchId: post.batchId,
    campaign: post.campaign,
    mediaKey: (post.files.length ? post.files : []).map((file) => file.name || file.path).join("\n"),
    format: post.format,
    source: postSourceLabel(post.offerId),
    agreement: post.agreementLabel,
    offerId: post.offerId,
    offerBrief: post.offerBrief,
    publishBy: post.publishBy ? formatPublishDate(post.publishBy) : "",
    proposedOn: post.proposedPublishOn ? formatPublishDate(post.proposedPublishOn) : "",
    postingMonth: agreementPostMonth(post),
    ...paymentCopy(post, payment),
    trackingDays: resolvedTrackingDays(post.trackingDays),
  };
}

export default async function AffiliatePostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; offer?: string; post?: string; compose?: string; campaign?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const code = affiliate.code;
  const acknowledged = await memo(`disclosure-ack:${code}`, () => disclosureAcknowledged(code).catch(() => false));
  let posts: ContentSubmission[] = [];
  let accounts: SocialAccountView[] = [];
  let payments: DeliverablePayment[] = [];
  let assignedCampaigns: string[] = [];
  let postsUnavailable = false;
  let posting: PostingAgreement | null = null;
  let agreementsUnavailable = false;
  let viewRate: Awaited<ReturnType<typeof loadPaymentRates>> | null = null;
  if (acknowledged) {
    const [loadedPosts, loadedAccounts, loadedPayments, records, agreements, rates] = await Promise.all([
      memo(`submissions:${code}`, () => loadContentSubmissions(code)).catch(() => null),
      memo(`accounts:${code}`, () => loadSocialAccounts(code)).catch(() => null),
      memo(`payments:${code}`, () => loadDeliverablePayments(code)).catch(() => null),
      memo("campaign-records", () => loadMarketingCampaignRecords()).catch(() => null),
      memo(`agreements:${code}`, () => loadAffiliateAgreements(code)).catch(() => null),
      memo("payment-rates", () => loadPaymentRates().catch(() => null)),
    ]);
    if (!loadedPosts || !loadedAccounts || !loadedPayments) postsUnavailable = true;
    else {
      posts = loadedPosts;
      accounts = loadedAccounts;
      payments = loadedPayments;
    }
    viewRate = rates;
    if (records) {
      assignedCampaigns = records
        .filter((record) => affiliateCanAttachCampaign(record, code, posts.some((post) => post.contentStatus !== "withdrawn" && post.campaign.trim().toLowerCase() === record.name.toLowerCase())))
        .map((record) => record.name);
    }
    if (!agreements) agreementsUnavailable = true;
    else {
      try {
        posting = postingAgreement(agreements, utcAgreementToday(), posts);
      } catch {
        agreementsUnavailable = true;
      }
    }
  }
  const paymentByPost = new Map(payments.map((payment) => [payment.postId, payment]));
  let offerComposer: {
    id: string;
    format: NonNullable<ReturnType<typeof formatForOfferKind>>;
    kindLabel: string;
    brief: string;
    publishLabel: string;
    feeCents: number;
    maxPayCents: number | null;
    trackingDays: number;
    campaign: string;
    draftId: string;
    minSlides: number;
    maxSlides: number;
  } | null = null;
  let focusPostId = query.post ?? "";
  if (query.offer && acknowledged && !postsUnavailable) {
    const linkedOffer = await loadMarketingOffer(query.offer).catch(() => null);
    const openPost = posts.find((post) => post.offerId === linkedOffer?.id && post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected" && post.contentStatus !== "draft");
    const draft = posts.find((post) => post.offerId === linkedOffer?.id && post.contentStatus === "draft");
    if (linkedOffer && linkedOffer.code === affiliate.code && linkedOffer.status === "accepted") {
      if (openPost) focusPostId = openPost.id;
      else {
        const format = formatForOfferKind(linkedOffer.kind);
        const bounds = offerSlideBounds(linkedOffer.kind);
        if (format && bounds) {
          offerComposer = {
            id: linkedOffer.id,
            format,
            kindLabel: offerKindLabel(linkedOffer.kind),
            brief: linkedOffer.brief,
            publishLabel: formatPublishDate(linkedOffer.publishBy),
            feeCents: linkedOffer.amountCents,
            maxPayCents: linkedOffer.maxPayCents,
            trackingDays: linkedOffer.trackingDays,
            campaign: linkedOffer.campaign,
            draftId: draft?.id ?? "",
            minSlides: bounds.min,
            maxSlides: bounds.max,
          };
        }
      }
    }
  }
  const error = query.error ? (postErrors[query.error] ?? "") : "";
  const notice = notices[query.notice ?? ""] ?? "";

  return (
    <div className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {acknowledged ? null : (
        <>
          <h2 className="text-2xl">Posts</h2>
          {notice ? <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">{notice}</p> : null}
        <form action={acknowledgeDisclosureAction} className="mt-6">
          <input type="hidden" name="next" value="posts" />
          <h3 className="text-lg">Sponsorship agreement</h3>
          <p className="mt-2 max-w-2xl text-sm text-brown">Put “Paid partnership with Leader Health” and your tracking link in the caption. A link in your bio is not enough.</p>
          <label className="mt-4 flex items-start gap-3 text-sm text-ink">
            <input name="acknowledge" type="checkbox" required className="mt-1 size-4 accent-ink" />
            <span>I will include a clear sponsorship disclosure on posts and videos I publish for Leader Health, and I will send each new post for review before I publish it, with my tracking link in the caption.</span>
          </label>
          <button type="submit" className={`${buttonClass} mt-4`}>
            Acknowledge
          </button>
        </form>
        </>
      )}
      {acknowledged && postsUnavailable ? <p className="text-sm text-ink">Posts are unavailable right now.</p> : null}
      {acknowledged && !postsUnavailable ? (
        <PostsHub
          posts={posts.map((post) => hubPost(post, accounts, paymentByPost.get(post.id)))}
          trackingUrl={affiliateTrackingLink(affiliate.code)}
          disclosureLine={DISCLOSURE_LINE}
          affiliateCode={affiliate.code}
          email={affiliate.email}
          notice={notice}
          noticeTone={query.notice === "check" ? "warn" : "ok"}
          agreedFeeCents={standingViewRateCents(viewRate)}
          standingMaxPayCents={affiliate.deliverableMaxPayCents}
          standingTrackingDays={affiliate.deliverableTrackingDays}
          campaigns={assignedCampaigns}
          offer={offerComposer}
          focusPostId={focusPostId}
          startCompose={query.compose === "1"}
          startCampaign={query.campaign ?? ""}
          posting={posting}
          agreementsUnavailable={agreementsUnavailable}
        />
      ) : null}
    </div>
  );
}
