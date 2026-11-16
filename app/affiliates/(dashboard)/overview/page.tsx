import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { DeliverablePaymentList } from "@/components/affiliate/DeliverablePaymentList";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { deliverableLines, loadDeliverablePayments, marketingTotals, type DeliverableLine } from "@/lib/affiliate/deliverable-payments";
import { formatCents, formatPublishDate, publishDateValue } from "@/lib/affiliate/format";
import { loadMarketingOffers, offerKindLabel } from "@/lib/affiliate/marketing-offers";
import { formatPayoutMonth, loadPayoutRecords, paidOutInRange, type PayoutRecord } from "@/lib/affiliate/payouts";
import { remainingSalesCents } from "@/lib/affiliate/refunds";
import { periodReferralSummaries } from "@/lib/affiliate/order-view";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { AffiliateStoreError, loadAffiliateActivity, type ConversionSummary } from "@/lib/affiliate/store";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { listPromoCodes, personalPromoForAffiliate } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "30" | "90" | "all";

const ranges: { id: Range; label: string }[] = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
];

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const badgeClass = "inline-flex max-w-full items-center rounded-full bg-rose px-3 py-1 text-xs font-medium leading-5 text-ink";

function rangeOf(value: string | undefined): Range {
  if (value === "30" || value === "90") return value;
  return "all";
}

function overviewHref(range: Range) {
  return range === "all" ? "/affiliates/overview" : `/affiliates/overview?range=${range}`;
}

function inRange(createdAt: string | null, range: Range) {
  if (range === "all") return true;
  if (!createdAt) return false;
  const days = range === "30" ? 30 : 90;
  return new Date(createdAt).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export default async function AffiliatePortalOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  const range = rangeOf((await searchParams).range);
  let conversions: ConversionSummary[] = [];
  let clickTimes: string[] = [];
  let payouts: PayoutRecord[] = [];
  let marketing = { pendingCents: 0, heldCents: 0, approvedCents: 0, paidCents: 0 };
  let paymentLines: DeliverableLine[] = [];
  let ownPosts: ContentSubmission[] = [];
  let loadError = "";
  try {
    const activity = await loadAffiliateActivity(affiliate.code);
    conversions = activity.conversions;
    clickTimes = activity.clickTimes;
    payouts = await loadPayoutRecords(affiliate.code);
    const [posts, payments] = await Promise.all([loadContentSubmissions(), loadDeliverablePayments(affiliate.code)]);
    ownPosts = posts.filter((post) => post.code === affiliate.code);
    const lines = deliverableLines({
      affiliates: [{ code: affiliate.code, name: affiliate.name }],
      posts: ownPosts,
      payments,
    });
    paymentLines = lines.filter((line) => line.status !== "closed" && line.status !== "paid");
    marketing = marketingTotals(lines);
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load your overview.";
  }

  let promosUnavailable = false;
  let personalCode: string | null = null;
  let acknowledged = false;
  try {
    personalCode = personalPromoForAffiliate(await listPromoCodes(), affiliate.code)?.code ?? null;
  } catch {
    promosUnavailable = true;
  }
  try {
    acknowledged = await disclosureAcknowledged(affiliate.code);
  } catch {
    acknowledged = false;
  }

  const paid = conversions.filter((conversion) => !conversion.dryRun && inRange(conversion.createdAt, range));
  const paidOrderCount = paid.filter((conversion) => remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0).length;
  const paidOutCents = paidOutInRange(payouts, range);
  const clicks = clickTimes.filter((createdAt) => inRange(createdAt, range)).length;
  const recent = periodReferralSummaries(
    paid.map((conversion) => ({
      code: affiliate.code,
      dryRun: conversion.dryRun,
      amountCents: conversion.amountCents,
      refundedAmountCents: conversion.refundedAmountCents,
      commissionCents: conversion.commissionCents,
      commissionRefundedCents: conversion.commissionRefundedCents,
      createdAt: conversion.createdAt,
      orderKind: conversion.orderKind,
    })),
  );
  const labCents = recent.reduce((sum, row) => sum + row.commissionCents, 0);
  let deadlines: { id: string; label: string; when: string }[] = [];
  let deadlineCount = 0;
  let deadlinesUnavailable = false;
  try {
    const offers = await loadMarketingOffers(affiliate.code);
    const open = offers.filter(
      (offer) =>
        (offer.status === "sent" || offer.status === "countered" || offer.status === "accepted") && publishDateValue(offer.publishBy),
    );
    deadlineCount = open.length;
    deadlines = [...open]
      .sort((left, right) => left.publishBy.localeCompare(right.publishBy))
      .slice(0, 4)
      .map((offer) => ({ id: offer.id, label: offerKindLabel(offer.kind), when: formatPublishDate(offer.publishBy) }));
  } catch {
    deadlinesUnavailable = true;
  }
  const submissionCount = ownPosts.filter(
    (post) => post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected" && post.contentStatus !== "draft",
  ).length;
  const fee = affiliate.deliverableFeeCents == null ? "Not set" : `${formatCents(affiliate.deliverableFeeCents)} per 1,000 views`;
  const payLabel = LAB_COMMISSIONS_ENABLED ? `${fee}. Lab commission applies to lab orders.` : `${fee}. Lab commission is not active.`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl">{affiliate.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={badgeClass}>
              <span className="text-brown">Affiliate ID</span>
              <span className="ml-1.5 break-all">{affiliate.code}</span>
            </span>
            <span className={badgeClass}>{payLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
          {ranges.map((item) => (
            <Link
              key={item.id}
              href={overviewHref(item.id)}
              aria-current={range === item.id ? "true" : undefined}
              className={`${pillClass} ${range === item.id ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-share-link-title">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="portal-share-link-title" className="text-xl">
            Your code
          </h3>
          <Link href="/affiliates/tracking-link" className="text-sm font-medium text-ink underline underline-offset-4">
            Referral link
          </Link>
        </div>
        {acknowledged && personalCode ? (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-[24px] bg-background py-2 pl-4 pr-2">
            <p className="min-w-0 break-all text-lg text-ink">{personalCode}</p>
            <CopyTrackingLink url={personalCode} label="Copy" quiet accessibleName="Copy code" copiedNotice="Code copied." failedNotice="Couldn't copy the code." />
          </div>
        ) : (
          <p className="mt-3 break-all text-lg text-ink">
            {acknowledged ? (promosUnavailable ? "Promo codes are unavailable right now." : "No personal code is assigned yet.") : "Accept the sponsorship agreement on the referral link page. Your code and Posts stay closed until then."}
          </p>
        )}
        <p className="mt-2 text-sm text-brown">Customers enter this code at checkout. Your promo link and tracking link are on the referral link page.</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-deadlines-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="portal-deadlines-title" className="text-xl">
              Deadlines
            </h3>
            <Link href="/affiliates/offers" className="text-sm font-medium text-ink underline underline-offset-4">
              Past monthly plans
            </Link>
          </div>
          <p className="mt-2 text-sm text-brown">A plan is optional and does not block a new post.</p>
          {deadlinesUnavailable ? (
            <p className="mt-4 text-sm text-brown">Deadlines are unavailable right now.</p>
          ) : deadlineCount === 0 ? (
            <p className="mt-4 text-sm text-brown">No publish-by dates on open plans.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-brown">{deadlineCount === 1 ? "1 open plan has a publish-by date." : `${deadlineCount} open plans have a publish-by date.`}</p>
              <ul className="mt-3 divide-y divide-rose/60">
                {deadlines.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 py-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-brown">{item.when}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-submissions-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="portal-submissions-title" className="text-xl">
              Submissions
            </h3>
            <Link href="/affiliates/posts" className="text-sm font-medium text-ink underline underline-offset-4">
              My posts
            </Link>
          </div>
          {acknowledged ? (
            <p className="mt-4 text-sm text-brown">
              {loadError ? "Submissions are unavailable right now." : submissionCount === 1 ? "1 submission is on file." : `${submissionCount} submissions are on file.`}
            </p>
          ) : (
            <p className="mt-4 text-sm text-brown">Accept the sponsorship agreement before submissions open.</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">View rate</h3>
          <p className="mt-2 text-3xl">{affiliate.deliverableFeeCents == null ? "Not set" : formatCents(affiliate.deliverableFeeCents)}</p>
          <p className="mt-2 text-sm text-brown">Per 1,000 views</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Paid orders</h3>
          <p className="mt-2 text-3xl">{paidOrderCount}</p>
          <p className="mt-2 text-sm text-brown">Paid orders in this period</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Visits</h3>
          <p className="mt-2 text-3xl">{clicks}</p>
          <p className="mt-2 text-sm text-brown">Each person counts once a day in this period</p>
        </section>
      </div>

      <section className="rounded-[28px] bg-white p-6" aria-labelledby="portal-earnings-title">
        <h3 id="portal-earnings-title" className="sr-only">
          Your earnings
        </h3>
        <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-rose/60">
          <div className="sm:pr-8">
            <h4 className="text-sm text-brown">Marketing earned</h4>
            <p className="mt-2 text-3xl">{formatCents(marketing.pendingCents)}</p>
            <p className="mt-2 text-sm text-brown">
              Approved {formatCents(marketing.approvedCents)} · On hold {formatCents(marketing.heldCents)} · Paid {formatCents(marketing.paidCents)}
            </p>
          </div>
          <div className="mt-6 border-t border-rose/60 pt-6 sm:mt-0 sm:border-0 sm:pt-0 sm:pl-8">
            <h4 className="text-sm text-brown">Lab commission</h4>
            <p className="mt-2 text-3xl">{LAB_COMMISSIONS_ENABLED ? formatCents(labCents) : "Not active"}</p>
            <p className="mt-2 text-sm text-brown">
              {LAB_COMMISSIONS_ENABLED ? `Paid out ${formatCents(paidOutCents)} in this period.` : "Past commission payouts stay on the Payouts page."}
            </p>
          </div>
        </div>
        <p className="mt-6 border-t border-rose/60 pt-4 text-sm text-brown">Pay-period conversion counts are on the Orders page.</p>
      </section>

      <section className="rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-payments-title">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="portal-payments-title" className="text-xl">Marketing payments</h3>
          <Link href="/affiliates/payouts" className="text-sm font-medium text-ink underline underline-offset-4">
            Payouts
          </Link>
        </div>
        <p className="mt-2 text-sm text-brown">Each post locks its rate, maximum, and tracking period when you send it. Pay is calculated from recorded views after that period, then added to the next payout. Lab commission stays separate.</p>
        <DeliverablePaymentList lines={paymentLines} />
      </section>

      <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-recent-orders-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="portal-recent-orders-title" className="text-xl">
              Recent orders
            </h3>
            <Link href="/affiliates/orders" className="text-sm font-medium text-ink underline underline-offset-4">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-brown">No paid orders in this period.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rose/60">
              {recent.map((row) => (
                <li key={row.period} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="break-words font-medium">{formatPayoutMonth(row.period)}</div>
                    <p className="mt-1 text-brown">{row.conversions === 1 ? "1 conversion" : `${row.conversions} conversions`}</p>
                  </div>
                  {LAB_COMMISSIONS_ENABLED ? <p className="shrink-0 font-medium">{formatCents(row.commissionCents)}</p> : null}
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
