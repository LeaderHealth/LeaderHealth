import type { Metadata } from "next";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { formatCents } from "@/lib/affiliate/format";
import { adminOrderDetails, type AdminOrderSource } from "@/lib/affiliate/order-view";
import { formatPayoutMonth } from "@/lib/affiliate/payouts";
import { AffiliateStoreError, loadAffiliateOverview } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodSource(conversion: {
  code: string;
  orderId: string;
  productName: string;
  promoCode: string | null;
  dryRun: boolean;
  amountCents: number | null;
  refundedAmountCents: number;
  commissionCents: number;
  commissionRefundedCents: number;
  createdAt: string | null;
  orderKind: "lab" | "treatment";
}): AdminOrderSource {
  return {
    code: conversion.code,
    orderId: conversion.orderId,
    productName: conversion.productName,
    promoCode: conversion.promoCode,
    dryRun: conversion.dryRun,
    amountCents: conversion.amountCents,
    refundedAmountCents: conversion.refundedAmountCents,
    commissionCents: conversion.commissionCents,
    commissionRefundedCents: conversion.commissionRefundedCents,
    createdAt: conversion.createdAt,
    orderKind: conversion.orderKind,
  };
}

function orderDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function labCommission(cents: number, kind: "lab" | "treatment") {
  if (!LAB_COMMISSIONS_ENABLED) return "Not active";
  if (kind !== "lab") return "—";
  return formatCents(cents);
}

export default async function AffiliateOrdersPage() {
  let sources: AdminOrderSource[] = [];
  let names = new Map<string, string>();
  let loadError = "";
  try {
    const overview = await loadAffiliateOverview();
    sources = overview.conversions.map(periodSource);
    names = new Map(overview.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
  }
  const orders = adminOrderDetails(sources);

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="recent-orders-title" className="px-4 pt-4 text-2xl">
        Orders
      </h2>
      <p className="px-4 pt-2 text-sm text-brown">Each paid order, with its date, product, sale, and order id. {LAB_COMMISSIONS_ENABLED ? "Lab commission applies to lab orders." : "Lab commission is not active."}</p>
      {orders.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No paid orders yet.</p>
      ) : (
        <table className="w-full table-fixed border-collapse text-left text-sm leading-6" aria-labelledby="recent-orders-title">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[13%]" />
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Date</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Affiliate</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Product</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Type</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Sale</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Commission</th>
              <th scope="col" className="px-3 py-4 align-bottom font-medium">Order ID</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId} className="border-t border-rose/60">
                <td className="px-3 py-4 align-top">
                  <div>{orderDate(order.createdAt)}</div>
                  <div className="text-xs text-brown">{formatPayoutMonth(order.period)}</div>
                </td>
                <td className="px-3 py-4 align-top break-words">
                  <div>{names.get(order.code) || order.code}</div>
                  <div className="text-xs text-brown">{order.code}</div>
                </td>
                <td className="px-3 py-4 align-top break-words">
                  <div>{order.productName}</div>
                  {order.promoCode ? <div className="text-xs text-brown">Promo {order.promoCode}</div> : null}
                </td>
                <td className="px-3 py-4 align-top">{order.orderKind === "lab" ? "Lab" : "Treatment"}</td>
                <td className="px-3 py-4 align-top">{formatCents(order.saleCents)}</td>
                <td className="px-3 py-4 align-top">{labCommission(order.commissionCents, order.orderKind)}</td>
                <td className="px-3 py-4 align-top break-all text-xs leading-5">{order.orderId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
