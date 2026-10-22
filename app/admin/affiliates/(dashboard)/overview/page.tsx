import type { Metadata } from "next";
import Link from "next/link";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { loadPayoutRecords, paidOutInRange, type PayoutRecord } from "@/lib/affiliate/payouts";
import { adjustedCommissionCents, refundStatusLabel } from "@/lib/affiliate/refunds";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { AffiliateStoreError, loadAffiliateOverview, loadClickTimes, type AffiliateSummary, type ConversionSummary } from "@/lib/affiliate/store";
import { listPromoCodes, promoCodesForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";

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

function formatDay(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
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
  const range = rangeOf(query.range);
  const status = statusOf(query.status);
  const search = searchOf(query.q);

  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let clickTimes: string[] = [];
  let payouts: PayoutRecord[] = [];
  let loadError = "";
  try {
    await syncAttributedGenHealthSales();
    const overview = await loadAffiliateOverview();
    affiliates = overview.affiliates;
    conversions = overview.conversions;
    clickTimes = await loadClickTimes();
    payouts = await loadPayoutRecords();
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load affiliate records.";
  }

  let catalog: PromoCodeRow[] | null = null;
  try {
    catalog = await listPromoCodes();
  } catch {
    catalog = null;
  }

  const paid = paidInRange(conversions, range);
  const byCode = new Map<string, { orders: number; salesCents: number; commissionCents: number }>();
  for (const affiliate of affiliates) byCode.set(affiliate.code, { orders: 0, salesCents: 0, commissionCents: 0 });
  for (const conversion of paid) {
    const current = byCode.get(conversion.code) ?? { orders: 0, salesCents: 0, commissionCents: 0 };
    current.orders += 1;
    current.salesCents += conversion.amountCents ?? 0;
    current.commissionCents += netCommission(conversion);
    byCode.set(conversion.code, current);
  }

  const salesCents = paid.reduce((sum, conversion) => sum + (conversion.amountCents ?? 0), 0);
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
    .filter((row) => row.stats.salesCents > 0)
    .sort((left, right) => right.stats.salesCents - left.stats.salesCents || left.affiliate.name.localeCompare(right.affiliate.name));
  const top = ranked.slice(0, 5);
  const topSales = top[0]?.stats.salesCents ?? 0;

  const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const recent = [...paid]
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .slice(0, 5);
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
    .sort((left, right) => (byCode.get(right.code)?.salesCents ?? 0) - (byCode.get(left.code)?.salesCents ?? 0) || left.name.localeCompare(right.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">Overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">Sales and commission for every affiliate.</p>
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
          <Link href="/admin/affiliates/add-an-affiliate" className={`${pillClass} bg-ink text-white hover:bg-brown`}>
            Add an affiliate
          </Link>
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Sales</h3>
          <p className="mt-2 text-3xl">{formatCents(salesCents)}</p>
          <p className="mt-2 text-sm text-brown">From paid orders</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Paid orders</h3>
          <p className="mt-2 text-3xl">{paid.length}</p>
          <p className="mt-2 text-sm text-brown">Paid orders in this period</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Active affiliates</h3>
          <p className="mt-2 text-3xl">
            {activeCount} <span className="text-lg text-brown">of {affiliates.length}</span>
          </p>
          <p className="mt-2 text-sm text-brown">
            {inactiveCount} inactive · {sellers} have made a sale
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
              <h4 className="text-sm text-brown">Unpaid earnings</h4>
              <p className="mt-2 text-3xl">{formatCents(unpaidCents)}</p>
              <p className="mt-2 text-sm text-brown">Commission not paid out yet</p>
            </div>
            <div className="mt-6 border-t border-rose/60 pt-6 sm:mt-0 sm:border-0 sm:pt-0 sm:pl-8">
              <h4 className="text-sm text-brown">Total earnings</h4>
              <p className="mt-2 text-3xl">{formatCents(commissionCents)}</p>
              <p className="mt-2 text-sm text-brown">Commission from paid orders</p>
            </div>
          </div>
          <p className="mt-6 border-t border-rose/60 pt-4 text-sm text-brown">
            Paid out {formatCents(paidOutCents)} in this period. A refund can leave unpaid earnings negative until a later sale covers it. Order details are on the Orders page.
          </p>
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
              Total visitors
            </h3>
            <p className="mt-1 text-3xl">{visitorCount}</p>
            <p className="mt-1 text-sm text-brown">Each person counts once a day</p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="top-affiliates-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="top-affiliates-title" className="text-xl">
              Top affiliates
            </h3>
            <p className="text-sm text-brown">By sales</p>
          </div>
          {top.length === 0 ? (
            <p className="mt-6 text-sm text-brown">No sales in this period.</p>
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
                        style={{ width: `${topSales === 0 ? 0 : Math.max(8, Math.round((row.stats.salesCents / topSales) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatCents(row.stats.salesCents)}</span>
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
              {recent.map((conversion) => (
                <li key={conversion.orderId} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{names.get(conversion.code) || conversion.code}</div>
                    <p className="mt-1 break-words text-brown">
                      {formatDay(conversion.createdAt)}
                      {conversion.productName ? ` · ${conversion.productName}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full bg-rose px-3 py-1 text-xs font-medium text-ink">
                      {refundStatusLabel(conversion.refundStatus) || "Paid"}
                    </span>
                    <p className="mt-2 font-medium">{conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}</p>
                    {conversion.refundStatus === "none" ? null : (
                      <p className="text-brown">
                        {formatCents(netCommission(conversion))} adjusted
                        {conversion.refundedAmountCents > 0 ? ` · ${formatCents(conversion.refundedAmountCents)} refunded` : ""}
                        {" · "}
                        {formatCents(conversion.commissionCents)} original
                      </p>
                    )}
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
                      <dt className="text-xs text-brown">Commission rate</dt>
                      <dd className="mt-1">{formatCommissionRate(affiliate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Paid orders</dt>
                      <dd className="mt-1">{stats.orders}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Sales</dt>
                      <dd className="mt-1">{formatCents(stats.salesCents)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-brown">Total earnings</dt>
                      <dd className="mt-1">{formatCents(stats.commissionCents)}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}

        {visible.length > 0 ? (
          <table className="mt-4 hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="all-affiliates-title">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="text-brown">
              <tr>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Affiliate</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Affiliate ID</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Paid orders</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Sales</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Total earnings</th>
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
                      <div className="mt-1 text-brown">{formatCommissionRate(affiliate)}</div>
                      {promos ? <div className="text-brown">{promos}</div> : null}
                    </td>
                    <td className="px-4 py-5 align-top">{stats.orders}</td>
                    <td className="px-4 py-5 align-top">{formatCents(stats.salesCents)}</td>
                    <td className="px-4 py-5 align-top">{formatCents(stats.commissionCents)}</td>
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
                      <Link href="/admin/affiliates/accounts" className="font-medium text-ink underline underline-offset-4">
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        <p className="px-4 py-4 text-sm text-brown sm:px-6">
          Showing {visible.length} of {affiliates.length} affiliates. Promo codes and commission rates are edited on each affiliate.
        </p>
      </section>
    </div>
  );
}
