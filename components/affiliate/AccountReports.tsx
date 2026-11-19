"use client";

import { useId, useState } from "react";
import { SlidingTabs } from "./SlidingTabs";
import { currentReportMonth, networkLabel, type SocialNetwork } from "@/lib/affiliate/marketing";
import type { WebsiteMonthReport } from "@/lib/affiliate/website-report";

type ReportSection = {
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  months: {
    month: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  }[];
};

type SocialMetric = Exclude<keyof ReportSection["months"][number], "month">;

const SOCIAL_METRICS: [SocialMetric, string][] = [
  ["impressions", "Impressions"],
  ["reach", "Reach"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["shares", "Shares"],
  ["saves", "Saves"],
];

function count(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function shiftMonth(month: string, delta: number) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function axisMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

function SectionHeading({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <h4 id={id} className="text-[15px] font-semibold">
        {title}
      </h4>
      <p className="text-[13px] text-[#4A3A37]">{note}</p>
    </div>
  );
}

export function AccountReports({
  unavailable,
  months,
  sections,
}: {
  unavailable: boolean;
  months: WebsiteMonthReport[];
  sections: ReportSection[];
}) {
  const ids = useId();
  const [view, setView] = useState<"visits" | "orders">("visits");
  const newest = currentReportMonth();
  const recent = [2, 1, 0].map((back) => {
    const id = shiftMonth(newest, -back);
    return months.find((month) => month.month === id) ?? { month: id, trackingVisits: 0, trackingOrders: 0, promoVisits: 0, promoOrders: 0, promoLinkOrders: 0, promos: [] };
  });
  const series =
    view === "visits"
      ? [
          { id: "tracking", label: "Tracking link visits", color: "#33130F", values: recent.map((month) => month.trackingVisits) },
          { id: "promo", label: "Promo link visits", color: "#E39A93", values: recent.map((month) => month.promoVisits) },
        ]
      : [
          { id: "tracking", label: "Tracking link orders", color: "#33130F", values: recent.map((month) => month.trackingOrders) },
          { id: "promo-code", label: "Promo code orders", color: "#A8706A", values: recent.map((month) => month.promoOrders) },
          { id: "promo-link", label: "Promo link orders", color: "#E39A93", values: recent.map((month) => month.promoLinkOrders) },
        ];
  const peak = Math.max(1, ...series.flatMap((item) => item.values));
  const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

  return (
    <section aria-labelledby="marketing-report-title" className="flex flex-col gap-4 rounded-[24px] bg-white px-6 py-[22px]">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 id="marketing-report-title" className="text-lg font-semibold">
          Marketing report
        </h3>
        <p className="text-[13px] text-[#4A3A37]">Last 3 months · doesn’t change commission or payouts</p>
      </div>

      {unavailable ? (
        <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px] text-[#4A3A37]">Marketing reports are unavailable right now.</p>
      ) : (
        <>
          <section aria-labelledby={`${ids}-website`} className="flex flex-col gap-3.5 border-t border-[#F0E8E6] pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <SectionHeading
                id={`${ids}-website`}
                title="Website traffic"
                note={view === "visits" ? "Visits from the tracking link and promo links" : "Orders from the tracking link, promo code and promo links"}
              />
              <SlidingTabs
                variant="track"
                label="Website traffic"
                items={(
                  [
                    ["visits", "Visits"],
                    ["orders", "Orders"],
                  ] as const
                ).map(([id, label]) => ({
                  id,
                  label,
                  current: view === id,
                  onSelect: () => setView(id),
                }))}
              />
            </div>

            <div className={`grid gap-2.5 ${series.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {series.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 rounded-[14px] border border-[#E8DEDC] px-3.5 py-2.5">
                  <span aria-hidden="true" className="size-2.5 flex-none rounded-sm" style={{ background: item.color }} />
                  <span className="min-w-0 flex-1 text-[13px] text-[#4A3A37]">{item.label}</span>
                  <span className="text-lg font-semibold tabular-nums">{total(item.values)}</span>
                </div>
              ))}
            </div>

            <p className="sr-only">
              {recent.map((month, index) => `${axisMonth(month.month)}: ${series.map((item) => `${item.label} ${item.values[index]}`).join(", ")}`).join(". ")}.
            </p>
            <div aria-hidden="true" className="flex items-end border-b border-[#E8DEDC]">
              {recent.map((month, index) => (
                <div key={month.month} className="flex h-32 flex-1 items-end justify-center gap-1.5">
                  {series.map((item) => {
                    const value = item.values[index] ?? 0;
                    return (
                      <div key={item.id} className="flex w-6 flex-col items-center justify-end sm:w-7">
                        <span className="mb-1 text-[11px] font-medium tabular-nums">{value}</span>
                        <div
                          className={value > 0 ? "w-full rounded-t-md" : "h-0.5 w-full rounded-full bg-[#E8DEDC]"}
                          style={value > 0 ? { height: Math.max(6, Math.round((value / peak) * 88)), background: item.color } : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="-mt-2 flex">
              {recent.map((month) => (
                <span key={month.month} className="flex-1 text-center text-[12px] text-[#6B5A57]">
                  {axisMonth(month.month)}
                </span>
              ))}
            </div>
          </section>

          <section aria-labelledby={`${ids}-social`} className="flex flex-col gap-3 border-t border-[#F0E8E6] pt-4">
            <SectionHeading id={`${ids}-social`} title="Social accounts" note="Reach and engagement from connected accounts" />
            {sections.length ? (
              sections.map((section) => {
                const shown = section.months.filter((month) => recent.some((item) => item.month === month.month));
                const sum = (key: SocialMetric) => shown.reduce((acc, month) => acc + month[key], 0);
                return (
                  <div key={`${section.network}-${section.accountId}`} className="flex flex-col gap-2 rounded-[14px] border border-[#E8DEDC] px-3.5 py-3">
                    <span className="text-[13px] font-semibold">
                      {networkLabel(section.network)} · {section.accountName}
                    </span>
                    <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {SOCIAL_METRICS.map(([key, label]) => (
                        <div key={key} className="flex flex-col-reverse">
                          <dt className="text-[11px] text-[#6B5A57]">{label}</dt>
                          <dd className="text-[15px] font-semibold tabular-nums">{count(sum(key))}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })
            ) : (
              <p className="flex items-center gap-2.5 rounded-[14px] bg-[#F7F3F2] px-3.5 py-3 text-[13px] text-[#4A3A37]">
                <span aria-hidden="true" className="size-1.5 flex-none rounded-full bg-[#B3A5A2]" />
                No social account connected yet, so views and engagement aren’t shown.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
