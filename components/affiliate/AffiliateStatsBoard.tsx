"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { SlidingTabs, TabPanel } from "./SlidingTabs";
import { formatCents } from "@/lib/affiliate/format";
import {
  barPath,
  chartMax,
  compactCount,
  contentPosts,
  customLengths,
  daySpan,
  deltaLabel,
  fullDay,
  linePath,
  pageViewPath,
  postEngagement,
  postsIn,
  rangeLabel,
  rangeLength,
  salePeriodLabel,
  saleDaysIn,
  saleHistory,
  salesTotals,
  shortDay,
  trafficIn,
  type BoardPlatform,
  type BoardPostFilter,
  type BoardRange,
  type SaleDayCount,
  type SalePeriodRefs,
  type StatsBoardDay,
  type StatsBoardPost,
} from "@/lib/affiliate/stats-board";

const selectedChip = "border-ink bg-ink text-white";
const quietChip = "border-[#CDBDBA] bg-white text-ink";

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${pressed ? selectedChip : quietChip}`}
    >
      {children}
    </button>
  );
}

function Delta({ current, previous, points = false }: { current: number; previous: number; points?: boolean }) {
  const delta = deltaLabel(current, previous, points);
  return (
    <span className={`self-start rounded-full px-2 py-0.5 text-[13px] font-semibold ${delta.up ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]"}`}>
      {delta.text}
    </span>
  );
}

export function AffiliateStatsBoard({ today, posts, traffic, saleDays, salePeriods }: { today: string; posts: StatsBoardPost[]; traffic: StatsBoardDay[]; saleDays: SaleDayCount[]; salePeriods: SalePeriodRefs[] }) {
  const [range, setRange] = useState<BoardRange>("30");
  const [fromDays, setFromDays] = useState(14);
  const [tab, setTab] = useState<"social" | "web" | "posts" | "labs">("social");
  const [platform, setPlatform] = useState<BoardPlatform>("all");
  const [postFilter, setPostFilter] = useState<BoardPostFilter>("all");
  const [saleView, setSaleView] = useState<"commission" | "none">("commission");
  const [openId, setOpenId] = useState<string | null>(null);
  const days = rangeLength(range, fromDays);
  const currentDays = useMemo(() => daySpan(today, days), [today, days]);
  const previousDays = useMemo(() => daySpan(currentDays[0] ? shiftBefore(currentDays[0]) : today, days), [currentDays, today, days]);
  const currentPosts = postsIn(posts, currentDays);
  const previousPosts = postsIn(posts, previousDays);
  const views = sum(currentPosts, (post) => post.views);
  const previousViews = sum(previousPosts, (post) => post.views);
  const engagements = sum(currentPosts, postEngagement);
  const previousEngagements = sum(previousPosts, postEngagement);
  const rate = views > 0 ? (engagements / views) * 100 : 0;
  const previousRate = previousViews > 0 ? (previousEngagements / previousViews) * 100 : 0;
  const site = trafficIn(traffic, currentDays);
  const previousSite = trafficIn(traffic, previousDays);
  const socialPosts = postsIn(posts, currentDays, platform);
  const viewSeries = currentDays.map((day) => sum(socialPosts.filter((post) => post.postedOn === day), (post) => post.views));
  const engagementSeries = currentDays.map((day) => sum(socialPosts.filter((post) => post.postedOn === day), postEngagement));
  const viewMax = chartMax(viewSeries);
  const engagementMax = chartMax(engagementSeries);
  const viewLine = linePath(viewSeries, viewMax, 10, 250);
  const likes = sum(socialPosts, (post) => post.likes);
  const comments = sum(socialPosts, (post) => post.comments);
  const shares = sum(socialPosts, (post) => post.shares);
  const saves = sum(socialPosts, (post) => post.saves);
  const engagementTotal = likes + comments + shares + saves;
  const breakdown = [
    ["Likes", likes],
    ["Comments", comments],
    ["Shares", shares],
    ["Saves", saves],
  ] as const;
  const clickSeries = currentDays.map((day) => traffic.find((item) => item.day === day)?.clicks ?? 0);
  const pageSeries = currentDays.map((day) => traffic.find((item) => item.day === day)?.pageViews ?? 0);
  const clickMax = chartMax(clickSeries);
  const pageMax = chartMax(pageSeries);
  const shownPosts = contentPosts(posts, currentDays, postFilter);
  const showCommission = saleView === "commission";
  const currentSales = saleDaysIn(saleDays, currentDays, showCommission);
  const previousSales = saleDaysIn(saleDays, previousDays, showCommission);
  const labNow = salesTotals(currentSales);
  const labBefore = salesTotals(previousSales);
  const rangePeriods = [...new Set(currentDays.map((day) => day.slice(0, 7)))];
  const countSeries = rangePeriods.map((period) => salesTotals(currentSales.filter((sale) => sale.day.startsWith(period))).orders);
  const commissionDollars = rangePeriods.map((period) => salesTotals(currentSales.filter((sale) => sale.day.startsWith(period))).commissionCents / 100);
  const orderMax = chartMax(countSeries);
  const commissionDollarMax = chartMax(commissionDollars);
  const orderLine = linePath(countSeries, orderMax, 10, 250);
  const commissionLine = linePath(commissionDollars, commissionDollarMax, 10, 250);
  const history = saleHistory(salePeriods, saleDays, currentDays, showCommission);
  const activePeriods = history.length;
  const previousActivePeriods = saleHistory(salePeriods, saleDays, previousDays, showCommission).length;
  const periodLabels = rangePeriods.map((period) => salePeriodLabel(period));
  const periodStart = periodLabels[0] ?? "";
  const periodMiddle = periodLabels.length > 2 ? periodLabels[Math.floor(periodLabels.length / 2)] ?? "" : "";
  const periodEnd = periodLabels.length > 1 ? periodLabels.at(-1) ?? "" : "";
  const start = currentDays[0] ?? today;
  const middle = currentDays[Math.floor(currentDays.length / 2)] ?? today;
  const end = currentDays.at(-1) ?? today;
  const versus = `vs. previous ${days} days`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <h2 className="text-[32px] font-medium leading-tight">Stats</h2>
          <p className="mt-1.5 text-[15px] text-[#4A3A37]">
            How your posts, tracking link, and sales are doing. Earnings are in <Link href="/affiliates/payouts" className="underline underline-offset-4">Payouts</Link>.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
            {(["7", "30", "90"] as const).map((item) => (
              <Chip key={item} pressed={range === item} onClick={() => { setRange(item); setOpenId(null); }}>
                {`${item} days`}
              </Chip>
            ))}
            <Chip pressed={range === "custom"} onClick={() => { setRange("custom"); setOpenId(null); }}>Ending today</Chip>
          </div>
          <span className="text-[13px] text-[#6B5A57]">{rangeLabel(start, end)}</span>
        </div>
      </div>

      {range === "custom" ? (
        <div className="flex flex-wrap items-end gap-3 rounded-[18px] bg-white px-4 py-3.5">
          <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor="stats-from">
            From
            <select
              id="stats-from"
              value={fromDays}
              onChange={(event) => setFromDays(Number(event.target.value))}
              className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal"
            >
              {customLengths().map((length) => (
                <option key={length} value={length}>{fullDay(daySpan(today, length)[0] ?? today)}</option>
              ))}
            </select>
          </label>
          <span className="pb-3 text-[15px] text-[#4A3A37]">to {fullDay(today)}</span>
        </div>
      ) : null}

      <section aria-label="Performance overview" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        <Card label="Views" value={compactCount(views)} detail={versus} current={views} previous={previousViews} />
        <Card label="Engagements" value={compactCount(engagements)} detail="Likes, comments, shares, saves" current={engagements} previous={previousEngagements} />
        <Card label="Engagement rate" value={`${rate.toFixed(1)}%`} detail="Engagements ÷ views" current={rate} previous={previousRate} points />
        <Card label="Verified link clicks" value={compactCount(site.clicks)} detail="Your tracking link" current={site.clicks} previous={previousSite.clicks} />
        <Card label="Public page views" value={compactCount(site.pageViews)} detail="Approved Leader Health pages" current={site.pageViews} previous={previousSite.pageViews} />
      </section>

      <SlidingTabs
        variant="track"
        label="Stats sections"
        items={([["social", "Social media"], ["web", "Website traffic"], ["posts", "Content"], ["labs", "Sales"]] as const).map(([id, name]) => ({
          id,
          label: name,
          current: tab === id,
          onSelect: () => setTab(id),
        }))}
      />

      <TabPanel tabKey={tab} className="flex flex-col gap-[18px]">
      {tab === "social" ? (
        <section aria-labelledby="social-stats-title" className="flex flex-col gap-[18px] rounded-3xl bg-white px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="social-stats-title" className="flex-1 text-xl font-semibold">Social media</h3>
            <div role="group" aria-label="Platform" className="flex flex-wrap gap-2">
              {([["all", "All"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["youtube", "YouTube"]] as const).map(([id, label]) => (
                <Chip key={id} pressed={platform === id} onClick={() => setPlatform(id)}>{label}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-[#4A3A37]">
            <Legend mark="line" color="#33130F" label="Views" value={compactCount(sum(viewSeries, (value) => value))} />
            <Legend mark="dashed" color="#D9534A" label="Engagements" value={compactCount(engagementTotal)} />
          </div>
          <Chart
            label={`Daily views and engagements, ${platform === "all" ? "Instagram, Facebook, TikTok, and YouTube" : platformLabel(platform)}`}
            left={[axisCount(viewMax), axisCount(viewMax / 2), "0"]}
            leftClass="text-ink"
            right={[axisCount(engagementMax), axisCount(engagementMax / 2), "0"]}
            rightClass="text-[#D9534A]"
            height={260}
            start={shortDay(start)}
            middle={shortDay(middle)}
            end={shortDay(end)}
          >
            <line x1="0" y1="10" x2="1000" y2="10" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="130" x2="1000" y2="130" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#DCCFCC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {viewLine ? <path d={`${viewLine} L1000 250 L0 250 Z`} fill="#33130F" fillOpacity="0.06" /> : null}
            {viewLine ? <path d={viewLine} fill="none" stroke="#33130F" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
            <path d={linePath(engagementSeries, engagementMax, 10, 250)} fill="none" stroke="#D9534A" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
          </Chart>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {breakdown.map(([label, value]) => {
              const share = engagementTotal > 0 ? Math.round((value / engagementTotal) * 100) : 0;
              return (
                <div key={label} className="flex flex-col gap-2 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[#4A3A37]">{label}</span>
                    <span className="text-[13px] text-[#6B5A57]">{share}%</span>
                  </div>
                  <span className="text-2xl font-medium">{compactCount(value)}</span>
                  <div className="h-1.5 rounded-full bg-[#E8DEDC]">
                    <div className="h-1.5 rounded-full bg-ink" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-[#6B5A57]">Views and engagements are the latest numbers on posts published in this range. Days without a published post stay at zero.</p>
        </section>
      ) : null}

      {tab === "web" ? (
        <section aria-labelledby="web-stats-title" className="flex flex-col gap-[18px] rounded-3xl bg-white px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="web-stats-title" className="flex-1 text-xl font-semibold">Website traffic</h3>
            <span className="text-[13px] text-[#6B5A57]">Ad impressions aren’t counted.</span>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-[#4A3A37]">
            <Legend mark="square" color="#D9C6C2" label="Verified link clicks" value={compactCount(site.clicks)} />
            <Legend mark="line" color="#1D6340" label="Public page views" value={compactCount(site.pageViews)} />
          </div>
          <Chart
            label="Daily verified link clicks and public page views"
            left={[compactCount(clickMax), "0"]}
            leftClass="text-[#6B5A57]"
            right={[compactCount(pageMax), "0"]}
            rightClass="text-[#1D6340]"
            height={220}
            start={shortDay(start)}
            middle={shortDay(middle)}
            end={shortDay(end)}
          >
            <line x1="0" y1="210" x2="1000" y2="210" stroke="#DCCFCC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <path d={barPath(clickSeries, clickMax)} fill="#D9C6C2" />
            <path d={pageViewPath(pageSeries, pageMax)} fill="none" stroke="#1D6340" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </Chart>
          <p className="text-sm text-[#4A3A37]">Only clicks on your own tracking link and views of approved public pages count.</p>
        </section>
      ) : null}

      {tab === "posts" ? (
        <section aria-labelledby="content-stats-title" className="flex flex-col gap-[18px] rounded-3xl bg-white px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="content-stats-title" className="flex-1 text-xl font-semibold">Content performance</h3>
            <div role="group" aria-label="Posts" className="flex flex-wrap gap-2">
              {([["all", "All posts"], ["campaign", "Campaign posts"], ["independent", "Agreement posts"]] as const).map(([id, label]) => (
                <Chip key={id} pressed={postFilter === id} onClick={() => { setPostFilter(id); setOpenId(null); }}>{label}</Chip>
              ))}
            </div>
          </div>
          {shownPosts.length === 0 ? <p className="px-2 py-3 text-[15px] text-[#6B5A57]">No published posts in this date range.</p> : null}
          <div className={`${shownPosts.length === 0 ? "hidden" : "hidden lg:grid"} grid-cols-[2.6fr_1fr_1.4fr_0.8fr_0.9fr_0.9fr] gap-3.5 border-b border-[#E8DEDC] px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B5A57]`}>
            <span>Post</span><span>Platform</span><span>Campaign</span><span className="text-right">Views</span><span className="text-right">Engagements</span><span />
          </div>
          {shownPosts.map((post) => {
            const open = openId === post.id;
            const engagementsForPost = postEngagement(post);
            const engagementRate = post.views > 0 ? `${((engagementsForPost / post.views) * 100).toFixed(1)}%` : "—";
            return (
              <div key={post.id} className="border-b border-[#F0E8E6]">
                <div className="grid items-center gap-3 px-2 py-3 lg:grid-cols-[2.6fr_1fr_1.4fr_0.8fr_0.9fr_0.9fr]">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-[52px] w-[52px] shrink-0 place-items-end rounded-xl p-1 ${post.platform === "tiktok" ? "bg-gradient-to-br from-[#4A3A37] to-[#1A0E0C]" : "bg-gradient-to-br from-[#E39A93] to-[#8E3B46]"}`}>
                      <span className="rounded-md bg-black/35 px-1.5 py-px text-[10px] font-bold text-white">{post.kind}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{post.title}</span>
                      <span className="block text-[13px] text-[#6B5A57]">Posted {shortDay(post.postedOn)}</span>
                    </span>
                  </span>
                  <span className="text-sm">{platformLabel(post.platform)}</span>
                  <span><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${post.campaign ? "bg-[#F3E6E3] text-[#5A2A24]" : "bg-[#EFEAE9] text-[#4A3A37]"}`}>{post.campaign || post.agreementLabel || "Agreement post"}</span></span>
                  <span className="text-[15px] font-semibold lg:text-right">{compactCount(post.views)}</span>
                  <span className="text-[15px] lg:text-right">{compactCount(engagementsForPost)}</span>
                  <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : post.id)} className="h-9 justify-self-start rounded-full border border-[#CDBDBA] bg-white px-3.5 text-sm font-medium text-ink lg:justify-self-end">
                    {open ? "Hide details" : "View details"}
                  </button>
                </div>
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="px-2 pb-3.5">
                      <div className="grid gap-3 rounded-[18px] bg-[#F7F3F2] px-4 py-4 sm:grid-cols-3 lg:grid-cols-5">
                        <Detail label="Likes" value={compactCount(post.likes)} />
                        <Detail label="Comments" value={compactCount(post.comments)} />
                        <Detail label="Shares" value={compactCount(post.shares)} />
                        <Detail label="Saves" value={compactCount(post.saves)} />
                        <Detail label="Engagement rate" value={engagementRate} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {tab === "labs" ? (
        <section aria-labelledby="lab-sales-title" className="flex flex-col gap-[18px] rounded-3xl bg-white px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="lab-sales-title" className="flex-1 text-xl font-semibold">Sales</h3>
            <div role="group" aria-label="Lab orders" className="flex flex-wrap gap-2">
              <Chip pressed={showCommission} onClick={() => setSaleView("commission")}>Lab commission</Chip>
              <Chip pressed={!showCommission} onClick={() => setSaleView("none")}>No commission</Chip>
            </div>
          </div>
          {showCommission ? (
            <>
              <p className="text-[13px] text-[#6B5A57]">These lab orders earn commission.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <LabStat label="Lab orders" value={compactCount(labNow.orders)} detail={versus} current={labNow.orders} previous={labBefore.orders} />
                <LabStat label="Lab commission" value={formatCents(labNow.commissionCents)} detail="Lab commission for this range" current={labNow.commissionCents} previous={labBefore.commissionCents} />
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-[15px] font-semibold">Orders by pay period</h4>
                <div className="flex flex-wrap gap-5 text-sm text-[#4A3A37]">
                  <Legend mark="line" color="#33130F" label="Lab orders" value={compactCount(labNow.orders)} />
                  <Legend mark="dashed" color="#1D6340" label="Lab commission" value={formatCents(labNow.commissionCents)} />
                </div>
                <Chart
                  label="Orders by pay period"
                  left={[axisCount(orderMax), axisCount(orderMax / 2), "0"]}
                  leftClass="text-ink"
                  right={[axisDollars(commissionDollarMax), axisDollars(commissionDollarMax / 2), "$0"]}
                  rightClass="text-[#1D6340]"
                  height={260}
                  start={periodStart}
                  middle={periodMiddle}
                  end={periodEnd}
                >
                  <line x1="0" y1="10" x2="1000" y2="10" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="130" x2="1000" y2="130" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="250" x2="1000" y2="250" stroke="#DCCFCC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {orderLine ? <path d={`${orderLine} L1000 250 L0 250 Z`} fill="#33130F" fillOpacity="0.06" /> : null}
                  {orderLine ? <path d={orderLine} fill="none" stroke="#33130F" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
                  {commissionLine ? <path d={commissionLine} fill="none" stroke="#1D6340" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" /> : null}
                </Chart>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[#6B5A57]">HIPAA-friendly stats for these orders: a count grouped by pay period, and an opaque referral ID. Patient names, contact details, products, and purchase dates are not shown.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <LabStat label="Orders" value={compactCount(labNow.orders)} detail={versus} current={labNow.orders} previous={labBefore.orders} />
                <LabStat label="Pay periods" value={compactCount(activePeriods)} detail="With an order" current={activePeriods} previous={previousActivePeriods} />
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-[15px] font-semibold">Orders by pay period</h4>
                <div className="flex flex-wrap gap-5 text-sm text-[#4A3A37]">
                  <Legend mark="line" color="#33130F" label="Orders" value={compactCount(labNow.orders)} />
                </div>
                <Chart
                  label="Orders by pay period"
                  left={[axisCount(orderMax), axisCount(orderMax / 2), "0"]}
                  leftClass="text-ink"
                  right={["", "", ""]}
                  rightClass="text-[#D9534A]"
                  height={260}
                  start={periodStart}
                  middle={periodMiddle}
                  end={periodEnd}
                >
                  <line x1="0" y1="10" x2="1000" y2="10" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="130" x2="1000" y2="130" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="250" x2="1000" y2="250" stroke="#DCCFCC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {orderLine ? <path d={`${orderLine} L1000 250 L0 250 Z`} fill="#33130F" fillOpacity="0.06" /> : null}
                  {orderLine ? <path d={orderLine} fill="none" stroke="#33130F" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
                </Chart>
              </div>
            </>
          )}
          <div className="flex flex-col gap-3 pt-1">
            <h4 className="text-[15px] font-semibold">Order history</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E8DEDC] text-xs font-semibold uppercase tracking-wide text-[#6B5A57]">
                    <th className="px-2 py-1.5 font-semibold">Pay period</th>
                    <th className="px-2 py-1.5 font-semibold">{showCommission ? "Lab orders" : "Orders"}</th>
                    {showCommission ? <th className="px-2 py-1.5 font-semibold">Lab commission</th> : null}
                    <th className="px-2 py-1.5 font-semibold">Referral ID</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={showCommission ? 4 : 3} className="px-2 py-3 text-[15px] text-[#6B5A57]">{showCommission ? "No lab orders in this date range." : "No orders in this date range."}</td>
                    </tr>
                  ) : history.map((group) => (
                    <tr key={group.period} className="border-b border-[#F0E8E6]">
                      <td className="px-2 py-3 text-[15px] font-semibold">{salePeriodLabel(group.period)}</td>
                      <td className="px-2 py-3 text-[15px]">{compactCount(group.orders)}</td>
                      {showCommission ? <td className="px-2 py-3 text-[15px]">{formatCents(group.commissionCents)}</td> : null}
                      <td className="px-2 py-3">
                        {group.refs.length > 0 ? (
                          <span className="flex flex-wrap gap-2">
                            {group.refs.map((ref) => (
                              <span key={ref} className="font-mono text-[13px] font-semibold">{ref}</span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-[13px] text-[#6B5A57]">Referral IDs appear when the whole pay period is in this range.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
      </TabPanel>
    </div>
  );
}

function platformLabel(platform: StatsBoardPost["platform"] | BoardPlatform) {
  if (platform === "instagram") return "Instagram";
  if (platform === "facebook") return "Facebook";
  if (platform === "tiktok") return "TikTok";
  if (platform === "youtube") return "YouTube";
  if (platform === "all") return "All";
  return "Other";
}

function shiftBefore(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function axisCount(value: number) {
  if (value > 0 && value < 1) return value.toFixed(1);
  return compactCount(value);
}

function axisDollars(dollars: number) {
  const amount = Math.max(0, dollars);
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  if (amount >= 100) return `$${Math.round(amount)}`;
  if (amount > 0 && amount < 1) return `$${amount.toFixed(2)}`;
  return `$${Math.round(amount)}`;
}

function sum<T>(items: T[], value: (item: T) => number) {
  return items.reduce((total, item) => total + value(item), 0);
}

function Card({ label, value, detail, current, previous, points = false }: { label: string; value: string; detail: string; current: number; previous: number; points?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] bg-white p-[18px]">
      <span className="text-sm text-[#4A3A37]">{label}</span>
      <span className="text-[30px] font-medium tracking-tight">{value}</span>
      <Delta current={current} previous={previous} points={points} />
      <span className="text-[13px] text-[#6B5A57]">{detail}</span>
    </div>
  );
}

function LabStat({ label, value, detail, current, previous }: { label: string; value: string; detail: string; current: number; previous: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
      <span className="text-sm text-[#4A3A37]">{label}</span>
      <span className="text-2xl font-medium tracking-tight">{value}</span>
      <Delta current={current} previous={previous} />
      <span className="text-[13px] text-[#6B5A57]">{detail}</span>
    </div>
  );
}

function Legend({ mark, color, label, value }: { mark: "line" | "dashed" | "square"; color: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {mark === "square" ? <span className="h-3 w-3 rounded-[3px]" style={{ background: color }} /> : <span className={`h-[3px] w-[18px] rounded-sm ${mark === "dashed" ? "border-t-2 border-dashed" : ""}`} style={mark === "dashed" ? { borderColor: color } : { background: color }} />}
      {label} <b className="text-ink">{value}</b>
    </span>
  );
}

function Chart({ label, left, right, leftClass, rightClass, height, start, middle, end, children }: { label: string; left: string[]; right: string[]; leftClass: string; rightClass: string; height: number; start: string; middle: string; end: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <div aria-hidden="true" className={`flex w-12 flex-col justify-between text-right text-xs ${leftClass}`} style={{ height }}>{left.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
      <div className="min-w-0 flex-1">
        <svg role="img" aria-label={label} viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" className="block w-full overflow-visible" style={{ height }}>{children}</svg>
        <div className="flex justify-between pt-1.5 text-xs text-[#6B5A57]"><span>{start}</span><span>{middle}</span><span>{end}</span></div>
      </div>
      {right.some(Boolean) ? <div aria-hidden="true" className={`flex w-12 flex-col justify-between text-xs ${rightClass}`} style={{ height }}>{right.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] text-[#4A3A37]">{label}</span>
      <span className="text-xl font-medium">{value}</span>
    </div>
  );
}
