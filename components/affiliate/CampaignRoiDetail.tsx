import Link from "next/link";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { deleteMarketingCostAction, updateMarketingCostAction } from "@/app/admin/affiliates/actions";
import { costButtonClass, MarketingCostFields, MarketingCostForm } from "@/components/affiliate/MarketingCostForm";
import { formatCents } from "@/lib/affiliate/format";
import { campaignAdvice, campaignDates, campaignDay, campaignPhaseLabel, formatRoi, type CampaignRoiDetail as Detail } from "@/lib/affiliate/roi-detail";

const summaryClass =
  "inline-flex min-h-9 cursor-pointer list-none items-center text-sm font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93] [&::-webkit-details-marker]:hidden";
const GOOD = "#1D6340";
const BAD = "#9B2C1F";

function tone(value: number | null) {
  return value == null ? "#2A1714" : value >= 0 ? GOOD : BAD;
}

function verdict(detail: Detail) {
  if (detail.roiPct == null) return "No cost recorded yet";
  const ahead = detail.roiPct >= 0;
  if (detail.phase === "ended") return ahead ? "Paid off" : "Didn’t pay off";
  if (detail.phase === "upcoming") return ahead ? "Paying off so far" : "Not paid off yet · hasn’t started";
  if (detail.phase === "open") return ahead ? "Paying off so far" : "Not paid off yet";
  return ahead ? "Paying off so far" : "Not paid off yet · still running";
}

function barWidth(value: number, max: number) {
  if (max <= 0 || value <= 0) return "0%";
  return `${Math.max(3, Math.round((Math.log(value + 1) / Math.log(max + 1)) * 100))}%`;
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? word : `${word}s`}`;
}

function rangeLabel(range: string) {
  if (range === "30") return "30 days";
  if (range === "90") return "90 days";
  return "All time";
}

export function CampaignRoiDetail({
  detail,
  backHref,
  range,
  today,
  notice,
  amount,
  error,
}: {
  detail: Detail;
  backHref: string;
  range: string;
  today: string;
  notice: "" | "cost-added" | "cost-updated" | "cost-removed";
  amount: string;
  error: string;
}) {
  const status =
    notice === "cost-added" ? `${amount || "Cost"} added.` : notice === "cost-updated" ? (amount ? `Cost updated to ${amount}.` : "Cost updated.") : notice === "cost-removed" ? "Cost removed." : "";
  const running = detail.phase === "running";
  const tiles = [
    { label: "Revenue", value: formatCents(detail.salesCents), note: plural(detail.orders, "paid order"), color: "#2A1714" },
    { label: "Cost", value: formatCents(detail.costCents), note: "Affiliate pay and marketing", color: "#2A1714" },
    { label: "Profit", value: formatCents(detail.netCents), note: "Revenue − cost", color: tone(detail.netCents) },
  ];
  const funnelMax = Math.max(detail.views, detail.engagements, detail.orders);
  const funnel = [
    { label: "Views", value: detail.views, color: "#33130F" },
    { label: "Engagements", value: detail.engagements, color: "#A8706A" },
    { label: "Paid orders", value: detail.orders, color: GOOD },
  ];
  const exportHref = `/admin/affiliates/roi-export?campaign=${encodeURIComponent(detail.name)}`;

  return (
    <div className="flex flex-col gap-4">
      <Link href={backHref} className="self-start py-1 text-sm font-medium text-ink underline-offset-4 hover:underline">
        ← All campaigns
      </Link>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1.5">
          <h2 className="break-words text-[26px] sm:text-[30px]">{detail.name}</h2>
          <p className="text-[15px] text-[#4A3A37]">
            {rangeLabel(range)} · {campaignDates(detail.startsOn, detail.endsOn)} · {plural(detail.affiliates.length, "affiliate")} · {detail.verified} of {detail.required} posts verified
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${running ? "bg-[#FBEFD6] text-[#7A4E00]" : "bg-[#EFEAE9] text-[#4A3A37]"}`}>
          {campaignPhaseLabel(detail, true)}
        </span>
      </div>

      {error ? <TimedNotice message={error} tone="warn" query="error" /> : null}
      {status ? <TimedNotice message={status} query="notice" /> : null}

      <section aria-labelledby="roi-result-title" className="flex min-w-0 flex-col gap-5 rounded-[24px] bg-white p-4 sm:p-6">
        <div>
          <h3 id="roi-result-title" className="text-lg font-semibold">Result</h3>
          <p className="mt-1 text-[15px] font-medium text-ink">ROI = (revenue − cost) ÷ cost</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div className={`col-span-2 flex min-w-0 flex-col gap-1 rounded-[18px] px-5 py-4 lg:col-span-1 ${detail.roiPct == null ? "bg-[#F7F3F2]" : detail.roiPct >= 0 ? "bg-[#E7F4EC]" : "bg-[#FBE3DF]"}`}>
            <span className="text-sm text-[#4A3A37]">ROI</span>
            <span className="text-[34px] font-medium tabular-nums sm:text-[40px]" style={{ color: tone(detail.roiPct) }}>{formatRoi(detail.roiPct)}</span>
            <span className="text-[13px]" style={{ color: tone(detail.roiPct) }}>{verdict(detail)}</span>
          </div>
          {tiles.map((tile, index) => (
            <div key={tile.label} className={`flex min-w-0 flex-col gap-1 rounded-[18px] bg-[#F7F3F2] px-5 py-4 ${index === 2 ? "col-span-2 lg:col-span-1" : ""}`}>
              <span className="text-sm text-[#4A3A37]">{tile.label}</span>
              <span className="break-words text-2xl font-medium tabular-nums sm:text-[30px]" style={{ color: tile.color }}>{tile.value}</span>
              <span className="text-[13px] text-[#6B5A57]">{tile.note}</span>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 md:gap-7">
          <div className="flex min-w-0 flex-col">
            <h4 className="mb-1 text-sm font-semibold">Where the money went</h4>
            <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-ink">Affiliate pay</span>
                <span className="text-[13px] text-[#6B5A57]">Commissions and post fees</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatCents(detail.affiliatePayCents)}</span>
            </div>
            {detail.costs.length === 0 ? (
              <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
                <span className="text-ink">Marketing costs</span>
                <span className="shrink-0 tabular-nums">{formatCents(0)}</span>
              </div>
            ) : (
              detail.costs.map((cost, index) => (
                <div key={cost.id || `${cost.spentOn}-${index}`} className="border-t border-[#F0E8E6] py-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="break-words text-ink">{cost.note || "Marketing cost"}</span>
                      <span className="break-words text-[13px] text-[#6B5A57]">
                        {[cost.spentOn ? `Spent ${campaignDay(cost.spentOn)}` : "", cost.recordedBy ? `by ${cost.recordedBy}` : ""].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatCents(cost.costCents)}</span>
                  </div>
                  {cost.id ? (
                    <details className="group mt-1.5">
                      <summary className={summaryClass}>
                        <span className="group-open:hidden">Edit</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <form action={updateMarketingCostAction} className="mt-3 grid gap-3 rounded-[16px] bg-[#F7F3F2] p-3.5">
                        <input type="hidden" name="id" value={cost.id} />
                        <input type="hidden" name="campaign" value={detail.name} />
                        <input type="hidden" name="range" value={range} />
                        <MarketingCostFields today={today} amount={(cost.costCents / 100).toFixed(2)} note={cost.note} spentOn={cost.spentOn || today} />
                        <div className="flex flex-wrap gap-2.5">
                          <button type="submit" className={costButtonClass}>Save</button>
                          <button
                            type="submit"
                            formAction={deleteMarketingCostAction}
                            formNoValidate
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E3B7B0] bg-white px-5 text-sm font-medium text-[#9B2C1F] hover:bg-[#FBF1EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          >
                            Remove
                          </button>
                        </div>
                      </form>
                    </details>
                  ) : null}
                </div>
              ))
            )}
            <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm font-semibold">
              <span className="text-[#4A3A37]">Total cost</span>
              <span className="tabular-nums">{formatCents(detail.costCents)}</span>
            </div>
            <details className="group border-t border-[#F0E8E6] pt-2.5" open={detail.costs.length === 0}>
              <summary className={summaryClass}>Add a cost</summary>
              <MarketingCostForm range={range} today={today} campaign={detail.name} stacked className="mt-3 rounded-[16px] bg-[#F7F3F2] p-3.5" />
            </details>
          </div>
          <div className="flex min-w-0 flex-col">
            <h4 className="mb-1 text-sm font-semibold">What it brought in</h4>
            <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
              <span className="text-[#4A3A37]">Paid orders</span>
              <span className="tabular-nums">{detail.orders.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
              <span className="text-[#4A3A37]">Refunded</span>
              <span className="tabular-nums">{formatCents(detail.refundedCents)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm font-semibold">
              <span className="text-[#4A3A37]">Total revenue</span>
              <span className="tabular-nums">{formatCents(detail.salesCents)}</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="roi-drivers-title" className="flex min-w-0 flex-col gap-5 rounded-[24px] bg-white p-4 sm:p-6">
        <h3 id="roi-drivers-title" className="text-lg font-semibold">What drove it</h3>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Funnel</h4>
          {funnel.map((step) => (
            <div key={step.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_5.5rem]">
              <span className="text-sm text-[#4A3A37]">{step.label}</span>
              <span className="h-5 overflow-hidden rounded-md bg-[#F7F3F2]">
                <span className="block h-5 rounded-md" style={{ width: barWidth(step.value, funnelMax), background: step.color }} />
              </span>
              <span className="text-right text-[15px] font-semibold tabular-nums">{step.value.toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-col">
          <h4 className="mb-1.5 text-sm font-semibold">By affiliate</h4>
          {detail.affiliates.length === 0 ? (
            <p className="border-t border-[#F0E8E6] py-3 text-sm text-[#4A3A37]">No affiliates on this campaign yet.</p>
          ) : (
            <>
              <ul className="md:hidden">
                {detail.affiliates.map((affiliate) => (
                  <li key={affiliate.code} className="border-t border-[#F0E8E6] py-3 text-sm">
                    <p className="font-semibold">{affiliate.name}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 tabular-nums">
                      <div><dt className="text-xs text-[#6B5A57]">Posts verified</dt><dd>{affiliate.verified} of {affiliate.required}</dd></div>
                      <div><dt className="text-xs text-[#6B5A57]">Views</dt><dd>{affiliate.views.toLocaleString("en-US")}</dd></div>
                      <div><dt className="text-xs text-[#6B5A57]">Engagements</dt><dd>{affiliate.engagements.toLocaleString("en-US")}</dd></div>
                      <div><dt className="text-xs text-[#6B5A57]">Paid orders</dt><dd>{affiliate.orders}</dd></div>
                      <div><dt className="text-xs text-[#6B5A57]">Revenue</dt><dd>{formatCents(affiliate.salesCents)}</dd></div>
                    </dl>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
                <div className="grid grid-cols-[minmax(0,1fr)_7rem_6rem_7rem_6rem_7rem] gap-3 py-2 text-[13px] text-[#6B5A57]">
                  <span>Affiliate</span>
                  <span className="text-right">Posts verified</span>
                  <span className="text-right">Views</span>
                  <span className="text-right">Engagements</span>
                  <span className="text-right">Paid orders</span>
                  <span className="text-right">Revenue</span>
                </div>
                {detail.affiliates.map((affiliate) => (
                  <div key={affiliate.code} className="grid grid-cols-[minmax(0,1fr)_7rem_6rem_7rem_6rem_7rem] items-center gap-3 border-t border-[#F0E8E6] py-3 text-sm tabular-nums">
                    <span className="truncate font-semibold">{affiliate.name}</span>
                    <span className="text-right">{affiliate.verified} of {affiliate.required}</span>
                    <span className="text-right">{affiliate.views.toLocaleString("en-US")}</span>
                    <span className="text-right">{affiliate.engagements.toLocaleString("en-US")}</span>
                    <span className="text-right">{affiliate.orders}</span>
                    <span className="text-right">{formatCents(affiliate.salesCents)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="roi-report-title" className="flex min-w-0 flex-wrap items-center justify-between gap-3.5 rounded-[24px] bg-white p-4 sm:p-6">
        <div className="min-w-0 flex-1 basis-64">
          <h3 id="roi-report-title" className="text-lg font-semibold">Next step</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-[#4A3A37]">{campaignAdvice(detail)}</p>
        </div>
        <a href={exportHref} className="inline-flex h-12 items-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-[15px] font-medium text-[#33130F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]">
          Export report
        </a>
      </section>
    </div>
  );
}
