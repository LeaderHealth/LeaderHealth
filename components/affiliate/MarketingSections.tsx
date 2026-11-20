"use client";

import { useState, type ReactNode } from "react";
import { SlidingTabs } from "./SlidingTabs";
import { disconnectSocialAction } from "@/app/affiliates/social-actions";
import { currentReportMonth, formatReportMonth, networkLabel, reportMetricsBlank, type SocialNetwork } from "@/lib/affiliate/marketing";
import type { SocialAccountView } from "@/lib/affiliate/social-store";
import type { WebsiteMonthReport } from "@/lib/affiliate/website-report";

const MONTHS_ON_SCREEN = 6;
const MONTHS_AVAILABLE = 12;
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SocialConnections({
  metaReady,
  instagramReady,
  tiktokReady,
  youtubeReady,
  accounts,
}: {
  metaReady: boolean;
  instagramReady: boolean;
  tiktokReady: boolean;
  youtubeReady: boolean;
  accounts: SocialAccountView[];
}) {
  const facebook = accounts.filter((account) => account.network === "facebook");
  const instagram = accounts.filter((account) => account.network === "instagram");
  const tiktok = accounts.filter((account) => account.network === "tiktok");
  const youtube = accounts.filter((account) => account.network === "youtube");

  return (
    <div className="grid gap-4">
      <NetworkRow
        title="Facebook"
        ready={metaReady}
        accounts={facebook}
        connectHref="/api/affiliate/social/meta/start"
        unsetLabel="Facebook reporting is not set up."
        disconnect="facebook"
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            <a href="/affiliates/privacy#facebook-instagram-accounts" className="underline underline-offset-4">
              Affiliate Privacy Policy
            </a>
          </p>
        }
      />
      <NetworkRow
        title="Instagram"
        ready={instagramReady}
        accounts={instagram}
        connectHref="/api/affiliate/social/instagram/start"
        unsetLabel="Instagram reporting is not set up."
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            Instagram opens its own login. Use a professional Instagram account.{" "}
            <a href="/affiliates/privacy#facebook-instagram-accounts" className="underline underline-offset-4">
              Affiliate Privacy Policy
            </a>
          </p>
        }
      />
      <NetworkRow
        title="TikTok"
        ready={tiktokReady}
        accounts={tiktok}
        connectHref="/api/affiliate/social/tiktok/start"
        unsetLabel="TikTok reporting is not set up."
        disconnect="tiktok"
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            Connecting is optional. Leader Health reads the TikTok display name and the list of videos — each caption, link, view count, like count, comment count, and share count — to show which videos include this affiliate’s tracking link. Leader Health does not post to TikTok.{" "}
            <a href="/affiliates/privacy#tiktok-accounts" className="underline underline-offset-4">
              Affiliate Privacy Policy
            </a>
          </p>
        }
      />
      <NetworkRow
        title="YouTube"
        ready={youtubeReady}
        accounts={youtube}
        connectHref="/api/affiliate/social/youtube/start"
        unsetLabel="YouTube reporting is not set up."
        disconnect="youtube"
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            Connecting is optional. Leader Health reads the YouTube channel name. Leader Health does not post to YouTube.{" "}
            <a href="/affiliates/privacy#youtube-accounts" className="underline underline-offset-4">
              Affiliate Privacy Policy
            </a>
          </p>
        }
      />
    </div>
  );
}

function connectionStatus(accounts: SocialAccountView[]) {
  if (accounts.some((account) => account.needsReconnect)) return "Reconnect required";
  if (accounts.length > 0) return "Connected";
  return "Not connected";
}

function NetworkRow({
  title,
  ready,
  accounts,
  connectHref,
  unsetLabel,
  detail,
  disconnect,
}: {
  title: string;
  ready: boolean;
  accounts: SocialAccountView[];
  connectHref: string;
  unsetLabel: string;
  detail?: ReactNode;
  disconnect?: "facebook" | "tiktok" | "youtube";
}) {
  const status = connectionStatus(accounts);
  const offerConnect = ready && status !== "Connected";
  return (
    <div className="rounded-2xl bg-background px-4 py-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-brown">{status}</p>
      {detail}
      {accounts.length > 0 ? <p className="mt-2 text-sm text-brown">{accounts.map((account) => account.accountName).join(", ")}</p> : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {offerConnect ? (
          <a href={connectHref} className={buttonClass}>
            Connect {title}
          </a>
        ) : null}
        {ready && (disconnect === "tiktok" || disconnect === "youtube") && status === "Connected" ? (
          <a href={connectHref} className={quietClass}>
            {disconnect === "youtube" ? "Change YouTube channel" : "Change TikTok account"}
          </a>
        ) : null}
        {!ready && accounts.length === 0 ? (
          <button type="button" disabled className={`${buttonClass} cursor-not-allowed opacity-70`}>
            {unsetLabel}
          </button>
        ) : null}
        {disconnect && accounts.length > 0 ? (
          <form action={disconnectSocialAction}>
            <input type="hidden" name="network" value={disconnect} />
            <button type="submit" className={quietClass}>
              Disconnect {title}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function WebsiteReportSection({ months }: { months: WebsiteMonthReport[] }) {
  const shown = activeWebsiteMonths(months);
  const [view, setView] = useState<"visits" | "orders">("visits");
  const columns = shown.map((month) => ({ id: month.month, label: shortReportMonth(month.month) }));
  const visits = view === "visits";
  return (
    <section className="mt-6">
      <h3 className="text-lg">Website traffic</h3>
      <p className="mt-1 text-sm text-brown">Visits come from tracking links. A promo code is counted when the link carries that code, or when a paid order uses it.</p>
      <div className="mt-4">
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
      <MonthChart
        months={columns}
        series={
          visits
            ? [
                { id: "tracking", label: "Tracking link", color: "#33130F", values: shown.map((month) => month.trackingVisits) },
                { id: "promo", label: "Promo link", color: "#E39A93", values: shown.map((month) => month.promoVisits) },
              ]
            : [
                { id: "tracking", label: "Tracking link", color: "#33130F", values: shown.map((month) => month.trackingOrders) },
                { id: "promo-code", label: "Promo code", color: "#A8706A", values: shown.map((month) => month.promoOrders) },
                { id: "promo-link", label: "Promo tracking link", color: "#E39A93", values: shown.map((month) => month.promoLinkOrders) },
              ]
        }
      />
    </section>
  );
}

export type ReportPromo = {
  code: string;
  status?: "Active" | "Inactive" | "Expired";
};

export function reportPromos(assigned: readonly ReportPromo[], months: readonly WebsiteMonthReport[]) {
  const byCode = new Map<string, ReportPromo>();
  for (const promo of assigned) {
    const code = promo.code.trim();
    if (code) byCode.set(code.toLowerCase(), { code, status: promo.status });
  }
  for (const month of months) {
    for (const promo of month.promos) {
      const code = promo.code.trim();
      if (code && !byCode.has(code.toLowerCase())) byCode.set(code.toLowerCase(), { code });
    }
  }
  return [...byCode.values()];
}

export function ReportPromoCodes({ promos }: { promos: readonly ReportPromo[] }) {
  if (promos.length === 0) {
    return (
      <div className="mt-4 flex min-h-12 items-center rounded-full bg-background px-4 text-sm text-brown">
        Promo code <span className="ml-3 font-medium text-ink">None assigned</span>
      </div>
    );
  }
  return (
    <div className="mt-4 grid gap-2">
      {promos.map((promo) => (
        <ReportPromoRow key={promo.code} promo={promo} />
      ))}
    </div>
  );
}

function ReportPromoRow({ promo }: { promo: ReportPromo }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(promo.code);
      ok = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = promo.code;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      ok = document.execCommand("copy");
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const statusClass = promo.status === "Active"
    ? "bg-[#E6F4EC] text-[#1D6340]"
    : promo.status
      ? "bg-background text-brown"
      : "";

  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-full bg-background px-3 py-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="pl-1 text-sm text-brown">Promo code</span>
        <span className="inline-flex items-center rounded-full bg-rose px-3 py-1 text-sm font-semibold text-ink">{promo.code}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-8 items-center rounded-full border border-[#CDBDBA] bg-white px-3.5 text-sm font-medium text-ink hover:bg-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {promo.status ? (
        <div className="flex items-center gap-3 pr-1">
          <span className="text-sm text-brown">From Gen Health</span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{promo.status}</span>
        </div>
      ) : null}
    </div>
  );
}

function count(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function MarketingAccountSections({
  sections,
}: {
  sections: {
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
  }[];
}) {
  if (sections.length === 0) return null;
  return (
    <div className="mt-4 space-y-6">
      {sections.map((section) => (
        <section key={`${section.network}-${section.accountId}`} className="border-t border-rose/60 pt-4">
          <h3 className="text-lg">
            {networkLabel(section.network)} · {section.accountName}
          </h3>
          <MonthChart
            months={section.months.map((month) => ({ id: month.month, label: shortReportMonth(month.month) }))}
            series={[
              { id: "impressions", label: "Impressions", color: "#33130F", values: section.months.map((month) => month.impressions) },
              { id: "reach", label: "Reach", color: "#33130F", values: section.months.map((month) => month.reach) },
              { id: "likes", label: "Likes", color: "#33130F", values: section.months.map((month) => month.likes) },
              { id: "comments", label: "Comments", color: "#33130F", values: section.months.map((month) => month.comments) },
              { id: "shares", label: "Shares", color: "#33130F", values: section.months.map((month) => month.shares) },
              { id: "saves", label: "Saves", color: "#33130F", values: section.months.map((month) => month.saves) },
            ]}
          />
          {section.months.length > 0 && section.months.every((month) => reportMetricsBlank(month)) ? (
            <p className="mt-3 text-sm text-brown">The post must contain the tracking link, or its URL must be submitted.</p>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function shortReportMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return formatReportMonth(month);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function shiftMonth(month: string, delta: number) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function recentWebsiteMonths(months: WebsiteMonthReport[]) {
  const byMonth = new Map(months.map((month) => [month.month, month]));
  const newest = months[0]?.month ?? currentReportMonth();
  const oldestData = months[months.length - 1]?.month ?? newest;
  const oldestWindow = shiftMonth(newest, -(MONTHS_AVAILABLE - 1));
  const oldest = oldestData < oldestWindow ? oldestData : oldestWindow;
  const filled: WebsiteMonthReport[] = [];
  for (let month = newest; month >= oldest; month = shiftMonth(month, -1)) {
    filled.push(byMonth.get(month) ?? { month, trackingVisits: 0, trackingOrders: 0, promoVisits: 0, promoOrders: 0, promoLinkOrders: 0, promos: [] });
    if (filled.length > 36) break;
  }
  return filled;
}

function monthHasTraffic(month: WebsiteMonthReport) {
  return month.trackingVisits + month.trackingOrders + month.promoVisits + month.promoOrders + month.promoLinkOrders > 0 || month.promos.length > 0;
}

function activeWebsiteMonths(months: WebsiteMonthReport[]) {
  const filled = recentWebsiteMonths(months);
  let last = filled.length - 1;
  while (last > 0 && !monthHasTraffic(filled[last])) last -= 1;
  return filled.slice(0, last + 1);
}

function MonthChart({
  months,
  series,
  notes = [],
}: {
  months: { id: string; label: string }[];
  series: { id: string; label: string; color: string; values: number[] }[];
  notes?: string[];
}) {
  const [page, setPage] = useState(0);
  const [metric, setMetric] = useState(series[0]?.id ?? "");
  if (months.length === 0) return <p className="mt-3 text-sm text-brown">No months yet.</p>;
  const pageCount = Math.ceil(months.length / MONTHS_ON_SCREEN);
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * MONTHS_ON_SCREEN;
  const windowMonths = [...months.slice(start, start + MONTHS_ON_SCREEN)].reverse();
  const drawn = series.length > 3 ? series.filter((item) => item.id === (series.some((entry) => entry.id === metric) ? metric : series[0]?.id)) : series;
  const bars = windowMonths.map((month) => {
    const index = months.findIndex((item) => item.id === month.id);
    return { ...month, axis: axisMonth(month.id), values: drawn.map((item) => item.values[index] ?? 0), note: notes[index] ?? "" };
  });
  const peak = Math.max(1, ...bars.flatMap((month) => month.values));
  const newest = windowMonths[windowMonths.length - 1];
  const oldest = windowMonths[0];
  const codes = [...new Set(bars.map((month) => month.note).filter(Boolean))];
  const promoLine = codes.length === 0 ? "" : codes.length === 1 ? `Promo code: ${codes[0]}` : bars.filter((month) => month.note).map((month) => `${month.label} ${month.note}`).join(" · ");
  return (
    <div className="mt-4">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {series.length > 3 ? (
          <div role="group" aria-label="Metric" className="flex flex-wrap gap-2">
            {series.map((item) => {
              const selected = drawn[0]?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMetric(item.id)}
                  className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium ${selected ? "bg-ink text-white" : "border border-[#CDBDBA] bg-white text-ink"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 text-sm text-brown">
            {drawn.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: item.color }} />
                {item.label}
                <span className="font-medium text-ink">{count(item.values.slice(start, start + MONTHS_ON_SCREEN).reduce((sum, value) => sum + value, 0))}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-sm text-brown">{oldest && newest && oldest.id !== newest.id ? `${oldest.label} – ${newest.label}` : newest?.label}</p>
          {pageCount > 1 ? (
            <>
              <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className={`${quietClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Older
              </button>
              <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className={`${quietClass} disabled:cursor-not-allowed disabled:opacity-40`}>
                Newer
              </button>
            </>
          ) : null}
        </div>
      </div>
      <p className="sr-only">
        {oldest?.label} through {newest?.label}. {drawn.map((item) => `${item.label} ${count(item.values.slice(start, start + MONTHS_ON_SCREEN).reduce((sum, value) => sum + value, 0))}`).join(". ")}.
      </p>
      <div className="flex items-end gap-4 sm:gap-10">
        {bars.map((month) => (
          <div key={month.id} className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="flex h-56 w-full items-end justify-center gap-3">
              {month.values.map((value, index) => (
                <div key={drawn[index]?.id ?? index} className={`flex flex-col items-center justify-end ${month.values.length > 2 ? "w-6 sm:w-8" : "w-8 sm:w-11"}`}>
                  <span className="mb-2 text-sm font-medium tabular-nums">{count(value)}</span>
                  {value > 0 ? (
                    <div className="w-full rounded-t-lg" style={{ height: Math.max(12, Math.round((value / peak) * 176)), background: drawn[index]?.color ?? "#33130F" }} />
                  ) : (
                    <div className="h-0.5 w-full rounded-full bg-[#E8DEDC]" />
                  )}
                </div>
              ))}
            </div>
            <span className="pb-3 text-sm text-brown">{month.axis}</span>
          </div>
        ))}
      </div>
      {promoLine ? <p className="mt-5 text-sm text-brown">{promoLine}</p> : null}
    </div>
  );
}

function axisMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}
