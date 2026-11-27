import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { accountColumnTotals } from "@/lib/affiliate/account-figures";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { loadDeliverablePayments, type DeliverablePayment } from "@/lib/affiliate/deliverable-payments";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { memo } from "@/lib/affiliate/memo";
import { loadAllWebsitePayouts, loadMarketingEvents } from "@/lib/affiliate/marketing-events";
import { eventPeriod, rateFor, socialMonthCents, standingViewRateCents, websiteMonthAmount, type PaymentRates } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { currentPayoutPeriod, formatPayoutMonth, normalizePayoutPeriod, payoutLines, payoutPeriod } from "@/lib/affiliate/payouts";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { loadPayoutRecords, type PayoutRecord } from "@/lib/affiliate/payouts";
import { reportHandledAffiliateError } from "@/lib/affiliate/report";
import { earnsLabCommission, remainingSalesCents } from "@/lib/affiliate/refunds";
import {
  AffiliateStoreError,
  AFFILIATE_MAX_AGE,
  alignAffiliateRecordTotals,
  loadAffiliateOverview,
  loadClickCounts,
  loadUncommissionedPendingOrders,
  type AffiliateSummary,
  type ConversionSummary,
} from "@/lib/affiliate/store";
import { AccountAgreement } from "@/components/affiliate/AccountAgreement";
import { SlidingTabs, TabPanel } from "@/components/affiliate/SlidingTabs";
import { AccountReports } from "@/components/affiliate/AccountReports";
import { AccountTracking } from "@/components/affiliate/AccountTracking";
import { loadAffiliateAgreements, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { agreementMonthEarning, agreementMonthPeriods } from "@/lib/affiliate/agreement-earnings";
import { loadAllAgreementPayouts, type AgreementPayoutRow } from "@/lib/affiliate/agreement-payouts";
import { agreementEditorState, agreementSeed, presentAgreement } from "@/lib/affiliate/agreement-view";
import { agreementSlotRows, agreementSlotState, type AgreementBoardPost } from "@/lib/affiliate/post-agreement";
import { AGREEMENT_PLATFORMS, agreementPostTotal, type AgreementPlatform } from "@/lib/affiliate/agreement-partnership";
import { visibleReportSections } from "@/lib/affiliate/marketing";
import { loadMarketingReports, type MarketingReport } from "@/lib/affiliate/marketing-store";
import {
  loadContentSubmissions,
  refreshDueMetrics,
  type ContentSubmission,
} from "@/lib/affiliate/post-review";
import { loadSocialAccounts, reportingAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";
import { loadWebsiteEvents, websiteReportMonths, type WebsiteOrder, type WebsiteVisit } from "@/lib/affiliate/website-report";
import type { AffiliatePromoDetail } from "@/components/affiliate/AffiliatePromoCodes";
import { listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { AccountActions } from "@/components/affiliate/AccountActions";
import { replaceAgreementAction } from "../../agreement-actions";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Affiliate accounts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusKey = "active" | "invited" | "inactive";

const STATUS: Record<StatusKey, { label: string; pill: string; dot: string }> = {
  active: { label: "Active", pill: "bg-[#DDF0E4] text-[#1D6340]", dot: "bg-[#1D6340]" },
  invited: { label: "Invited", pill: "bg-[#FBEFD6] text-[#7A4E00]", dot: "bg-[#C98A1A]" },
  inactive: { label: "Inactive", pill: "bg-[#EFEAE9] text-[#4A3A37]", dot: "bg-[#B3A5A2]" },
};

const FILTERS: { id: "all" | StatusKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "invited", label: "Invited" },
  { id: "inactive", label: "Inactive" },
];

const GRID =
  "grid grid-cols-[minmax(9.5rem,1.7fr)_minmax(8.5rem,1.25fr)_minmax(5.5rem,0.8fr)_minmax(6.75rem,0.9fr)_minmax(5.25rem,0.75fr)_minmax(5.25rem,0.75fr)_minmax(5rem,0.75fr)_minmax(7.5rem,1fr)_minmax(6.5rem,0.9fr)_6.5rem] gap-x-2";
const muted = "text-[#B3A5A2]";
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const textLink = `text-sm font-medium text-ink underline underline-offset-4 hover:text-brown ${focusRing}`;

function statusKey(affiliate: AffiliateSummary): StatusKey {
  if (!affiliate.active) return "inactive";
  if (affiliate.pendingInvite) return "invited";
  return "active";
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function shortDate(value: string | null, withYear = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" }).format(date);
}

function sumKnown(values: (number | null)[]) {
  const known = values.filter((value): value is number => value != null);
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

function accountsHref(status: string, q: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  const text = params.toString();
  return text ? `/admin/affiliates/accounts?${text}` : "/admin/affiliates/accounts";
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center rounded-full bg-[#F3CFCB] font-semibold text-ink ${large ? "size-13 text-base" : "size-9.5 text-[13px]"}`}
    >
      {initials(name)}
    </span>
  );
}

const zero = "text-[#D3C8C5]";

function Amount({ cents, strong = false, group = false }: { cents: number | null; strong?: boolean; group?: boolean }) {
  return (
    <span role="cell" className={`text-right text-[15px] tabular-nums ${cents ? "" : zero} ${strong ? "font-semibold" : ""} ${group ? "border-l border-[#E8DEDC] pl-3" : ""}`}>
      {money(cents)}
    </span>
  );
}

function CompactStat({ label, value, empty = false, tone = "", hint = "" }: { label: string; value: string; empty?: boolean; tone?: string; hint?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-[#6B5A57]">
        {label}
        {hint ? <span className="mt-0.5 block text-[11px] font-normal leading-tight text-[#8A7A77]">{hint}</span> : null}
      </span>
      <span className={`text-[15px] tabular-nums ${empty ? zero : tone}`}>{value}</span>
    </span>
  );
}

function Count({ value, tone = "" }: { value: number | null; tone?: string }) {
  return (
    <span role="cell" className={`text-right text-[15px] tabular-nums ${value ? tone : zero}`}>
      {value == null ? "—" : value}
    </span>
  );
}

function MonthStep({ href, label, direction }: { href: string | null; label: string; direction: "previous" | "next" }) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "previous" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
  const className = `flex size-8 items-center justify-center rounded-full ${focusRing}`;
  if (!href) return <span aria-hidden="true" className={`${className} text-[#CDBDBA]`}>{icon}</span>;
  return (
    <Link href={href} aria-label={label} className={`${className} text-ink hover:bg-[#F7F3F2]`}>
      {icon}
    </Link>
  );
}

function Tile({ label, value, note, white = false, tone = "" }: { label: string; value: string; note: string; white?: boolean; tone?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${white ? "rounded-[20px] bg-white px-5 py-[18px]" : "rounded-[18px] bg-[#F7F3F2] px-4 py-3.5"}`}>
      <span className="text-sm text-[#4A3A37]">{label}</span>
      <span className={`text-[26px] font-medium tabular-nums ${tone}`}>{value}</span>
      <span className="text-[13px] text-[#6B5A57]">{note}</span>
    </div>
  );
}

function discountText(promo: PromoCodeRow) {
  if (promo.discount.kind === "price") return `Set price ${promo.discount.amount}`;
  return promo.discount.label;
}

function paidEarningsCents(code: string, payouts: PayoutRecord[]) {
  return payouts.reduce((sum, payout) => {
    if (payout.code !== code || payout.status !== "paid" || payout.paidCents == null) return sum;
    return sum + payout.paidCents;
  }, 0);
}

function payFormula(terms: [number, string][]) {
  const parts = terms.filter(([cents]) => cents > 0).map(([cents, unit]) => `${formatCents(cents)} / ${unit}`.replace(/ /g, "\u00a0"));
  return parts.length ? parts.join(" + ") : "Not set";
}

function money(cents: number | null) {
  return cents == null ? "—" : formatCents(cents);
}

function marketingPayText(rates: PaymentRates | null) {
  const cents = standingViewRateCents(rates);
  const fee = cents == null ? "Not set" : `${formatCents(cents)} per 1,000 views`;
  return LAB_COMMISSIONS_ENABLED ? `${fee}. Lab commission applies to lab orders.` : `${fee}. Lab commission is not active.`;
}

function editableAgreement(current: AffiliateAgreement | null, editable: boolean) {
  return editable ? current : null;
}

function shiftMonth(period: string, delta: number) {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthProgress(posts: ContentSubmission[], code: string, agreementId: string, required: number, kinds: { platform: string; type: string; count: number }[], period = currentPayoutPeriod()) {
  const board: AgreementBoardPost[] = posts
    .filter((post) => post.code === code)
    .map((post) => ({
      id: post.id,
      agreementId: post.agreementId,
      contentStatus: post.contentStatus,
      offerId: post.offerId,
      publishedAt: post.publishedAt,
      submittedAt: post.submittedAt,
      postingMonth: post.postingMonth,
      publicationStatus: post.publicationStatus,
      reviewNote: post.reviewNote,
      title: "",
      agreementSlot: post.agreementSlot,
      format: post.format,
      fileCount: post.files.length || (post.filePath ? 1 : 0),
      agreementPlatform: post.agreementPlatform,
      agreementPostType: post.agreementPostType,
      liveFixNote: post.liveFixNote,
    }));
  return { labels: agreementSlotRows(board, agreementId, period, required, kinds).map((row) => agreementSlotState(row.post)) };
}

function slotProgressNote(labels: readonly string[]) {
  const count = (name: string) => labels.filter((label) => label === name).length;
  const fix = count("Needs a fix");
  const changes = count("Changes requested");
  const parts = [
    count("Ready to publish") ? `${count("Ready to publish")} ready to publish` : "",
    count("In review") ? `${count("In review")} in review` : "",
    count("Checking the link") + count("Checking the update") ? `${count("Checking the link") + count("Checking the update")} checking the link` : "",
    changes ? `${changes} ${changes === 1 ? "change requested" : "changes requested"}` : "",
    count("Live but changes requested") ? `${count("Live but changes requested")} live with changes requested` : "",
    fix ? `${fix} ${fix === 1 ? "needs a fix" : "need a fix"}` : "",
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return count("Verified") ? "Verified" : "Not posted";
}

const complianceNotices: Record<string, string> = {
  "agreement-saved": "Draft saved.",
  "agreement-deleted": "Draft deleted.",
  "agreement-waiting": "Sent. It’s on their Contracts page to read and accept.",
  "agreement-signed": "Signed PDF stored. It’s active.",
  "agreement-accepted": "Marked as accepted. It’s active.",
  "agreement-withdrawn": "Withdrawn. You can edit it again.",
  "agreement-ended": "Agreement ended.",
  "agreement-replied": "Reply sent. They can accept the agreement or ask again.",
  "agreement-replaced": "A new draft was started. Earlier agreements stay on file.",
  "post-approved": "Post approved. The affiliate can add the live link.",
  "post-change": "Asked for a change.",
  "post-rejected": "Post rejected.",
  "post-checked": "Link marked as checked. Metrics stay blank until the platform can be read.",
  "counts-updated": "Post numbers updated.",
  fee: "View rate saved.",
};

function postPlatform(post: ContentSubmission): AgreementPlatform | null {
  if (post.format === "tiktok") return "TikTok";
  if (post.format === "instagram_post" || post.format === "instagram_reel") return "Instagram";
  let host = "";
  try {
    host = new URL(post.postUrl ?? "").hostname.toLowerCase().replace(/^(www|m)\./, "");
  } catch {
    return null;
  }
  if (host === "instagram.com") return "Instagram";
  if (host.endsWith("tiktok.com")) return "TikTok";
  if (host === "facebook.com" || host === "fb.watch") return "Facebook";
  if (host === "youtube.com" || host === "youtu.be") return "YouTube";
  return null;
}

function postKind(post: ContentSubmission) {
  if (post.format === "tiktok") return "Video";
  if (post.format === "instagram_reel") return "Reel";
  if (post.files.length > 1) return `Carousel · ${post.files.length}`;
  return post.files[0]?.contentType.startsWith("video/") ? "Video" : "Post";
}

function compactNumber(value: number | null) {
  return value == null ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default async function AffiliateAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; created?: string; invited?: string; resent?: string; code?: string; status?: string; q?: string; view?: string; platform?: string; step?: string; new?: string; month?: string; from?: string }>;
}) {
  const query = await searchParams;
  const fromRoi = query.from === "roi";
  const agreementsTab = query.view === "agreements";
  const postsTab = query.view === "posts";
  const trackingTab = query.view === "tracking";
  const actor = await adminSessionActor();
  const canInvite = Boolean(actor && adminHasFullAccess(actor));
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const complianceNotice = complianceNotices[query.notice ?? ""] ?? "";
  const created = normalizeAffiliateCode(query.created);
  const requestedCode = normalizeAffiliateCode(query.code);

  const [ratesResult, coreResult, unpaidResult, payoutResult, catalogResult] = await Promise.all([
    memo("payment-rates", () => loadPaymentRates()).then(
      (value) => value as PaymentRates | null,
      () => null,
    ),
    Promise.all([
      memo("admin-overview", () => loadAffiliateOverview()),
      memo("click-counts", () => loadClickCounts()),
    ]).then(
      (value) => ({ ok: true as const, value }),
      (caught: unknown) => ({ ok: false as const, caught }),
    ),
    memo("unpaid-orders", () => loadUncommissionedPendingOrders()).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    memo("payout-records:all", () => loadPayoutRecords()).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    memo("promo-codes", () => listPromoCodes()).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
  ]);
  const contentRates = ratesResult;
  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let clickCounts = new Map<string, number>();
  let loadError = "";
  if (coreResult.ok) {
    affiliates = coreResult.value[0].affiliates;
    conversions = coreResult.value[0].conversions;
    clickCounts = coreResult.value[1];
  } else {
    loadError = coreResult.caught instanceof AffiliateStoreError ? coreResult.caught.message : "Could not load affiliate records.";
  }
  const unpaidOrders = new Map<string, number>();
  let unpaidOrdersReady = false;
  let payouts: PayoutRecord[] = [];
  let payoutsReady = false;
  if (!loadError && unpaidResult.ok) {
    for (const code of unpaidResult.value.values()) unpaidOrders.set(code, (unpaidOrders.get(code) ?? 0) + 1);
      unpaidOrdersReady = true;
    }
  if (!loadError && payoutResult.ok) {
    payouts = payoutResult.value;
      payoutsReady = true;
  }
  const catalog: PromoCodeRow[] | null = catalogResult.ok ? catalogResult.value : null;
  const promoError = catalogResult.ok ? "" : "Promo codes are unavailable right now.";

  function promosFor(affiliate: AffiliateSummary): AffiliatePromoDetail[] {
    if (!catalog) return [];
    return promoRowsForAffiliate(catalog, affiliate.code).map((promo) => ({
      code: promo.code,
      mode: promo.mode,
      discount: discountText(promo),
      scope: promo.scope,
      usage: promo.usage,
      validUntil: promo.validUntil,
      status: promo.statusLabel,
    }));
  }

  function trackingPromos(affiliate: AffiliateSummary) {
    return promosFor(affiliate).map((promo) => ({
      code: promo.code,
      discount: promo.discount,
      url: affiliateTrackingLink(affiliate.code, promo.code),
    }));
  }

  const cookieDays = AFFILIATE_MAX_AGE / (60 * 60 * 24);

  function figures(affiliate: AffiliateSummary) {
    return accountColumnTotals({
      code: affiliate.code,
      clicks: clickCounts.get(affiliate.code) ?? 0,
      orders: conversions,
      unpaidOrders: unpaidOrdersReady ? (unpaidOrders.get(affiliate.code) ?? 0) : null,
      paidOutCents: payoutsReady ? paidEarningsCents(affiliate.code, payouts) : null,
    });
  }

  if (!loadError) {
    await Promise.all(
      affiliates.map(async (affiliate) => {
        const totals = figures(affiliate);
        try {
          await alignAffiliateRecordTotals(
            affiliate.code,
            {
              clickCount: affiliate.clickCount,
              paidConversionCount: affiliate.paidConversionCount,
              commissionCents: affiliate.commissionCents,
            },
            {
              clickCount: totals.visitors,
              paidConversionCount: totals.paidOrders,
              commissionCents: totals.earnedCents,
            },
          );
        } catch (caught) {
          reportHandledAffiliateError("[affiliate] total align failed", caught);
        }
      }),
    );
  }

  let marketingReports: MarketingReport[] = [];
  let socialAccounts: SocialAccountView[] = [];
  let websiteVisits: WebsiteVisit[] = [];
  let websiteOrders: WebsiteOrder[] = [];
  let reportsUnavailable = false;
  let agreements: AffiliateAgreement[] = [];
  let agreementsUnavailable = false;
  let agreementPayouts: AgreementPayoutRow[] = [];
  let contentPosts: ContentSubmission[] = [];
  let deliverablePayments: DeliverablePayment[] = [];
  let marketingEvents: Awaited<ReturnType<typeof loadMarketingEvents>> = [];
  let websiteSnapshots: Awaited<ReturnType<typeof loadAllWebsitePayouts>> = [];
  let postsUnavailable = false;
  let websiteUnavailable = false;
  if (!loadError) {
    const [reportsResult, agreementResult, postResult, websiteResult] = await Promise.all([
      Promise.all([
        memo("marketing-reports", () => loadMarketingReports()),
        memo("social-accounts", () => loadSocialAccounts()),
        memo("website-events", () => loadWebsiteEvents()),
      ]).then(
        (value) => ({ ok: true as const, value }),
        (caught: unknown) => ({ ok: false as const, caught }),
      ),
      Promise.all([
        memo("agreements:all", () => loadAffiliateAgreements()),
        memo("agreement-payouts:all", () => loadAllAgreementPayouts()),
      ]).then(
        (value) => ({ ok: true as const, value }),
        (caught: unknown) => ({ ok: false as const, caught }),
      ),
      memo("stats-refresh:all", () => refreshDueMetrics(undefined, 8))
        .catch((caught: unknown) => {
          reportHandledAffiliateError("[affiliate] post metrics refresh failed", caught);
        })
        .then(() =>
          Promise.all([
            memo("submissions:all", () => loadContentSubmissions()),
            memo("payments:all", () => loadDeliverablePayments()),
          ]),
        )
        .then(
          (value) => ({ ok: true as const, value }),
          (caught: unknown) => ({ ok: false as const, caught }),
        ),
      Promise.all([
        memo("marketing-events:all", () => loadMarketingEvents({ all: true })),
        memo("website-payouts:all", () => loadAllWebsitePayouts()),
      ]).then(
        (value) => ({ ok: true as const, value }),
        (caught: unknown) => ({ ok: false as const, caught }),
      ),
    ]);
    if (reportsResult.ok) {
      const [saved, connected, website] = reportsResult.value;
      marketingReports = saved;
      socialAccounts = connected;
      websiteVisits = website.visits;
      websiteOrders = website.orders;
    } else {
      reportsUnavailable = true;
      reportHandledAffiliateError("[affiliate] marketing report load failed", reportsResult.caught);
    }
    if (agreementResult.ok) {
      [agreements, agreementPayouts] = agreementResult.value;
    } else {
      agreementsUnavailable = true;
      reportHandledAffiliateError("[affiliate] agreement load failed", agreementResult.caught);
    }
    if (postResult.ok) {
      [contentPosts, deliverablePayments] = postResult.value;
    } else {
      postsUnavailable = true;
      reportHandledAffiliateError("[affiliate] post load failed", postResult.caught);
    }
    if (websiteResult.ok) {
      [marketingEvents, websiteSnapshots] = websiteResult.value;
    } else {
      websiteUnavailable = true;
      reportHandledAffiliateError("[affiliate] website pay load failed", websiteResult.caught);
    }
  }
  const labByCode = new Map<string, number>();
  if (payoutsReady) {
    for (const line of payoutLines({ affiliates, orders: conversions, payouts })) {
      labByCode.set(line.code, (labByCode.get(line.code) ?? 0) + line.earnedCents);
    }
  }
  function payFor(code: string) {
    const posts = contentPosts.filter((post) => post.code === code);
    const payments = deliverablePayments.filter((payment) => payment.code === code);
    const periods = new Set<string>();
    for (const post of posts) {
      const period = eventPeriod(post.publishedAt ?? "");
      if (period) periods.add(period);
    }
    for (const payment of payments) {
      const period = eventPeriod(payment.approvedAt ?? payment.paidAt ?? "");
      if (period) periods.add(period);
    }
    for (const row of agreementPayouts) {
      if (row.code === code) periods.add(row.period);
    }
    let socialCents = 0;
    for (const period of periods) {
      const month = socialMonthCents({ period, posts, payments });
      socialCents += month.socialCents + month.adjustmentCents + monthlyRate(code, period).earnedCents;
    }
    const websitePeriods = new Set<string>();
    for (const event of marketingEvents) {
      if (event.code !== code) continue;
      const period = eventPeriod(event.createdAt);
      if (period) websitePeriods.add(period);
    }
    for (const snapshot of websiteSnapshots) {
      if (snapshot.code === code) websitePeriods.add(snapshot.period);
    }
    let websiteCents = 0;
    if (contentRates) {
      for (const period of websitePeriods) {
        const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
        websiteCents += websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents;
      }
    }
    return { socialCents, websiteCents, labCents: labByCode.get(code) ?? 0 };
  }

  function monthlyRate(code: string, period: string) {
    return agreementMonthEarning({
      agreements,
      posts: contentPosts,
      code,
      period,
      snapshot: agreementPayouts.find((row) => row.code === code && row.period === period) ?? null,
    });
  }

  function monthPay(code: string, period: string) {
    const posts = contentPosts.filter((post) => post.code === code);
    const payments = deliverablePayments.filter((payment) => payment.code === code);
    const social = socialMonthCents({ period, posts, payments });
    const monthly = monthlyRate(code, period).earnedCents;
    const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
    const website = contentRates ? websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents : null;
    const lab = payoutLines({ affiliates, orders: conversions, payouts, period })
      .filter((line) => line.code === code)
      .reduce((sum, line) => sum + line.earnedCents, 0);
    return {
      social: postsUnavailable ? null : social.socialCents + social.adjustmentCents + monthly,
      website: websiteUnavailable || !contentRates ? null : website,
      lab: payoutsReady ? lab : null,
    };
  }

  const reportSections = visibleReportSections(marketingReports, reportingAccounts(socialAccounts));

  function agreementProps(affiliate: AffiliateSummary) {
    const own = agreements.filter((agreement) => agreement.code === affiliate.code);
    const current = own.find((agreement) => agreement.current) ?? null;
    const history = own.filter((agreement) => agreement.id !== current?.id);
    const editor = agreementEditorState(current, history, agreementsUnavailable);
    return {
      name: affiliate.name,
      code: affiliate.code,
      labRate: !LAB_COMMISSIONS_ENABLED ? "Off" : affiliate.commissionMode === "fixed" ? formatCommissionRate(affiliate) : `${formatCommissionRate(affiliate)} of lab orders`,
      standingRate: standingViewRateCents(contentRates) == null ? "Not set" : `${formatCents(standingViewRateCents(contentRates) ?? 0)} per 1,000 views`,
      unavailable: agreementsUnavailable,
      agreements: (current ? [current, ...history] : history).map((agreement) => presentAgreement(agreement)),
      editableId: editor.editable && current ? current.id : null,
      seed: agreementSeed(editableAgreement(current, editor.editable)),
      canSign: editor.canSign,
      canAccept: editor.canAccept,
      canEnd: editor.canEnd,
      canReplace: editor.canReplace,
      replaceNeedsNote: editor.replaceNeedsNote,
      progress: current && editor.canEnd ? monthProgress(contentPosts, affiliate.code, current.id, agreementPostTotal(current.posts), current.posts) : null,
    };
  }

  function agreementFor(affiliate: AffiliateSummary) {
    const current = agreements.find((agreement) => agreement.code === affiliate.code && agreement.current) ?? null;
    const view = current ? presentAgreement(current) : null;
    const progress = current && view?.phase === "active" ? monthProgress(contentPosts, affiliate.code, current.id, agreementPostTotal(current.posts), current.posts) : null;
    return { view, progress };
  }

  function earnings(affiliate: AffiliateSummary) {
    const pay = payFor(affiliate.code);
    const social = postsUnavailable ? null : pay.socialCents;
    const website = websiteUnavailable || !contentRates ? null : pay.websiteCents;
    const lab = LAB_COMMISSIONS_ENABLED && payoutsReady ? pay.labCents : null;
    return { social, website, lab, total: sumKnown([social, website, lab]) };
  }

  function metricCount(value: number | null | undefined) {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  function engagementsFor(code: string) {
    if (postsUnavailable) return null;
    return contentPosts
      .filter((post) => post.code === code && post.contentStatus === "approved" && (post.publicationStatus === "tracking_active" || Boolean(post.postUrl)))
      .reduce((sum, post) => sum + metricCount(post.likes) + metricCount(post.comments) + metricCount(post.shares) + metricCount(post.saves), 0);
  }

  function labOrdersFor(code: string) {
    return conversions.filter(
      (order) => order.code === code && !order.dryRun && remainingSalesCents(order.amountCents, order.refundedAmountCents) > 0 && earnsLabCommission(order),
    ).length;
  }

  const rows = affiliates.map((affiliate) => ({
    affiliate,
    status: statusKey(affiliate),
    stats: figures(affiliate),
    engagements: engagementsFor(affiliate.code),
    labOrders: labOrdersFor(affiliate.code),
    pay: earnings(affiliate),
    deal: agreementFor(affiliate),
  }));
  type Row = (typeof rows)[number];
  const statusFilter = FILTERS.find((filter) => filter.id === query.status)?.id ?? "all";
  const search = (query.q ?? "").trim();
  const needle = search.toLowerCase();
  const visible = rows.filter(
    (row) =>
      (statusFilter === "all" || row.status === statusFilter) &&
      (!needle || `${row.affiliate.name} ${row.affiliate.email} ${row.affiliate.code}`.toLowerCase().includes(needle)),
  );
  const visibleTotal = (pick: (row: Row) => number | null) => sumKnown(visible.map(pick));

  const selected = requestedCode ? (affiliates.find((affiliate) => affiliate.code === requestedCode) ?? null) : null;
  const currentPeriod = currentPayoutPeriod();
  function agreementCell(row: Row) {
    const { view, progress } = row.deal;
    if (view?.phase === "active") {
      const need = view.postTotal;
      const done = progress?.labels.filter((label) => label === "Verified").length ?? 0;
      const postingNow = agreementMonthPeriods(view.effectiveValue, view.expiresValue).includes(currentPeriod);
    return (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[15px]">{view.monthly ? `${view.monthly}/month · ${need} posts each month` : `${need} posts each month`}</span>
          {need > 0 && postingNow ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 max-w-[90px] flex-1 overflow-hidden rounded-full bg-[#E8DEDC]">
                <span className="block h-1.5 bg-[#1D6340]" style={{ width: `${Math.min(100, Math.round((done / need) * 100))}%` }} />
              </span>
              <span className="whitespace-nowrap text-[13px] text-[#4A3A37]">
                {done} of {need} this month
              </span>
            </span>
          ) : null}
        </span>
      );
    }
    const text = view?.phase === "waiting" ? (view.questions.length > 0 ? "Still negotiating" : "Waiting for signature") : view?.phase === "draft" ? "Draft" : "None";
    return <span className={`text-[15px] ${text === "None" ? "text-[#6B5A57]" : ""}`}>{text}</span>;
  }

  function profileView(affiliate: AffiliateSummary) {
    const row = rows.find((item) => item.affiliate.code === affiliate.code);
    if (!row) return null;
    const { view } = row.deal;
    const first = affiliate.name.trim().split(/\s+/)[0] || affiliate.name;
    const status = STATUS[row.status];
    const agreement = agreementProps(affiliate);
    const posts = contentPosts.filter((post) => post.code === affiliate.code);
    const ownPayouts = payouts.filter((payout) => payout.code === affiliate.code);
    const ownAgreements = agreements.filter((item) => item.code === affiliate.code);
    const waitingPosts = posts.filter((post) => post.contentStatus === "submitted").length;
    const approvedCents = ownPayouts.filter((payout) => payout.status === "approved").reduce((sum, payout) => sum + payout.earnedCents, 0);
    const requestedMonth = normalizePayoutPeriod(query.month);
    const selectedPeriod = requestedMonth && requestedMonth <= currentPeriod ? requestedMonth : currentPeriod;
    const thisMonth = sumKnown(Object.values(monthPay(affiliate.code, selectedPeriod)));
    const activeDeal = view?.phase === "active" ? (ownAgreements.find((item) => item.current) ?? null) : null;
    const rateThisMonth = monthlyRate(affiliate.code, selectedPeriod);
    const postsShort = rateThisMonth.requiredPosts - rateThisMonth.verifiedPosts;
    const earnedNote =
      rateThisMonth.status === "none"
        ? "Agreement pay, social performance, website and lab"
        : rateThisMonth.status === "short"
          ? `Agreement pay needs ${postsShort} more ${postsShort === 1 ? "post" : "posts"}`
          : "Includes agreement pay";
    const promoCodes = promosFor(affiliate).map((promo) => promo.code);
    const joined = shortDate(affiliate.createdAt, true);
    const labRate = LAB_COMMISSIONS_ENABLED ? formatCommissionRate(affiliate) : "Off";
    const viewRate = standingViewRateCents(contentRates);
    const profileHref = `/admin/affiliates/accounts?code=${encodeURIComponent(affiliate.code)}${fromRoi ? "&from=roi" : ""}`;
    const agreementsHref = `${profileHref}&view=agreements`;
    const postsHref = `${profileHref}&view=posts`;

    function livePosts() {
      const live = posts
        .filter((post) => post.contentStatus === "approved" && post.publicationStatus === "tracking_active")
        .map((post) => ({ post, platform: postPlatform(post) }))
        .sort((a, b) => (b.post.publishedAt ?? b.post.reviewedAt ?? "").localeCompare(a.post.publishedAt ?? a.post.reviewedAt ?? ""));
      const platform = AGREEMENT_PLATFORMS.find((item) => item.toLowerCase() === (query.platform ?? "").toLowerCase()) ?? null;
      const shown = platform ? live.filter((item) => item.platform === platform) : live;
      const chips = [
        { label: "All", value: null, count: live.length },
        ...AGREEMENT_PLATFORMS.map((item) => ({ label: item, value: item, count: live.filter((row) => row.platform === item).length })),
      ];
      return (
        <section aria-labelledby="live-posts-title" className="flex flex-col gap-4 rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h3 id="live-posts-title" className="flex-1 text-lg font-semibold">
              Live posts
            </h3>
            <span className="text-sm text-[#4A3A37]">Approved and verified on {first}’s account</span>
          </div>
          <nav aria-label="Filter by platform" className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const on = chip.value === platform;
              return (
                <Link
                  key={chip.label}
                  href={chip.value ? `${postsHref}&platform=${chip.value.toLowerCase()}` : postsHref}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ${on ? "bg-ink text-white" : `bg-[#F7F3F2] text-ink hover:bg-background ${focusRing}`}`}
                >
                  {chip.label}
                  <span className={`tabular-nums ${on ? "text-white/70" : chip.count ? "text-[#6B5A57]" : muted}`}>{chip.count}</span>
                </Link>
              );
            })}
          </nav>
          {postsUnavailable ? (
            <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px] text-[#4A3A37]">Posts are unavailable right now.</p>
          ) : shown.length === 0 ? (
            <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px] text-[#4A3A37]">
              {platform ? `No live ${platform} posts yet.` : `${first} has no live posts yet.`}
            </p>
          ) : (
            <ul className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map(({ post, platform: network }) => {
                const file = post.files[0] ?? (post.filePath ? { contentType: post.contentType } : null);
                const src = `/admin/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=1`;
                const line = post.caption.replace(/\s+/g, " ").trim();
                const published = shortDate(post.publishedAt ?? post.reviewedAt, true);
                return (
                  <li key={post.id} className="flex flex-col overflow-hidden rounded-[20px] border border-[#F0E8E6]">
                    <div className="relative aspect-[4/5] bg-[#F7F3F2]">
                      {file?.contentType.startsWith("video/") ? (
                        <video src={src} controls muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                      ) : file ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-sm text-[#6B5A57]">No preview</span>
                      )}
                      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-ink">
                        {network ?? "Social"} · {postKind(post)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[13px] text-[#4A3A37]">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-[#1D6340]" />
                        Live{published ? ` since ${published}` : ""}
                      </div>
                      {line ? <p className="line-clamp-2 text-[15px]">{line}</p> : null}
                      <dl className="grid grid-cols-4 gap-2 rounded-2xl bg-[#F7F3F2] px-3 py-2.5 text-center">
                        {(
                          [
                            ["Views", post.views],
                            ["Likes", post.likes],
                            ["Comments", post.comments],
                            ["Shares", post.shares],
                          ] as const
                        ).map(([label, value]) => (
                          <div key={label} className="flex flex-col-reverse">
                            <dt className="text-[11px] text-[#6B5A57]">{label}</dt>
                            <dd className="text-[15px] font-semibold tabular-nums">{compactNumber(value)}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1">
                        {post.postUrl ? (
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className={textLink}>
                            View on {network ?? "the platform"}
                          </a>
                        ) : null}
                        <Link href={`/admin/affiliates/posts/published?post=${encodeURIComponent(post.id)}`} className={textLink}>
                          Review details
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      );
    }

    const attention: { text: string; cta: ReactNode }[] = [];
    if (waitingPosts > 0) {
      attention.push({
        text: `${waitingPosts === 1 ? "1 post is" : `${waitingPosts} posts are`} waiting for review.`,
        cta: (
          <Link href="/admin/affiliates/posts/pending" className={textLink}>
            Review {waitingPosts === 1 ? "post" : "posts"}
          </Link>
        ),
      });
    }
    if (payoutsReady && approvedCents > 0) {
      attention.push({
        text: `${formatCents(approvedCents)} is approved and not sent.`,
        cta: (
          <Link href="/admin/affiliates/payouts" className={textLink}>
            Go to payouts
          </Link>
        ),
      });
    }
    if (view?.phase === "waiting") {
      attention.push({
        text: view.openQuestion ? `${first} asked a question about the agreement.` : `The agreement is waiting for ${first} to accept.`,
        cta: (
          <Link href={agreementsHref} className={textLink}>
            {view.openQuestion ? "Reply" : "Open agreement"}
          </Link>
        ),
      });
    }
    if (row.status === "invited") {
      attention.push({ text: `${first} has not accepted the invitation yet.`, cta: null });
    }

    const caption = (text: string) => {
      const line = text.trim().split("\n")[0] ?? "";
      return line ? ` · ${line.length > 40 ? `${line.slice(0, 40)}…` : line}` : "";
    };
    const activity: { at: string; text: string }[] = [];
    for (const item of ownAgreements) {
      const title = item.title || "Agreement";
      if (item.createdAt) activity.push({ at: item.createdAt, text: `${title} drafted` });
      if (item.sentAt) activity.push({ at: item.sentAt, text: `${title} sent to ${first}` });
      if (item.signedAt) activity.push({ at: item.signedAt, text: `${title} signed` });
      if (item.endedAt) activity.push({ at: item.endedAt, text: `${title} ended` });
    }
    for (const post of posts) {
      if (post.submittedAt) activity.push({ at: post.submittedAt, text: `Post sent for review${caption(post.caption)}` });
      if (post.reviewedAt && post.contentStatus === "approved") activity.push({ at: post.reviewedAt, text: `Post approved${caption(post.caption)}` });
      if (post.publishedAt) activity.push({ at: post.publishedAt, text: `Post published${caption(post.caption)}` });
    }
    for (const payout of ownPayouts) {
      if (payout.paidAt && payout.paidCents != null) {
        activity.push({ at: payout.paidAt, text: `Paid ${formatCents(payout.paidCents)} for ${formatPayoutMonth(payout.period)}` });
      }
    }
    const recent = activity
      .filter((item) => !Number.isNaN(new Date(item.at).getTime()))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5);

    const account: { label: string; value: string }[] = [
      { label: "Affiliate ID", value: affiliate.code },
      { label: "Promo code", value: promoError ? "Unavailable" : promoCodes.length ? `${promoCodes.join(", ")} (GenHealth)` : "Not assigned" },
      { label: "Tracking link", value: affiliate.active ? affiliateTrackingLink(affiliate.code) : `${affiliateTrackingLink(affiliate.code)} (off)` },
      { label: "Lab commission", value: LAB_COMMISSIONS_ENABLED ? `${labRate} of lab orders` : "Not active" },
      {
        label: "Social pay",
        value: payFormula([
          [activeDeal?.monthlyCents ?? 0, `month (${view?.postTotal ?? 0} ${view?.postTotal === 1 ? "post" : "posts"})`],
          [viewRate ?? 0, "1k views"],
          [contentRates ? rateFor(contentRates, "engagements") : 0, "engagement"],
        ]),
      },
      { label: "Website pay", value: payFormula([[contentRates ? rateFor(contentRates, "clicks") : 0, "click"], [contentRates ? rateFor(contentRates, "pageViews") : 0, "1k page views"]]) },
    ];

    const reportMonths = websiteReportMonths({ code: affiliate.code, visits: websiteVisits, orders: websiteOrders });
    const monthReport = reportMonths.find((month) => month.month === selectedPeriod) ?? null;
    const monthVisits = reportsUnavailable ? null : (monthReport ? monthReport.trackingVisits + monthReport.promoVisits : 0);
    const monthPaid = loadError
      ? null
      : conversions.filter(
          (order) =>
            order.code === affiliate.code &&
            !order.dryRun &&
            payoutPeriod(order.createdAt) === selectedPeriod &&
            remainingSalesCents(order.amountCents, order.refundedAmountCents) > 0,
        );
    const monthLab = monthPaid?.filter((order) => earnsLabCommission(order)).length ?? 0;
    const monthPlain = monthPaid == null ? 0 : monthPaid.length - monthLab;
    const unpaidCount = row.stats.unpaidOrders;
    const monthApproved = payoutsReady ? ownPayouts.filter((payout) => payout.period === selectedPeriod && payout.status === "approved").reduce((sum, payout) => sum + payout.earnedCents, 0) : null;
    const covering = ownAgreements
      .filter((item) => (item.status === "signed" || item.status === "ended") && agreementMonthPeriods(item.effectiveOn, item.expiresOn).includes(selectedPeriod))
      .sort((a, b) => Number(b.current) - Number(a.current) || (b.effectiveOn ?? "").localeCompare(a.effectiveOn ?? ""));
    const periodAgreement = covering[0] ? presentAgreement(covering[0]) : null;
    const periodProgress = covering[0] ? monthProgress(contentPosts, affiliate.code, covering[0].id, agreementPostTotal(covering[0].posts), covering[0].posts, selectedPeriod) : null;
    const postingMonth = Boolean(periodAgreement && agreementMonthPeriods(periodAgreement.effectiveValue, periodAgreement.expiresValue).includes(selectedPeriod));
    const knownMonths = [payoutPeriod(affiliate.createdAt), ...reportMonths.map((month) => month.month), ...ownPayouts.map((payout) => normalizePayoutPeriod(payout.period))].filter((period): period is string => Boolean(period));
    const oldestKnown = knownMonths.sort()[0];
    const yearBack = shiftMonth(currentPeriod, -23);
    const oldestMonth = oldestKnown && oldestKnown < yearBack ? oldestKnown : yearBack;
    const olderMonth = selectedPeriod > oldestMonth ? shiftMonth(selectedPeriod, -1) : null;
    const newerMonth = selectedPeriod < currentPeriod ? shiftMonth(selectedPeriod, 1) : null;
    const monthPage = (period: string) => `${profileHref}${period === currentPeriod ? "" : `&month=${period}`}`;

    return (
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-wrap items-center gap-4 rounded-[26px] bg-white px-6 py-5">
          <Link
            href={fromRoi ? "/admin/affiliates/roi" : "/admin/affiliates/accounts"}
            aria-label={fromRoi ? "Back to ROI" : "All affiliates"}
            className={`flex size-10 flex-none items-center justify-center rounded-full bg-[#F7F3F2] text-ink hover:bg-background ${focusRing}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          <Avatar name={affiliate.name} large />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id="affiliate-title" className="text-2xl font-medium">
                {affiliate.name}
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${status.pill}`}>{status.label}</span>
            </div>
            <p className="break-all text-sm text-[#4A3A37]">
              {affiliate.email}
              {joined ? ` · joined ${joined}` : ""}
            </p>
          </div>
          <SlidingTabs
            variant="segment"
            label="Affiliate"
            items={[
              { id: "overview", href: profileHref, label: "Overview", current: !agreementsTab && !postsTab && !trackingTab },
              { id: "tracking", href: `${profileHref}&view=tracking`, label: "Tracking", current: trackingTab },
              { id: "agreements", href: agreementsHref, label: "Agreements", current: agreementsTab },
              { id: "posts", href: postsHref, label: "Posts", current: postsTab },
            ]}
          />
        </div>

        <TabPanel tabKey={trackingTab ? "tracking" : postsTab ? "posts" : agreementsTab ? "agreements" : "overview"} className="flex flex-col gap-[18px]">
        {trackingTab ? (
        <AccountTracking
          name={affiliate.name}
            commission={formatCommissionRate(affiliate)}
            viewRate={marketingPayText(contentRates)}
          cookieDays={cookieDays}
          trackingLink={affiliateTrackingLink(affiliate.code)}
          promos={trackingPromos(affiliate)}
          unavailable={Boolean(promoError)}
        />
        ) : postsTab ? (
          livePosts()
        ) : agreementsTab ? (
          <AccountAgreement
            key={`${agreement.editableId ?? "none"}-${query.notice ?? ""}-${query.error ?? ""}-${query.new ?? ""}`}
            {...agreement}
            toast={query.notice === "agreement-replied" ? "" : complianceNotice}
            replyNotice={query.notice === "agreement-replied" ? complianceNotice : ""}
            error={error}
            initialStep={query.step === "1" || query.step === "2" || query.step === "3" ? Number(query.step) : 0}
            startNew={query.new === "1"}
          />
        ) : (
          <>
        {attention.length ? (
          <ul aria-label="Needs your attention" className="flex flex-col gap-2">
            {attention.map((item) => (
              <li key={item.text} className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[#FBF6EC] px-4 py-3">
                <span aria-hidden="true" className="size-2 flex-none rounded-full bg-[#C98A1A]" />
                <span className="flex-[1_1_300px] text-[15px]">{item.text}</span>
                {item.cta}
              </li>
            ))}
          </ul>
        ) : null}

        <section aria-labelledby="month-title" className="flex flex-col gap-3.5 rounded-[24px] bg-white px-6 py-[22px]">
          <div className="flex items-baseline gap-2.5">
            <h3 id="month-title" className="flex-1 text-lg font-semibold">
              {selectedPeriod === currentPeriod ? "This month" : "Past month"}
            </h3>
            <div className="flex items-center gap-1 text-sm text-[#4A3A37]">
              <MonthStep href={olderMonth ? monthPage(olderMonth) : null} label={olderMonth ? `Show ${formatPayoutMonth(olderMonth)}` : "No earlier month"} direction="previous" />
              <span className="min-w-[8.5rem] text-center">{formatPayoutMonth(selectedPeriod)}</span>
              <MonthStep href={newerMonth ? monthPage(newerMonth) : null} label={newerMonth ? `Show ${formatPayoutMonth(newerMonth)}` : "Already on the current month"} direction="next" />
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Tile label="Link visits" value={monthVisits == null ? "—" : String(monthVisits)} note="Tracking and promo links. Not the verified link clicks used for pay." />
            <Tile
              label="Paid orders"
              value={monthPaid == null ? "—" : String(monthPaid.length)}
              tone={monthPaid?.length ? "text-[#1D6340]" : ""}
              note={monthPaid == null ? "Unavailable right now" : `Lab orders ${monthLab} · Orders without commission ${monthPlain}`}
            />
            <Tile
              label="Checkouts not finished"
              value={unpaidCount == null ? "—" : String(unpaidCount)}
              tone={unpaidCount ? "text-[#7A4E00]" : ""}
              note={selectedPeriod === currentPeriod ? "Started checkout. Not a promo use, and no commission." : "Still open now"}
            />
            <Tile
              label="Posts verified"
              value={postingMonth && periodProgress && periodAgreement ? `${periodProgress.labels.filter((label) => label === "Verified").length} of ${periodAgreement.postTotal}` : "—"}
              note={postingMonth ? slotProgressNote(periodProgress?.labels ?? []) : view?.phase === "active" && selectedPeriod === currentPeriod ? "Not a posting month" : selectedPeriod === currentPeriod ? "No active agreement" : "No agreement that month"}
            />
            <Tile label="Earned" value={money(thisMonth)} note={earnedNote} />
            <Tile label="Approved, not sent" value={monthApproved == null ? "—" : formatCents(monthApproved)} note={monthApproved ? "Not sent yet" : "Nothing waiting to send"} />
          </div>
        </section>

        <div className="flex flex-col gap-[18px] lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
            <AccountReports unavailable={reportsUnavailable} months={reportMonths} sections={reportSections.filter((section) => section.code === affiliate.code)} />

            <section aria-labelledby="activity-title" className="flex flex-col rounded-[24px] bg-white px-6 py-[22px]">
              <h3 id="activity-title" className="mb-2 text-lg font-semibold">
                Recent activity
              </h3>
              {recent.length ? (
                <ul>
                  {recent.map((item) => (
                    <li key={`${item.at}-${item.text}`} className="flex justify-between gap-3 border-t border-[#F0E8E6] py-2.5 text-sm">
                      <span className="min-w-0">{item.text}</span>
                      <span className="whitespace-nowrap text-[#6B5A57]">{shortDate(item.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-[#F0E8E6] py-2.5 text-sm text-[#6B5A57]">No activity yet.</p>
              )}
            </section>
          </div>

          <aside className="flex w-full flex-none flex-col gap-[18px] lg:w-[340px]">
            <section aria-labelledby="agreement-title" className="flex flex-col gap-1.5 rounded-[24px] bg-white px-[22px] py-5">
              <h3 id="agreement-title" className="text-lg font-semibold">
                Agreement
              </h3>
              {view?.phase === "active" ? (
                <>
                  <span className="text-[15px] font-medium">{view.monthly ? `${view.monthly}/month · ${view.postTotal} posts each month` : `${view.postTotal} posts each month`}</span>
                  <span className="text-[13px] text-[#4A3A37]">
                    {view.title || "Agreement"} · {view.effectiveOn} – {view.expiresOn}
                  </span>
                </>
              ) : view?.phase === "waiting" || view?.phase === "draft" ? (
                <>
                  <span className="text-[15px] font-medium">{view.phase === "waiting" ? (view.questions.length > 0 ? "Still negotiating" : `Waiting for ${first} to accept`) : view.sentAt ? "Pulled back after it was sent" : "Draft, not sent yet"}</span>
                  <span className="text-[13px] text-[#4A3A37]">{view.title || "Untitled agreement"}</span>
                </>
              ) : (
                <>
                  <span className="text-[15px] font-medium">No active agreement</span>
                  <span className="text-[13px] text-[#4A3A37]">{first} can’t send posts for approval until one is accepted.</span>
                  {agreementsUnavailable ? null : agreement.agreements.length === 0 ? (
                    <Link href={`${agreementsHref}&new=1`} className={`mt-2 inline-flex h-9 w-fit items-center rounded-full bg-ink px-4 text-[13px] font-medium text-white hover:bg-brown ${focusRing}`}>
                      + New agreement
                    </Link>
                  ) : agreement.canReplace ? (
                    <form action={replaceAgreementAction} className="mt-2">
                      <input type="hidden" name="code" value={affiliate.code} />
                      {agreement.replaceNeedsNote ? <input type="hidden" name="note" value="Replaced with a new agreement." /> : null}
                      <button type="submit" className={`inline-flex h-9 w-fit items-center rounded-full bg-ink px-4 text-[13px] font-medium text-white hover:bg-brown ${focusRing}`}>
                        + New agreement
            </button>
          </form>
        ) : (
                    <Link href={`${agreementsHref}&new=1`} className={`mt-2 inline-flex h-9 w-fit items-center rounded-full bg-ink px-4 text-[13px] font-medium text-white hover:bg-brown ${focusRing}`}>
                      + New agreement
                    </Link>
                  )}
                </>
              )}
            </section>

            <section aria-labelledby="account-title" className="flex flex-col rounded-[24px] bg-white px-[22px] py-5">
              <h3 id="account-title" className="mb-2 text-lg font-semibold">
                Account
              </h3>
              <dl>
                {account.map((item) => {
                  const link = item.label === "Tracking link";
                  return (
                    <div key={item.label} className={`flex gap-3 border-t border-[#F0E8E6] py-2.5 text-[13px] ${link ? "flex-col gap-1" : "justify-between"}`}>
                      <dt className="shrink-0 whitespace-nowrap text-[#4A3A37]">{item.label}</dt>
                      <dd className={`min-w-0 font-semibold ${link ? "break-all" : "text-right [overflow-wrap:anywhere]"}`}>{item.value}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="flex flex-wrap gap-2 pt-2.5">
                <AccountActions code={affiliate.code} name={affiliate.name} active={affiliate.active} pendingInvite={affiliate.pendingInvite && affiliate.active} canInvite={canInvite} layout="wrap" />
              </div>
            </section>
          </aside>
        </div>
          </>
        )}
        </TabPanel>
      </div>
    );
  }

  const inlineMessages = Boolean(selected && agreementsTab);

  return (
    <div className="space-y-6">
      {requestedCode && !selected && !loadError ? (
        <p className="text-ink">That affiliate was not found.</p>
      ) : null}
      {error && !inlineMessages ? <TimedNotice message={error} tone="warn" query="error" /> : null}
      {complianceNotice && !inlineMessages ? <TimedNotice message={complianceNotice} tone="plain" query="notice" /> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      {created && affiliates.some((affiliate) => affiliate.code === created) ? (
        <TimedNotice message={`Affiliate ID ${created}`} tone="plain" ms={8000} query="created">
          <span className="break-all">
            Affiliate ID <span className="font-medium">{created}</span>. Tracking link{" "}
            <span className="font-medium">{affiliateTrackingLink(created)}</span>
            {query.invited === "1" ? " An invitation email was sent so they can set a password." : ""}
          </span>
        </TimedNotice>
      ) : null}
      {query.resent === "1" ? <TimedNotice message="A new invitation was sent. The previous unused link no longer works." tone="plain" query="resent" /> : null}
      {selected ? (
        profileView(selected)
      ) : (
        <section aria-labelledby="accounts-title" className="flex min-w-0 flex-col gap-[18px] rounded-[30px] bg-white px-4 py-6 sm:px-7">
          <div className="flex flex-wrap items-end gap-3.5">
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1">
              <h2 id="accounts-title" className="text-[30px] leading-tight">
                Affiliates
              </h2>
              <p className="text-[15px] text-[#4A3A37]">Everyone in the program. Click any affiliate in the table to view their profile: overview, tracking, agreements and posts.</p>
                      </div>
                      </div>

          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const on = filter.id === statusFilter;
                const count = filter.id === "all" ? rows.length : rows.filter((row) => row.status === filter.id).length;
                return (
                  <Link
                    key={filter.id}
                    href={accountsHref(filter.id, search)}
                    aria-current={on ? "true" : undefined}
                    className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${on ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink hover:bg-background"} ${focusRing}`}
                  >
                    {filter.label} {count}
                  </Link>
                );
              })}
                    </div>
            <span className="hidden flex-1 sm:block" />
            <form action="/admin/affiliates/accounts" role="search" className="w-full sm:w-auto">
              {statusFilter !== "all" ? <input type="hidden" name="status" value={statusFilter} /> : null}
              <label htmlFor="accounts-search" className="sr-only">
                Search affiliates
              </label>
              <input
                id="accounts-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, email or ID"
                className={`h-11 w-full rounded-full border border-[#CDBDBA] bg-white px-[18px] text-[15px] text-ink sm:w-[260px] ${focusRing}`}
              />
            </form>
                      </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Total link visits" value={String(rows.reduce((sum, row) => sum + row.stats.visitors, 0))} note="Tracking and promo links, all time. Not the verified link clicks used for pay." />
            <Tile
              label="Lab orders"
              value={String(rows.reduce((sum, row) => sum + row.labOrders, 0))}
              note="All time. These are the only orders that earn commission."
            />
            <Tile label="Total earned" value={money(sumKnown(rows.map((row) => row.pay.total)))} note="Agreement pay, social performance, website and lab, all time" />
            <Tile
              label="Total active agreements"
              value={agreementsUnavailable ? "—" : String(rows.filter((row) => row.deal.view?.phase === "active").length)}
              note={`of ${rows.length} ${rows.length === 1 ? "affiliate" : "affiliates"}`}
            />
                      </div>

          {affiliates.length === 0 ? (
            <p className="px-2.5 py-2.5 text-[15px] text-[#6B5A57]">No affiliates yet.</p>
          ) : visible.length === 0 ? (
            <p className="px-2.5 py-2.5 text-[15px] text-[#6B5A57]">No affiliates match.</p>
          ) : (
            <>
              <ul aria-labelledby="accounts-title" className="overflow-hidden rounded-[20px] border border-[#E8DEDC] xl:hidden">
                {visible.map((row) => (
                  <li key={row.affiliate.code} className="border-b border-[#F0E8E6]">
                    <Link href={`/admin/affiliates/accounts?code=${encodeURIComponent(row.affiliate.code)}`} className={`flex flex-col gap-3.5 p-4 text-ink hover:bg-[#FBF9F8] ${focusRing}`}>
                      <span className="flex items-center gap-3">
                        <Avatar name={row.affiliate.name} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-base font-semibold">{row.affiliate.name}</span>
                          <span className="flex items-center gap-1.5 text-[13px] text-[#4A3A37]">
                            <span aria-hidden="true" className={`size-2 rounded-full ${STATUS[row.status].dot}`} />
                            {STATUS[row.status].label}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-0.5">
                          <span className="text-xs text-[#6B5A57]">Total earned</span>
                          <span className={`text-base font-semibold tabular-nums ${row.pay.total ? "" : zero}`}>{money(row.pay.total)}</span>
                        </span>
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="text-xs text-[#6B5A57]">Agreement</span>
                        {agreementCell(row)}
                      </span>
                      <span className="grid gap-4 sm:grid-cols-2">
                        <span className="flex flex-col gap-2">
                          <span className="grid grid-cols-3 gap-2">
                            <CompactStat label="Link visits" value={String(row.stats.visitors)} empty={!row.stats.visitors} hint="Not for pay" />
                            <CompactStat label="Engagements" value={row.engagements == null ? "—" : String(row.engagements)} empty={!row.engagements} hint=" " />
                            <CompactStat label="Lab orders" value={String(row.labOrders)} empty={!row.labOrders} tone={row.labOrders ? "text-[#1D6340]" : ""} hint=" " />
                          </span>
                        </span>
                        <span className="flex flex-col gap-2">
                          <span className="grid grid-cols-3 gap-2">
                            <CompactStat label="Social" value={money(row.pay.social)} empty={!row.pay.social} />
                            <CompactStat label="Website" value={money(row.pay.website)} empty={!row.pay.website} />
                            <CompactStat label="Lab commission" value={LAB_COMMISSIONS_ENABLED ? money(row.pay.lab) : "Off"} empty={LAB_COMMISSIONS_ENABLED ? !row.pay.lab : true} />
                          </span>
                        </span>
                      </span>
                      <span aria-hidden="true" className="inline-flex items-center gap-0.5 self-end text-[13px] font-medium underline underline-offset-4">
                        View profile
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="bg-[#FBF9F8] px-4 py-3.5">
                  <span className="text-[15px] font-semibold">Total{visible.length < rows.length ? " (shown)" : ""}</span>
                  <span className="mt-3 grid gap-4 sm:grid-cols-2">
                    <span className="grid grid-cols-3 gap-2">
                      <CompactStat label="Link visits" value={String(visibleTotal((row) => row.stats.visitors) ?? 0)} empty={!visibleTotal((row) => row.stats.visitors)} hint="Not for pay" />
                      <CompactStat label="Engagements" value={String(visibleTotal((row) => row.engagements) ?? 0)} empty={!visibleTotal((row) => row.engagements)} hint=" " />
                      <CompactStat label="Lab orders" value={String(visibleTotal((row) => row.labOrders) ?? 0)} empty={!visibleTotal((row) => row.labOrders)} hint=" " />
                    </span>
                    <span className="grid grid-cols-3 gap-2">
                      <CompactStat label="Social" value={money(visibleTotal((row) => row.pay.social))} empty={!visibleTotal((row) => row.pay.social)} />
                      <CompactStat label="Website" value={money(visibleTotal((row) => row.pay.website))} empty={!visibleTotal((row) => row.pay.website)} />
                      <CompactStat label="Lab commission" value={LAB_COMMISSIONS_ENABLED ? money(visibleTotal((row) => row.pay.lab)) : "Off"} empty={!LAB_COMMISSIONS_ENABLED || !visibleTotal((row) => row.pay.lab)} />
                    </span>
                  </span>
                  <span className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-[#6B5A57]">Total earned</span>
                    <span className={`text-base font-semibold tabular-nums ${visibleTotal((row) => row.pay.total) ? "" : zero}`}>{money(visibleTotal((row) => row.pay.total))}</span>
                  </span>
                </li>
            </ul>

              <div className="hidden overflow-x-auto rounded-[20px] border border-[#E8DEDC] xl:block">
              <div role="table" aria-labelledby="accounts-title" className="min-w-[72rem]">
                <div role="rowgroup" className="border-b border-[#E8DEDC] px-4">
                  <div role="row" className={`${GRID} items-end pb-2.5 pt-3.5 text-[13px] font-medium leading-tight text-[#6B5A57]`}>
                    <span role="columnheader">Affiliate</span>
                    <span role="columnheader">Agreement</span>
                    <span role="columnheader" className="text-right" title="Not the verified link clicks used for pay.">
                      Link visits
                    </span>
                    <span role="columnheader" className="text-right">
                      Engagements
                    </span>
                    <span role="columnheader" className="text-right">
                      Lab orders
                    </span>
                    <span role="columnheader" className="border-l border-[#E8DEDC] pl-3 text-right">
                      Social
                    </span>
                    <span role="columnheader" className="text-right">
                      Website
                    </span>
                    <span role="columnheader" className="text-right">
                      Lab commission
                    </span>
                    <span role="columnheader" className="text-right">
                      Total earned
                    </span>
                    <span role="columnheader">
                      <span className="sr-only">Profile</span>
                              </span>
                            </div>
                </div>
                <div role="rowgroup">
                  {visible.map((row) => (
                    <div key={row.affiliate.code} role="row" className={`${GRID} group relative items-center border-b border-[#F3EDEB] bg-white px-4 py-3.5 hover:bg-[#FBF9F8]`}>
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <Avatar name={row.affiliate.name} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <Link
                            href={`/admin/affiliates/accounts?code=${encodeURIComponent(row.affiliate.code)}`}
                            className={`truncate text-base font-semibold text-ink after:absolute after:inset-0 after:content-[''] ${focusRing}`}
                          >
                            {row.affiliate.name}
                          </Link>
                          <span className="flex items-center gap-1.5 text-[13px] text-[#4A3A37]">
                            <span aria-hidden="true" className={`size-2 rounded-full ${STATUS[row.status].dot}`} />
                            {STATUS[row.status].label}
                          </span>
                        </span>
                      </span>
                      <span role="cell" className="min-w-0">
                        {agreementCell(row)}
                      </span>
                      <Count value={row.stats.visitors} />
                      <Count value={row.engagements} />
                      <Count value={row.labOrders} tone="text-[#1D6340]" />
                      <Amount cents={row.pay.social} group />
                      <Amount cents={row.pay.website} />
                      {LAB_COMMISSIONS_ENABLED ? (
                        <Amount cents={row.pay.lab} />
                      ) : (
                        <span role="cell" className={`text-right text-[15px] ${muted}`}>
                          Off
                        </span>
                      )}
                      <Amount cents={row.pay.total} strong />
                      <span role="cell" aria-hidden="true" className="inline-flex items-center justify-end gap-0.5 whitespace-nowrap text-[13px] font-medium text-[#8A7A77] underline-offset-4 group-hover:text-ink group-hover:underline">
                        View profile
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  ))}
                </div>
                <div role="row" className={`${GRID} items-center bg-[#FBF9F8] px-4 py-3.5 text-[15px] font-semibold`}>
                  <span role="cell">Total{visible.length < rows.length ? " (shown)" : ""}</span>
                  <span role="cell" />
                  <Count value={visibleTotal((row) => row.stats.visitors)} />
                  <Count value={visibleTotal((row) => row.engagements)} />
                  <Count value={visibleTotal((row) => row.labOrders)} />
                  <Amount cents={visibleTotal((row) => row.pay.social)} group />
                  <Amount cents={visibleTotal((row) => row.pay.website)} />
                  {LAB_COMMISSIONS_ENABLED ? <Amount cents={visibleTotal((row) => row.pay.lab)} /> : <span role="cell" />}
                  <Amount cents={visibleTotal((row) => row.pay.total)} strong />
                  <span role="cell" />
                </div>
              </div>
            </div>
          </>
          )}
        </section>
        )}
    </div>
  );
}
