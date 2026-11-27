import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AffiliateStatsBoard } from "@/components/affiliate/AffiliateStatsBoard";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { loadAffiliateAgreements, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { agreementPostMonth } from "@/lib/affiliate/agreement-earnings";
import { agreementPostTotal } from "@/lib/affiliate/agreement-partnership";
import { memo } from "@/lib/affiliate/memo";
import { loadMarketingEvents } from "@/lib/affiliate/marketing-events";
import { toAffiliateOrder } from "@/lib/affiliate/order-view";
import { placedSlotNumber, postIdentity, postPlaceLabel, postTypeLabel, type AgreementBoardPost } from "@/lib/affiliate/post-agreement";
import { loadContentSubmissions, refreshDueMetrics, type ContentSubmission } from "@/lib/affiliate/post-review";
import { adjustedCommissionCents, remainingSalesCents } from "@/lib/affiliate/refunds";
import { utcDay, type SaleDayCount, type SalePeriodRefs, type StatsBoardDay, type StatsBoardPost } from "@/lib/affiliate/stats-board";
import { payoutPeriod } from "@/lib/affiliate/payouts";
import { loadAffiliateActivity, type ConversionSummary } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../../current";

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const socialErrors: Record<string, string> = {
  social: "That social account could not be connected.",
  "social-setup": "Reporting is not set up for that network.",
  "social-denied": "The connection was cancelled.",
  "social-page": "Connect a Facebook Page to import posts.",
  "social-channel": "This Google account has no YouTube channel.",
};

function titleOf(caption: string) {
  const line = caption.split("\n").map((part) => part.trim()).find(Boolean) ?? "";
  return line.slice(0, 80) || "Untitled post";
}

function postedOn(post: ContentSubmission) {
  return (post.publishedAt || post.createdAt || "").slice(0, 10);
}

function boardPlatform(post: ContentSubmission): StatsBoardPost["platform"] {
  if (post.format === "tiktok") return "tiktok";
  if (post.format === "instagram_reel" || post.format === "instagram_post") return "instagram";
  const host = (() => {
    try {
      return new URL(post.postUrl ?? "").hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host === "fb.com" || host === "fb.watch") return "facebook";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  return "other";
}

function agreementRows(posts: ContentSubmission[]): AgreementBoardPost[] {
  return posts.map((post) => ({
    id: post.id,
    agreementId: post.agreementId,
    contentStatus: post.contentStatus,
    offerId: post.offerId,
    publicationStatus: post.publicationStatus,
    publishedAt: post.publishedAt,
    submittedAt: post.submittedAt,
    postingMonth: post.postingMonth,
    reviewNote: post.reviewNote,
    title: titleOf(post.caption),
    agreementSlot: post.agreementSlot,
  }));
}

function agreementLabel(post: ContentSubmission, rows: AgreementBoardPost[], agreements: readonly AffiliateAgreement[]) {
  const owner = agreements.find((item) => item.id === post.agreementId);
  const total = owner ? agreementPostTotal(owner.posts) : 0;
  const slot = placedSlotNumber(rows, post.agreementId, agreementPostMonth(post), total, post.id);
  const place = postPlaceLabel(
    { offerId: post.offerId, agreementId: post.agreementId, agreementSlot: post.agreementSlot },
    slot,
    post.offerId ? "Marketing offer" : "",
  );
  const type = postTypeLabel({
    agreementPlatform: post.agreementPlatform,
    agreementPostType: post.agreementPostType,
    format: post.format,
    fileCount: post.files.length || (post.filePath ? 1 : 0),
  });
  return postIdentity(place, type);
}

function boardPost(post: ContentSubmission, label: string): StatsBoardPost | null {
  const day = postedOn(post);
  if (!day) return null;
  const platform = boardPlatform(post);
  const kind = platform === "tiktok" || platform === "youtube" ? "Video" : platform === "instagram" && post.format === "instagram_reel" ? "Reel" : post.files.length > 1 ? "Carousel" : "Post";
  return {
    id: post.id,
    title: titleOf(post.caption),
    platform,
    kind,
    campaign: post.campaign,
    agreementLabel: label,
    postedOn: day,
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: post.comments ?? 0,
    shares: post.shares ?? 0,
    saves: post.saves ?? 0,
  };
}

function boardSales(conversions: ConversionSummary[]) {
  const days = new Map<string, SaleDayCount>();
  const periods = new Map<string, SalePeriodRefs>();
  for (const conversion of conversions) {
    if (conversion.dryRun || !conversion.createdAt) continue;
    const period = payoutPeriod(conversion.createdAt);
    if (!period || remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) <= 0) continue;
    const commissionCents = adjustedCommissionCents(conversion.commissionCents, conversion.commissionRefundedCents);
    const commissioned = conversion.orderKind === "lab" && commissionCents > 0;
    const countedCommission = commissioned ? commissionCents : 0;
    const day = conversion.createdAt.slice(0, 10);
    const dayKey = `${day}:${commissioned}`;
    const dayRow = days.get(dayKey) ?? { day, commissioned, orders: 0, commissionCents: 0 };
    dayRow.orders += 1;
    dayRow.commissionCents += countedCommission;
    days.set(dayKey, dayRow);
    const periodKey = `${period}:${commissioned}`;
    const periodRow = periods.get(periodKey) ?? { period, commissioned, orders: 0, commissionCents: 0, refs: [] };
    periodRow.orders += 1;
    periodRow.commissionCents += countedCommission;
    periodRow.refs.push(toAffiliateOrder({ orderId: conversion.orderId }).ref);
    periods.set(periodKey, periodRow);
  }
  return { days: [...days.values()], periods: [...periods.values()] };
}

function published(post: ContentSubmission) {
  return post.contentStatus === "approved" && (post.publicationStatus === "tracking_active" || Boolean(post.postUrl));
}

function trafficDays(events: { kind: string; payable: boolean; excluded?: boolean; createdAt: string }[]): StatsBoardDay[] {
  const days = new Map<string, StatsBoardDay>();
  for (const event of events) {
    if (!event.payable || event.excluded || (event.kind !== "click" && event.kind !== "page_view")) continue;
    const day = event.createdAt.slice(0, 10);
    const current = days.get(day) ?? { day, clicks: 0, pageViews: 0 };
    if (event.kind === "click") current.clicks += 1;
    else current.pageViews += 1;
    days.set(day, current);
  }
  return [...days.values()];
}

export default async function AffiliateStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const socialError = query.error ? socialErrors[query.error] ?? "" : "";
  let posts: StatsBoardPost[] = [];
  let traffic: StatsBoardDay[] = [];
  let saleDays: SaleDayCount[] = [];
  let salePeriods: SalePeriodRefs[] = [];
  let unavailable = "";
  try {
    const submissions = await memo(`submissions:${affiliate.code}`, () => loadContentSubmissions(affiliate.code));
    const agreements = await memo(`agreements:${affiliate.code}`, () => loadAffiliateAgreements(affiliate.code)).catch(() => [] as AffiliateAgreement[]);
    const rows = agreementRows(submissions);
    await memo(`stats-refresh:${affiliate.code}`, () => refreshDueMetrics(affiliate.code, 8));
    posts = submissions.filter(published).map((post) => boardPost(post, agreementLabel(post, rows, agreements))).filter((post): post is StatsBoardPost => post !== null);
    traffic = trafficDays(await memo(`marketing-events:${affiliate.code}`, () => loadMarketingEvents({ code: affiliate.code })));
    const sales = boardSales((await memo(`activity:${affiliate.code}`, () => loadAffiliateActivity(affiliate.code))).conversions);
    saleDays = sales.days;
    salePeriods = sales.periods;
  } catch {
    unavailable = "Stats are unavailable right now.";
  }

  const statsNotice =
    query.notice === "connected"
      ? "Account connected."
      : query.notice === "disconnected"
        ? "Account disconnected."
        : query.notice === "disconnected-facebook"
          ? "Leader Health is disconnected. You can also remove Leader Health in Facebook under Settings, Security, Apps and websites."
          : query.notice === "disconnected-tiktok"
            ? "Leader Health is disconnected. You can also remove Leader Health in TikTok under Settings, Security, Manage app permissions."
            : query.notice === "disconnected-youtube"
              ? "Leader Health is disconnected. You can also remove Leader Health in your Google Account under Security, Third-party apps and services."
              : "";

  return (
    <section className="min-w-0" aria-labelledby="portal-stats-title">
      <h2 id="portal-stats-title" className="sr-only">Stats</h2>
      {socialError ? <TimedNotice message={socialError} tone="warn" query="error" className="mb-4" /> : null}
      {statsNotice ? <TimedNotice message={statsNotice} tone="plain" query="notice" className="mb-4" /> : null}
      {unavailable ? <p className="text-ink">{unavailable}</p> : <AffiliateStatsBoard today={utcDay()} posts={posts} traffic={traffic} saleDays={saleDays} salePeriods={salePeriods} />}
    </section>
  );
}
