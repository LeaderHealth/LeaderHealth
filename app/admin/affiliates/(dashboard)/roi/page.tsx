import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ERRORS } from "@/app/admin/affiliates/messages";
import { CampaignRoiDetail } from "@/components/affiliate/CampaignRoiDetail";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { MarketingCostForm } from "@/components/affiliate/MarketingCostForm";
import type { MarketingCampaignRecord } from "@/lib/affiliate/campaign-record";
import { formatCents } from "@/lib/affiliate/format";
import { campaignDates, campaignPhase, campaignPhaseLabel, formatRoi, roiPercent } from "@/lib/affiliate/roi-detail";
import { loadCampaignRoiDetail, loadPostPay } from "@/lib/affiliate/roi-detail-store";
import { listAffiliateChoices } from "@/lib/affiliate/marketing-store";
import {
  affiliateRoiRows,
  ROI_UNASSIGNED,
  type AffiliateRoiPart,
  roiRange,
  type CampaignRankOrder,
  type CampaignWindow,
  type RoiPostPay,
  type RoiRange,
  type RoiReport,
} from "@/lib/affiliate/roi";
import { memo } from "@/lib/affiliate/memo";
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
const affiliateColumns = "lg:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_6.5rem_6.5rem_5.5rem_1.5rem]";
const gridColumns = "lg:grid-cols-[minmax(0,1fr)_7rem_4.5rem_6.5rem_6.5rem_6.5rem_5.5rem_1.5rem]";

function roiHref(range: RoiRange) {
  return range === "all" ? "/admin/affiliates/roi" : `/admin/affiliates/roi?range=${range}`;
}

function campaignHref(range: RoiRange, name: string) {
  const params = new URLSearchParams({ campaign: name });
  if (range !== "all") params.set("range", range);
  return `/admin/affiliates/roi?${params.toString()}`;
}

function emptyReport(): RoiReport {
  return { rows: [], orders: 0, costCents: 0, revenueCents: 0, profitCents: 0 };
}

export default async function AffiliateRoiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; error?: string; notice?: string; campaign?: string; amount?: string; added?: string }>;
}) {
  const query = await searchParams;
  const range = roiRange(query.range);
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const today = new Date().toISOString().slice(0, 10);
  const amountCents = Number(query.amount);
  const amount = Number.isFinite(amountCents) && amountCents > 0 ? formatCents(amountCents) : "";

  if (query.campaign) {
    const detail = await loadCampaignRoiDetail(query.campaign, range).catch(() => undefined);
    if (detail) {
      return (
        <CampaignRoiDetail
          detail={detail}
          backHref={roiHref(range)}
          range={range}
          today={today}
          notice={query.notice === "cost-added" || query.notice === "cost-updated" || query.notice === "cost-removed" ? query.notice : ""}
          amount={amount}
          error={error}
        />
      );
    }
  }

  let report = emptyReport();
  let records: MarketingCampaignRecord[] = [];
  let orders: CampaignRankOrder[] = [];
  let postPay: RoiPostPay[] = [];
  let names = new Map<string, string>();
  let loadError = "";
  try {
    const [loadedPostPay, loadedRecords, loadedOrders, affiliates] = await Promise.all([
      memo("roi-post-pay", () => loadPostPay()).catch(() => [] as RoiPostPay[]),
      memo("marketing-campaign-records", () => loadMarketingCampaignRecords()),
      memo("roi-orders", () => loadCampaignOrders()).catch(() => [] as CampaignRankOrder[]),
      memo("affiliate-choices", () => listAffiliateChoices()).catch(() => [] as { code: string; name: string }[]),
    ]);
    report = await memo(`roi:${range}`, () => loadRoiReport(range, loadedPostPay));
    records = loadedRecords.filter((record) => record.status !== "draft");
    orders = loadedOrders;
    postPay = loadedPostPay;
    names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  } catch (caught) {
    loadError = caught instanceof RoiStoreError ? caught.message : "Could not load campaign ROI.";
  }
  const campaigns = records.map((record) => record.name);
  const windows: CampaignWindow[] = records.map((record) => ({ name: record.name, startsOn: record.startsOn, endsOn: record.endsOn }));
  const byName = new Map(records.map((record) => [record.name.toLowerCase(), record]));
  const addedRecord = query.added ? byName.get(query.added.toLowerCase()) : undefined;
  const addedName = addedRecord?.name ?? "";
  const addedHref = addedRecord ? campaignHref(range, addedRecord.name) : "";
  const tableRows = report.rows.filter((row) => row.campaign !== ROI_UNASSIGNED).map((row) => {
    const record = byName.get(row.campaign.toLowerCase());
    const phase = record ? campaignPhase(record, today) : null;
    const roi = roiPercent(row.revenueCents, row.costCents);
    return {
      ...row,
      href: record ? campaignHref(range, record.name) : "",
      meta: record
        ? `${campaignDates(record.startsOn, record.endsOn)} · ${record.assignedCodes.length} ${record.assignedCodes.length === 1 ? "affiliate" : "affiliates"}`
        : `${row.orders} ${row.orders === 1 ? "order" : "orders"} without a campaign code`,
      status: phase ? campaignPhaseLabel(phase) : "",
      running: phase?.phase === "running",
      roi: formatRoi(roi),
      roiColor: roi == null ? "#2A1714" : roi >= 0 ? "#1D6340" : "#9B2C1F",
      netColor: row.profitCents >= 0 ? "#1D6340" : "#9B2C1F",
    };
  });
  const roiTone = (part: AffiliateRoiPart) => {
    const roi = roiPercent(part.revenueCents, part.costCents);
    return {
      ...part,
      roi: formatRoi(roi),
      roiColor: roi == null ? "#2A1714" : roi >= 0 ? "#1D6340" : "#9B2C1F",
      netColor: part.profitCents >= 0 ? "#1D6340" : "#9B2C1F",
    };
  };
  const affiliateRows = affiliateRoiRows({ orders, postPay, windows, names, range }).map((row) => ({
    ...row,
    ...roiTone(row),
      parts: [
      { label: "In campaigns", ...roiTone(row.campaigns) },
      { label: "Outside campaigns", ...roiTone(row.outside) },
    ],
  }));
  const campaignTotals = tableRows.reduce(
    (totals, row) => ({
      costCents: totals.costCents + row.costCents,
      revenueCents: totals.revenueCents + row.revenueCents,
      profitCents: totals.profitCents + row.profitCents,
    }),
    { costCents: 0, revenueCents: 0, profitCents: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl">ROI</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            Cost, revenue, and profit for each campaign. These totals stay inside admin and do not change affiliate pay.
          </p>
          <p className="mt-3 text-[15px] font-medium text-ink">ROI = (revenue − cost) ÷ cost</p>
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

      {query.notice === "cost-added" && amount && addedName ? (
        <TimedNotice message={`${amount} added to ${addedName}`} query="notice">
          {amount} added to{" "}
          {addedHref ? (
            <Link href={addedHref} className="font-medium underline underline-offset-4">
              {addedName}
            </Link>
          ) : (
            addedName
          )}
          .
        </TimedNotice>
      ) : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        <section className={`col-span-2 min-w-0 rounded-[24px] p-4 sm:col-span-1 sm:rounded-[28px] sm:p-6 ${campaignTotals.profitCents >= 0 ? "bg-[#E7F4EC]" : "bg-[#FBE3DF]"}`}>
          <h3 className="text-sm text-brown">Profit</h3>
          <p className="mt-2 break-words text-2xl sm:text-3xl" style={{ color: campaignTotals.profitCents >= 0 ? "#1D6340" : "#9B2C1F" }}>{formatCents(campaignTotals.profitCents)}</p>
          <p className="mt-1 text-xs text-brown">Revenue − cost</p>
        </section>
        <section className="min-w-0 rounded-[24px] bg-white p-4 sm:rounded-[28px] sm:p-6">
          <h3 className="text-sm text-brown">Cost</h3>
          <p className="mt-2 break-words text-2xl sm:text-3xl">{formatCents(campaignTotals.costCents)}</p>
        </section>
        <section className="min-w-0 rounded-[24px] bg-white p-4 sm:rounded-[28px] sm:p-6">
          <h3 className="text-sm text-brown">Revenue</h3>
          <p className="mt-2 break-words text-2xl sm:text-3xl">{formatCents(campaignTotals.revenueCents)}</p>
        </section>
      </div>

      <section aria-labelledby="roi-table-title" className="min-w-0 rounded-[28px] bg-white px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
        <h3 id="roi-table-title" className="text-xl">
          Campaigns
        </h3>
        <p className="pt-2 text-sm text-brown">Open a campaign to see what it cost, what it brought in, and what drove it.</p>
        <div role="group" aria-labelledby="roi-cost-title" className="mt-5 rounded-[20px] border border-[#F0E8E6] p-4 sm:p-5">
          <h4 id="roi-cost-title" className="text-base font-semibold">Add a marketing cost</h4>
          <p className="mt-1 text-[13px] text-[#6B5A57]">Log money the company spent on a campaign. It&apos;s added to that campaign&apos;s cost.</p>
          <MarketingCostForm range={range} today={today} campaigns={campaigns} className="mt-4" />
        </div>
        {tableRows.length === 0 ? (
          <p className="py-6 text-sm text-brown">No campaigns yet.</p>
        ) : (
          <div className="mt-5">
            <div aria-hidden="true" className={`${gridColumns} hidden gap-3 pb-2.5 pt-1 text-[13px] text-[#6B5A57] lg:grid`}>
              <span>Campaign</span>
              <span>Status</span>
              <span className="text-right">Paid orders</span>
              <span className="text-right">Cost</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">Profit</span>
              <span className="text-right">ROI</span>
              <span />
            </div>
            <ul aria-labelledby="roi-table-title">
              {tableRows.map((row) => {
                const body = (
                  <>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="break-words text-[15px] font-semibold">{row.campaign}</span>
                      <span className="text-[13px] text-[#6B5A57]">{row.meta}</span>
                    </span>
                    <span className="lg:order-none">
                      {row.status ? (
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${row.running ? "bg-[#FBEFD6] text-[#7A4E00]" : "bg-[#EFEAE9] text-[#4A3A37]"}`}>{row.status}</span>
                      ) : null}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Paid orders</span>
                      {row.orders}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Cost</span>
                      {formatCents(row.costCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Revenue</span>
                      {formatCents(row.revenueCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right" style={{ color: row.netColor }}>
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Profit</span>
                      {formatCents(row.profitCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-base font-semibold tabular-nums lg:block lg:text-right" style={{ color: row.roiColor }}>
                      <span className="text-[13px] font-normal text-[#6B5A57] lg:hidden">ROI</span>
                      {row.roi}
                    </span>
                    <span aria-hidden="true" className="hidden text-[#6B5A57] lg:block">{row.href ? "›" : ""}</span>
                  </>
                );
                const rowClass =
                  `${gridColumns} grid grid-cols-1 gap-2 border-t border-[#F0E8E6] py-4 sm:grid-cols-2 sm:gap-x-6 lg:min-h-16 lg:items-center lg:gap-3 lg:py-3.5`;
                return (
                  <li key={row.campaign}>
                    {row.href ? (
                      <Link
                        href={row.href}
                        className={`${rowClass} -mx-2 rounded-xl px-2 hover:bg-[#FBF8F7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]`}
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className={rowClass}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="roi-affiliates-title" className="min-w-0 rounded-[28px] bg-white px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
        <h3 id="roi-affiliates-title" className="text-xl">
          Affiliates
        </h3>
        <p className="pt-2 text-sm text-brown">What each affiliate cost compared with the paid orders they brought in.</p>
        {affiliateRows.length === 0 ? (
          <p className="py-6 text-sm text-brown">No affiliate sales or pay in this range.</p>
        ) : (
          <div className="mt-5">
            <div aria-hidden="true" className={`${affiliateColumns} hidden gap-3 pb-2.5 pt-1 text-[13px] text-[#6B5A57] lg:grid`}>
              <span>Affiliate</span>
              <span className="text-right">Paid orders</span>
              <span className="text-right">Cost</span>
              <span className="text-right">Revenue</span>
              <span className="text-right">Profit</span>
              <span className="text-right">ROI</span>
              <span />
            </div>
            <ul aria-labelledby="roi-affiliates-title">
              {affiliateRows.map((row) => (
                <li key={row.code} className="border-t border-[#F0E8E6] pb-3">
                  <Link
                    href={`/admin/affiliates/accounts?code=${encodeURIComponent(row.code)}&from=roi`}
                    className={`${affiliateColumns} -mx-2 grid grid-cols-1 gap-2 rounded-xl px-2 py-4 hover:bg-[#FBF8F7] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93] sm:grid-cols-2 sm:gap-x-6 lg:min-h-16 lg:items-center lg:gap-3 lg:py-3.5`}
                  >
                    <span className="flex min-w-0 flex-col gap-0.5 sm:col-span-2 lg:col-span-1">
                      <span className="break-words text-[15px] font-semibold">{row.name}</span>
                      <span className="text-[13px] text-[#6B5A57]">{row.code}</span>
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Paid orders</span>
                      {row.orders}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Cost</span>
                      {formatCents(row.costCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right">
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Revenue</span>
                      {formatCents(row.revenueCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-[15px] tabular-nums lg:block lg:text-right" style={{ color: row.netColor }}>
                      <span className="text-[13px] text-[#6B5A57] lg:hidden">Profit</span>
                      {formatCents(row.profitCents)}
                    </span>
                    <span className="flex justify-between gap-3 text-base font-semibold tabular-nums lg:block lg:text-right" style={{ color: row.roiColor }}>
                      <span className="text-[13px] font-normal text-[#6B5A57] lg:hidden">ROI</span>
                      {row.roi}
                    </span>
                    <span aria-hidden="true" className="hidden text-[#6B5A57] lg:block">›</span>
                  </Link>
                  <dl className="flex flex-col gap-1.5 rounded-[14px] bg-[#F7F3F2] px-3 py-2.5 lg:gap-0 lg:bg-transparent lg:p-0">
                    {row.parts.map((part) => (
                      <div key={part.label} className={`${affiliateColumns} grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-[13px] text-[#4A3A37] lg:min-h-8 lg:items-center lg:gap-3`}>
                        <dt className="lg:pl-4">{part.label}</dt>
                        <dd className="text-right tabular-nums lg:hidden">
                          {formatCents(part.profitCents)} profit · <span style={{ color: part.roiColor }}>{part.roi}</span>
                        </dd>
                        <dd className="hidden text-right tabular-nums lg:block">{part.orders}</dd>
                        <dd className="hidden text-right tabular-nums lg:block">{formatCents(part.costCents)}</dd>
                        <dd className="hidden text-right tabular-nums lg:block">{formatCents(part.revenueCents)}</dd>
                        <dd className="hidden text-right tabular-nums lg:block" style={{ color: part.netColor }}>{formatCents(part.profitCents)}</dd>
                        <dd className="hidden text-right font-semibold tabular-nums lg:block" style={{ color: part.roiColor }}>{part.roi}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
