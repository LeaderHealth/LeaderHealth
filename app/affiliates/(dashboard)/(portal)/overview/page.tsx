import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { affiliateCampaignBoard } from "@/lib/affiliate/affiliate-campaigns";
import { hasAcceptedAgreement, loadAffiliateAgreements, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { agreementMonthEarning, agreementForMonth, agreementPostMonth, type AgreementMonthEarning } from "@/lib/affiliate/agreement-earnings";
import { loadAgreementPayoutsForCode, type AgreementPayoutRow } from "@/lib/affiliate/agreement-payouts";
import { agreementPostTotal } from "@/lib/affiliate/agreement-partnership";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { deliverableLines, loadDeliverablePayments, marketingTotals } from "@/lib/affiliate/deliverable-payments";
import { formatCents, formatPublishDate, publishDateValue } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { eventPeriod, socialMonthCents } from "@/lib/affiliate/payment-rates";
import { currentPayoutPeriod, formatPayoutMonth, loadPayoutRecords, type PayoutRecord } from "@/lib/affiliate/payouts";
import { agreementSlotRows, agreementSlotState, mixSentence, placedSlotNumber, postIdentity, postPlaceLabel, postTypeLabel, type AgreementBoardPost } from "@/lib/affiliate/post-agreement";
import { contentStatusLabel, loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { earnsLabCommission, remainingSalesCents } from "@/lib/affiliate/refunds";
import { memo } from "@/lib/affiliate/memo";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { AffiliateStoreError, loadAffiliateActivity, loadUncommissionedPendingOrders, type ConversionSummary } from "@/lib/affiliate/store";
import { listPromoCodes, personalPromoForAffiliate } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../../current";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "this" | "last" | "90";

const ranges: { id: Range; label: string }[] = [
  { id: "this", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "90", label: "Last 90 days" },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inkButton = `inline-flex h-[46px] items-center justify-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white hover:bg-brown ${focusRing}`;
const quietButton = `inline-flex h-[46px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink hover:bg-[#F7F3F2] ${focusRing}`;

function rangeOf(value: string | undefined): Range {
  if (value === "last" || value === "90") return value;
  return "this";
}

function overviewHref(range: Range) {
  return range === "this" ? "/affiliates/overview" : `/affiliates/overview?range=${range}`;
}

function shiftMonth(period: string, delta: number) {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStart(period: string) {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return Date.UTC(year, month - 1, 1);
}

function monthEnd(period: string) {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  return Date.UTC(year, month, 1);
}

function utcMidnight(now: number) {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function overviewWindow(range: Range, currentPeriod: string, now = Date.now()) {
  if (range === "90") {
    const day = 86_400_000;
    const windowStart = utcMidnight(now) - 89 * day;
    return {
      windowStart,
      windowEnd: now + 1,
      previousStart: windowStart - 90 * day,
      previousEnd: windowStart,
      versus: "vs. previous 90 days",
    };
  }
  const selectedPeriod = range === "last" ? shiftMonth(currentPeriod, -1) : currentPeriod;
  const previousPeriod = shiftMonth(selectedPeriod, -1);
  return {
    windowStart: monthStart(selectedPeriod),
    windowEnd: range === "last" ? monthEnd(selectedPeriod) : now + 1,
    previousStart: monthStart(previousPeriod),
    previousEnd: monthEnd(previousPeriod),
    versus: "vs. last month",
  };
}

function inWindow(value: string | null, start: number, end: number) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= start && time < end;
}

function shortDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function rangeLabel(start: number, endInclusive: number) {
  const startDate = new Date(start).toISOString().slice(0, 10);
  const endDate = new Date(endInclusive).toISOString().slice(0, 10);
  const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
  const startText = sameYear ? shortDate(startDate) : formatPublishDate(startDate);
  return `${startText} – ${formatPublishDate(endDate)}`;
}

function countLabel(value: number) {
  return value.toLocaleString("en-US");
}

function changeChip(current: number, previous: number, versus: string) {
  if (previous <= 0) {
    if (current <= 0) return { text: `0% ${versus}`, className: "bg-[#EFEAE9] text-[#4A3A37]", note: false };
    return { text: `New ${versus}`, className: "bg-[#DDF0E4] text-[#1D6340]", note: false };
  }
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(percent) * 10) / 10;
  const up = percent >= 0;
  return {
    text: `${up ? "▲" : "▼"} ${rounded}% ${versus}`,
    className: up ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]",
    note: false,
  };
}

function postStamp(post: ContentSubmission) {
  return post.publishedAt ?? post.submittedAt ?? post.createdAt;
}

function engagementsOf(post: ContentSubmission) {
  return [post.likes, post.comments, post.shares, post.saves].reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function pipColor(label: string) {
  if (label === "Verified") return "#1D6340";
  if (label === "Ready to publish") return "#33130F";
  if (label === "In review" || label === "Checking the link" || label === "Checking the update") return "#E9C98A";
  if (label === "Needs a fix" || label === "Changes requested" || label === "Live but changes requested") return "#9B2C1F";
  return "#E8DEDC";
}

function overviewBoard(posts: ContentSubmission[]): AgreementBoardPost[] {
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
    title: "",
    agreementSlot: post.agreementSlot,
    format: post.format,
    fileCount: post.files.length || (post.filePath ? 1 : 0),
    agreementPlatform: post.agreementPlatform,
    agreementPostType: post.agreementPostType,
    liveFixNote: post.liveFixNote,
  }));
}

function recentKind(post: ContentSubmission, rows: AgreementBoardPost[], agreements: readonly AffiliateAgreement[]) {
  const owner = agreements.find((item) => item.id === post.agreementId);
  const total = owner ? agreementPostTotal(owner.posts) : 0;
  const slot = placedSlotNumber(rows, post.agreementId, agreementPostMonth(post), total, post.id, owner?.posts ?? []);
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
  return postIdentity(place, type) || post.campaign || "post";
}

function paymentLine(earning: AgreementMonthEarning, left: number, socialCents: number) {
  const base = earning.status === "none" ? 0 : earning.earnedCents;
  const total = base + socialCents;
  const sum = `${formatCents(total)} · ${formatCents(base)} agreement + ${formatCents(socialCents)} social`;
  if (earning.status === "paid") return { text: `Paid · ${sum}`, className: "bg-[#DDF0E4] text-[#1D6340]" };
  if (earning.status === "earned" || earning.status === "approved") return { text: `Requirements met · ${sum}`, className: "bg-[#DDF0E4] text-[#1D6340]" };
  if (socialCents > 0) return { text: sum, className: "bg-[#F7F3F2] text-ink" };
  if (earning.status === "short") return { text: `Not yet · ${left} more to verify`, className: "bg-[#FBF6EC] text-[#7A4E00]" };
  return { text: "No monthly rate this month", className: "bg-[#F7F3F2] text-ink" };
}

function postStatus(post: ContentSubmission) {
  if (post.liveFixNote && post.publicationStatus === "tracking_active") return { label: "Live but changes requested", className: "bg-[#FBE3DF] text-[#9B2C1F]", href: "/affiliates/posts" };
  if (post.liveFixNote && post.publicationStatus === "verification_pending") return { label: "Checking the update", className: "bg-[#FBEFD6] text-[#7A4E00]", href: "" };
  if (post.liveFixNote) return { label: "Paste the updated link", className: "bg-[#FBE3DF] text-[#9B2C1F]", href: "/affiliates/posts" };
  if (post.publicationStatus === "tracking_active") return { label: "Verified", className: "bg-[#DDF0E4] text-[#1D6340]", href: "" };
  if (post.publicationStatus === "verification_failed") return { label: "Needs a fix", className: "bg-[#FBE3DF] text-[#9B2C1F]", href: "/affiliates/posts" };
  if (post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus == null)) {
    return { label: "Ready to publish", className: "bg-ink text-white", href: "/affiliates/posts" };
  }
  if (post.publicationStatus === "verification_pending") return { label: "Checking the link", className: "bg-[#FBEFD6] text-[#7A4E00]", href: "" };
  if (post.contentStatus === "revision_requested") return { label: "Changes requested", className: "bg-[#FBE3DF] text-[#9B2C1F]", href: "" };
  if (post.contentStatus === "submitted") return { label: "In review", className: "bg-[#FBEFD6] text-[#7A4E00]", href: "" };
  return { label: contentStatusLabel(post.contentStatus), className: "bg-[#EFEAE9] text-[#4A3A37]", href: "" };
}

function postTitle(post: ContentSubmission) {
  const line = post.caption.trim().split("\n").find((part) => part.trim()) ?? "";
  return line || post.agreementLabel || post.campaign || "Post";
}

export default async function AffiliatePortalOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  const range = rangeOf((await searchParams).range);
  const currentPeriod = currentPayoutPeriod();
  const { windowStart, windowEnd, previousStart, previousEnd, versus } = overviewWindow(range, currentPeriod);

  let conversions: ConversionSummary[] = [];
  let clickTimes: string[] = [];
  let payouts: PayoutRecord[] = [];
  let marketing = { pendingCents: 0, heldCents: 0, approvedCents: 0, paidCents: 0 };
  let ownPosts: ContentSubmission[] = [];
  let agreements: AffiliateAgreement[] = [];
  let agreementPayouts: AgreementPayoutRow[] = [];
  let socialPerformanceCents = 0;
  let loadError = "";
  try {
    const [activity, loadedPayouts, posts, payments, loadedAgreements, loadedAgreementPayouts] = await Promise.all([
      memo(`activity:${affiliate.code}`, () => loadAffiliateActivity(affiliate.code)),
      memo(`payout-records:${affiliate.code}`, () => loadPayoutRecords(affiliate.code)),
      memo("submissions:all", () => loadContentSubmissions()),
      memo(`payments:${affiliate.code}`, () => loadDeliverablePayments(affiliate.code)),
      memo(`agreements:${affiliate.code}`, () => loadAffiliateAgreements(affiliate.code)),
      memo(`agreement-payouts:${affiliate.code}`, () => loadAgreementPayoutsForCode(affiliate.code)),
    ]);
    conversions = activity.conversions;
    clickTimes = activity.clickTimes;
    payouts = loadedPayouts;
    agreements = loadedAgreements;
    agreementPayouts = loadedAgreementPayouts;
    ownPosts = posts.filter((post) => post.code === affiliate.code);
    const socialMonth = socialMonthCents({ period: currentPeriod, posts: ownPosts, payments });
    socialPerformanceCents = socialMonth.socialCents + socialMonth.adjustmentCents;
    const lines = deliverableLines({
      affiliates: [{ code: affiliate.code, name: affiliate.name }],
      posts: ownPosts,
      payments,
    });
    marketing = marketingTotals(lines);
    const monthlyPeriods = new Set<string>([currentPeriod, ...agreementPayouts.map((row) => row.period)]);
    for (const post of ownPosts) {
      const period = eventPeriod(post.publishedAt ?? "");
      if (period) monthlyPeriods.add(period);
    }
    for (const period of monthlyPeriods) {
      const snapshot = agreementPayouts.find((row) => row.period === period) ?? null;
      const monthly = agreementMonthEarning({ agreements, posts: ownPosts, code: affiliate.code, period, snapshot });
      if (monthly.status === "earned") marketing.pendingCents += monthly.earnedCents;
      else if (monthly.status === "approved") marketing.approvedCents += monthly.earnedCents;
      else if (monthly.status === "paid") marketing.paidCents += monthly.earnedCents;
    }
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load your overview.";
  }

  let unpaidOrders = 0;
  const pending = await memo("unpaid-orders", () => loadUncommissionedPendingOrders()).catch(() => null);
  if (pending) unpaidOrders = [...pending.values()].filter((code) => code === affiliate.code).length;

  let inviteName = "";
  const records = await memo("campaign-records", () => loadMarketingCampaignRecords()).catch(() => null);
  try {
    if (!records) throw new Error("unavailable");
    const board = affiliateCampaignBoard({
      records,
      posts: ownPosts.map((post) => ({
        id: post.id,
        campaign: post.campaign,
        caption: post.caption,
        contentStatus: post.contentStatus,
        publicationStatus: post.publicationStatus,
        format: post.format,
        reviewNote: post.reviewNote,
        liveFixNote: post.liveFixNote,
        hasFile: Boolean(post.filePath),
        createdAt: post.createdAt,
      })),
      code: affiliate.code,
    });
    inviteName = board.invites[0]?.name ?? "";
  } catch {
    inviteName = "";
  }

  let personalCode: string | null = null;
  let promosUnavailable = false;
  const acknowledged = hasAcceptedAgreement(agreements);
  try {
    personalCode = personalPromoForAffiliate(await memo("promo-codes", () => listPromoCodes()), affiliate.code)?.code ?? null;
  } catch {
    promosUnavailable = true;
  }

  const countedIn = (start: number, end: number, commissioned: boolean) =>
    conversions.filter((conversion) => {
      if (conversion.dryRun || !inWindow(conversion.createdAt, start, end) || remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) <= 0) return false;
      return earnsLabCommission(conversion) === commissioned;
    }).length;
  const clicksIn = (start: number, end: number) => clickTimes.filter((createdAt) => inWindow(createdAt, start, end)).length;
  const postsIn = (start: number, end: number) =>
    ownPosts.filter((post) => post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected" && post.contentStatus !== "draft" && inWindow(postStamp(post), start, end));
  const viewsIn = (start: number, end: number) => postsIn(start, end).reduce((sum, post) => sum + (post.views ?? 0), 0);
  const engagementsIn = (start: number, end: number) => postsIn(start, end).reduce((sum, post) => sum + engagementsOf(post), 0);

  const views = viewsIn(windowStart, windowEnd);
  const engagements = engagementsIn(windowStart, windowEnd);
  const clicks = clicksIn(windowStart, windowEnd);
  const labOrders = countedIn(windowStart, windowEnd, true);
  const plainOrders = countedIn(windowStart, windowEnd, false);
  const performance = [
    { key: "Views", value: countLabel(views), chip: changeChip(views, viewsIn(previousStart, previousEnd), versus) },
    { key: "Engagements", value: countLabel(engagements), chip: changeChip(engagements, engagementsIn(previousStart, previousEnd), versus) },
    { key: "Verified link clicks", value: countLabel(clicks), chip: changeChip(clicks, clicksIn(previousStart, previousEnd), versus) },
    { key: "Lab orders", value: String(labOrders), chip: changeChip(labOrders, countedIn(previousStart, previousEnd, true), versus) },
    { key: "Orders without commission", value: String(plainOrders), chip: changeChip(plainOrders, countedIn(previousStart, previousEnd, false), versus) },
    { key: "Checkouts not finished", value: String(unpaidOrders), allTime: true, chip: { text: "Started checkout. Not a promo use, and no commission.", className: "bg-[#FBEFD6] text-[#7A4E00]", note: true } },
  ];

  const agreement = agreementForMonth(agreements, affiliate.code, currentPeriod);
  const waiting = agreement
    ? null
    : agreements
        .filter((item) => item.status === "awaiting_signature")
        .sort((leftItem, rightItem) => (rightItem.sentAt ?? "").localeCompare(leftItem.sentAt ?? ""))[0] ?? null;
  const shownAgreement = agreement ?? waiting;
  const earning = agreementMonthEarning({
    agreements,
    posts: ownPosts,
    code: affiliate.code,
    period: currentPeriod,
    snapshot: agreementPayouts.find((row) => row.period === currentPeriod) ?? null,
  });
  const required = agreement ? agreementPostTotal(agreement.posts) : 0;
  const slotRows = agreement ? agreementSlotRows(overviewBoard(ownPosts), agreement.id, currentPeriod, required, agreement.posts) : [];
  const shownVerified = slotRows.filter((row) => agreementSlotState(row.post) === "Verified").length;
  const left = Math.max(0, required - shownVerified);
  const pips = slotRows.map((row) => {
    const label = agreementSlotState(row.post);
    return { number: row.number, label, color: pipColor(label) };
  });
  const negotiating = Boolean(waiting && waiting.questions.length > 0);
  const payState = waiting
    ? { text: "Not active until you accept", className: "bg-[#FBF6EC] text-[#7A4E00]" }
    : paymentLine(earning, left, socialPerformanceCents);
  const agreementTitle = shownAgreement?.title?.trim() || (agreement ? `${formatPayoutMonth(currentPeriod)} content partnership` : waiting ? "Agreement to review" : "No active agreement");
  const agreementStart = shownAgreement?.effectiveOn ?? "";
  const agreementFinish = shownAgreement?.expiresOn ?? "";
  const agreementDates = agreementStart && agreementFinish ? `${shortDate(agreementStart)} – ${formatPublishDate(agreementFinish)}` : "";
  const agreementEnd = agreementFinish ? shortDate(agreementFinish) : "";
  const statusLabel = agreement && agreementEnd ? `Active until ${agreementEnd}` : waiting ? (negotiating ? "Still negotiating" : "Waiting for you to accept") : "No accepted agreement";
  const statusNote = waiting ? "This stays here until you accept it. Posts don’t count toward it yet." : "An accepted agreement is what lets posts count toward the monthly rate.";
  const rate = shownAgreement?.monthlyCents ? formatCents(shownAgreement.monthlyCents) : "";
  const mix = shownAgreement ? mixSentence(shownAgreement.posts) : "";
  const trackingLink = affiliateTrackingLink(affiliate.code);
  const trackingText = trackingLink.replace(/^https?:\/\//, "");
  const first = affiliate.name.trim().split(/\s+/)[0] || affiliate.name;
  const lastPaid = payouts
    .filter((payout) => payout.status === "paid" && payout.paidAt)
    .sort((leftPayout, rightPayout) => (rightPayout.paidAt ?? "").localeCompare(leftPayout.paidAt ?? ""))[0];
  const recentPosts = [...ownPosts]
    .filter((post) => post.contentStatus !== "draft" && post.contentStatus !== "withdrawn")
    .sort((leftPost, rightPost) => (postStamp(rightPost) ?? "").localeCompare(postStamp(leftPost) ?? ""))
    .slice(0, 3);
  const windowText = rangeLabel(windowStart, windowEnd - 1);
  const createHref = acknowledged ? "/affiliates/posts/new" : "/affiliates/contracts#agreements";

  return (
    <div className="space-y-[18px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-[360px]">
          <h2 className="text-[32px] font-medium leading-tight">Welcome back, {first}</h2>
          <p className="mt-1.5 text-[15px] text-[#4A3A37]">Your posting requirements, marketing results and payments at a glance.</p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
            {ranges.map((item) => {
              const selected = range === item.id;
              return (
                <Link
                  key={item.id}
                  href={overviewHref(item.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${focusRing} ${selected ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink hover:bg-[#F7F3F2]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="text-sm text-[#4A3A37]">Performance for {windowText}</p>
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      {inviteName ? (
        <TimedNotice message={inviteName} tone="warm" ms={8000}>
          <span className="flex flex-wrap items-center gap-3">
            <span className="size-2 shrink-0 rounded-full bg-[#C98A1A]" aria-hidden="true" />
            <span className="min-w-[200px] flex-1">
              New campaign invitation: <b>{inviteName}</b>
            </span>
            <Link href="/affiliates/campaigns" className="text-sm font-medium text-ink underline underline-offset-4">
              Review invitation
            </Link>
          </span>
        </TimedNotice>
      ) : null}

      <section aria-labelledby="performance-title" className="flex flex-col gap-3.5 rounded-[24px] bg-white px-6 py-[22px]">
        <div className="flex items-baseline gap-3">
          <h3 id="performance-title" className="flex-1 text-lg font-semibold">Performance</h3>
          <Link href="/affiliates/stats" className="text-sm text-ink">View stats →</Link>
        </div>
        <p className="text-[13px] text-[#6B5A57]">{windowText}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {performance.map((item) => (
            <div key={item.key} className="flex flex-col gap-1 rounded-2xl border border-[#E8DEDC] px-[18px] py-4">
              <span className="text-sm text-[#4A3A37]">{item.key}</span>
              {"allTime" in item ? <span className="text-[13px] text-[#6B5A57]">All time</span> : null}
              <span className="text-[30px] font-medium leading-none">{item.value}</span>
              <span className={item.chip.note ? `mt-1 self-stretch rounded-xl px-2.5 py-1.5 text-left text-[13px] font-medium leading-snug ${item.chip.className}` : `mt-1 self-start rounded-full px-2 py-0.5 text-[13px] font-semibold ${item.chip.className}`}>{item.chip.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="share-title" className="flex flex-col gap-3.5 rounded-[24px] bg-white px-6 py-[22px]">
        <div className="flex items-baseline gap-3">
          <h3 id="share-title" className="flex-1 text-lg font-semibold">Your link and code</h3>
          <Link href="/affiliates/stats" className="text-sm text-ink">See traffic →</Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#F7F3F2] px-[18px] py-4">
            <span className="text-sm text-[#4A3A37]">Tracking link</span>
            {acknowledged ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-base font-semibold">{trackingText}</span>
                <CopyTrackingLink url={trackingLink} label="Copy" accessibleName="Copy tracking link" copiedNotice="Link copied." failedNotice="Couldn't copy the link." />
              </div>
            ) : (
              <p className="text-sm text-[#4A3A37]">Your tracking link opens once you accept your agreement.</p>
            )}
            <span className="text-[13px] text-[#4A3A37]">Optional in the caption. Tag @myleaderhealth in every caption so the post can track. A link in your bio doesn’t count.</span>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[18px] bg-[#F7F3F2] px-[18px] py-4">
            <span className="text-sm text-[#4A3A37]">Promo code</span>
            {acknowledged && personalCode ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-[10px] border-[1.5px] border-dashed border-[#C9A6A0] bg-white px-3.5 py-1 font-mono text-lg font-bold tracking-[0.06em] text-ink">{personalCode}</span>
                <span className="flex-1" />
                <CopyTrackingLink url={personalCode} label="Copy" accessibleName="Copy promo code" copiedNotice="Code copied." failedNotice="Couldn't copy the code." />
              </div>
            ) : (
              <p className="text-sm text-[#4A3A37]">
                {acknowledged ? (promosUnavailable ? "Promo codes are unavailable right now." : "No personal code is assigned yet.") : "Your code opens once you accept your agreement."}
              </p>
            )}
            <span className="text-[13px] text-[#4A3A37]">
              {LAB_COMMISSIONS_ENABLED
                ? "Customers get the discount on the products it covers. You earn on lab orders only."
                : "Customers get the discount on the products it covers."}
            </span>
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-[18px] xl:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="agreement-title" className="flex flex-col gap-[18px] rounded-[24px] border-2 border-ink bg-white px-6 py-[22px]">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1 basis-[220px]">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B5A57]">My agreement</span>
                <span className="rounded-full bg-[#F7F3F2] px-2.5 py-0.5 text-[13px] font-semibold normal-case tracking-normal text-[#4A3A37]">This month</span>
              </span>
              <h3 id="agreement-title" className="mt-1 text-[22px] font-semibold leading-tight">{agreementTitle}</h3>
              {agreementDates ? <span className="mt-1 block text-sm text-[#4A3A37]">{agreementDates}</span> : <span className="mt-1 block text-sm text-[#4A3A37]">{statusNote}</span>}
            </div>
            {agreement ? <span className="rounded-full bg-[#DDF0E4] px-3 py-1 text-[13px] font-semibold text-[#1D6340]">Active</span> : waiting ? <span className="rounded-full bg-[#FBEFD6] px-3 py-1 text-[13px] font-semibold text-[#7A4E00]">{negotiating ? "Still negotiating" : "Waiting for you"}</span> : null}
          </div>
          {shownAgreement && rate ? (
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-[38px] font-medium tracking-tight">{rate}<span className="text-lg text-[#4A3A37]">/month</span></span>
              {mix ? <span className="text-base">{mix}</span> : null}
            </div>
          ) : null}
          {required > 0 ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                <span className="text-[17px] font-semibold">{shownVerified} of {required} posts verified</span>
                <span className="text-[15px] text-[#4A3A37]">{left ? `${left} ${left === 1 ? "post" : "posts"} left this month` : "All done for this month"}</span>
              </div>
              <div role="img" aria-label={`${shownVerified} of ${required} posts verified`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(pips.length, 1)}, minmax(0, 1fr))` }}>
                {pips.map((pip) => (
                  <div key={pip.number} className="flex flex-col gap-1.5">
                    <span className="h-3.5 rounded-[7px]" style={{ background: pip.color }} />
                    <span className="text-[13px] text-[#4A3A37]">Post {pip.number} · {pip.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5 rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
              <span className="text-[13px] text-[#4A3A37]">Agreement status</span>
              <span className="text-[15px] font-semibold">{statusLabel}</span>
            </div>
            <div className={`flex flex-col gap-0.5 rounded-[14px] px-3.5 py-3 ${payState.className}`}>
              <span className="text-[13px] text-[#4A3A37]">This month’s payment</span>
              <span className="text-[15px] font-semibold">{payState.text}</span>
            </div>
          </div>
          <span className="text-[13px] text-[#6B5A57]">Only verified posts count. Progress resets on the 1st of each month. Campaign posts don’t count toward this agreement.</span>
          <div className="flex flex-wrap gap-2.5">
            <Link href={createHref} className={inkButton}>{acknowledged ? "Create post" : "Accept agreement"}</Link>
            <Link href="/affiliates/contracts" className={quietButton}>View agreement</Link>
          </div>
        </section>

        <section aria-labelledby="payments-title" className="flex flex-col gap-3 rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline gap-3">
            <h3 id="payments-title" className="flex-1 text-lg font-semibold">Payments</h3>
            <Link href="/affiliates/payouts" className="text-sm text-ink">View payouts →</Link>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">Approved, not sent</span>
            <span className="text-[26px] font-medium">{formatCents(marketing.approvedCents)}</span>
            <span className="text-[13px] text-[#6B5A57]">Waiting to be sent</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">Needs approval</span>
            <span className="text-[26px] font-medium">{formatCents(marketing.pendingCents)}</span>
            <span className="text-[13px] text-[#6B5A57]">Earned, not approved yet</span>
          </div>
          {marketing.heldCents > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
              <span className="text-sm text-[#4A3A37]">On hold</span>
              <span className="text-[26px] font-medium">{formatCents(marketing.heldCents)}</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">Paid to date</span>
            <span className="text-[26px] font-medium">{formatCents(marketing.paidCents)}</span>
            <span className="text-[13px] text-[#6B5A57]">{lastPaid?.paidAt ? `Last paid ${formatPublishDate(lastPaid.paidAt.slice(0, 10))}` : "Nothing paid yet"}</span>
          </div>
          <span className="text-[13px] text-[#6B5A57]">Payments are sent manually after approval.</span>
        </section>
      </div>

      <div className="grid items-start gap-[18px] xl:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="recent-posts-title" className="flex flex-col rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline gap-3 pb-2">
            <h3 id="recent-posts-title" className="flex-1 text-lg font-semibold">Recent posts</h3>
            <Link href="/affiliates/posts" className="text-sm text-ink">View all posts →</Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="border-t border-[#F0E8E6] py-3 text-sm text-[#6B5A57]">No posts yet.</p>
          ) : (
            recentPosts.map((post) => {
              const status = postStatus(post);
              const when = publishDateValue(postStamp(post)?.slice(0, 10)) ? formatPublishDate(postStamp(post)!.slice(0, 10)) : "";
              const kind = recentKind(post, overviewBoard(ownPosts), agreements);
              return (
                <div key={post.id} className="flex flex-wrap items-center gap-3.5 border-t border-[#F0E8E6] py-3">
                  <span aria-hidden="true" className="size-11 shrink-0 rounded-[10px] bg-[linear-gradient(135deg,#E39A93,#8E3B46)]" />
                  <span className="min-w-[180px] flex-1">
                    <span className="block text-[15px] font-semibold">{postTitle(post)}</span>
                    <span className="mt-0.5 block text-[13px] text-[#6B5A57]">{[kind, when].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${status.className}`}>{status.label}</span>
                  {status.href ? (
                    <Link href={status.href} className="text-sm font-medium text-ink">Add live link</Link>
                  ) : null}
                </div>
              );
            })
          )}
        </section>

        <section aria-labelledby="quick-actions-title" className="flex flex-col gap-2.5 rounded-[24px] bg-white px-6 py-[22px]">
          <h3 id="quick-actions-title" className="mb-1 text-lg font-semibold">Quick actions</h3>
          <Link href={createHref} className={`${inkButton} h-[50px]`}>{acknowledged ? "+ Create post" : "Accept agreement"}</Link>
          <Link href="/affiliates/contracts" className={`${quietButton} h-[50px]`}>View agreement</Link>
          <Link href="/affiliates/payouts" className={`${quietButton} h-[50px]`}>View payouts</Link>
        </section>
      </div>
    </div>
  );
}
