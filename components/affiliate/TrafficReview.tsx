"use client";

import { useState } from "react";
import Link from "next/link";
import { excludeTrafficAction, keepTrafficAction } from "@/app/admin/affiliates/payment-actions";
import type { TrafficRowStatus, TrafficStepTone } from "@/lib/affiliate/traffic-review";

type Row = {
  code: string;
  name: string;
  initials: string;
  color: string;
  clicks: number;
  pageViews: number;
  excluded: number;
  status: TrafficRowStatus;
  spikeHour: string;
  spikeCount: number;
  spikeLabel: string;
};

type Day = {
  date: string;
  label: string;
  parts: { code: string; clicks: number; excluded: number; flagged: boolean }[];
};

const STATUS: Record<TrafficRowStatus, [string, string, string]> = {
  clear: ["No spike", "#EFEAE9", "#4A3A37"],
  flagged: ["Needs review", "#FBE3DF", "#9B2C1F"],
};

const STEP: Record<TrafficStepTone, { bg: string; fg: string }> = {
  done: { bg: "#DDF0E4", fg: "#1D6340" },
  current: { bg: "#33130F", fg: "#FFFFFF" },
  next: { bg: "#FFFFFF", fg: "#4A3A37" },
};

function count(value: number) {
  return value.toLocaleString("en-US");
}

export function TrafficReview({
  month,
  monthLabel,
  previousHref,
  nextHref,
  canReview,
  notice,
  error,
  steps,
  rows,
  days,
  totals,
}: {
  month: string;
  monthLabel: string;
  previousHref: string;
  nextHref: string | null;
  canReview: boolean;
  notice: string;
  error: string;
  steps: { n: string; label: string; sub: string; tone: TrafficStepTone }[];
  rows: Row[];
  days: Day[];
  totals: { clicks: number; pageViews: number; excluded: number };
}) {
  const [who, setWho] = useState("all");
  const [review, setReview] = useState("");
  const visible = (code: string) => who === "all" || who === code;
  const bars = days.map((day) => {
    const parts = day.parts.filter((part) => visible(part.code));
    const clicks = parts.reduce((sum, part) => sum + part.clicks, 0);
    const excluded = parts.reduce((sum, part) => sum + part.excluded, 0);
    const flag = parts.find((part) => part.flagged && part.clicks > 0);
    return { ...day, parts, clicks, excluded, flagCount: flag ? rows.find((row) => row.code === flag.code)?.spikeCount ?? 0 : 0 };
  });
  const max = Math.max(...bars.map((bar) => bar.clicks + bar.excluded), 0);
  const nice = Math.max(10, Math.ceil(max / 10) * 10);
  const height = (value: number) => Math.round((value / nice) * 180);
  const first = bars[0]?.label ?? "";
  const middle = bars[Math.floor((bars.length - 1) / 2)]?.label ?? "";
  const last = bars[bars.length - 1]?.label ?? "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-normal">Website traffic</h2>
        <p className="mt-1.5 text-[15px] text-[#4A3A37]">Check each affiliate’s clicks and page views. Unusual spikes are flagged for review.</p>
      </div>

      <ol aria-label="Monthly steps" className="grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.n} className="flex flex-col gap-0.5 rounded-2xl px-3.5 py-3" style={{ background: STEP[step.tone].bg, color: STEP[step.tone].fg }}>
            <span className="text-[13px] font-semibold opacity-80">{step.n}</span>
            <span className="text-[15px] font-semibold">{step.label}</span>
            <span className="text-[13px] opacity-85">{step.sub}</span>
          </li>
        ))}
      </ol>

      {notice ? <p role="status" className="rounded-[14px] bg-[#DDF0E4] px-4 py-3 text-[15px] font-medium text-[#1D6340]">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-[14px] bg-[#FBE3DF] px-4 py-3 text-[15px] text-[#9B2C1F]">{error}</p> : null}

      <section aria-labelledby="traffic-chart-title" className="flex flex-col gap-3.5 rounded-3xl bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="traffic-chart-title" className="min-w-0 flex-1 text-xl font-medium">Verified clicks per day</h3>
          <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5">
            <Filter pressed={who === "all"} color="#6B5A57" label="All affiliates" onClick={() => setWho("all")} />
            {rows.map((row) => (
              <Filter key={row.code} pressed={who === row.code} color={row.color} label={row.name} onClick={() => setWho(row.code)} />
            ))}
          </div>
        </div>
        {days.length === 0 ? <p className="text-sm text-[#6B5A57]">No days in this month yet.</p> : (
          <>
            <div className="flex gap-2.5">
              <div aria-hidden="true" className="flex h-[220px] w-10 flex-col justify-end">
                <div className="mb-[-8px] flex h-[180px] flex-col justify-between text-right text-xs text-[#6B5A57]">
                  <span>{count(nice)}</span>
                  <span>{count(nice / 2)}</span>
                  <span>0</span>
                </div>
              </div>
              <div role="img" aria-label={`Verified clicks per day, ${first} to ${last}`} className="flex h-[220px] min-w-0 flex-1 items-end gap-1 border-b border-[#DCCFCC] sm:gap-2">
                {bars.map((bar) => {
                  const segments = [
                    ...bar.parts.filter((part) => part.clicks > 0).map((part) => ({ key: part.code, height: height(part.clicks), color: part.flagged ? "#9B2C1F" : rows.find((row) => row.code === part.code)?.color ?? "#33130F", hatch: false })),
                    ...(bar.excluded > 0 ? [{ key: "excluded", height: height(bar.excluded), color: "", hatch: true }] : []),
                  ];
                  return (
                    <div key={bar.date} title={`${bar.label}: ${count(bar.clicks)} counted${bar.excluded ? `, ${count(bar.excluded)} not counted` : ""}`} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                      {bar.flagCount > 0 ? <span className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#FBE3DF] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-[#9B2C1F]" style={{ bottom: height(bar.clicks + bar.excluded) + 6 }}>{count(bar.flagCount)} in 1 hour</span> : null}
                      {segments.map((segment, index) => (
                        <div key={segment.key} className={index === segments.length - 1 ? "rounded-t" : ""} style={{ height: segment.height, background: segment.hatch ? "repeating-linear-gradient(45deg, #E8DEDC 0 4px, #F7F3F2 4px 8px)" : segment.color }} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between pl-12 text-[13px] text-[#6B5A57]"><span>{first}</span><span>{middle}</span><span>{last}</span></div>
            <div className="flex flex-wrap gap-4 pl-12 text-[13px] text-[#4A3A37]">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, #DCCFCC 0 3px, #F7F3F2 3px 6px)" }} />Not counted</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#9B2C1F]" />Flagged, waiting for review</span>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col rounded-3xl bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 pb-2.5">
          <h3 className="text-xl font-medium">{monthLabel}</h3>
          <Link href={previousHref} className="text-sm text-ink underline">Previous month</Link>
          {nextHref ? <Link href={nextHref} className="text-sm text-ink underline">Next month</Link> : null}
          <span className="ml-auto text-sm text-[#6B5A57]">Ad impressions are never counted.</span>
        </div>
        {rows.length === 0 ? <p className="py-6 text-sm text-[#6B5A57]">No affiliates yet.</p> : (
          <div className="overflow-x-auto">
            <div className="min-w-[46rem]">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_2.2fr] gap-4 border-b border-[#E8DEDC] px-2 py-2 text-[13px] font-semibold tracking-wide text-[#6B5A57] uppercase">
                <span>Affiliate</span>
                <span className="text-right">Verified clicks</span>
                <span className="text-right">Page views</span>
                <span className="text-right">Not counted</span>
                <span>Status</span>
              </div>
              {rows.map((row) => {
                const [label, background, color] = STATUS[row.status];
                const reviewing = review === row.code;
                return (
                  <div key={row.code} className="border-b border-[#F0E8E6]">
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_2.2fr] items-center gap-4 px-2 py-3.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-[34px] items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold">{row.initials}</span>
                        <span className="text-base font-semibold">{row.name}</span>
                      </span>
                      <span className="text-right text-base font-semibold">{count(row.clicks)}</span>
                      <span className="text-right text-base">{count(row.pageViews)}</span>
                      <span className="text-right text-base text-[#6B5A57]">{count(row.excluded)}</span>
                      <span className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background, color }}>{label}</span>
                        {canReview && !reviewing && row.status === "flagged" ? (
                          <button type="button" onClick={() => setReview(row.code)} className="ml-auto inline-flex h-[38px] items-center rounded-full bg-ink px-4 text-sm font-medium text-white">Review spike</button>
                        ) : null}
                      </span>
                    </div>
                    {reviewing ? (
                      <div className="mx-2 mb-4 flex flex-col gap-3 rounded-2xl border-2 border-[#E9C98A] px-4 py-4 sm:ml-[52px]">
                        <span className="text-base font-semibold">Unusual spike: {row.spikeLabel}</span>
                        <span className="text-[15px] text-[#4A3A37]">Most of these clicks arrived in one hour. That can mean automated traffic.</span>
                        <div className="flex flex-wrap gap-2.5">
                          <form action={excludeTrafficAction}>
                            <input type="hidden" name="month" value={month} />
                            <input type="hidden" name="code" value={row.code} />
                            <button type="submit" className="inline-flex h-[46px] items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white">Don’t count the spike ({count(row.spikeCount)} clicks)</button>
                          </form>
                          <form action={keepTrafficAction}>
                            <input type="hidden" name="month" value={month} />
                            <input type="hidden" name="code" value={row.code} />
                            <button type="submit" className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink">Count it</button>
                          </form>
                          <button type="button" onClick={() => setReview("")} className="inline-flex h-[46px] items-center text-sm text-ink underline">Decide later</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_2.2fr] gap-4 px-2 pt-3.5 text-base font-semibold">
                <span>Total</span>
                <span className="text-right">{count(totals.clicks)}</span>
                <span className="text-right">{count(totals.pageViews)}</span>
                <span className="text-right">{count(totals.excluded)}</span>
                <span />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Filter({ pressed, color, label, onClick }: { pressed: boolean; color: string; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium" style={{ background: pressed ? "#33130F" : "#FFFFFF", color: pressed ? "#FFFFFF" : "#33130F", borderColor: pressed ? "#33130F" : "#CDBDBA" }}>
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </button>
  );
}
