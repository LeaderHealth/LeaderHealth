import type { Metadata } from "next";
import Link from "next/link";
import { ManageAffiliate } from "@/components/affiliate/ManageAffiliate";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { deliverableLines, loadDeliverablePayments, marketingTotals } from "@/lib/affiliate/deliverable-payments";
import { formatCents } from "@/lib/affiliate/format";
import { loadMarketingEvents, loadWebsitePayouts } from "@/lib/affiliate/marketing-events";
import { socialMonthCents, websiteMonthAmount, type PaymentRates } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { listOpenApplications } from "@/lib/affiliate/applications";
import { memo } from "@/lib/affiliate/memo";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { agreementMonthEarning } from "@/lib/affiliate/agreement-earnings";
import { loadAgreementPayouts } from "@/lib/affiliate/agreement-payouts";
import { loadAffiliateAgreements } from "@/lib/affiliate/agreements";
import { visibleReportSections } from "@/lib/affiliate/marketing";
import { loadMarketingReports, type MarketingReport } from "@/lib/affiliate/marketing-store";
import { loadSocialAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";
import { loadWebsiteEvents, websiteReportMonths, type WebsiteOrder, type WebsiteVisit } from "@/lib/affiliate/website-report";
import { currentPayoutPeriod, formatPayoutMonth, loadPayoutRecords, paidOutInRange, payoutLines, previousPayoutPeriod, type PayoutRecord } from "@/lib/affiliate/payouts";
import { periodReferralSummaries } from "@/lib/affiliate/order-view";
import { adjustedCommissionCents, remainingSalesCents } from "@/lib/affiliate/refunds";
import { AffiliateStoreError, loadAffiliateOverview, loadClickTimes, type AffiliateSummary, type ConversionSummary } from "@/lib/affiliate/store";
import { listPromoCodes, promoCodesForAffiliate, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

export const metadata: Metadata = {
  title: "Affiliate overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "30" | "90" | "all";
type StatusFilter = "all" | "active" | "inactive" | "sales";

const ranges: { id: Range; label: string }[] = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
];

const statuses: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "sales", label: "With sales" },
];

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const fieldClass =
  "min-h-11 w-full min-w-0 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function rangeOf(value: string | undefined): Range {
  if (value === "30" || value === "90") return value;
  return "all";
}

function statusOf(value: string | undefined): StatusFilter {
  if (value === "active" || value === "inactive" || value === "sales") return value;
  return "all";
}

function searchOf(value: string | undefined) {
  const query = (value ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
  return query;
}

function overviewHref(range: Range, status: StatusFilter, query: string) {
  const params = new URLSearchParams();
  if (range !== "all") params.set("range", range);
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/admin/affiliates/overview?${search}` : "/admin/affiliates/overview";
}

function inRange(createdAt: string | null, range: Range) {
  if (range === "all") return true;
  if (!createdAt) return false;
  const days = range === "30" ? 30 : 90;
  return new Date(createdAt).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function netCommission(conversion: ConversionSummary) {
  if (conversion.orderKind !== "lab") return 0;
  return adjustedCommissionCents(conversion.commissionCents, conversion.commissionRefundedCents);
}

function paidInRange(conversions: ConversionSummary[], range: Range) {
  return conversions.filter((conversion) => !conversion.dryRun && inRange(conversion.createdAt, range));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`;
  return (letters || name.slice(0, 1) || "?").toUpperCase();
}

function promoLabel(count: number | null) {
  if (count == null) return "";
  if (count === 0) return "No promo codes";
  return `${count} promo ${count === 1 ? "code" : "codes"}`;
}

export default async function AffiliateOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; status?: string; q?: string }>;
}) {
  const query = await searchParams;
  const actor = await adminSessionActor();
  const canInvite = Boolean(actor && adminHasFullAccess(actor));
  const range = rangeOf(query.range);
  const status = statusOf(query.status);
  const search = searchOf(query.q);

  const currentPeriod = currentPayoutPeriod();
  const priorPeriod = previousPayoutPeriod(currentPeriod) ?? currentPeriod;
  const [core, postsBundle, catalog, reportsBundle, applications, websiteBundle, agreementBundle] = await Promise.all([
    Promise.all([
      memo("admin-overview", () => loadAffiliateOverview()),
      memo("click-times", () => loadClickTimes()),
      memo("payout-records:all", () => loadPayoutRecords()),
    ]).then(
      (value) => ({ ok: true as const, value }),
      (caught: unknown) => ({ ok: false as const, caught }),
    ),
    Promise.all([
      memo("submissions:all", () => loadContentSubmissions()),
      memo("payments:all", () => loadDeliverablePayments()),
    ]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    memo("promo-codes", () => listPromoCodes()).then(
      (value) => value,
      () => null as PromoCodeRow[] | null,
    ),
    Promise.all([
      memo("marketing-reports", () => loadMarketingReports()),
      memo("social-accounts", () => loadSocialAccounts()),
      memo("website-events", () => loadWebsiteEvents()),
    ]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    canInvite
      ? memo("open-applications", () => listOpenApplications()).then(
          (rows) => ({ unavailable: false, count: rows.length as number | null }),
          () => ({ unavailable: true, count: null as number | null }),
        )
      : Promise.resolve({ unavailable: false, count: null as number | null }),
    Promise.all([
      memo("payment-rates", () => loadPaymentRates()),
      memo(`marketing-events:${priorPeriod}`, () => loadMarketingEvents({ period: priorPeriod })),
      priorPeriod === currentPeriod ? Promise.resolve([]) : memo(`marketing-events:${currentPeriod}`, () => loadMarketingEvents({ period: currentPeriod })),
      memo(`website-payouts-period:${priorPeriod}`, () => loadWebsitePayouts(priorPeriod)),
      priorPeriod === currentPeriod ? Promise.resolve([]) : memo(`website-payouts-period:${currentPeriod}`, () => loadWebsitePayouts(currentPeriod)),
    ]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    Promise.all([
      memo("agreements:all", () => loadAffiliateAgreements()),
      memo(`agreement-payouts-period:${priorPeriod}`, () => loadAgreementPayouts(priorPeriod)),
      priorPeriod === currentPeriod ? Promise.resolve([]) : memo(`agreement-payouts-period:${currentPeriod}`, () => loadAgreementPayouts(currentPeriod)),
    ]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
  ]);

  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let clickTimes: string[] = [];
  let payouts: PayoutRecord[] = [];
  let loadError = "";
  if (core.ok) {
    affiliates = core.value[0].affiliates;
    conversions = core.value[0].conversions;
    clickTimes = core.value[1];
    payouts = core.value[2];
  } else {
    loadError = core.caught instanceof AffiliateStoreError ? core.caught.message : "Could not load affiliate records.";
  }

  let marketing = { pendingCents: 0, heldCents: 0, approvedCents: 0, paidCents: 0 };
  let reviewCount: number | null = null;
  let marketingApprovalCount = 0;
  const marketingByCode = new Map<string, { pendingCents: number; approvedCents: number; paidCents: number }>();
  let contentPosts: Awaited<ReturnType<typeof loadContentSubmissions>> = [];
  let deliverablePayments: Awaited<ReturnType<typeof loadDeliverablePayments>> = [];
  let postsReady = false;
  if (postsBundle.ok) {
    const [posts, payments] = postsBundle.value;
    contentPosts = posts;
    deliverablePayments = payments;
    postsReady = true;
    reviewCount = posts.filter((post) => post.contentStatus === "submitted").length;
    const lines = deliverableLines({ affiliates, posts, payments });
    marketingApprovalCount = lines.filter((line) => line.status === "pending").length;
    marketing = marketingTotals(lines);
    for (const affiliate of affiliates) {
      marketingByCode.set(affiliate.code, marketingTotals(lines.filter((line) => line.code === affiliate.code)));
    }
  }

  let marketingReports: MarketingReport[] = [];
  let socialAccounts: SocialAccountView[] = [];
  let websiteVisits: WebsiteVisit[] = [];
  let websiteOrders: WebsiteOrder[] = [];
  let reportsUnavailable = false;
  if (reportsBundle.ok) {
    const [saved, connected, website] = reportsBundle.value;
    marketingReports = saved;
    socialAccounts = connected;
    websiteVisits = website.visits;
    websiteOrders = website.orders;
  } else {
    reportsUnavailable = true;
  }
  const reportSections = visibleReportSections(marketingReports, socialAccounts);
  const applicationCount = applications.count;
  const applicationsUnavailable = applications.unavailable;
  let contentRates: PaymentRates | null = null;
  let marketingEvents: Awaited<ReturnType<typeof loadMarketingEvents>> = [];
  let websiteSnapshots: Awaited<ReturnType<typeof loadWebsitePayouts>> = [];
  let websiteReady = false;
  if (websiteBundle.ok) {
    const [rates, priorEvents, currentEvents, priorPayouts, currentPayouts] = websiteBundle.value;
    contentRates = rates;
    marketingEvents = [...priorEvents, ...currentEvents];
    websiteSnapshots = [...priorPayouts, ...currentPayouts];
    websiteReady = true;
  }
  let agreements: Awaited<ReturnType<typeof loadAffiliateAgreements>> = [];
  let agreementPayouts: Awaited<ReturnType<typeof loadAgreementPayouts>> = [];
  if (agreementBundle.ok) {
    const [loadedAgreements, priorAgreementPayouts, currentAgreementPayouts] = agreementBundle.value;
    agreements = loadedAgreements;
    agreementPayouts = [...priorAgreementPayouts, ...currentAgreementPayouts];
  }
  const labLines = loadError ? [] : payoutLines({ affiliates, orders: conversions, payouts });
  const payoutApprovalCount = loadError ? null : labLines.filter((line) => line.status === "pending").length;
  const payoutsWaiting =
    payoutApprovalCount == null && reviewCount == null ? null : (payoutApprovalCount ?? 0) + marketingApprovalCount;

  const queues = [
    ...(canInvite
      ? [
          {
            href: "/admin/affiliates/applications",
            label: "Pending applications",
            value: applicationsUnavailable || applicationCount == null ? "—" : String(applicationCount),
            detail: applicationsUnavailable ? "Unavailable right now" : "Waiting for approval",
          },
        ]
      : []),
    {
      href: "/admin/affiliates/posts/pending",
      label: "Posts waiting for review",
      value: reviewCount == null ? "—" : String(reviewCount),
      detail: reviewCount == null ? "Unavailable right now" : "Submitted content",
    },
    {
      href: "/admin/affiliates/payouts",
      label: "Payouts waiting for approval",
      value: payoutsWaiting == null ? "—" : String(payoutsWaiting),
      detail: payoutsWaiting == null ? "Unavailable right now" : "Marketing payments and lab payouts",
    },
  ];

  const paid = paidInRange(conversions, range);
  const byCode = new Map<string, { orders: number; salesCents: number; commissionCents: number }>();
  for (const affiliate of affiliates) byCode.set(affiliate.code, { orders: 0, salesCents: 0, commissionCents: 0 });
  for (const conversion of paid) {
    const current = byCode.get(conversion.code) ?? { orders: 0, salesCents: 0, commissionCents: 0 };
    const remaining = remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents);
    if (remaining > 0) current.orders += 1;
    current.salesCents += remaining;
    current.commissionCents += netCommission(conversion);
    byCode.set(conversion.code, current);
  }

  const paidOrderCount = paid.filter((conversion) => remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0).length;
  const commissionCents = paid.reduce((sum, conversion) => sum + netCommission(conversion), 0);
  const paidOutCents = paidOutInRange(payouts, range);
  const unpaidCents =
    conversions.filter((conversion) => !conversion.dryRun).reduce((sum, conversion) => sum + netCommission(conversion), 0) -
    paidOutInRange(payouts, "all");
  const activeCount = affiliates.filter((affiliate) => affiliate.active).length;
  const inactiveCount = affiliates.length - activeCount;
  const sellers = affiliates.filter((affiliate) => (byCode.get(affiliate.code)?.orders ?? 0) > 0).length;

  const ranked = [...affiliates]
    .map((affiliate) => ({ affiliate, stats: byCode.get(affiliate.code) ?? { orders: 0, salesCents: 0, commissionCents: 0 } }))
    .filter((row) => row.stats.orders > 0)
    .sort((left, right) => right.stats.orders - left.stats.orders || left.affiliate.name.localeCompare(right.affiliate.name));
  const top = ranked.slice(0, 5);
  const topOrders = top[0]?.stats.orders ?? 0;

  const recent = periodReferralSummaries(
    paid.map((conversion) => ({
      code: conversion.code,
      dryRun: conversion.dryRun,
      amountCents: conversion.amountCents,
      refundedAmountCents: conversion.refundedAmountCents,
      commissionCents: conversion.commissionCents,
      commissionRefundedCents: conversion.commissionRefundedCents,
      createdAt: conversion.createdAt,
      orderKind: conversion.orderKind,
    })),
  );
  const newAffiliateCount = affiliates.filter((affiliate) => inRange(affiliate.createdAt, range)).length;
  const visitorCount = clickTimes.filter((createdAt) => inRange(createdAt, range)).length;

  const needle = search.toLowerCase();
  const visible = affiliates
    .filter((affiliate) => {
      const stats = byCode.get(affiliate.code);
      if (status === "active" && !affiliate.active) return false;
      if (status === "inactive" && affiliate.active) return false;
      if (status === "sales" && (stats?.orders ?? 0) === 0) return false;
      if (!needle) return true;
      return [affiliate.name, affiliate.email, affiliate.code].some((value) => value.toLowerCase().includes(needle));
    })
    .sort((left, right) => (byCode.get(right.code)?.orders ?? 0) - (byCode.get(left.code)?.orders ?? 0) || left.name.localeCompare(right.name));

  function manageReports(code: string) {
    return {
      unavailable: reportsUnavailable,
      months: websiteReportMonths({ code, visits: websiteVisits, orders: websiteOrders }),
      sections: reportSections.filter((section) => section.code === code),
      promos: catalog ? promoRowsForAffiliate(catalog, code).map((promo) => ({ code: promo.code, status: promo.statusLabel })) : [],
    };
  }

  function monthPay(code: string, period: string) {
    const socialMonth = socialMonthCents({
      period,
      posts: contentPosts.filter((post) => post.code === code),
      payments: deliverablePayments.filter((payment) => payment.code === code),
    });
    const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
    const labCents = labLines.filter((line) => line.code === code && line.period === period).reduce((sum, line) => sum + line.earnedCents, 0);
    const monthly = agreementMonthEarning({
      agreements,
      posts: contentPosts,
      code,
      period,
      snapshot: agreementPayouts.find((row) => row.code === code && row.period === period) ?? null,
    });
    return {
      label: formatPayoutMonth(period),
      social: postsReady ? formatCents(socialMonth.socialCents + socialMonth.adjustmentCents + monthly.earnedCents) : "—",
      website:
        websiteReady && contentRates
          ? formatCents(websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents)
          : "—",
      lab: !LAB_COMMISSIONS_ENABLED ? "Not active" : loadError ? "—" : formatCents(labCents),
    };
  }

  function manageMonths(code: string) {
    return {
      prior: monthPay(code, priorPeriod),
      current: monthPay(code, currentPeriod),
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">Overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            Conversions, marketing payments, and lab commission. Sale amounts, product names, and order ids stay off this dashboard.
            {LAB_COMMISSIONS_ENABLED ? "" : " Lab commission is not active."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
            {ranges.map((item) => (
              <Link
                key={item.id}
                href={overviewHref(item.id, status, search)}
                aria-current={range === item.id ? "true" : undefined}
                className={`${pillClass} ${range === item.id ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {canInvite ? (
            <Link href="/admin/affiliates/add-an-affiliate" className={`${pillClass} bg-ink text-white hover:bg-brown`}>
              Add an affiliate
            </Link>
          ) : null}
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <section aria-label="Queues" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {queues.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-[28px] bg-white p-6 hover:bg-background">
            <h3 className="text-sm text-brown">{item.label}</h3>
            <p className="mt-2 text-3xl">{item.value}</p>
            <p className="mt-2 text-sm text-brown">{item.detail}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Paid orders</h3>
          <p className="mt-2 text-3xl">{paidOrderCount}</p>
          <p className="mt-2 text-sm text-brown">Conversions in this period</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Active affiliates</h3>
          <p className="mt-2 text-3xl">
            {activeCount} <span className="text-lg text-brown">of {affiliates.length}</span>
          </p>
          <p className="mt-2 text-sm text-brown">
            {inactiveCount} inactive · {sellers === 1 ? "1 has made a sale" : `${sellers} have made a sale`}
          </p>
        </section>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6" aria-labelledby="admin-earnings-title">
          <h3 id="admin-earnings-title" className="sr-only">
            Earnings
          </h3>
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-rose/60">
            <div className="sm:pr-8">
              <h4 className="text-sm text-brown">Marketing earned</h4>
              <p className="mt-2 text-3xl">{formatCents(marketing.pendingCents)}</p>
              <p className="mt-2 text-sm text-brown">
                Approved {formatCents(marketing.approvedCents)} · On hold {formatCents(marketing.heldCents)} · Paid {formatCents(marketing.paidCents)}
              </p>
            </div>
            <div className="mt-6 border-t border-rose/60 pt-6 sm:mt-0 sm:border-0 sm:pt-0 sm:pl-8">
              <h4 className="text-sm text-brown">Lab commission</h4>
              <p className="mt-2 text-3xl">{LAB_COMMISSIONS_ENABLED ? formatCents(commissionCents) : "Not active"}</p>
              <p className="mt-2 text-sm text-brown">
                {LAB_COMMISSIONS_ENABLED ? `Unpaid ${formatCents(unpaidCents)}. Paid out ${formatCents(paidOutCents)} in this period.` : "Past commission payouts stay on the Payouts page."}
              </p>
            </div>
          </div>
          <p className="mt-6 border-t border-rose/60 pt-4 text-sm text-brown">Pay-period conversion counts are on the Orders page.</p>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[28px] bg-white px-6 py-4" aria-labelledby="new-affiliates-title">
            <h3 id="new-affiliates-title" className="text-sm text-brown">
              New affiliates
            </h3>
            <p className="mt-1 text-3xl">{newAffiliateCount}</p>
            <p className="mt-1 text-sm text-brown">Registered in this period</p>
          </section>
          <section className="rounded-[28px] bg-white px-6 py-4" aria-labelledby="total-visitors-title">
            <h3 id="total-visitors-title" className="text-sm text-brown">
              Visits
            </h3>
            <p className="mt-1 text-3xl">{visitorCount}</p>
            <p className="mt-1 text-sm text-brown">Each person counts once a day in this period</p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="top-affiliates-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="top-affiliates-title" className="text-xl">
              Top affiliates
            </h3>
            <p className="text-sm text-brown">By conversions</p>
          </div>
          {top.length === 0 ? (
            <p className="mt-6 text-sm text-brown">No conversions in this period.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {top.map((row, index) => (
                <li key={row.affiliate.code} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="text-sm text-brown">{index + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{row.affiliate.name}</div>
                    <div className="mt-2 h-2 rounded-full bg-background" aria-hidden="true">
                      <div
                        className="h-2 rounded-full bg-rose"
                        style={{ width: `${topOrders === 0 ? 0 : Math.max(8, Math.round((row.stats.orders / topOrders) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{row.stats.orders === 1 ? "1 conversion" : `${row.stats.orders} conversions`}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="recent-orders-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="recent-orders-title" className="text-xl">
              Recent orders
            </h3>
            <Link href="/admin/affiliates/orders" className="text-sm font-medium text-ink underline underline-offset-4">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-brown">No paid orders in this period.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rose/60">
              {recent.map((row) => (
                <li key={`${row.period}:${row.code}`} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="break-words font-medium">{formatPayoutMonth(row.period)}</div>
                    <p className="mt-1 break-all text-brown">{row.code}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {LAB_COMMISSIONS_ENABLED ? <p className="font-medium">{formatCents(row.commissionCents)}</p> : null}
                    <p className="text-brown">{row.conversions === 1 ? "1 conversion" : `${row.conversions} conversions`}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="min-w-0 rounded-[28px] bg-white" aria-labelledby="all-affiliates-title">
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 pt-4 sm:px-6">
          <div>
            <h3 id="all-affiliates-title" className="text-xl">
              All affiliates
            </h3>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Affiliate status">
              {statuses.map((item) => (
                <Link
                  key={item.id}
                  href={overviewHref(range, item.id, search)}
                  aria-current={status === item.id ? "true" : undefined}
                  className={`${pillClass} ${status === item.id ? "bg-ink text-white" : "text-ink hover:bg-background"}`}
                >
                  {item.label}
                  {item.id === "all" ? ` ${affiliates.length}` : ""}
                  {item.id === "active" ? ` ${activeCount}` : ""}
                </Link>
              ))}
            </div>
          </div>
          <form action="/admin/affiliates/overview" className="w-full sm:max-w-xs">
            {range !== "all" ? <input type="hidden" name="range" value={range} /> : null}
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
            <label className="block text-sm text-brown" htmlFor="affiliate-overview-search">
              Search
              <input
                id="affiliate-overview-search"
                name="q"
                defaultValue={search}
                placeholder="Name, email, or ID"
                className={`${fieldClass} mt-2`}
              />
            </label>
          </form>
        </div>

        {visible.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown sm:px-6">No affiliates match.</p>
        ) : (
          <ul className="mt-2 xl:hidden" aria-labelledby="all-affiliates-title">
            {visible.map((affiliate) => {
              const stats = byCode.get(affiliate.code) ?? { orders: 0, salesCents: 0, commissionCents: 0 };
              const promos = promoLabel(catalog ? promoCodesForAffiliate(catalog, affiliate.code).length : null);
              return (
                <li key={affiliate.code} className="border-t border-ink/10 px-4 py-5 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose text-xs font-medium text-ink">
                        {initials(affiliate.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium">{affiliate.name}</div>
                        <div className="mt-1 break-all text-sm text-brown">{affiliate.email}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        affiliate.active ? "bg-rose text-ink" : "border border-ink/30 text-brown"
                      }`}
                    >
                      {affiliate.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
                    <div>
                      <dt className="text-xs text-brown">Affiliate ID</dt>
                      <dd className="mt-1 break-all">{affiliate.code}</dd>
                      {promos ? <dd className="text-brown">{promos}</dd> : null}
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Paid orders</dt>
                      <dd className="mt-1">{stats.orders}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-brown">Marketing earned</dt>
                      <dd className="mt-1">{formatCents(marketingByCode.get(affiliate.code)?.pendingCents ?? 0)}</dd>
                    </div>
                  </dl>
                  <ManageAffiliate
                    name={affiliate.name}
                    email={affiliate.email}
                    {...manageMonths(affiliate.code)}
                    reports={manageReports(affiliate.code)}
                    className="mt-5 inline-flex font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                </li>
              );
            })}
          </ul>
        )}

        {visible.length > 0 ? (
          <table className="mt-4 hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="all-affiliates-title">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="text-brown">
              <tr>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Affiliate</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Affiliate ID</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid orders</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Marketing earned</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Status</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">
                  <span className="sr-only">Manage</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((affiliate) => {
                const stats = byCode.get(affiliate.code) ?? { orders: 0, salesCents: 0, commissionCents: 0 };
                const promos = promoLabel(catalog ? promoCodesForAffiliate(catalog, affiliate.code).length : null);
                return (
                  <tr key={affiliate.code} className="border-t border-rose/60">
                    <td className="px-4 py-5 align-top">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose text-xs font-medium text-ink">
                          {initials(affiliate.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium">{affiliate.name}</div>
                          <div className="mt-1 break-all text-brown">{affiliate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <div className="break-all">{affiliate.code}</div>
                      {promos ? <div className="text-brown">{promos}</div> : null}
                    </td>
                    <td className="px-4 py-5 align-top">{stats.orders}</td>
                    <td className="px-4 py-5 align-top">{formatCents(marketingByCode.get(affiliate.code)?.pendingCents ?? 0)}</td>
                    <td className="px-4 py-5 align-top">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          affiliate.active ? "bg-rose text-ink" : "border border-ink/30 text-brown"
                        }`}
                      >
                        {affiliate.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <ManageAffiliate
                        name={affiliate.name}
                        email={affiliate.email}
                        {...manageMonths(affiliate.code)}
                        reports={manageReports(affiliate.code)}
                        className="font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        <p className="px-4 py-4 text-sm text-brown sm:px-6">
          Showing {visible.length} of {affiliates.length} affiliates. Promo codes are edited on each affiliate.
        </p>
      </section>
    </div>
  );
}
