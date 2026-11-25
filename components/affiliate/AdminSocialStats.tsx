"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  chartMax,
  compactCount,
  daySpan,
  deltaLabel,
  linePath,
  postEngagement,
  postsIn,
  rangeLabel,
  shortDay,
  type BoardPlatform,
  type StatsBoardPost,
} from "@/lib/affiliate/stats-board";

export type AdminSocialPost = StatsBoardPost & { code: string; name: string };

const ranges = ["7", "30", "90"] as const;
const platforms = [
  ["all", "All"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
] as const;
const selectedChip = "border-ink bg-ink text-white";
const quietChip = "border-[#CDBDBA] bg-white text-ink";

function shiftBefore(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function sum(posts: AdminSocialPost[], value: (post: AdminSocialPost) => number) {
  return posts.reduce((total, post) => total + value(post), 0);
}

function platformLabel(platform: BoardPlatform) {
  return platforms.find(([id]) => id === platform)?.[1] ?? "All";
}

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

export function AdminSocialStats({ today, posts }: { today: string; posts: AdminSocialPost[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]>("30");
  const [platform, setPlatform] = useState<BoardPlatform>("all");
  const days = Number(range);
  const currentDays = useMemo(() => daySpan(today, days), [today, days]);
  const previousDays = useMemo(() => daySpan(shiftBefore(currentDays[0] ?? today), days), [currentDays, today, days]);
  const current = postsIn(posts, currentDays, platform) as AdminSocialPost[];
  const previous = postsIn(posts, previousDays, platform) as AdminSocialPost[];
  const views = sum(current, (post) => post.views);
  const previousViews = sum(previous, (post) => post.views);
  const engagements = sum(current, postEngagement);
  const previousEngagements = sum(previous, postEngagement);
  const rate = views > 0 ? (engagements / views) * 100 : 0;
  const previousRate = previousViews > 0 ? (previousEngagements / previousViews) * 100 : 0;
  const viewSeries = currentDays.map((day) => sum(current.filter((post) => post.postedOn === day), (post) => post.views));
  const engagementSeries = currentDays.map((day) => sum(current.filter((post) => post.postedOn === day), postEngagement));
  const viewMax = chartMax(viewSeries);
  const engagementMax = chartMax(engagementSeries);
  const viewLine = linePath(viewSeries, viewMax, 10, 190);
  const likes = sum(current, (post) => post.likes);
  const comments = sum(current, (post) => post.comments);
  const shares = sum(current, (post) => post.shares);
  const saves = sum(current, (post) => post.saves);
  const breakdown = [
    ["Likes", likes],
    ["Comments", comments],
    ["Shares", shares],
    ["Saves", saves],
  ] as const;
  const affiliates = [...current.reduce((rows, post) => {
    const row = rows.get(post.code) ?? { code: post.code, name: post.name, posts: 0, views: 0, engagements: 0 };
    row.posts += 1;
    row.views += post.views;
    row.engagements += postEngagement(post);
    rows.set(post.code, row);
    return rows;
  }, new Map<string, { code: string; name: string; posts: number; views: number; engagements: number }>()).values()].sort((a, b) => b.views - a.views || b.engagements - a.engagements || a.name.localeCompare(b.name));
  const start = currentDays[0] ?? today;
  const middle = currentDays[Math.floor(currentDays.length / 2)] ?? today;
  const end = currentDays.at(-1) ?? today;
  const versus = `vs. previous ${days} days`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <h2 className="text-2xl">Social media</h2>
          <p className="mt-2 max-w-2xl text-sm text-brown">Views and engagements on published posts across affiliates. These numbers don’t change payouts.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <Chip key={item} pressed={range === item} onClick={() => setRange(item)}>{`${item} days`}</Chip>
            ))}
          </div>
          <span className="text-[13px] text-[#6B5A57]">{rangeLabel(start, end)}</span>
        </div>
      </div>

      <section aria-label="Social media totals" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Views" value={compactCount(views)} detail={versus} current={views} previous={previousViews} />
        <Tile label="Engagements" value={compactCount(engagements)} detail="Likes, comments, shares, saves" current={engagements} previous={previousEngagements} />
        <Tile label="Engagement rate" value={`${rate.toFixed(1)}%`} detail="Engagements ÷ views" current={rate} previous={previousRate} points />
        <Tile label="Published posts" value={compactCount(current.length)} detail={versus} current={current.length} previous={previous.length} />
      </section>

      <section aria-labelledby="admin-social-chart" className="flex flex-col gap-[18px] rounded-3xl bg-white px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="admin-social-chart" className="flex-1 text-xl font-semibold">Views and engagements</h3>
          <div role="group" aria-label="Platform" className="flex flex-wrap gap-2">
            {platforms.map(([id, label]) => (
              <Chip key={id} pressed={platform === id} onClick={() => setPlatform(id)}>{label}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[#4A3A37]">
          <span className="inline-flex items-center gap-2"><span className="h-[3px] w-[18px] rounded-sm bg-ink" />Views <b className="text-ink">{compactCount(views)}</b></span>
          <span className="inline-flex items-center gap-2"><span className="h-0 w-[18px] border-t-2 border-dashed border-[#D9534A]" />Engagements <b className="text-ink">{compactCount(engagements)}</b></span>
        </div>
        <div className="flex gap-2.5">
          <div aria-hidden="true" className="flex h-[200px] w-12 flex-col justify-between text-right text-xs text-ink">
            <span>{compactCount(viewMax)}</span>
            <span>{compactCount(viewMax / 2)}</span>
            <span>0</span>
          </div>
          <div className="min-w-0 flex-1">
            <svg role="img" aria-label={`Daily views and engagements, ${platform === "all" ? "all platforms" : platformLabel(platform)}`} viewBox="0 0 1000 200" preserveAspectRatio="none" className="block h-[200px] w-full overflow-visible">
              <line x1="0" y1="10" x2="1000" y2="10" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#F0E8E6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="190" x2="1000" y2="190" stroke="#DCCFCC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {viewLine ? <path d={`${viewLine} L1000 190 L0 190 Z`} fill="#33130F" fillOpacity="0.06" /> : null}
              {viewLine ? <path d={viewLine} fill="none" stroke="#33130F" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
              <path d={linePath(engagementSeries, engagementMax, 10, 190)} fill="none" stroke="#D9534A" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="flex justify-between pt-1.5 text-xs text-[#6B5A57]">
              <span>{shortDay(start)}</span>
              <span>{shortDay(middle)}</span>
              <span>{shortDay(end)}</span>
            </div>
          </div>
          <div aria-hidden="true" className="flex h-[200px] w-12 flex-col justify-between text-xs text-[#D9534A]">
            <span>{compactCount(engagementMax)}</span>
            <span>{compactCount(engagementMax / 2)}</span>
            <span>0</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {breakdown.map(([label, value]) => {
            const share = engagements > 0 ? Math.round((value / engagements) * 100) : 0;
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
        <p className="text-sm text-[#6B5A57]">Latest numbers on posts published in this range. Days without a published post stay at zero.</p>
      </section>

      <section aria-labelledby="admin-social-affiliates" className="rounded-3xl bg-white px-4 py-6 sm:px-6">
        <h3 id="admin-social-affiliates" className="text-xl font-semibold">By affiliate</h3>
        {affiliates.length === 0 ? (
          <p className="mt-4 text-[15px] text-[#6B5A57]">No published posts in this date range.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E8DEDC] text-left text-xs font-semibold uppercase tracking-wide text-[#6B5A57]">
                <th className="px-2 py-2 font-semibold">Affiliate</th>
                <th className="px-2 py-2 text-right font-semibold">Posts</th>
                <th className="px-2 py-2 text-right font-semibold">Views</th>
                <th className="px-2 py-2 text-right font-semibold">Engagements</th>
                <th className="px-2 py-2 text-right font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.code} className="border-b border-[#F0E8E6]">
                  <td className="px-2 py-3 font-semibold">
                    <Link href={`/admin/affiliates/accounts?code=${encodeURIComponent(affiliate.code)}`} className="underline-offset-4 hover:underline">
                      {affiliate.name}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{compactCount(affiliate.posts)}</td>
                  <td className="px-2 py-3 text-right font-semibold tabular-nums">{compactCount(affiliate.views)}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{compactCount(affiliate.engagements)}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{affiliate.views > 0 ? `${((affiliate.engagements / affiliate.views) * 100).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, detail, current, previous, points = false }: { label: string; value: string; detail: string; current: number; previous: number; points?: boolean }) {
  const delta = deltaLabel(current, previous, points);
  return (
    <div className="flex flex-col gap-1.5 rounded-[20px] bg-white p-[18px]">
      <span className="text-sm text-[#4A3A37]">{label}</span>
      <span className="text-[30px] font-medium tracking-tight">{value}</span>
      <span className={`self-start rounded-full px-2 py-0.5 text-[13px] font-semibold ${delta.up ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]"}`}>{delta.text}</span>
      <span className="text-[13px] text-[#6B5A57]">{detail}</span>
    </div>
  );
}
