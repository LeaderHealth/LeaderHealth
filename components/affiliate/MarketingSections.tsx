"use client";

import { useState, type ReactNode } from "react";
import { disconnectSocialAction } from "@/app/affiliates/social-actions";
import { currentReportMonth, formatReportMonth, networkLabel, reportMetricsBlank, type SocialNetwork } from "@/lib/affiliate/marketing";
import type { SocialAccountView } from "@/lib/affiliate/social-store";
import type { WebsiteMonthReport } from "@/lib/affiliate/website-report";

const MONTHS_ON_SCREEN = 3;
const MONTHS_AVAILABLE = 12;
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SocialConnections({
  metaReady,
  tiktokReady,
  youtubeReady,
  accounts,
}: {
  metaReady: boolean;
  tiktokReady: boolean;
  youtubeReady: boolean;
  accounts: SocialAccountView[];
}) {
  const facebook = accounts.filter((account) => account.network === "facebook");
  const instagram = accounts.filter((account) => account.network === "instagram");
  const tiktok = accounts.filter((account) => account.network === "tiktok");

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
        ready={metaReady}
        accounts={instagram}
        connectHref="/api/affiliate/social/meta/start"
        unsetLabel="Instagram reporting is not set up."
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            Instagram connects with the Facebook Page. A professional account linked to that Page is included. Disconnecting Facebook removes it.{" "}
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
        ready={false}
        accounts={[]}
        connectHref=""
        unsetLabel={youtubeReady ? "YouTube reporting is not available yet." : "YouTube reporting is not set up."}
        detail={
          <p className="mt-2 text-sm leading-relaxed text-brown">
            {youtubeReady ? "YouTube reporting stays off until Google approves the app." : "YouTube reporting is not set up."}
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
  disconnect?: "facebook" | "tiktok";
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
  const shown = recentWebsiteMonths(months);
  const columns = shown.map((month) => ({ id: month.month, label: shortReportMonth(month.month) }));
  return (
    <section className="mt-4 border-t border-rose/60 pt-4">
      <h3 className="text-lg">Website traffic</h3>
      <p className="mt-1 text-sm text-brown">Visits come from tracking links. A promo code is counted when the link carries that code, or when a paid order uses it.</p>
      <MonthCompare
        months={columns}
        rows={[
          { label: "Tracking link visits", values: shown.map((month) => month.trackingVisits) },
          { label: "Tracking link orders", values: shown.map((month) => month.trackingOrders) },
          { label: "Promo link visits", values: shown.map((month) => month.promoVisits) },
          { label: "Promo code orders", values: shown.map((month) => month.promoOrders) },
          { label: "Promo code", values: shown.map((month) => month.promos.map((promo) => promo.code).join(", ") || "—") },
        ]}
      />
    </section>
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
  if (sections.length === 0) return <p className="mt-4 text-sm text-brown">No connected social account yet.</p>;
  return (
    <div className="mt-4 space-y-6">
      {sections.map((section) => (
        <section key={`${section.network}-${section.accountId}`} className="border-t border-rose/60 pt-4">
          <h3 className="text-lg">
            {networkLabel(section.network)} · {section.accountName}
          </h3>
          <MonthCompare
            months={section.months.map((month) => ({ id: month.month, label: shortReportMonth(month.month) }))}
            rows={[
              { label: "Impressions", values: section.months.map((month) => month.impressions) },
              { label: "Reach", values: section.months.map((month) => month.reach) },
              { label: "Likes", values: section.months.map((month) => month.likes) },
              { label: "Comments", values: section.months.map((month) => month.comments) },
              { label: "Shares", values: section.months.map((month) => month.shares) },
              { label: "Saves", values: section.months.map((month) => month.saves) },
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
    filled.push(byMonth.get(month) ?? { month, trackingVisits: 0, trackingOrders: 0, promoVisits: 0, promoOrders: 0, promos: [] });
    if (filled.length > 36) break;
  }
  return filled;
}

function MonthCompare({ months, rows }: { months: { id: string; label: string }[]; rows: { label: string; values: (number | string)[] }[] }) {
  const [page, setPage] = useState(0);
  if (months.length === 0) return <p className="mt-3 text-sm text-brown">No months yet.</p>;
  const pageCount = Math.ceil(months.length / MONTHS_ON_SCREEN);
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * MONTHS_ON_SCREEN;
  const visible = months.slice(start, start + MONTHS_ON_SCREEN);
  const last = visible[visible.length - 1];
  return (
    <div className="mt-3">
      {pageCount > 1 ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className={`${quietClass} disabled:cursor-not-allowed disabled:opacity-40`}>
            Newer
          </button>
          <p className="text-sm text-brown">
            {visible[0]?.label} – {last?.label}
          </p>
          <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className={`${quietClass} disabled:cursor-not-allowed disabled:opacity-40`}>
            Older
          </button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white py-2 pr-4 text-left">
                <span className="sr-only">Stat</span>
              </th>
              {visible.map((month) => (
                <th key={month.id} className="whitespace-nowrap px-3 py-2 text-right font-semibold">
                  {month.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-rose/60">
                <th className="sticky left-0 bg-white py-3 pr-4 text-left font-normal text-brown">{row.label}</th>
                {visible.map((month, index) => {
                  const value = row.values[start + index];
                  return (
                    <td key={month.id} className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums">
                      {typeof value === "number" ? count(value) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
