import type { Metadata } from "next";
import Link from "next/link";
import { MarkPaidButton } from "@/components/affiliate/MarkPaidButton";
import { formatCents } from "@/lib/affiliate/format";
import {
  currentPayoutPeriod,
  formatPayoutDate,
  formatPayoutMonth,
  loadPayoutRecords,
  normalizePayoutPeriod,
  payoutLines,
  payoutMonths,
  type PayoutLine,
  type PayoutStatus,
} from "@/lib/affiliate/payouts";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";
import { approvePayoutAction } from "../../actions";
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

function PayoutAction({ line, updated, paidOn }: { line: PayoutLine; updated: boolean; paidOn: string }) {
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

export default async function AffiliatePayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const notice = notices[query.notice ?? ""] ?? "";
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const paidOn = new Date().toISOString().slice(0, 10);

  let lines: PayoutLine[] = [];
  let months: string[] = [];
  let loadError = "";
  const month = normalizePayoutPeriod(query.month) ?? currentPayoutPeriod();
  try {
    await syncAttributedGenHealthSales();
    const overview = await loadAffiliateOverview();
    const payouts = await loadPayoutRecords();
    months = [...new Set([month, ...payoutMonths(overview.conversions, payouts)])].sort((left, right) => right.localeCompare(left));
    lines = payoutLines({
      affiliates: overview.affiliates,
      orders: overview.conversions,
      payouts,
      period: month,
    });
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
          Review earned commission, approve a month, then record a payment completed outside this dashboard.
        </p>
      </div>

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
          <h3 className="text-sm text-brown">Pending</h3>
          <p className="mt-2 text-3xl">{formatCents(pendingCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Approved</h3>
          <p className="mt-2 text-3xl">{formatCents(approvedCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Paid</h3>
          <p className="mt-2 text-3xl">{formatCents(paidCents)}</p>
        </section>
      </div>

      <div className="min-w-0 rounded-[28px] bg-white">
        <h3 id="payout-table-title" className="px-4 pt-4 text-xl">
          {formatPayoutMonth(month)}
        </h3>
        {lines.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">No commission for this month.</p>
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
                    <dd className="mt-1">{line.paidCents == null ? "—" : formatCents(line.paidCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Paid on</dt>
                    <dd className="mt-1">{formatPayoutDate(line.paidAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Reference</dt>
                    <dd className="mt-1 break-words">{line.reference || "—"}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <PayoutAction line={line} updated={approvedCodes.has(line.code)} paidOn={paidOn} />
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
                  <td className="px-4 py-5 align-top">{line.paidCents == null ? "—" : formatCents(line.paidCents)}</td>
                  <td className="px-4 py-5 align-top">{formatPayoutDate(line.paidAt)}</td>
                  <td className="break-words px-4 py-5 align-top">{line.reference || "—"}</td>
                  <td className="px-4 py-5 align-top">
                    <PayoutAction line={line} updated={approvedCodes.has(line.code)} paidOn={paidOn} />
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
