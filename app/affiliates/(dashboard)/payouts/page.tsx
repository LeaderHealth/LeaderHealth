import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/affiliate/format";
import {
  formatPayoutDate,
  formatPayoutMonth,
  loadPayoutRecords,
  payoutLines,
  type PayoutLine,
  type PayoutStatus,
} from "@/lib/affiliate/payouts";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { AffiliateStoreError, loadAffiliateActivity } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Payouts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusClass(status: PayoutStatus) {
  if (status === "pending") return "border border-ink/30 text-brown";
  return "bg-rose text-ink";
}

function statusLabel(status: PayoutStatus) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  return "Paid";
}

function HistoryRow({ line }: { line: PayoutLine }) {
  return (
    <>
      <div className="font-medium">{formatPayoutMonth(line.period)}</div>
      <div className="mt-2">
        <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm ${statusClass(line.status)}`}>
          {statusLabel(line.status)}
        </span>
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
    </>
  );
}

export default async function AffiliatePayoutHistoryPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let lines: PayoutLine[] = [];
  let loadError = "";
  try {
    await syncAttributedGenHealthSales();
    const activity = await loadAffiliateActivity(affiliate.code);
    const payouts = await loadPayoutRecords(affiliate.code);
    lines = payoutLines({
      affiliates: [{ code: affiliate.code, name: affiliate.name }],
      orders: activity.conversions,
      payouts,
    });
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load your payouts.";
  }

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="payout-history-title" className="px-4 pt-4 text-2xl">
        Payouts
      </h2>
      <p className="px-4 pt-2 text-sm text-brown">Your payout status and monthly payment history.</p>
      {loadError ? <p className="px-4 py-6 text-ink">{loadError}</p> : null}
      {!loadError && lines.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No commission yet.</p>
      ) : null}
      {lines.length > 0 ? (
        <ul className="xl:hidden" aria-labelledby="payout-history-title">
          {lines.map((line) => (
            <li key={line.key} className="border-t border-ink/10 px-4 py-5 text-sm">
              <HistoryRow line={line} />
            </li>
          ))}
        </ul>
      ) : null}
      {lines.length > 0 ? (
        <table className="mt-4 hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="payout-history-title">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Month</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Earned</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Status</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid on</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Reference</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key} className="border-t border-rose/60">
                <td className="px-4 py-5 align-top font-medium">{formatPayoutMonth(line.period)}</td>
                <td className="px-4 py-5 align-top">{formatCents(line.earnedCents)}</td>
                <td className="px-4 py-5 align-top">
                  <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm ${statusClass(line.status)}`}>
                    {statusLabel(line.status)}
                  </span>
                </td>
                <td className="px-4 py-5 align-top">{line.paidCents == null ? "—" : formatCents(line.paidCents)}</td>
                <td className="px-4 py-5 align-top">{formatPayoutDate(line.paidAt)}</td>
                <td className="break-words px-4 py-5 align-top">{line.reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
