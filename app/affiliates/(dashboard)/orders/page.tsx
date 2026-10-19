import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCents, formatCommissionRate, formatWhen } from "@/lib/affiliate/format";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { AffiliateStoreError, loadAffiliateConversions, type ConversionSummary } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Affiliate orders",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliateOrdersPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let conversions: ConversionSummary[] = [];
  let loadError = "";
  try {
    await syncAttributedGenHealthSales();
    conversions = await loadAffiliateConversions(affiliate.code);
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load your orders.";
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="portal-orders-title" className="px-4 pt-4 text-2xl">
        Recent orders
      </h2>
      {conversions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No attributed orders yet.</p>
      ) : (
        <ul className="xl:hidden" aria-labelledby="portal-orders-title">
          {conversions.map((conversion) => (
            <li key={conversion.orderId} className="border-t border-ink/10 px-4 py-5 text-sm">
              <div className="font-medium">{conversion.productName}</div>
              <p className="mt-1 break-all text-brown">
                {conversion.orderId}
                {conversion.dryRun ? " · Dry run" : ""}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                <div>
                  <dt className="text-xs text-brown">When</dt>
                  <dd className="mt-1">{formatWhen(conversion.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Amount</dt>
                  <dd className="mt-1">{conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-brown">Commission</dt>
                  <dd className="mt-1">
                    {formatCents(conversion.commissionCents)}
                    <div className="text-brown">{formatCommissionRate(conversion)}</div>
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {conversions.length > 0 ? (
      <table className="hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="portal-orders-title">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[24%]" />
          <col className="w-[28%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
        </colgroup>
        <thead className="text-brown">
          <tr>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">When</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Order</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Product</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Amount</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Commission</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => (
              <tr key={conversion.orderId} className="border-t border-rose/60">
                <td className="break-words px-4 py-5 align-top">{formatWhen(conversion.createdAt)}</td>
                <td className="break-all px-4 py-5 align-top">
                  {conversion.orderId}
                  {conversion.dryRun ? <div className="mt-1 text-brown">Dry run</div> : null}
                </td>
                <td className="break-words px-4 py-5 align-top">{conversion.productName}</td>
                <td className="px-4 py-5 align-top">{conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}</td>
                <td className="px-4 py-5 align-top">
                  <div>{formatCents(conversion.commissionCents)}</div>
                  <div className="mt-1 text-brown">{formatCommissionRate(conversion)}</div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      ) : null}
    </div>
  );
}
