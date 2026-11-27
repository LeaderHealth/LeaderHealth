import type { Metadata } from "next";
import Link from "next/link";
import { loadUnfinishedCheckoutCount, UnfinishedCheckoutsTile } from "@/components/affiliate/UnfinishedCheckoutsTile";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { formatCents } from "@/lib/affiliate/format";
import { adminOrderDetails, type AdminOrderDetail, type AdminOrderSource } from "@/lib/affiliate/order-view";
import { currentPayoutPeriod, formatPayoutMonth, normalizePayoutPeriod } from "@/lib/affiliate/payouts";
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

function shiftMonth(period: string, delta: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function OrderFacts({ order, name }: { order: AdminOrderDetail; name: string }) {
  const facts = [
    ["Date", orderDate(order.createdAt)],
    ["Affiliate", name],
    ["Product", order.productName],
    ["Type", order.orderKind === "lab" ? "Lab" : "Treatment"],
    ["Sale", formatCents(order.saleCents)],
    ["Commission", labCommission(order.commissionCents, order.orderKind)],
    ["Order ID", order.orderId],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {facts.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[12px] font-semibold tracking-wide text-brown uppercase">{label}</dt>
          <dd className={`text-sm ${label === "Order ID" ? "break-all text-xs leading-5" : "break-words"}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AffiliateOrdersPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const query = await searchParams;
  const current = currentPayoutPeriod();
  const month = normalizePayoutPeriod(query.month) ?? current;
  const next = shiftMonth(month, 1);
  let sources: AdminOrderSource[] = [];
  let names = new Map<string, string>();
  let loadError = "";
  const unfinishedCheckouts = await loadUnfinishedCheckoutCount();
  try {
    const overview = await loadAffiliateOverview();
    sources = overview.conversions.map(periodSource);
    names = new Map(overview.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
  }
  const orders = adminOrderDetails(sources).filter((order) => order.period === month);

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3.5">
      <section className="flex min-w-0 flex-col gap-1 rounded-[20px] bg-white px-[18px] py-4">
        <h3 className="text-sm text-[#4A3A37]">Paid orders</h3>
        <p className="text-[28px] tabular-nums">{orders.length.toLocaleString("en-US")}</p>
        <p className="text-[13px] text-[#6B5A57]">{formatPayoutMonth(month)}</p>
      </section>
      <UnfinishedCheckoutsTile count={unfinishedCheckouts} />
    </div>
    <div className="min-w-0 rounded-[28px] bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
        <h2 id="recent-orders-title" className="text-2xl">
          Orders
        </h2>
        <Link href={`/admin/affiliates/orders?month=${shiftMonth(month, -1)}`} className="text-sm text-ink underline">
          Previous month
        </Link>
        {next <= current ? (
          <Link href={`/admin/affiliates/orders?month=${next}`} className="text-sm text-ink underline">
            Next month
          </Link>
        ) : null}
        <span className="text-sm text-brown">{formatPayoutMonth(month)}</span>
      </div>
      <p className="px-4 pt-2 text-sm text-brown">All paid orders for this month. {LAB_COMMISSIONS_ENABLED ? "Lab commission applies to lab orders." : "Lab commission is not active."}</p>
      {orders.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No paid orders this month.</p>
      ) : (
        <>
          <ul className="xl:hidden" aria-labelledby="recent-orders-title">
            {orders.map((order) => (
              <li key={order.orderId} className="border-t border-rose/60 px-4 py-4">
                <OrderFacts order={order} name={names.get(order.code) || order.code} />
                {order.promoCode ? <p className="mt-2 text-xs text-brown">Promo {order.promoCode}</p> : null}
              </li>
            ))}
          </ul>
          <table className="hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="recent-orders-title">
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
        </>
      )}
    </div>
    </div>
  );
}
