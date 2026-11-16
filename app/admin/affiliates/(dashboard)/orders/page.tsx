import type { Metadata } from "next";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { formatCents } from "@/lib/affiliate/format";
import { periodReferralSummaries, type PeriodReferralSource } from "@/lib/affiliate/order-view";
import { formatPayoutMonth } from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodSource(conversion: { code: string; dryRun: boolean; amountCents: number | null; refundedAmountCents: number; commissionCents: number; commissionRefundedCents: number; createdAt: string | null; orderKind: "lab" | "treatment" }): PeriodReferralSource {
  return {
    code: conversion.code,
    dryRun: conversion.dryRun,
    amountCents: conversion.amountCents,
    refundedAmountCents: conversion.refundedAmountCents,
    commissionCents: conversion.commissionCents,
    commissionRefundedCents: conversion.commissionRefundedCents,
    createdAt: conversion.createdAt,
    orderKind: conversion.orderKind,
  };
}

function labCommission(cents: number) {
  return LAB_COMMISSIONS_ENABLED ? formatCents(cents) : "Not active";
}

export default async function AffiliateOrdersPage() {
  let rows: ReturnType<typeof periodReferralSummaries> = [];
  let loadError = "";
  try {
    rows = periodReferralSummaries((await loadAffiliateOverview()).conversions.map(periodSource));
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="recent-orders-title" className="px-4 pt-4 text-2xl">
        Orders
      </h2>
      <p className="px-4 pt-2 text-sm text-brown">Period, referral id, and conversion count. {LAB_COMMISSIONS_ENABLED ? "Lab commission is separate from marketing payments." : "Lab commission is not active."}</p>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No paid orders yet.</p>
      ) : (
        <ul className="xl:hidden" aria-labelledby="recent-orders-title">
          {rows.map((row) => (
            <li key={`${row.period}:${row.code}`} className="border-t border-ink/10 px-4 py-5 text-sm">
              <div className="font-medium">{formatPayoutMonth(row.period)}</div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                <div className="col-span-2">
                  <dt className="text-xs text-brown">Referral ID</dt>
                  <dd className="mt-1 break-all">{row.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Conversions</dt>
                  <dd className="mt-1">{row.conversions}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Lab commission</dt>
                  <dd className="mt-1">{labCommission(row.commissionCents)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 ? (
        <table className="hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="recent-orders-title">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[32%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Period</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Referral ID</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Conversions</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Lab commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.period}:${row.code}`} className="border-t border-rose/60">
                <td className="break-words px-4 py-5 align-top">{formatPayoutMonth(row.period)}</td>
                <td className="break-all px-4 py-5 align-top">{row.code}</td>
                <td className="px-4 py-5 align-top">{row.conversions}</td>
                <td className="px-4 py-5 align-top">{labCommission(row.commissionCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
