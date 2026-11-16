import type { Metadata } from "next";
import Link from "next/link";
import { MarkPaidButton } from "@/components/affiliate/MarkPaidButton";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import {
  deliverableLines,
  loadDeliverablePayments,
  marketingTotals,
  type DeliverableLine,
} from "@/lib/affiliate/deliverable-payments";
import { deliverableStatusLabel } from "@/lib/affiliate/deliverable-flow";
import { formatCents } from "@/lib/affiliate/format";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import {
  currentPayoutPeriod,
  formatPayoutMonth,
  loadPayoutRecords,
  normalizePayoutPeriod,
  payoutLines,
  payoutPaidAmount,
  payoutPaidOn,
  payoutReferenceText,
  payoutMonths,
  type PayoutLine,
  type PayoutStatus,
} from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { approveDeliverablePaymentAction, adjustDeliverableAction, approvePayoutAction, forfeitDeliverableAction, markDeliverablePaidAction, recheckDeliverableAction, reinstateDeliverableAction } from "../../actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Affiliate payouts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const actionClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-center text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const notices: Record<string, string> = {
  approved: "Payout approved.",
  paid: "Payment recorded.",
  "deliverable-approved": "Marketing payment approved.",
  "deliverable-paid": "Marketing payment recorded.",
  "deliverable-rechecked": "Post re-checked. The fee is added to the next payout.",
  "deliverable-forfeited": "Marketing fee forfeited.",
  "deliverable-reinstated": "Marketing fee reinstated.",
  "deliverable-adjusted": "Bonus or clawback recorded.",
};

function statusClass(status: PayoutStatus) {
  if (status === "pending") return "border border-ink/30 text-brown";
  return "bg-rose text-ink";
}

function statusLabel(status: PayoutStatus) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  return "Paid";
}

function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

function PayoutAction({ line, updated, paidOn, canPay }: { line: PayoutLine; updated: boolean; paidOn: string; canPay: boolean }) {
  if (!canPay) return line.status === "paid" ? <span className="text-brown">Recorded</span> : null;
  if (line.status === "pending") {
    return (
      <form action={approvePayoutAction}>
        <input type="hidden" name="code" value={line.code} />
        <input type="hidden" name="period" value={line.period} />
        <button type="submit" className={actionClass}>
          {updated ? "Approve updated amount" : "Approve"}
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
      />
    );
  }
  return <span className="text-brown">Recorded</span>;
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
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const paidOn = new Date().toISOString().slice(0, 10);

  let lines: PayoutLine[] = [];
  let marketing: DeliverableLine[] = [];
  let months: string[] = [];
  let loadError = "";
  let marketingError = "";
  const month = normalizePayoutPeriod(query.month) ?? currentPayoutPeriod();
  try {
    const overview = await loadAffiliateOverview();
    const payouts = await loadPayoutRecords();
    months = [...new Set([month, ...payoutMonths(overview.conversions, payouts)])].sort((left, right) => right.localeCompare(left));
    lines = payoutLines({
      affiliates: overview.affiliates,
      orders: overview.conversions,
      payouts,
      period: month,
    });
    try {
      const [posts, payments] = await Promise.all([loadContentSubmissions(), loadDeliverablePayments()]);
      marketing = deliverableLines({ affiliates: overview.affiliates, posts, payments });
    } catch (caught) {
      marketingError = caught instanceof Error ? "Could not load marketing payments." : "Could not load marketing payments.";
    }
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load payouts.";
    months = [month];
  }

  const pendingCents = lines.filter((line) => line.status === "pending").reduce((sum, line) => sum + line.earnedCents, 0);
  const approvedCents = lines.filter((line) => line.status === "approved").reduce((sum, line) => sum + line.earnedCents, 0);
  const paidCents = lines.reduce((sum, line) => sum + (line.paidCents ?? 0), 0);
  const approvedCodes = new Set(lines.filter((line) => line.status === "approved").map((line) => line.code));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl">Payouts</h2>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          {canPay
            ? "Each post locks its rate, maximum, and tracking period when it is sent. After that period, approve the amount calculated from recorded views, then record the payment. Older flat-fee posts still follow the 14-day hold."
            : "Review marketing payments and past commission payouts. Approving and recording a payment is limited to main admins and admins."}{" "}
          {LAB_COMMISSIONS_ENABLED ? "Lab commission is calculated from lab orders." : "Lab commission is not active."}
        </p>
      </div>

      {marketingError ? <p className="text-ink">{marketingError}</p> : null}
      <section className="min-w-0 rounded-[28px] bg-white">
        <h3 id="marketing-payments-title" className="px-4 pt-4 text-xl">
          Marketing payments
        </h3>
        <p className="px-4 pt-2 text-sm text-brown">
          Earned {formatCents(marketingTotals(marketing).pendingCents)} · On hold {formatCents(marketingTotals(marketing).heldCents)} · Approved{" "}
          {formatCents(marketingTotals(marketing).approvedCents)} · Paid {formatCents(marketingTotals(marketing).paidCents)}
        </p>
        {marketing.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">No marketing payments are on file yet.</p>
        ) : (
          <ul aria-labelledby="marketing-payments-title">
            {marketing.map((line) => (
              <li key={line.postId} className="border-t border-ink/10 px-4 py-5 text-sm">
                <div className="font-medium">{line.name}</div>
                <p className="mt-1 text-brown">{line.label}</p>
                <div className="mt-2">
                  <span className="inline-flex min-h-8 items-center rounded-full bg-rose px-3 text-sm text-ink">
                    {deliverableStatusLabel(line.status, line.adjustmentCents != null)}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-brown">{line.detail}</p>
                <p className="mt-3">
                  {line.status === "closed"
                    ? "No fee"
                    : formatCents(line.status === "paid" ? (line.paidCents ?? 0) + (line.adjustmentCents ?? 0) : line.amountCents)}
                </p>
                {line.adjustmentCents != null ? (
                  <p className="mt-2 text-brown">
                    {line.adjustmentCents > 0 ? "Bonus" : "Clawback"} {formatCents(Math.abs(line.adjustmentCents))}. {line.adjustmentReason}
                  </p>
                ) : null}
                <div className="mt-4">
                  <MarketingAction line={line} paidOn={paidOn} canPay={canPay} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Month">
        {months.map((item) => (
          <Link
            key={item}
            href={`/admin/affiliates/payouts?month=${item}`}
            aria-current={item === month ? "true" : undefined}
            className={`${pillClass} ${item === month ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
          >
            {formatPayoutMonth(item)}
          </Link>
        ))}
      </div>

      {notice ? <p className="text-sm text-ink">{notice}</p> : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">{LAB_COMMISSIONS_ENABLED ? "Lab pending" : "Past pending"}</h3>
          <p className="mt-2 text-3xl">{formatCents(pendingCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">{LAB_COMMISSIONS_ENABLED ? "Lab approved" : "Past approved"}</h3>
          <p className="mt-2 text-3xl">{formatCents(approvedCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">{LAB_COMMISSIONS_ENABLED ? "Lab paid" : "Past paid"}</h3>
          <p className="mt-2 text-3xl">{formatCents(paidCents)}</p>
        </section>
      </div>

      <div className="min-w-0 rounded-[28px] bg-white">
        <h3 id="payout-table-title" className="px-4 pt-4 text-xl">
          {LAB_COMMISSIONS_ENABLED ? "Lab commission" : "Past commission"} · {formatPayoutMonth(month)}
        </h3>
        {lines.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">
            {LAB_COMMISSIONS_ENABLED ? "No lab commission for this month." : "No past commission payout for this month."}
          </p>
        ) : (
          <ul className="xl:hidden" aria-labelledby="payout-table-title">
            {lines.map((line) => (
              <li key={line.key} className="border-t border-ink/10 px-4 py-5 text-sm">
                <div className="font-medium">{line.name}</div>
                <div className="mt-2">
                  <PayoutStatusBadge status={line.status} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                  <div>
                    <dt className="text-xs text-brown">Earned</dt>
                    <dd className="mt-1">{formatCents(line.earnedCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Paid</dt>
                    <dd className="mt-1">{payoutPaidAmount(line)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Paid on</dt>
                    <dd className="mt-1">{payoutPaidOn(line)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Reference</dt>
                    <dd className="mt-1 break-words">{payoutReferenceText(line)}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <PayoutAction line={line} updated={approvedCodes.has(line.code)} paidOn={paidOn} canPay={canPay} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 ? (
          <table className="hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="payout-table-title">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="text-brown">
              <tr>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Affiliate</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Earned</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Status</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid on</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Reference</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className="border-t border-rose/60">
                  <td className="break-words px-4 py-5 align-top font-medium">{line.name}</td>
                  <td className="px-4 py-5 align-top">{formatCents(line.earnedCents)}</td>
                  <td className="px-4 py-5 align-top">
                    <PayoutStatusBadge status={line.status} />
                  </td>
                  <td className="px-4 py-5 align-top">{payoutPaidAmount(line)}</td>
                  <td className="px-4 py-5 align-top">{payoutPaidOn(line)}</td>
                  <td className="break-words px-4 py-5 align-top">{payoutReferenceText(line)}</td>
                  <td className="px-4 py-5 align-top">
                    <PayoutAction line={line} updated={approvedCodes.has(line.code)} paidOn={paidOn} canPay={canPay} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
