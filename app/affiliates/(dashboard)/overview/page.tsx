import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { affiliateCampaignBoard } from "@/lib/affiliate/affiliate-campaigns";
import { loadAffiliateAgreements, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { agreementMonthEarning, agreementForMonth, agreementPostMonth, type AgreementMonthEarning } from "@/lib/affiliate/agreement-earnings";
import { loadAgreementPayoutsForCode, type AgreementPayoutRow } from "@/lib/affiliate/agreement-payouts";
import { agreementPostTotal, type AgreementPostCount } from "@/lib/affiliate/agreement-partnership";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { deliverableLines, loadDeliverablePayments, marketingTotals } from "@/lib/affiliate/deliverable-payments";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { formatCents, formatPublishDate, publishDateValue } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { eventPeriod, socialMonthCents } from "@/lib/affiliate/payment-rates";
import { currentPayoutPeriod, formatPayoutMonth, loadPayoutRecords, type PayoutRecord } from "@/lib/affiliate/payouts";
import { contentStatusLabel, loadContentSubmissions, publicationStatusLabel, type ContentSubmission } from "@/lib/affiliate/post-review";
import { remainingSalesCents } from "@/lib/affiliate/refunds";
import { memo } from "@/lib/affiliate/memo";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { AffiliateStoreError, loadAffiliateActivity, loadUncommissionedPendingOrders, type ConversionSummary } from "@/lib/affiliate/store";
import { listPromoCodes, personalPromoForAffiliate } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "this" | "last" | "custom";

const ranges: { id: Range; label: string }[] = [
  { id: "this", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "custom", label: "Custom" },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inkButton = `inline-flex h-[46px] items-center justify-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white hover:bg-brown ${focusRing}`;
const quietButton = `inline-flex h-[46px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink hover:bg-[#F7F3F2] ${focusRing}`;

function rangeOf(value: string | undefined): Range {
  if (value === "last" || value === "custom") return value;
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

function overviewWindow(range: Range, currentPeriod: string) {
  const now = Date.now();
  const selectedPeriod = range === "last" ? shiftMonth(currentPeriod, -1) : currentPeriod;
  const customStart = monthStart(shiftMonth(currentPeriod, -2));
  const previousPeriod = shiftMonth(selectedPeriod, -1);
  return {
    selectedPeriod,
    windowStart: range === "custom" ? customStart : monthStart(selectedPeriod),
    windowEnd: range === "last" ? monthEnd(selectedPeriod) : now + 1,
    previousStart: range === "custom" ? customStart : monthStart(previousPeriod),
    previousEnd: range === "custom" ? customStart : monthEnd(previousPeriod),
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

function changeChip(current: number, previous: number, custom: boolean) {
  if (custom) return { text: "Custom range", className: "bg-[#EFEAE9] text-[#4A3A37]" };
  if (previous <= 0) {
    if (current <= 0) return { text: "0% vs. last month", className: "bg-[#EFEAE9] text-[#4A3A37]" };
    return { text: "New vs. last month", className: "bg-[#DDF0E4] text-[#1D6340]" };
  }
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(percent) * 10) / 10;
  const up = percent >= 0;
  return {
    text: `${up ? "▲" : "▼"} ${rounded}% vs. last month`,
    className: up ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]",
  };
}

function postStamp(post: ContentSubmission) {
  return post.publishedAt ?? post.submittedAt ?? post.createdAt;
}

function engagementsOf(post: ContentSubmission) {
  return [post.likes, post.comments, post.shares, post.saves].reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function plural(name: string, count: number) {
  const word = name.toLowerCase();
  if (count === 1) return word;
  if (word.endsWith("y") && !/[aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (word.endsWith("s")) return word;
  return `${word}s`;
}

function mixLine(posts: readonly AgreementPostCount[]) {
  const used = posts.filter((post) => post.count > 0);
  const total = agreementPostTotal(used);
  if (!total) return "";
  const platforms = [...new Set(used.map((post) => post.platform))];
  const kinds = used.map((post) => `${post.count} ${plural(post.type, post.count)}`);
  const place = platforms.length === 1 ? platforms[0] : platforms.join(", ");
  return `${total} ${total === 1 ? "post" : "posts"} on ${place} · ${kinds.join(", ")}`;
}

function pipState(index: number, verified: number, review: number) {
  if (index < verified) return { color: "#1D6340", label: "Verified" };
  if (index < verified + review) return { color: "#E9C98A", label: "In review" };
  return { color: "#E8DEDC", label: "Not posted" };
}

function paymentLine(earning: AgreementMonthEarning, left: number, socialCents: number) {
  const base = earning.status === "none" ? 0 : earning.earnedCents;
  const total = base + socialCents;
  const sum = `${formatCents(total)} · ${formatCents(base)} base + ${formatCents(socialCents)} social`;
  if (earning.status === "paid") return { text: `Paid · ${sum}`, className: "bg-[#DDF0E4] text-[#1D6340]" };
  if (earning.status === "earned" || earning.status === "approved") return { text: `Requirements met · ${sum}`, className: "bg-[#DDF0E4] text-[#1D6340]" };
  if (socialCents > 0) return { text: sum, className: "bg-[#F7F3F2] text-ink" };
  if (earning.status === "short") return { text: `Not yet · ${left} more to verify`, className: "bg-[#FBF6EC] text-[#7A4E00]" };
  return { text: "No monthly rate this month", className: "bg-[#F7F3F2] text-ink" };
}

function postStatus(post: ContentSubmission) {
  if (post.publicationStatus === "tracking_active") return { label: "Verified", className: "bg-[#DDF0E4] text-[#1D6340]", href: "" };
  if (post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus == null)) {
    return { label: "Ready to publish", className: "bg-ink text-white", href: "/affiliates/posts" };
  }
  if (post.contentStatus === "submitted" || post.contentStatus === "revision_requested" || post.publicationStatus === "verification_pending") {
    return { label: post.publicationStatus === "verification_pending" ? publicationStatusLabel(post.publicationStatus) : contentStatusLabel(post.contentStatus), className: "bg-[#FBEFD6] text-[#7A4E00]", href: "" };
  }
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
  const { selectedPeriod, windowStart, windowEnd, previousStart, previousEnd } = overviewWindow(range, currentPeriod);

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
    const socialMonth = socialMonthCents({ period: selectedPeriod, posts: ownPosts, payments });
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
  let acknowledged = false;
  try {
    personalCode = personalPromoForAffiliate(await memo("promo-codes", () => listPromoCodes()), affiliate.code)?.code ?? null;
  } catch {
    promosUnavailable = true;
  }
  try {
    acknowledged = await memo(`disclosure-ack:${affiliate.code}`, () => disclosureAcknowledged(affiliate.code));
  } catch {
    acknowledged = false;
  }

  const paidIn = (start: number, end: number) =>
    conversions.filter((conversion) => !conversion.dryRun && inWindow(conversion.createdAt, start, end) && remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0).length;
  const clicksIn = (start: number, end: number) => clickTimes.filter((createdAt) => inWindow(createdAt, start, end)).length;
  const postsIn = (start: number, end: number) =>
    ownPosts.filter((post) => post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected" && post.contentStatus !== "draft" && inWindow(postStamp(post), start, end));
  const viewsIn = (start: number, end: number) => postsIn(start, end).reduce((sum, post) => sum + (post.views ?? 0), 0);
  const engagementsIn = (start: number, end: number) => postsIn(start, end).reduce((sum, post) => sum + engagementsOf(post), 0);

  const views = viewsIn(windowStart, windowEnd);
  const engagements = engagementsIn(windowStart, windowEnd);
  const clicks = clicksIn(windowStart, windowEnd);
  const paidOrders = paidIn(windowStart, windowEnd);
  const custom = range === "custom";
  const performance = [
    { key: "Total views", value: countLabel(views), chip: changeChip(views, viewsIn(previousStart, previousEnd), custom) },
    { key: "Total engagements", value: countLabel(engagements), chip: changeChip(engagements, engagementsIn(previousStart, previousEnd), custom) },
    { key: "Verified link clicks", value: countLabel(clicks), chip: changeChip(clicks, clicksIn(previousStart, previousEnd), custom) },
    { key: "Paid orders", value: String(paidOrders), chip: { text: "From your link or code", className: "bg-[#DDF0E4] text-[#1D6340]" } },
    { key: "Unpaid orders", value: String(unpaidOrders), chip: { text: "Not paid yet · no commission", className: "bg-[#FBEFD6] text-[#7A4E00]" } },
  ];

  const agreement = agreementForMonth(agreements, affiliate.code, selectedPeriod);
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
    period: selectedPeriod,
    snapshot: agreementPayouts.find((row) => row.period === selectedPeriod) ?? null,
  });
  const monthPosts = agreement
    ? ownPosts.filter((post) => post.agreementId === agreement.id && agreementPostMonth(post) === selectedPeriod && post.contentStatus !== "rejected" && post.contentStatus !== "withdrawn" && post.contentStatus !== "draft")
    : [];
  const verified = monthPosts.filter((post) => post.publicationStatus === "tracking_active").length;
  const review = monthPosts.filter((post) => post.publicationStatus !== "tracking_active").length;
  const required = agreement ? agreementPostTotal(agreement.posts) : 0;
  const shownVerified = Math.min(verified, required);
  const shownReview = Math.min(review, Math.max(0, required - shownVerified));
  const left = Math.max(0, required - shownVerified);
  const pips = Array.from({ length: required }, (_, index) => pipState(index, shownVerified, shownReview));
  const negotiating = Boolean(waiting && waiting.questions.length > 0);
  const payState = waiting
    ? { text: "Not active until you accept", className: "bg-[#FBF6EC] text-[#7A4E00]" }
    : paymentLine(earning, left, socialPerformanceCents);
  const agreementTitle = shownAgreement?.title?.trim() || (agreement ? `${formatPayoutMonth(selectedPeriod)} content partnership` : waiting ? "Agreement to review" : "No active agreement");
  const agreementStart = shownAgreement?.effectiveOn ?? "";
  const agreementFinish = shownAgreement?.expiresOn ?? "";
  const agreementDates = agreementStart && agreementFinish ? `${shortDate(agreementStart)} – ${formatPublishDate(agreementFinish)}` : "";
  const agreementEnd = agreementFinish ? shortDate(agreementFinish) : "";
  const statusLabel = agreement && agreementEnd ? `Active until ${agreementEnd}` : waiting ? (negotiating ? "Still negotiating" : "Waiting for you to accept") : "No accepted agreement";
  const statusNote = waiting ? "This stays here until you accept it. Posts don’t count toward it yet." : "An accepted agreement is what lets posts count toward the monthly rate.";
  const rate = shownAgreement?.monthlyCents ? formatCents(shownAgreement.monthlyCents) : "";
  const mix = shownAgreement ? mixLine(shownAgreement.posts) : "";
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
  const createHref = acknowledged ? "/affiliates/posts/new" : "/affiliates/tracking-link";

  return (
    <div className="space-y-[18px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-[360px]">
          <h2 className="text-[32px] font-medium leading-tight">Welcome back, {first}</h2>
          <p className="mt-1.5 text-[15px] text-[#4A3A37]">Your posting requirements, marketing results and payments at a glance.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
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
          <span className="text-[13px] text-[#6B5A57]">{windowText}</span>
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      {inviteName ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FBF6EC] px-[18px] py-3">
          <span className="size-2 shrink-0 rounded-full bg-[#C98A1A]" aria-hidden="true" />
          <span className="min-w-[240px] flex-1 text-[15px]">
            New campaign invitation: <b>{inviteName}</b>
          </span>
          <Link href="/affiliates/campaigns" className="text-sm font-medium text-ink">
            Review invitation
          </Link>
        </div>
      ) : null}

      <section aria-labelledby="performance-title" className="flex flex-col gap-3.5 rounded-[24px] bg-white px-6 py-[22px]">
        <div className="flex items-baseline gap-3">
          <h3 id="performance-title" className="flex-1 text-lg font-semibold">Performance</h3>
          <Link href="/affiliates/stats" className="text-sm text-ink">View stats →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {performance.map((item) => (
            <div key={item.key} className="flex flex-col gap-1 rounded-2xl border border-[#E8DEDC] px-[18px] py-4">
              <span className="text-sm text-[#4A3A37]">{item.key}</span>
              <span className="text-[30px] font-medium leading-none">{item.value}</span>
              <span className={`mt-1 self-start rounded-full px-2 py-0.5 text-[13px] font-semibold ${item.chip.className}`}>{item.chip.text}</span>
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
              <p className="text-sm text-[#4A3A37]">Accept the sponsorship agreement on the referral link page before sharing your tracking link.</p>
            )}
            <span className="text-[13px] text-[#4A3A37]">Put it in every caption. A link in your bio doesn’t count.</span>
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
                {acknowledged ? (promosUnavailable ? "Promo codes are unavailable right now." : "No personal code is assigned yet.") : "Your code stays closed until you accept the sponsorship agreement."}
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
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B5A57]">My agreement</span>
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
              <div role="img" aria-label={`${shownVerified} of ${required} posts verified`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${required}, minmax(0, 1fr))` }}>
                {pips.map((pip, index) => (
                  <div key={`${pip.label}-${index}`} className="flex flex-col gap-1.5">
                    <span className="h-3.5 rounded-[7px]" style={{ background: pip.color }} />
                    <span className="text-[13px] text-[#4A3A37]">Post {index + 1} · {pip.label}</span>
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
            <Link href={createHref} className={inkButton}>Create post</Link>
            <Link href="/affiliates/contracts" className={quietButton}>View agreement</Link>
          </div>
        </section>

        <section aria-labelledby="payments-title" className="flex flex-col gap-3 rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline gap-3">
            <h3 id="payments-title" className="flex-1 text-lg font-semibold">Payments</h3>
            <Link href="/affiliates/payouts" className="text-sm text-ink">View payouts →</Link>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">Approved earnings</span>
            <span className="text-[26px] font-medium">{formatCents(marketing.approvedCents)}</span>
            <span className="text-[13px] text-[#6B5A57]">Waiting to be sent</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">Pending payment</span>
            <span className="text-[26px] font-medium">{formatCents(marketing.pendingCents + marketing.heldCents)}</span>
            <span className="text-[13px] text-[#6B5A57]">{marketing.heldCents > 0 ? `Earned, not approved yet · ${formatCents(marketing.heldCents)} on hold` : "Earned, not approved yet"}</span>
          </div>
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
              const kind = post.agreementId ? "agreement post" : post.campaign ? post.campaign : "post";
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
          <Link href={createHref} className={`${inkButton} h-[50px]`}>+ Create post</Link>
          <Link href="/affiliates/contracts" className={`${quietButton} h-[50px]`}>View agreement</Link>
          <Link href="/affiliates/payouts" className={`${quietButton} h-[50px]`}>View payouts</Link>
        </section>
      </div>
    </div>
  );
}
