import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderCommission } from "@/components/affiliate/OrderCommission";
import { formatCents, formatWhen } from "@/lib/affiliate/format";
import { toAffiliateOrder, type AffiliateOrderView } from "@/lib/affiliate/order-view";
import { remainingSalesCents } from "@/lib/affiliate/refunds";
import { AffiliateStoreError, loadAffiliateConversions } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliateOrdersPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let conversions: AffiliateOrderView[] = [];
  let loadError = "";
  try {
    conversions = (await loadAffiliateConversions(affiliate.code))
      .filter((conversion) => !conversion.dryRun && remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0)
      .map(toAffiliateOrder);
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load your orders.";
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="portal-orders-title" className="px-4 pt-4 text-2xl">
        Orders
      </h2>
      {conversions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No paid orders yet.</p>
      ) : (
        <ul className="xl:hidden" aria-labelledby="portal-orders-title">
          {conversions.map((conversion) => (
            <li key={conversion.ref} className="border-t border-ink/10 px-4 py-5 text-sm">
              <div className="font-medium">Paid order</div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                <div>
                  <dt className="text-xs text-brown">When</dt>
                  <dd className="mt-1">{formatWhen(conversion.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Amount</dt>
                  <dd className="mt-1">{formatCents(remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents))}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-brown">Commission</dt>
                  <dd className="mt-1">
                    <OrderCommission conversion={conversion} />
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
          <col className="w-[34%]" />
          <col className="w-[33%]" />
          <col className="w-[33%]" />
        </colgroup>
        <thead className="text-brown">
          <tr>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">When</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Amount</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Commission</th>
          </tr>
        </thead>
        <tbody>
          {conversions.map((conversion) => (
              <tr key={conversion.ref} className="border-t border-rose/60">
                <td className="break-words px-4 py-5 align-top">{formatWhen(conversion.createdAt)}</td>
                <td className="px-4 py-5 align-top">{formatCents(remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents))}</td>
                <td className="px-4 py-5 align-top">
                  <OrderCommission conversion={conversion} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      ) : null}
    </div>
  );
}
