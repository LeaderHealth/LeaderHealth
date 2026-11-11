import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/affiliate/format";
import { periodReferralSummaries, type PeriodReferralSource } from "@/lib/affiliate/order-view";
import { formatPayoutMonth } from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateConversions } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodSource(code: string, conversion: { dryRun: boolean; amountCents: number | null; refundedAmountCents: number; commissionCents: number; commissionRefundedCents: number; createdAt: string | null }): PeriodReferralSource {
  return {
    code,
    dryRun: conversion.dryRun,
    amountCents: conversion.amountCents,
    refundedAmountCents: conversion.refundedAmountCents,
    commissionCents: conversion.commissionCents,
    commissionRefundedCents: conversion.commissionRefundedCents,
    createdAt: conversion.createdAt,
  };
}

export default async function AffiliateOrdersPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let rows: ReturnType<typeof periodReferralSummaries> = [];
  let loadError = "";
  try {
    rows = periodReferralSummaries((await loadAffiliateConversions(affiliate.code)).map((conversion) => periodSource(affiliate.code, conversion)));
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load your orders.";
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="portal-orders-title" className="px-4 pt-4 text-2xl">
        Orders
      </h2>
      <p className="px-4 pt-2 text-sm text-brown">
        Referral ID <span className="break-all text-ink">{affiliate.code}</span>
      </p>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No paid orders yet.</p>
      ) : (
        <ul className="xl:hidden" aria-labelledby="portal-orders-title">
          {rows.map((row) => (
            <li key={row.period} className="border-t border-ink/10 px-4 py-5 text-sm">
              <div className="font-medium">{formatPayoutMonth(row.period)}</div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                <div>
                  <dt className="text-xs text-brown">Conversions</dt>
                  <dd className="mt-1">{row.conversions}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Commission</dt>
                  <dd className="mt-1">{formatCents(row.commissionCents)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <table className="hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="portal-orders-title">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Period</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Conversions</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.period} className="border-t border-rose/60">
                <td className="break-words px-4 py-5 align-top">{formatPayoutMonth(row.period)}</td>
                <td className="px-4 py-5 align-top">{row.conversions}</td>
                <td className="px-4 py-5 align-top">{formatCents(row.commissionCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
