import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/affiliate/format";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { conversionLabel, dailyAffiliateStats, earningsPerClickCents } from "@/lib/affiliate/stats";
import { AffiliateStoreError, loadAffiliateActivity } from "@/lib/affiliate/store";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const columns = ["Date", "Visits", "Referring page", "Landing page", "Orders", "Conversion", "Earnings per click"] as const;

function formatStatDay(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function Pages({ pages }: { pages: string[] }) {
  if (pages.length === 0) return "—";
  return (
    <ul>
      {pages.map((page) => (
        <li key={page} className="break-all">
          {page}
        </li>
      ))}
    </ul>
  );
}

export default async function AffiliateStatsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let loadError = "";
  let rows = dailyAffiliateStats([], []);
  try {
    await syncAttributedGenHealthSales();
    const activity = await loadAffiliateActivity(affiliate.code);
    rows = dailyAffiliateStats(activity.clicks, activity.conversions);
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load your stats.";
  }

  if (loadError) return <p className="text-ink">{loadError}</p>;

  return (
    <section className="min-w-0 rounded-[28px] bg-white" aria-labelledby="portal-stats-title">
      <h2 id="portal-stats-title" className="px-4 pt-4 text-2xl sm:px-6">
        Stats
      </h2>
      {rows.length === 0 ? <p className="px-4 py-6 text-sm text-brown sm:px-6">No visits or paid orders yet.</p> : null}
      {rows.length > 0 ? (
        <ul className="xl:hidden" aria-labelledby="portal-stats-title">
          {rows.map((row) => {
            const perClick = earningsPerClickCents(row.commissionCents, row.visits);
            return (
              <li key={row.date} className="border-t border-rose/60 px-4 py-5 text-sm sm:px-6">
                <p className="font-medium">{formatStatDay(row.date)}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 leading-6">
                  <div>
                    <dt className="text-xs text-brown">Visits</dt>
                    <dd className="mt-1">{row.visits}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Orders</dt>
                    <dd className="mt-1">{row.orders}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Conversion</dt>
                    <dd className="mt-1">{conversionLabel(row.orders, row.visits)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Earnings per click</dt>
                    <dd className="mt-1">{perClick == null ? "—" : formatCents(perClick)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-brown">Referring page</dt>
                    <dd className="mt-1"><Pages pages={row.referringPages} /></dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-brown">Landing page</dt>
                    <dd className="mt-1"><Pages pages={row.landingPages} /></dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      ) : null}
      {rows.length > 0 ? (
        <table className="mt-4 hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="bg-background text-brown">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const perClick = earningsPerClickCents(row.commissionCents, row.visits);
              return (
                <tr key={row.date} className="border-t border-rose/60">
                  <td className="px-3 py-4 align-top">{formatStatDay(row.date)}</td>
                  <td className="px-3 py-4 align-top">{row.visits}</td>
                  <td className="px-3 py-4 align-top"><Pages pages={row.referringPages} /></td>
                  <td className="px-3 py-4 align-top"><Pages pages={row.landingPages} /></td>
                  <td className="px-3 py-4 align-top">{row.orders}</td>
                  <td className="px-3 py-4 align-top">{conversionLabel(row.orders, row.visits)}</td>
                  <td className="px-3 py-4 align-top">{perClick == null ? "—" : formatCents(perClick)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
