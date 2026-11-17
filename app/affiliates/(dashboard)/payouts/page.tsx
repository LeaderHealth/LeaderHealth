import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EarningsMonth, type EarningsMonthRow } from "@/components/affiliate/EarningsMonth";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { deliverableLines, loadDeliverablePayments, marketingTotals, type DeliverableLine } from "@/lib/affiliate/deliverable-payments";
import { deliverableStatusLabel } from "@/lib/affiliate/deliverable-flow";
import { formatCents } from "@/lib/affiliate/format";
import { loadMarketingEvents, loadWebsitePayoutsForCode } from "@/lib/affiliate/marketing-events";
import { eventPeriod, socialMonthCents, websiteMonthAmount } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import {
  currentPayoutPeriod,
  formatPayoutDate,
  formatPayoutMonth,
  loadPayoutRecords,
  payoutLines,
  type PayoutLine,
} from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateActivity } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Payouts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function labNote(line: PayoutLine | undefined) {
  if (!line || (line.earnedCents === 0 && line.status === "pending")) return "";
  if (line.status === "paid") {
    const date = formatPayoutDate(line.paidAt);
    const reference = line.reference ? ` · ${line.reference}` : "";
    return date === "—" ? `Paid${reference}` : `Paid ${date}${reference}`;
  }
  if (line.status === "approved") return "Approved";
  return "Pending";
}

export default async function AffiliatePayoutHistoryPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let lines: PayoutLine[] = [];
  let marketing: DeliverableLine[] = [];
  let earningRows: EarningsMonthRow[] = [];
  let loadError = "";
  try {
    const activity = await loadAffiliateActivity(affiliate.code);
    const payouts = await loadPayoutRecords(affiliate.code);
    lines = payoutLines({
      affiliates: [{ code: affiliate.code, name: affiliate.name }],
      orders: activity.conversions,
      payouts,
    });
    const [posts, payments, events, websitePayouts, rates] = await Promise.all([
      loadContentSubmissions(),
      loadDeliverablePayments(affiliate.code),
      loadMarketingEvents({ code: affiliate.code }),
      loadWebsitePayoutsForCode(affiliate.code),
      loadPaymentRates(),
    ]);
    const ownPosts = posts.filter((post) => post.code === affiliate.code);
    marketing = deliverableLines({
      affiliates: [{ code: affiliate.code, name: affiliate.name }],
      posts: ownPosts,
      payments,
    });
    const periods = new Set<string>([currentPayoutPeriod(), ...lines.map((line) => line.period), ...websitePayouts.map((row) => row.period)]);
    for (const payment of payments) {
      const period = eventPeriod(payment.approvedAt ?? payment.paidAt ?? "");
      if (period) periods.add(period);
    }
    earningRows = [...periods]
      .sort((left, right) => right.localeCompare(left))
      .flatMap((period) => {
        const social = socialMonthCents({ period, posts: ownPosts, payments });
        const snapshot = websitePayouts.find((row) => row.period === period) ?? null;
        const website = websiteMonthAmount({ events, code: affiliate.code, period, rates, snapshot });
        const lab = lines.find((line) => line.period === period);
        const labCents = lines.filter((line) => line.period === period).reduce((sum, line) => sum + line.earnedCents, 0);
        const totalCents = social.socialCents + website.amountCents + labCents + social.adjustmentCents;
        if (totalCents === 0 && !snapshot && !lab) return [];
        const websiteState = website.status === "paid" ? "Paid" : website.status === "approved" ? "Approved" : "";
        const counts = website.clicks + website.pageViews;
        return [
          {
            key: period,
            name: formatPayoutMonth(period),
            socialCents: social.socialCents,
            websiteCents: website.amountCents,
            labCents,
            adjustmentCents: social.adjustmentCents,
            totalCents,
            websiteLabel: counts === 0 && !websiteState ? "" : `${website.clicks} clicks, ${website.pageViews} page views${websiteState ? ` · ${websiteState}` : ""}`,
            labNote: labNote(lab),
          },
        ];
      });
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load payouts.";
  }
  const marketingSummary = marketingTotals(marketing);

  const marketingSummaryText = [
    marketingSummary.pendingCents ? `To approve ${formatCents(marketingSummary.pendingCents)}` : "",
    marketingSummary.heldCents ? `On hold ${formatCents(marketingSummary.heldCents)}` : "",
    marketingSummary.approvedCents ? `Approved ${formatCents(marketingSummary.approvedCents)}` : "",
    marketingSummary.paidCents ? `Paid ${formatCents(marketingSummary.paidCents)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl">Payouts</h2>
        <p className="mt-1 text-sm text-brown">
          Social, website traffic, and lab for each month.{LAB_COMMISSIONS_ENABLED ? "" : " Lab commission is not active."}
        </p>
      </div>
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      {marketing.length > 0 ? (
        <section className="min-w-0 rounded-[28px] bg-white">
          <h3 className="px-4 pt-4 text-xl">Posts</h3>
          {marketingSummaryText ? <p className="px-4 pt-1 text-sm text-brown">{marketingSummaryText}</p> : null}
          <ul>
            {marketing.map((line) => {
              const waiting = line.amountCents === 0 && (line.status === "review" || line.status === "changes" || line.status === "waiting" || line.status === "measuring");
              const amount = line.status === "closed" ? "Closed" : waiting ? "After the tracking period" : formatCents(line.status === "paid" ? (line.paidCents ?? 0) + (line.adjustmentCents ?? 0) : line.amountCents);
              return (
                <li key={line.postId} className="border-t border-ink/10 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="font-medium">{line.label}</div>
                    <div>{amount}</div>
                  </div>
                  <p className="mt-1 text-brown">{deliverableStatusLabel(line.status, line.adjustmentCents != null)}</p>
                  {line.detail ? <p className="mt-1 text-brown">{line.detail}</p> : null}
                  {line.adjustmentReason ? <p className="mt-1 text-brown">{line.adjustmentReason}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <EarningsMonth title="Months" rows={earningRows} emptyLabel="Nothing to show yet." nameLabel="Month" />
    </div>
  );
}
