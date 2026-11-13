import type { Metadata } from "next";
import Link from "next/link";
import { saveMarketingCostAction } from "@/app/admin/affiliates/actions";
import { ADMIN_ERRORS } from "@/app/admin/affiliates/messages";
import { formatCents } from "@/lib/affiliate/format";
import { roiRange, type RoiRange, type RoiReport } from "@/lib/affiliate/roi";
import { loadRoiReport, RoiStoreError } from "@/lib/affiliate/roi-store";

export const metadata: Metadata = {
  title: "Campaign ROI",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ranges: { id: RoiRange; label: string }[] = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
];

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const fieldClass =
  "min-h-11 w-full min-w-0 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function roiHref(range: RoiRange) {
  return range === "all" ? "/admin/affiliates/roi" : `/admin/affiliates/roi?range=${range}`;
}

function emptyReport(): RoiReport {
  return { rows: [], orders: 0, costCents: 0, revenueCents: 0, profitCents: 0 };
}

export default async function AffiliateRoiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const range = roiRange(query.range);
  const notice = query.notice === "saved" ? "Marketing cost saved." : "";
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const spentOn = new Date().toISOString().slice(0, 10);

  let report = emptyReport();
  let loadError = "";
  try {
    report = await loadRoiReport(range);
  } catch (caught) {
    loadError = caught instanceof RoiStoreError ? caught.message : "Could not load campaign ROI.";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">ROI</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            Campaign cost, sales revenue, and profit. These totals stay inside admin and do not change affiliate pay.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
          {ranges.map((item) => (
            <Link
              key={item.id}
              href={roiHref(item.id)}
              aria-current={range === item.id ? "true" : undefined}
              className={`${pillClass} ${range === item.id ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {notice ? <p className="text-sm text-ink">{notice}</p> : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Cost</h3>
          <p className="mt-2 text-3xl">{formatCents(report.costCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Revenue</h3>
          <p className="mt-2 text-3xl">{formatCents(report.revenueCents)}</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Profit</h3>
          <p className="mt-2 text-3xl">{formatCents(report.profitCents)}</p>
        </section>
      </div>

      <form action={saveMarketingCostAction} className="rounded-[28px] bg-white p-4 sm:p-6">
        <h3 className="text-xl">Add a marketing cost</h3>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Record what the company spent on a campaign. The amount is added to that campaign&apos;s cost and is not an affiliate payout.
        </p>
        <input type="hidden" name="range" value={range} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm text-brown">
            Campaign
            <input name="campaign" required maxLength={80} autoComplete="off" className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-brown">
            Amount
            <input name="amount" required inputMode="decimal" autoComplete="off" placeholder="500.00" className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-brown">
            Date spent
            <input name="spentOn" type="date" required defaultValue={spentOn} className={`${fieldClass} mt-2`} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={buttonClass}>
              Save cost
            </button>
          </div>
        </div>
      </form>

      <div className="min-w-0 rounded-[28px] bg-white">
        <h3 id="roi-table-title" className="px-4 pt-4 text-xl">
          Campaigns
        </h3>
        {report.rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">No campaign sales or costs in this range.</p>
        ) : (
          <ul className="xl:hidden" aria-labelledby="roi-table-title">
            {report.rows.map((row) => (
              <li key={row.campaign} className="border-t border-ink/10 px-4 py-5 text-sm">
                <div className="font-medium">{row.campaign}</div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 leading-6">
                  <div>
                    <dt className="text-xs text-brown">Orders</dt>
                    <dd className="mt-1">{row.orders}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Cost</dt>
                    <dd className="mt-1">{formatCents(row.costCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Revenue</dt>
                    <dd className="mt-1">{formatCents(row.revenueCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brown">Profit</dt>
                    <dd className="mt-1">{formatCents(row.profitCents)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
        {report.rows.length > 0 ? (
          <table className="hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="roi-table-title">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="text-brown">
              <tr>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Campaign</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Orders</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Cost</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Revenue</th>
                <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Profit</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.campaign} className="border-t border-rose/60">
                  <td className="break-words px-4 py-5 align-top font-medium">{row.campaign}</td>
                  <td className="px-4 py-5 align-top">{row.orders}</td>
                  <td className="px-4 py-5 align-top">{formatCents(row.costCents)}</td>
                  <td className="px-4 py-5 align-top">{formatCents(row.revenueCents)}</td>
                  <td className="px-4 py-5 align-top">{formatCents(row.profitCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
