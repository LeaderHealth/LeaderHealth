"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { chartMax, compactCount, linePath } from "@/lib/affiliate/stats-board";
import { FilterDatePicker } from "./FilterDatePicker";
import { SegmentedControl } from "./SegmentedControl";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33130F]";
const CLOSE_MS = 380;
const appear = "380ms cubic-bezier(0.22, 1, 0.36, 1)";
const PLATFORMS = [
  { id: "all", label: "All" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type OverviewRange = { id: string; label: string; href: string; current: boolean };

export type OverviewTodo = {
  n: string;
  title: string;
  sub: string;
  href: string;
  urgent: boolean;
  active: boolean;
};

export type OverviewKpi = { label: string; value: string; note: string; noteClass: string };

export type OverviewChartPost = {
  day: string;
  platform: "instagram" | "facebook" | "tiktok" | "youtube" | "other";
  views: number;
  engagements: number;
};

export type OverviewStat = { label: string; value: string; note: string; noteClass: string; tip: string };

export type OverviewAgreement = {
  initials: string;
  name: string;
  terms: string;
  pips: string[];
  progress: string;
  label: string;
  pillClass: string;
  href: string;
};

export type OverviewPay = { label: string; color: string; value: string; width: string };

export type OverviewCompareRow = {
  label: string;
  note: string;
  now: string;
  last: string;
  nowClass: string;
  strong: boolean;
  delta: string;
  deltaClass: string;
  rowClass: string;
};

export type OverviewAffiliate = {
  code: string;
  rank: string;
  name: string;
  views: string;
  linkClicks: string;
  engagements: string;
  labOrders: string;
  labClass: string;
  earned: string;
  initials: string;
  sub: string;
  rows: OverviewCompareRow[];
};

export type OverviewActivity = { text: string; when: string; color: string };

export function AdminOverviewBoard({
  ranges,
  customRange = null,
  rangeText,
  todoCount,
  todos,
  kpis,
  days,
  axisStart,
  axisEnd,
  posts,
  stats,
  agreements,
  owed,
  periodWord,
  payLabel,
  paySegments,
  paid,
  affiliates,
  monthNote,
  activity,
}: {
  ranges: OverviewRange[];
  customRange?: { from: string; to: string } | null;
  rangeText: string;
  todoCount: string;
  todos: OverviewTodo[];
  kpis: OverviewKpi[];
  days: string[];
  axisStart: string;
  axisEnd: string;
  posts: OverviewChartPost[];
  stats: OverviewStat[];
  agreements: OverviewAgreement[];
  owed: string;
  periodWord: string;
  payLabel: string;
  paySegments: OverviewPay[];
  paid: string;
  affiliates: OverviewAffiliate[];
  monthNote: string;
  activity: OverviewActivity[];
}) {
  const router = useRouter();
  const rangeFrom = customRange?.from ?? "";
  const rangeTo = customRange?.to ?? "";
  const [from, setFrom] = useState(rangeFrom);
  const [to, setTo] = useState(rangeTo);
  const [syncedFrom, setSyncedFrom] = useState(rangeFrom);
  const [syncedTo, setSyncedTo] = useState(rangeTo);
  if (syncedFrom !== rangeFrom || syncedTo !== rangeTo) {
    setSyncedFrom(rangeFrom);
    setSyncedTo(rangeTo);
    setFrom(rangeFrom);
    setTo(rangeTo);
  }
  const [platform, setPlatform] = useState<PlatformId>("all");
  const [compare, setCompare] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const shown = compare ? affiliates.find((affiliate) => affiliate.code === compare) ?? null : null;
  const filtered = posts.filter((post) => platform === "all" || post.platform === platform);
  const views = days.map((day) => filtered.filter((post) => post.day === day).reduce((sum, post) => sum + post.views, 0));
  const engagements = days.map((day) => filtered.filter((post) => post.day === day).reduce((sum, post) => sum + post.engagements, 0));
  const viewMax = chartMax(views);
  const engagementMax = chartMax(engagements);
  const viewTotal = views.reduce((sum, value) => sum + value, 0);
  const engagementTotal = engagements.reduce((sum, value) => sum + value, 0);
  const viewPath = linePath(views, viewMax, 10, 194);
  const engagementPath = linePath(engagements, engagementMax, 10, 194);
  const rate = viewTotal > 0 ? `${((engagementTotal / viewTotal) * 100).toFixed(1)}%` : "0.0%";

  function openCompare(code: string) {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const opening = compare == null;
    setCompare(code);
    if (!opening || prefersReducedMotion()) {
      setEntered(true);
      return;
    }
    setEntered(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }

  function closeCompare() {
    setEntered(false);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setCompare(null), prefersReducedMotion() ? 0 : CLOSE_MS);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function applyCustomRange() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return;
    const params = new URLSearchParams({ range: "custom", from, to });
    router.push(`/admin/affiliates/overview?${params.toString()}`);
  }

  useEffect(() => {
    if (!compare) return;
    const previousBody = document.body.style.overflow;
    const previousRoot = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeCompare();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousRoot;
    };
  }, [compare]);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
          <h2 className="text-[30px] font-normal leading-tight">Overview</h2>
          <p className="text-[15px] text-[#4A3A37]">What needs you today, and how the affiliate program is doing.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div role="group" aria-label="Date range" className="flex flex-wrap justify-end gap-2">
            {ranges.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={item.current ? "true" : undefined}
                className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${item.current ? "border-[#33130F] bg-[#33130F] text-white" : "border-[#CDBDBA] bg-white text-[#33130F] hover:bg-[#F7F3F2]"} ${focusRing}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {customRange ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="w-[11.5rem]">
                <FilterDatePicker label="From" placeholder="Start date" value={from} onChange={setFrom} variant="field" />
              </div>
              <div className="w-[11.5rem]">
                <FilterDatePicker label="To" placeholder="End date" value={to} onChange={setTo} variant="field" />
              </div>
              <button type="button" onClick={applyCustomRange} className={`inline-flex h-11 items-center rounded-full bg-[#33130F] px-4 text-sm font-medium text-white hover:bg-[#4A1E19] ${focusRing}`}>
                Apply
              </button>
            </div>
          ) : null}
          <span className="text-[13px] text-[#6B5A57]">{rangeText}</span>
          <span className="max-w-sm text-right text-[13px] text-[#6B5A57]">This range covers Program at a glance, Marketing and sales, and the top affiliates.</span>
        </div>
      </div>

      <section aria-labelledby="todo-h" className="flex flex-col gap-3 rounded-[24px] bg-white px-6 py-[22px]">
        <div className="flex items-baseline">
          <h3 id="todo-h" className="flex-1 text-lg font-semibold">
            Needs your action
          </h3>
          <span className="text-sm text-[#6B5A57]">{todoCount}</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {todos.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-[#2A1714] ${item.urgent ? "border-[#E9C98A] bg-[#FFFBF2]" : "border-[#E8DEDC] bg-white"} hover:bg-[#F7F3F2] ${focusRing}`}
            >
              <span className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-[15px] font-bold ${item.active ? "bg-[#33130F] text-white" : "bg-[#EFEAE9] text-[#6B5A57]"}`}>
                {item.n}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{item.title}</span>
                <span className="text-[13px] text-[#4A3A37]">{item.sub}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="kpi-h" className="flex flex-col gap-3.5 rounded-[24px] bg-white px-6 py-[22px]">
        <h3 id="kpi-h" className="text-lg font-semibold">
          Program at a glance
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {kpis.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-col gap-1 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
              <span className="truncate text-sm text-[#4A3A37]">{item.label}</span>
              <span className="text-[28px] font-medium tabular-nums leading-none">{item.value}</span>
              <span className={`text-[13px] leading-snug ${item.noteClass}`}>{item.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="mp-h" className="flex flex-col gap-4 rounded-[24px] bg-white px-6 py-[22px]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[16rem] flex-1 flex-col gap-0.5">
            <h3 id="mp-h" className="text-lg font-semibold">
              Marketing and sales
            </h3>
            <span className="text-[13px] text-[#6B5A57]">All affiliates combined</span>
          </div>
          <Link href="/admin/affiliates/social" className={`text-sm ${focusRing}`}>
            Full stats →
          </Link>
        </div>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
          <div className="flex min-w-0 flex-[1.3] flex-col gap-2">
            <div className="flex flex-wrap gap-x-[18px] gap-y-2 text-sm text-[#4A3A37]">
              <span className="inline-flex items-center gap-2">
                <span className="h-[3px] w-[18px] rounded-sm bg-[#33130F]" />
                Views
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-[3px] w-[18px] rounded-sm bg-[#D9534A]" />
                Engagements <b className="text-[#2A1714]">{compactCount(engagementTotal)}</b>
              </span>
              <span className="inline-flex items-center gap-2">
                Engagement rate <b className="text-[#2A1714]">{rate}</b>
              </span>
            </div>
            <div className="flex gap-2">
              <div aria-hidden="true" className="flex h-[170px] w-11 flex-col justify-between text-right text-xs text-[#33130F]">
                <span>{compactCount(viewMax)}</span>
                <span>0</span>
              </div>
              <div className="min-w-0 flex-1">
                <svg role="img" aria-label={`Daily views and engagements, ${platform === "all" ? "all platforms" : platform}`} viewBox="0 0 1000 200" preserveAspectRatio="none" className="block h-[170px] w-full overflow-visible">
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="#F0E8E6" />
                  <line x1="0" y1="194" x2="1000" y2="194" stroke="#DCCFCC" />
                  {viewPath ? <path d={`${viewPath} L1000 194 L0 194 Z`} fill="#33130F" fillOpacity="0.06" stroke="none" /> : null}
                  {viewPath ? <path d={viewPath} fill="none" stroke="#33130F" strokeWidth="2.5" strokeLinejoin="round" /> : null}
                  {engagementPath ? <path d={engagementPath} fill="none" stroke="#D9534A" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" /> : null}
                </svg>
                <div className="flex justify-between pt-1.5 text-xs text-[#6B5A57]">
                  <span>{axisStart}</span>
                  <span>{axisEnd}</span>
                </div>
              </div>
              <div aria-hidden="true" className="flex h-[170px] w-11 flex-col justify-between text-xs text-[#D9534A]">
                <span>{compactCount(engagementMax)}</span>
                <span>0</span>
              </div>
            </div>
            <SegmentedControl label="Platform" value={platform} options={PLATFORMS} onChange={setPlatform} className="mt-1" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 border-[#F0E8E6] xl:border-l xl:pl-6">
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map((item) => (
                <div key={item.label} title={item.tip} className="flex min-w-0 flex-col gap-0.5 rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
                  <span className="truncate text-[13px] text-[#4A3A37]">{item.label}</span>
                  <span className="text-[22px] font-medium tabular-nums">{item.value}</span>
                  <span className={`truncate text-xs ${item.noteClass}`}>{item.note}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-[#6B5A57]">Only lab orders earn commission. Likes, comments, shares and saves are on Full stats.</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-start gap-[18px] xl:flex-row">
        <section aria-labelledby="ag-h" className="flex min-w-0 flex-[1.4] flex-col gap-1 self-stretch rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline pb-2">
            <h3 id="ag-h" className="flex-1 text-lg font-semibold">
              Agreements this month
            </h3>
            <Link href="/admin/affiliates/accounts" className={`text-sm ${focusRing}`}>
              All agreements →
            </Link>
          </div>
          {agreements.length === 0 ? (
            <p className="border-t border-[#F0E8E6] py-3.5 text-sm text-[#6B5A57]">No agreements this month.</p>
          ) : (
            agreements.map((item) => (
              <Link key={item.href + item.name} href={item.href} className={`grid grid-cols-1 items-center gap-3 border-t border-[#F0E8E6] py-3.5 text-[#2A1714] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] sm:gap-4 ${focusRing}`}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-[38px] flex-none items-center justify-center rounded-full bg-[#F3CFCB] text-[13px] font-semibold">{item.initials}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{item.name}</span>
                    <span className="text-[13px] text-[#4A3A37]">{item.terms}</span>
                  </span>
                </span>
                <span className="flex flex-col gap-1.5">
                  {item.pips.length ? (
                    <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${item.pips.length}, minmax(0, 1fr))` }}>
                      {item.pips.map((color, index) => (
                        <span key={`${item.name}-${index}`} className="h-2.5 rounded-full" style={{ background: color }} />
                      ))}
                    </span>
                  ) : null}
                  <span className="text-[13px] text-[#4A3A37]">{item.progress}</span>
                </span>
                <span className={`w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${item.pillClass}`}>{item.label}</span>
              </Link>
            ))
          )}
        </section>

        <section aria-labelledby="pay-h" className="flex min-w-0 flex-1 flex-col gap-3 self-stretch rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline">
            <h3 id="pay-h" className="flex-1 text-lg font-semibold">
              Payouts
            </h3>
            <Link href="/admin/affiliates/payouts" className={`text-sm ${focusRing}`}>
              Go to payouts →
            </Link>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[32px] font-medium tabular-nums">{owed}</span>
            <span className="text-sm text-[#4A3A37]">earned {periodWord}</span>
          </div>
          <div role="img" aria-label={payLabel} className="flex h-3.5 overflow-hidden rounded-full bg-[#E8DEDC]">
            {paySegments.map((segment) => (
              <span key={segment.label} style={{ width: segment.width, background: segment.color }} />
            ))}
          </div>
          {paySegments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-2.5 text-sm">
              <span className="size-2.5 rounded-[3px]" style={{ background: segment.color }} />
              <span className="flex-1 text-[#4A3A37]">{segment.label}</span>
              <span className="font-semibold tabular-nums">{segment.value}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-[#F0E8E6] pt-3">
            <span className="text-sm text-[#4A3A37]">Paid {periodWord}</span>
            <span className="text-xl font-semibold tabular-nums">{paid}</span>
          </div>
        </section>
      </div>

      <div className="flex flex-col items-start gap-[18px] xl:flex-row">
        <section aria-labelledby="top-h" className="min-w-0 flex-[1.4] self-stretch rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline gap-3 pb-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h3 id="top-h" className="text-lg font-semibold">
                Top affiliates
              </h3>
              <span className="text-sm text-[#4A3A37]">Select anyone to compare this month with last month.</span>
            </div>
            <Link href="/admin/affiliates/accounts" className={`whitespace-nowrap text-sm ${focusRing}`}>
              All affiliates →
            </Link>
          </div>
          {affiliates.length === 0 ? (
            <p className="border-t border-[#E8DEDC] py-3.5 text-sm text-[#6B5A57]">No affiliates yet.</p>
          ) : (
            <div>
              <div className="grid grid-cols-[minmax(0,1.3fr)_3.4rem_9.5rem_6.2rem_5.2rem_4.4rem_2.25rem] gap-3 border-b border-[#E8DEDC] pb-2 text-[13px] font-semibold whitespace-nowrap text-[#4A3A37]">
                <span>Affiliate</span>
                <span className="text-right">Views</span>
                <span className="text-right">Verified link clicks</span>
                <span className="text-right">Engagements</span>
                <span className="text-right">Lab orders</span>
                <span className="text-right">Earned</span>
                <span />
              </div>
              {affiliates.map((affiliate) => (
                <button
                  key={affiliate.code}
                  type="button"
                  onClick={() => openCompare(affiliate.code)}
                  aria-label={`Compare ${affiliate.name}’s stats: this month and last month`}
                  className={`grid w-full grid-cols-[minmax(0,1.3fr)_3.4rem_9.5rem_6.2rem_5.2rem_4.4rem_2.25rem] items-center gap-3 border-b border-[#F0E8E6] bg-transparent py-3 text-left text-[15px] whitespace-nowrap text-[#2A1714] tabular-nums ${focusRing}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="w-4 shrink-0 text-[13px] text-[#6B5A57]">{affiliate.rank}</span>
                    <span className="whitespace-normal font-semibold">{affiliate.name}</span>
                  </span>
                  <span className="text-right">{affiliate.views}</span>
                  <span className="text-right">{affiliate.linkClicks}</span>
                  <span className="text-right">{affiliate.engagements}</span>
                  <span className={`text-right font-semibold ${affiliate.labClass}`}>{affiliate.labOrders}</span>
                  <span className="text-right font-semibold">{affiliate.earned}</span>
                  <span className="inline-flex size-9 items-center justify-center justify-self-end rounded-full border border-[#CDBDBA] bg-white text-[#33130F]" title="Compare">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20V10" />
                      <path d="M10 20V4" />
                      <path d="M16 20v-8" />
                      <path d="M22 20H2" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="act-h" className="flex min-w-0 flex-1 flex-col gap-0.5 self-stretch rounded-[24px] bg-white px-6 py-[22px]">
          <h3 id="act-h" className="pb-2 text-lg font-semibold">
            Recent activity
          </h3>
          {activity.length === 0 ? (
            <p className="border-t border-[#F0E8E6] py-2.5 text-sm text-[#6B5A57]">No activity yet.</p>
          ) : (
            activity.map((item) => (
              <div key={`${item.when}-${item.text}`} className="flex gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
                <span className="mt-1.5 size-2 flex-none rounded-full" style={{ background: item.color }} />
                <span className="min-w-0 flex-1">{item.text}</span>
                <span className="whitespace-nowrap text-[#6B5A57]">{item.when}</span>
              </div>
            ))
          )}
        </section>
      </div>

      {shown
        ? createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto p-4 [scrollbar-width:none] sm:p-8 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            aria-label="Close comparison"
            onClick={closeCompare}
            className={`absolute inset-0 bg-[rgba(42,23,20,0.45)] motion-reduce:transition-none ${entered ? "opacity-100" : "opacity-0"}`}
            style={prefersReducedMotion() ? undefined : { transition: `opacity ${appear}` }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-title"
            className={`lh-compare-scroll relative z-[1] max-h-[min(90vh,760px)] w-full max-w-[760px] overflow-y-auto overscroll-contain rounded-[28px] bg-white px-7 py-6 shadow-[0_30px_80px_rgba(51,19,15,0.3)] outline-none ${entered ? "" : "pointer-events-none"}`}
            style={
              prefersReducedMotion()
                ? undefined
                : {
                    opacity: entered ? 1 : 0,
                    transform: entered ? "translateY(0) scale(1)" : "translateY(16px) scale(0.98)",
                    transition: `opacity ${appear}, transform ${appear}`,
                  }
            }
          >
            <div className="flex items-center gap-3.5">
              <span className="inline-flex size-12 flex-none items-center justify-center rounded-full bg-[#F3CFCB] text-[15px] font-semibold">{shown.initials}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 id="compare-title" className="text-[22px] font-medium">
                  {shown.name}
                </h3>
                <span className="text-sm text-[#4A3A37]">{shown.sub}</span>
              </div>
              <button type="button" aria-label="Close" onClick={closeCompare} className={`inline-flex size-10 items-center justify-center rounded-full bg-[#F7F3F2] text-[#33130F] ${focusRing}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-[18px] grid grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_minmax(0,0.9fr)] gap-3 rounded-xl bg-[#F7F3F2] px-3 py-2 text-[13px] font-semibold text-[#4A3A37]">
              <span />
              <span className="text-right">This month</span>
              <span className="text-right">Last month</span>
              <span className="text-right">Change</span>
            </div>
            <div className="mt-1 flex flex-col">
              {shown.rows.map((row) => (
                <div key={row.label} className={`grid grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_minmax(0,0.9fr)] items-center gap-3 border-b border-[#F0E8E6] px-3 py-[11px] tabular-nums ${row.rowClass}`}>
                  <span className="flex flex-col gap-px">
                    <span className={`text-[15px] ${row.strong ? "font-bold" : "font-medium"}`}>{row.label}</span>
                    {row.note ? <span className="text-xs text-[#6B5A57]">{row.note}</span> : null}
                  </span>
                  <span className={`text-right text-base font-semibold ${row.nowClass}`}>{row.now}</span>
                  <span className="text-right text-[15px] text-[#4A3A37]">{row.last}</span>
                  <span className={`justify-self-end rounded-full px-2 py-0.5 text-xs font-semibold ${row.delta ? row.deltaClass : ""}`}>{row.delta}</span>
                </div>
              ))}
            </div>
            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              <span className="min-w-[16rem] flex-1 text-[13px] text-[#6B5A57]">{monthNote}</span>
              <Link href={`/admin/affiliates/accounts?code=${encodeURIComponent(shown.code)}`} className={`inline-flex h-[42px] items-center rounded-full bg-[#33130F] px-[18px] text-sm font-medium text-white ${focusRing}`}>
                Open profile
              </Link>
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}
    </div>
  );
}
