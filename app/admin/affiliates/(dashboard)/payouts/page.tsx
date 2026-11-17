import type { Metadata } from "next";
import Link from "next/link";
import { MarkPaidButton } from "@/components/affiliate/MarkPaidButton";
import { PayoutTable, type PayoutTableRow, type PayoutTableStatus } from "@/components/affiliate/PayoutTable";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import {
  deliverableLines,
  loadDeliverablePayments,
  type DeliverableLine,
} from "@/lib/affiliate/deliverable-payments";
import { deliverableStatusLabel } from "@/lib/affiliate/deliverable-flow";
import { formatCents } from "@/lib/affiliate/format";
import { loadMarketingEvents, loadWebsitePayouts } from "@/lib/affiliate/marketing-events";
import { eventPeriod, socialMonthCents, websiteMonthAmount } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import {
  currentPayoutPeriod,
  formatPayoutDate,
  formatPayoutMonth,
  loadPayoutRecords,
  normalizePayoutPeriod,
  payoutLines,
  payoutMonths,
  type PayoutLine,
} from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { approveDeliverablePaymentAction, adjustDeliverableAction, approvePayoutAction, forfeitDeliverableAction, markDeliverablePaidAction, markPayoutPaidAction, recheckDeliverableAction, reinstateDeliverableAction } from "../../actions";
import { approveWebsitePayoutAction, markWebsitePayoutPaidAction } from "../../payment-actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Affiliate payouts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-center text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const primaryClass =
  "inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const notices: Record<string, string> = {
  approved: "Approved. Send the money, then record the payment.",
  paid: "Payment recorded.",
  "deliverable-approved": "Approved. Send the money, then record the payment.",
  "deliverable-paid": "Payment recorded.",
  "deliverable-rechecked": "Post re-checked. The fee is added to the next payout.",
  "deliverable-forfeited": "Marketing fee forfeited.",
  "deliverable-reinstated": "Marketing fee reinstated.",
  "deliverable-adjusted": "Bonus or clawback recorded.",
};

function bucketRank(status: PayoutTableStatus) {
  if (status === "needs") return 0;
  if (status === "approved") return 1;
  if (status === "waiting") return 2;
  return 3;
}

function postBucket(status: DeliverableLine["status"]): PayoutTableStatus | null {
  if (status === "pending") return "needs";
  if (status === "approved") return "approved";
  if (status === "paid") return "paid";
  if (status === "review" || status === "changes" || status === "waiting" || status === "measuring" || status === "hold" || status === "recheck") return "waiting";
  return null;
}

function postControl(line: DeliverableLine, paidOn: string, canPay: boolean) {
  if (!canPay) return null;
  if (line.status === "pending") {
    return (
      <form action={approveDeliverablePaymentAction}>
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="postId" value={line.postId} />
        <button type="submit" className={primaryClass}>
          Approve {formatCents(line.amountCents)}
        </button>
      </form>
    );
  }
  if (line.status === "approved") {
    return (
      <MarkPaidButton
        code={line.code}
        name={line.name}
        period={line.postId}
        postId={line.postId}
        amount={(line.amountCents / 100).toFixed(2)}
        paidOn={paidOn}
        monthLabel={line.label}
        action={markDeliverablePaidAction}
        label="Record payment"
        triggerClass={primaryClass}
      />
    );
  }
  return null;
}

function PayoutAction({ line, updated, paidOn, canPay }: { line: PayoutLine; updated: boolean; paidOn: string; canPay: boolean }) {
  if (!canPay) return null;
  if (line.status === "pending") {
    return (
      <form action={approvePayoutAction}>
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="period" value={line.period} />
        <button type="submit" className={primaryClass}>
          {updated ? "Approve updated amount" : `Approve ${formatCents(line.earnedCents)}`}
        </button>
      </form>
    );
  }
  if (line.status === "approved") {
    return (
      <MarkPaidButton
        code={line.code}
        name={line.name}
        period={line.period}
        amount={(line.earnedCents / 100).toFixed(2)}
        paidOn={paidOn}
        monthLabel={formatPayoutMonth(line.period)}
        label="Record payment"
        triggerClass={primaryClass}
      />
    );
  }
  return null;
}

const fieldClass =
  "min-h-11 min-w-0 flex-1 rounded-full border border-ink/20 bg-white px-4 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function MarketingAction({ line, paidOn, canPay }: { line: DeliverableLine; paidOn: string; canPay: boolean }) {
  if (!canPay) return line.status === "paid" ? <span className="text-brown">Recorded</span> : null;
  if (line.status === "recheck") {
    return (
      <div className="flex flex-col gap-3">
        <form action={recheckDeliverableAction}>
          <input type="hidden" name="code" value={line.code} />
          <input type="hidden" name="postId" value={line.postId} />
          <button type="submit" className={actionClass}>
            Post is still up
          </button>
        </form>
        <ForfeitForm line={line} />
      </div>
    );
  }
  if (line.status === "hold") return <ForfeitForm line={line} />;
  if (line.status === "forfeited") {
    return (
      <form action={reinstateDeliverableAction}>
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="postId" value={line.postId} />
        <button type="submit" className={actionClass}>
          Reinstate
        </button>
      </form>
    );
  }
  if (line.status === "pending") {
    return (
      <form action={approveDeliverablePaymentAction}>
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="postId" value={line.postId} />
        <button type="submit" className={actionClass}>
          Approve {formatCents(line.amountCents)}
        </button>
      </form>
    );
  }
  if (line.status === "approved") {
    return (
      <MarkPaidButton
        code={line.code}
        name={line.name}
        period={line.postId}
        postId={line.postId}
        amount={(line.amountCents / 100).toFixed(2)}
        paidOn={paidOn}
        monthLabel={line.label}
        action={markDeliverablePaidAction}
      />
    );
  }
  if (line.status === "paid") {
    return (
      <form action={adjustDeliverableAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="postId" value={line.postId} />
        <input name="amount" inputMode="decimal" placeholder="Bonus or clawback" aria-label="Bonus or clawback amount" className={fieldClass} />
        <input name="note" required maxLength={300} placeholder="Reason" aria-label="Reason for the adjustment" className={fieldClass} />
        <button type="submit" className={actionClass}>
          Save adjustment
        </button>
      </form>
    );
  }
  return null;
}

function ForfeitForm({ line }: { line: DeliverableLine }) {
  return (
    <form action={forfeitDeliverableAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="code" value={line.code} />
      <input type="hidden" name="postId" value={line.postId} />
      <input name="note" required maxLength={300} placeholder="What changed" aria-label="Reason the post no longer qualifies" className={fieldClass} />
      <button type="submit" className={actionClass}>
        Forfeit fee
      </button>
    </form>
  );
}

export default async function AffiliatePayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const actor = await adminSessionActor();
  const canPay = Boolean(actor && adminHasFullAccess(actor));
  const notice = notices[query.notice ?? ""] ?? "";
  const error = query.error === "website" ? "The website traffic payment could not be saved." : query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const paidOn = new Date().toISOString().slice(0, 10);

  let lines: PayoutLine[] = [];
  let allLines: PayoutLine[] = [];
  let marketing: DeliverableLine[] = [];
  let months: string[] = [];
  let loadError = "";
  let affiliates: { code: string; name: string }[] = [];
  let posts: Awaited<ReturnType<typeof loadContentSubmissions>> = [];
  let payments: Awaited<ReturnType<typeof loadDeliverablePayments>> = [];
  let events: Awaited<ReturnType<typeof loadMarketingEvents>> = [];
  let websitePayouts: Awaited<ReturnType<typeof loadWebsitePayouts>> = [];
  let rates: Awaited<ReturnType<typeof loadPaymentRates>> | null = null;
  let marketingError = "";
  const month = normalizePayoutPeriod(query.month) ?? currentPayoutPeriod();
  try {
    const overview = await loadAffiliateOverview();
    affiliates = overview.affiliates.map((affiliate) => ({ code: affiliate.code, name: affiliate.name }));
    const payouts = await loadPayoutRecords();
    months = [...new Set([month, ...payoutMonths(overview.conversions, payouts)])].sort((left, right) => right.localeCompare(left));
    allLines = payoutLines({
      affiliates: overview.affiliates,
      orders: overview.conversions,
      payouts,
    });
    lines = allLines.filter((line) => line.period === month);
    try {
      const [loadedPosts, loadedPayments, loadedEvents, loadedWebsite, loadedRates] = await Promise.all([
        loadContentSubmissions(),
        loadDeliverablePayments(),
        loadMarketingEvents({ period: month }),
        loadWebsitePayouts(month),
        loadPaymentRates(),
      ]);
      posts = loadedPosts;
      payments = loadedPayments;
      events = loadedEvents;
      websitePayouts = loadedWebsite;
      rates = loadedRates;
      marketing = deliverableLines({ affiliates: overview.affiliates, posts, payments });
    } catch (caught) {
      marketingError = caught instanceof Error ? "Could not load marketing payments." : "Could not load marketing payments.";
    }
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load payouts.";
    months = [month];
  }

  const approvedCodes = new Set(lines.filter((line) => line.status === "approved").map((line) => line.code));
  const rows: PayoutTableRow[] = affiliates.flatMap((affiliate) => {
    const social = socialMonthCents({
      period: month,
      posts: posts.filter((post) => post.code === affiliate.code),
      payments: payments.filter((payment) => payment.code === affiliate.code),
    });
    const snapshot = websitePayouts.find((row) => row.code === affiliate.code) ?? null;
    const website = rates
      ? websiteMonthAmount({ events, code: affiliate.code, period: month, rates, snapshot })
      : { clicks: 0, pageViews: 0, amountCents: 0, status: "pending" as const };
    const labLines = lines.filter((line) => line.code === affiliate.code);
    const labPayable = labLines.find((line) => line.status !== "paid");
    const labPaid = labLines.find((line) => line.status === "paid");
    const labCents = labLines.reduce((sum, line) => sum + line.earnedCents, 0);
    const counts = website.clicks + website.pageViews;
    const totalCents = social.socialCents + website.amountCents + labCents + social.adjustmentCents;
    const monthPosts = marketing.filter((line) => {
      if (line.code !== affiliate.code) return false;
      const payment = payments.find((item) => item.postId === line.postId);
      const post = posts.find((item) => item.id === line.postId);
      return eventPeriod(line.paidAt ?? payment?.approvedAt ?? payment?.paidAt ?? post?.publishedAt ?? "") === month;
    });
    if (totalCents === 0 && counts === 0 && monthPosts.length === 0) return [];
    const buckets: PayoutTableStatus[] = [];
    if (labPayable?.status === "pending") buckets.push("needs");
    if (labPayable?.status === "approved") buckets.push("approved");
    if (labPaid) buckets.push("paid");
    if (website.status === "paid") buckets.push("paid");
    else if (website.status === "approved") buckets.push("approved");
    else if (counts > 0) buckets.push("needs");
    for (const post of monthPosts) {
      const bucket = postBucket(post.status);
      if (bucket) buckets.push(bucket);
    }
    const status = [...buckets].sort((left, right) => bucketRank(left) - bucketRank(right))[0] ?? "paid";
    const steps: string[] = [];
    if (canPay && labPayable) steps.push("lab");
    if (canPay && website.status === "pending" && counts > 0) steps.push("website");
    if (canPay && website.status === "approved") steps.push("website-record");
    for (const post of monthPosts) {
      if (post.status === "pending" || post.status === "approved") steps.push(post.postId);
    }
    const primary = steps[0] ?? "";
    const websiteLabel = counts === 0 ? "" : `${website.clicks} clicks, ${website.pageViews} page views`;
    const waitingNote = status !== "waiting" ? "" : monthPosts.some((post) => post.status === "measuring" || post.status === "hold" || post.status === "recheck") ? "Still counting" : "Still in review";
    const paidLine = labPaid ?? monthPosts.find((post) => post.status === "paid");
    const paidWhen = paidLine && "paidAt" in paidLine ? formatPayoutDate(paidLine.paidAt) : "";
    const paidRef = paidLine && "reference" in paidLine ? paidLine.reference : "";
    const detail = status === "paid" ? [paidWhen === "—" ? "" : paidWhen, paidRef].filter(Boolean).join(" · ") : status === "waiting" ? waitingNote : "";
    const parts = [
      social.socialCents ? { kind: "Social", what: monthPosts.length === 1 ? monthPosts[0].label : monthPosts.length > 1 ? `${monthPosts.length} posts this month` : "Social posts this month", amountCents: social.socialCents } : null,
      website.amountCents || counts ? { kind: "Website traffic", what: websiteLabel || "This month", amountCents: website.amountCents } : null,
      labCents ? { kind: "Lab", what: "Lab orders this month", amountCents: labCents } : null,
    ].filter((part) => part != null);
    const websiteApprove = (
      <form action={approveWebsitePayoutAction}>
        <input type="hidden" name="code" value={affiliate.code} />
        <input type="hidden" name="period" value={month} />
        <button type="submit" className={primary === "website" ? primaryClass : actionClass}>
          Approve {formatCents(website.amountCents)}
        </button>
      </form>
    );
    const websiteRecord = (
      <MarkPaidButton
        code={affiliate.code}
        name={affiliate.name}
        period={month}
        amount={(website.amountCents / 100).toFixed(2)}
        paidOn={paidOn}
        monthLabel={formatPayoutMonth(month)}
        action={markWebsitePayoutPaidAction}
        label="Record payment"
        triggerClass={primary === "website-record" ? primaryClass : undefined}
      />
    );
    const labAction = labPayable ? <PayoutAction line={labPayable} updated={approvedCodes.has(labPayable.code)} paidOn={paidOn} canPay={canPay} /> : null;
    const primaryPost = monthPosts.find((post) => post.postId === primary);
    const record =
      status === "approved" && canPay && primary === "lab" && labPayable?.status === "approved"
        ? { code: affiliate.code, name: affiliate.name, period: month, amountCents: labPayable.earnedCents, paidOn, action: markPayoutPaidAction }
        : status === "approved" && canPay && primary === "website-record"
          ? { code: affiliate.code, name: affiliate.name, period: month, amountCents: website.amountCents, paidOn, action: markWebsitePayoutPaidAction }
          : status === "approved" && canPay && primaryPost?.status === "approved"
            ? { code: affiliate.code, name: affiliate.name, period: primaryPost.postId, postId: primaryPost.postId, amountCents: primaryPost.amountCents, paidOn, action: markDeliverablePaidAction }
            : undefined;
    const action = record ? undefined : primary === "lab" ? labAction : primary === "website" ? websiteApprove : primary === "website-record" ? websiteRecord : primaryPost ? postControl(primaryPost, paidOn, canPay) : undefined;
    return [
      {
        key: affiliate.code,
        name: affiliate.name,
        socialCents: social.socialCents,
        websiteCents: website.amountCents,
        labCents,
        totalCents,
        status,
        detail,
        parts,
        action,
        record,
        extra:
          monthPosts.some((post) => post.postId !== primary && (post.detail || post.adjustmentCents != null || post.status === "recheck" || post.status === "hold" || post.status === "forfeited" || post.status === "paid")) ||
          (primary !== "website" && steps.includes("website")) ||
          (primary !== "website-record" && steps.includes("website-record")) ||
          (primary !== "lab" && steps.includes("lab")) ? (
            <div className="space-y-3 text-sm">
              {monthPosts.map((post) =>
                post.postId === primary ? null : (
                  <div key={post.postId}>
                    <p>
                      {post.label} · {deliverableStatusLabel(post.status, post.adjustmentCents != null)}
                    </p>
                    {post.detail ? <p className="mt-1 text-brown">{post.detail}</p> : null}
                    {post.adjustmentCents != null ? (
                      <p className="mt-1 text-brown">
                        {post.adjustmentCents > 0 ? "Bonus" : "Clawback"} {formatCents(Math.abs(post.adjustmentCents))}. {post.adjustmentReason}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <MarketingAction line={post} paidOn={paidOn} canPay={canPay} />
                    </div>
                  </div>
                ),
              )}
              {primary !== "website" && steps.includes("website") ? websiteApprove : null}
              {primary !== "website-record" && steps.includes("website-record") ? <div>{websiteRecord}</div> : null}
              {primary !== "lab" && steps.includes("lab") ? labAction : null}
            </div>
          ) : undefined,
      },
    ];
  });

  const bucketTotal = (status: PayoutTableStatus) => rows.filter((row) => row.status === status).reduce((sum, row) => sum + row.totalCents, 0);
  const bucketCount = (status: PayoutTableStatus) => rows.filter((row) => row.status === status).length;
  const needsCents = bucketTotal("needs");
  const approvedCents = bucketTotal("approved");
  const paidCents = bucketTotal("paid");
  const waitingCents = bucketTotal("waiting");
  const needsCount = bucketCount("needs");
  const paidCount = bucketCount("paid");
  function chipNote(period: string) {
    if (period === month) {
      if (rows.length === 0) return "Nothing yet";
      const unpaid = rows.filter((row) => row.status !== "paid").length;
      return unpaid === 0 ? "All paid" : `${unpaid} not paid yet`;
    }
    const monthLines = allLines.filter((line) => line.period === period);
    const unpaid = new Set(monthLines.filter((line) => line.status !== "paid").map((line) => line.code)).size;
    if (unpaid > 0) return `${unpaid} not paid yet`;
    if (monthLines.some((line) => line.status === "paid")) return "All paid";
    return "Nothing yet";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <h2 className="text-[30px] font-normal">Payouts</h2>
          <p className="mt-1.5 max-w-xl text-[15px] text-[#4a3a37]">
            {canPay ? "Approve each affiliate's total, send the money, then record it here." : "Approving and recording a payment is limited to main admins and admins."}
            {LAB_COMMISSIONS_ENABLED ? "" : " Lab commission is not active."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Month">
          {months.map((item) => {
            const selected = item === month;
            return (
              <Link
                key={item}
                href={`/admin/affiliates/payouts?month=${item}`}
                aria-current={selected ? "true" : undefined}
                className={`inline-flex min-w-[170px] flex-col rounded-2xl border px-4 py-2 text-left ${selected ? "border-ink bg-ink text-white" : "border-[#cdbdbA] bg-white text-ink hover:bg-background"}`}
              >
                <span className="text-[15px] font-semibold">{formatPayoutMonth(item)}</span>
                <span className={`text-[13px] ${selected ? "text-white/85" : "text-[#6b5a57]"}`}>{chipNote(item)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {notice ? (
        <p role="status" className="rounded-[14px] bg-[#ddf0e4] px-4 py-3 text-[15px] font-medium text-[#1d6340]">
          {notice}
        </p>
      ) : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      {marketingError ? <p className="text-ink">{marketingError}</p> : null}

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <section className={`flex flex-col gap-1 rounded-[20px] bg-white px-[18px] py-4 ${needsCount ? "border-2 border-[#e9c98a]" : "border-2 border-transparent"}`}>
          <h3 className="text-sm text-[#7a4e00]">Needs approval</h3>
          <p className="text-[28px]">{formatCents(needsCents)}</p>
          <p className="text-[13px] text-[#6b5a57]">{needsCount === 1 ? "1 affiliate" : `${needsCount} affiliates`}</p>
        </section>
        <section className="flex flex-col gap-1 rounded-[20px] border-2 border-transparent bg-white px-[18px] py-4">
          <h3 className="text-sm text-[#4a3a37]">Approved, not sent</h3>
          <p className="text-[28px]">{formatCents(approvedCents)}</p>
          <p className="text-[13px] text-[#6b5a57]">Send, then record</p>
        </section>
        <section className="flex flex-col gap-1 rounded-[20px] border-2 border-transparent bg-white px-[18px] py-4">
          <h3 className="text-sm text-[#1d6340]">Paid</h3>
          <p className="text-[28px]">{formatCents(paidCents)}</p>
          <p className="text-[13px] text-[#6b5a57]">{paidCount === 1 ? "1 recorded" : `${paidCount} recorded`}</p>
        </section>
        <section className="flex flex-col gap-1 rounded-[20px] border-2 border-transparent bg-white px-[18px] py-4">
          <h3 className="text-sm text-[#4a3a37]">Not ready</h3>
          <p className="text-[28px]">{formatCents(waitingCents)}</p>
          <p className="text-[13px] text-[#6b5a57]">Still counting or in review</p>
        </section>
      </div>

      <PayoutTable month={month} title={formatPayoutMonth(month)} rows={rows} />
    </div>
  );
}
