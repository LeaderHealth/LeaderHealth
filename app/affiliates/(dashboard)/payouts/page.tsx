import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AffiliatePayoutsBoard } from "@/components/affiliate/AffiliatePayoutsBoard";
import { loadDeliverablePayments } from "@/lib/affiliate/deliverable-payments";
import { loadMarketingEvents, loadWebsitePayoutsForCode } from "@/lib/affiliate/marketing-events";
import { eventPeriod, websiteMonthAmount } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { toAffiliateOrder } from "@/lib/affiliate/order-view";
import { buildPayoutItems, labPayoutRows, type PayoutBoardMonthly, type PayoutBoardWebsite, type PayoutLabInput, type PayoutLabPeriod } from "@/lib/affiliate/payout-board";
import { agreementMonthEarning } from "@/lib/affiliate/agreement-earnings";
import { loadAgreementPayoutsForCode } from "@/lib/affiliate/agreement-payouts";
import { loadAffiliateAgreements } from "@/lib/affiliate/agreements";
import { currentPayoutPeriod, loadPayoutRecords, payoutLines, payoutPeriod, type PayoutLine } from "@/lib/affiliate/payouts";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { adjustedCommissionCents, remainingSalesCents } from "@/lib/affiliate/refunds";
import { AffiliateStoreError, loadAffiliateConversions, type ConversionSummary } from "@/lib/affiliate/store";
import { utcDay } from "@/lib/affiliate/stats-board";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Payouts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliatePayoutHistoryPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const today = utcDay();
  let items = buildPayoutItems({ posts: [], payments: [], websites: [], today });
  let labs: PayoutLabPeriod[] = [];
  let loadError = "";
  try {
    const [posts, payments, events, websitePayouts, rates, conversions, payouts, agreements, agreementPayouts] = await Promise.all([
      loadContentSubmissions(affiliate.code),
      loadDeliverablePayments(affiliate.code),
      loadMarketingEvents({ code: affiliate.code }),
      loadWebsitePayoutsForCode(affiliate.code),
      loadPaymentRates(),
      LAB_COMMISSIONS_ENABLED ? loadAffiliateConversions(affiliate.code) : Promise.resolve([]),
      LAB_COMMISSIONS_ENABLED ? loadPayoutRecords(affiliate.code) : Promise.resolve([]),
      loadAffiliateAgreements(affiliate.code),
      loadAgreementPayoutsForCode(affiliate.code),
    ]);
    const monthlyPeriods = new Set<string>([currentPayoutPeriod(), ...agreementPayouts.map((row) => row.period)]);
    for (const post of posts) {
      const period = eventPeriod(post.publishedAt ?? "");
      if (period) monthlyPeriods.add(period);
    }
    const monthlies: PayoutBoardMonthly[] = [...monthlyPeriods].flatMap((period) => {
      const snapshot = agreementPayouts.find((row) => row.period === period) ?? null;
      const earning = agreementMonthEarning({ agreements, posts, code: affiliate.code, period, snapshot });
      if (earning.status === "none") return [];
      return [
        {
          period,
          rateCents: earning.rateCents,
          requiredPosts: earning.requiredPosts,
          verifiedPosts: earning.verifiedPosts,
          earnedCents: earning.earnedCents,
          status: earning.status,
          approvedAt: snapshot?.approvedAt ?? null,
          paidAt: snapshot?.paidAt ?? null,
          reference: snapshot?.reference ?? "",
        },
      ];
    });
    const periods = new Set<string>([currentPayoutPeriod(), ...websitePayouts.map((row) => row.period)]);
    for (const event of events) {
      const period = eventPeriod(event.createdAt);
      if (period) periods.add(period);
    }
    const websites: PayoutBoardWebsite[] = [...periods].map((period) => {
      const snapshot = websitePayouts.find((row) => row.period === period) ?? null;
      const website = websiteMonthAmount({ events, code: affiliate.code, period, rates, snapshot });
      return {
        period,
        clicks: website.clicks,
        pageViews: website.pageViews,
        amountCents: website.amountCents,
        status: website.status,
        clickRateCents: website.clickRateCents,
        pageViewRateCents: website.pageViewRateCents,
        paidAt: snapshot?.paidAt ?? null,
        approvedAt: snapshot?.approvedAt ?? null,
        reference: snapshot?.reference ?? "",
      };
    });
    const labRows = labInputs(
      conversions,
      payoutLines({ affiliates: [{ code: affiliate.code, name: affiliate.name }], orders: conversions, payouts }),
      `${formatCommissionRate(affiliate)} of each completed lab order`,
    );
    items = buildPayoutItems({
      today,
      posts: posts.map((post) => ({
        id: post.id,
        caption: post.caption,
        format: post.format,
        campaign: post.campaign,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        agreedFeeCents: post.agreedFeeCents,
        viewRateCents: post.viewRateCents,
        engagementRateCents: post.engagementRateCents,
        maxPayCents: post.maxPayCents,
        trackingDays: post.trackingDays,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        saves: post.saves,
        contentStatus: post.contentStatus,
        publicationStatus: post.publicationStatus,
        deliverableHoldStartedAt: post.deliverableHoldStartedAt,
        deliverableRecheckedAt: post.deliverableRecheckedAt,
        deliverableForfeitedAt: post.deliverableForfeitedAt,
      })),
      payments: payments.map((payment) => ({
        postId: payment.postId,
        amountCents: payment.amountCents,
        status: payment.status,
        approvedAt: payment.approvedAt,
        paidCents: payment.paidCents,
        paidAt: payment.paidAt,
        reference: payment.reference,
        adjustmentCents: payment.adjustmentCents,
        adjustmentReason: payment.adjustmentReason,
      })),
      websites,
      labs: labRows,
      monthlies,
    });
    labs = labPayoutRows(labRows, today).periods;
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load payouts.";
  }

  return (
    <section className="min-w-0" aria-labelledby="portal-payouts-title">
      {loadError ? <p className="text-ink">{loadError}</p> : <AffiliatePayoutsBoard today={today} items={items} labs={labs} />}
    </section>
  );
}

function labInputs(conversions: ConversionSummary[], lines: PayoutLine[], terms: string): PayoutLabInput[] {
  const groups = new Map<string, { amountCents: number; refs: PayoutLabInput["refs"] }>();
  for (const conversion of conversions) {
    if (conversion.dryRun || conversion.orderKind !== "lab") continue;
    if (remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) <= 0) continue;
    const period = payoutPeriod(conversion.createdAt);
    if (!period) continue;
    const current = groups.get(period) ?? { amountCents: 0, refs: [] };
    current.amountCents += adjustedCommissionCents(conversion.commissionCents, conversion.commissionRefundedCents);
    current.refs.push({
      id: toAffiliateOrder({ orderId: conversion.orderId }).ref,
      source: conversion.promoCode ? "Promo code" : "Tracking link",
    });
    groups.set(period, current);
  }
  return [...groups.entries()].map(([period, group]) => {
    const periodLines = lines.filter((line) => line.period === period);
    const paid = periodLines.filter((line) => line.status === "paid");
    const approved = periodLines.find((line) => line.status === "approved");
    const pending = periodLines.find((line) => line.status === "pending");
    const paidCents = paid.reduce((sum, line) => sum + (line.paidCents ?? line.earnedCents), 0);
    const latest = [...paid].sort((left, right) => (right.paidAt ?? "").localeCompare(left.paidAt ?? ""))[0];
    if (group.amountCents > 0 && paidCents >= group.amountCents && !approved && !pending) {
      return { period, amountCents: group.amountCents, conversions: group.refs.length, status: "paid" as const, paidOn: latest?.paidAt ?? null, approvedOn: latest?.paidAt ?? null, reference: latest?.reference ?? "", terms, refs: group.refs };
    }
    if (approved && !pending) {
      return { period, amountCents: group.amountCents, conversions: group.refs.length, status: "approved" as const, paidOn: null, approvedOn: approved.approvedAt, reference: "", terms, refs: group.refs };
    }
    return { period, amountCents: group.amountCents, conversions: group.refs.length, status: "pending" as const, paidOn: null, approvedOn: null, reference: "", terms, refs: group.refs };
  });
}
