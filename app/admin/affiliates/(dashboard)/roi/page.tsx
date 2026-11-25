import type { Metadata } from "next";
import Link from "next/link";
import { saveMarketingCostAction } from "@/app/admin/affiliates/actions";
import { ADMIN_ERRORS } from "@/app/admin/affiliates/messages";
import { FilterDatePicker } from "@/components/affiliate/FilterDatePicker";
import { FilterDropdown } from "@/components/affiliate/FilterDropdown";
import { CampaignAffiliateRank } from "@/components/affiliate/CampaignAffiliateRank";
import { chartRowsFor, RoiCampaignChart } from "@/components/affiliate/RoiCampaignChart";
import { formatCents } from "@/lib/affiliate/format";
import { listAffiliateChoices } from "@/lib/affiliate/marketing-store";
import { campaignAffiliateRanks, campaignSocialTotals, ordersWithinCampaignPeriod, roiRange, type CampaignRankOrder, type CampaignRankPost, type CampaignSocialPost, type CampaignWindow, type RoiRange, type RoiReport, type RoiRow } from "@/lib/affiliate/roi";
import { memo } from "@/lib/affiliate/memo";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { loadCampaignOrders, loadMarketingCampaignRecords, loadRoiReport, RoiStoreError } from "@/lib/affiliate/roi-store";

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

function published(post: ContentSubmission) {
  return post.contentStatus === "approved" && (post.publicationStatus === "tracking_active" || Boolean(post.postUrl));
}

function socialPost(post: ContentSubmission): CampaignSocialPost {
  const day = (post.publishedAt || post.createdAt || "").slice(0, 10);
  return {
    campaign: post.campaign,
    postedOn: day || null,
    views: post.views ?? 0,
    engagements: (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0) + (post.saves ?? 0),
  };
}

function rankPost(post: ContentSubmission): CampaignRankPost {
  return { code: post.code, ...socialPost(post) };
}

function withPeriodOrders<T extends RoiRow>(rows: T[], counts: Map<string, number>): T[] {
  return rows.map((row) => ({ ...row, orders: counts.get(row.campaign.toLowerCase()) ?? 0 }));
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
  let campaigns: string[] = [];
  let socialPosts: CampaignSocialPost[] = [];
  let rankPosts: CampaignRankPost[] = [];
  let orders: CampaignRankOrder[] = [];
  let names = new Map<string, string>();
  let windows: CampaignWindow[] = [];
  let loadError = "";
  try {
    const [loadedReport, records, submissions, loadedOrders, affiliates] = await Promise.all([
      memo(`roi:${range}`, () => loadRoiReport(range)),
      memo("marketing-campaign-records", () => loadMarketingCampaignRecords()),
      memo("submissions:all", () => loadContentSubmissions()).catch(() => [] as ContentSubmission[]),
      memo("roi-orders", () => loadCampaignOrders()).catch(() => [] as CampaignRankOrder[]),
      memo("affiliate-choices", () => listAffiliateChoices()).catch(() => []),
    ]);
    report = loadedReport;
    const liveCampaigns = records.filter((record) => record.status !== "draft");
    campaigns = liveCampaigns.map((record) => record.name);
    windows = liveCampaigns.map((record) => ({ name: record.name, startsOn: record.startsOn, endsOn: record.endsOn }));
    const livePosts = submissions.filter(published);
    socialPosts = livePosts.map(socialPost);
    rankPosts = livePosts.map(rankPost);
    orders = loadedOrders;
    names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  } catch (caught) {
    loadError = caught instanceof RoiStoreError ? caught.message : "Could not load campaign ROI.";
  }
  const periodOrders = ordersWithinCampaignPeriod(orders, windows, range);
  const tableRows = withPeriodOrders(report.rows, periodOrders);
  const chartRows = withPeriodOrders(chartRowsFor(report.rows, campaignSocialTotals(socialPosts, range)), periodOrders);
  const ranks = campaignAffiliateRanks({ posts: rankPosts, orders, names, windows, range });

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

      <RoiCampaignChart rows={chartRows} costCents={report.costCents} revenueCents={report.revenueCents} profitCents={report.profitCents} />

      <CampaignAffiliateRank boards={ranks} />

      <form action={saveMarketingCostAction} className="rounded-[28px] bg-white p-4 sm:p-6">
        <h3 className="text-xl">Add a marketing cost</h3>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Record what the company spent on a campaign. The amount is added to that campaign&apos;s cost and is not an affiliate payout.
        </p>
        <input type="hidden" name="range" value={range} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm text-brown">
            Campaign
            {campaigns.length === 0 ? (
              <span className={`${fieldClass} mt-2 flex items-center text-brown`}>
                <Link href="/admin/affiliates/campaigns/new" className="font-medium text-ink underline underline-offset-4">
                  Create a campaign
                </Link>
                <span className="ml-1">first.</span>
              </span>
            ) : (
              <FilterDropdown
                variant="field"
                className="mt-2"
                label="Campaign"
                name="campaign"
                required
                placeholder="Choose a campaign"
                options={campaigns.map((name) => ({ value: name, label: name }))}
              />
            )}
          </label>
          <label className="block text-sm text-brown">
            Amount
            <input name="amount" required inputMode="decimal" autoComplete="off" placeholder="500.00" className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-brown">
            Date spent
            <span className="mt-2 flex">
              <FilterDatePicker variant="field" label="Date spent" placeholder="Choose a date" name="spentOn" required defaultValue={spentOn} />
            </span>
          </label>
          <div className="flex items-end">
            <button type="submit" className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`} disabled={campaigns.length === 0}>
              Save cost
            </button>
          </div>
        </div>
      </form>

      <div className="min-w-0 rounded-[28px] bg-white">
        <h3 id="roi-table-title" className="px-4 pt-4 text-xl">
          Campaigns
        </h3>
        <p className="px-4 pt-2 text-sm text-brown">Orders are sales placed during that campaign&apos;s dates. A campaign without dates uses this range.</p>
        {tableRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">No campaigns yet.</p>
        ) : (
          <ul className="xl:hidden" aria-labelledby="roi-table-title">
            {tableRows.map((row) => (
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
        {tableRows.length > 0 ? (
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
              {tableRows.map((row) => (
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
