import type { Metadata } from "next";
import { AdminOverviewBoard, type OverviewActivity, type OverviewAffiliate, type OverviewAgreement, type OverviewCompareRow, type OverviewKpi, type OverviewPay, type OverviewStat, type OverviewTodo } from "@/components/affiliate/AdminOverviewBoard";
import { agreementForMonth, agreementMonthEarning, agreementPostMonth } from "@/lib/affiliate/agreement-earnings";
import { loadAgreementPayouts, type AgreementPayoutRow } from "@/lib/affiliate/agreement-payouts";
import { loadAffiliateAgreements, openAgreementQuestion, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { loadDeliverablePayments, type DeliverablePayment } from "@/lib/affiliate/deliverable-payments";
import { formatCents } from "@/lib/affiliate/format";
import { loadMarketingEvents, loadTrafficKeeps, loadWebsitePayouts } from "@/lib/affiliate/marketing-events";
import { eventPeriod, socialMonthCents, websiteMonthAmount, type PaymentRates } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { listOpenApplications } from "@/lib/affiliate/applications";
import { memo } from "@/lib/affiliate/memo";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { currentPayoutPeriod, formatPayoutMonth, loadPayoutRecords, payoutLines, previousPayoutPeriod, type PayoutLine, type PayoutRecord } from "@/lib/affiliate/payouts";
import { remainingSalesCents } from "@/lib/affiliate/refunds";
import { daySpan, rangeLabel, shortDay, shiftDay } from "@/lib/affiliate/stats-board";
import { AffiliateStoreError, loadAffiliateOverview, loadUncommissionedPendingOrders, type AffiliateSummary, type ConversionSummary } from "@/lib/affiliate/store";
import { trafficReview } from "@/lib/affiliate/traffic-review";
import { loadWebsiteEvents, type WebsiteVisit } from "@/lib/affiliate/website-report";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

export const metadata: Metadata = {
  title: "Affiliate overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RangeId = "this" | "last" | "q";

const RANGE_LINKS: { id: RangeId; label: string }[] = [
  { id: "this", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "q", label: "90 days" },
];

const PAY_COLORS = [
  ["Agreements (fixed monthly)", "#33130F"],
  ["Social performance", "#A8706A"],
  ["Website performance", "#E39A93"],
  ["Lab commission", "#C9A27E"],
] as const;

function rangeOf(value: string | undefined): RangeId {
  if (value === "last") return "last";
  if (value === "q" || value === "90") return "q";
  return "this";
}

function overviewHref(range: RangeId) {
  return range === "this" ? "/admin/affiliates/overview" : `/admin/affiliates/overview?range=${range}`;
}

function monthEnd(period: string) {
  const [year, month] = period.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${period}-${String(last).padStart(2, "0")}`;
}

function nextPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(start: string, end: string) {
  const months: string[] = [];
  let cursor = start.slice(0, 7);
  const last = end.slice(0, 7);
  while (cursor <= last && months.length < 6) {
    months.push(cursor);
    cursor = nextPeriod(cursor);
  }
  return months;
}

function dayOf(value: string | null | undefined) {
  const day = value?.slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
}

function inSpan(value: string | null | undefined, start: string, end: string) {
  const day = dayOf(value);
  return Boolean(day && day >= start && day <= end);
}

function countOf(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function engagementOf(post: ContentSubmission) {
  return countOf(post.likes) + countOf(post.comments) + countOf(post.shares) + countOf(post.saves);
}

function chartPlatform(post: ContentSubmission): "instagram" | "facebook" | "tiktok" | "youtube" | "other" {
  if (post.format === "tiktok") return "tiktok";
  if (post.format === "instagram_reel" || post.format === "instagram_post") return "instagram";
  let host = "";
  try {
    host = new URL(post.postUrl ?? "").hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    host = "";
  }
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host === "fb.com" || host === "fb.watch") return "facebook";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  return "other";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (`${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}` || name.slice(0, 1) || "?").toUpperCase();
}

function shortWhen(value: string) {
  const day = dayOf(value);
  return day ? shortDay(day) : "";
}

function changeNote(current: number, previous: number, previousName: string) {
  if (previous <= 0 && current <= 0) return { text: "No change", className: "text-[#4A3A37]" };
  if (previous <= 0) return { text: "New", className: "text-[#1D6340]" };
  const delta = Math.round(((current - previous) / previous) * 100);
  const up = delta >= 0;
  return { text: `${up ? "▲" : "▼"} ${Math.abs(delta)}% vs. ${previousName}`, className: up ? "text-[#1D6340]" : "text-[#9B2C1F]" };
}

function countDelta(now: number, last: number, invert = false) {
  if (last <= 0 && now <= 0) return { text: "—", className: "bg-[#F7F3F2] text-[#6B5A57]" };
  if (last <= 0) {
    return invert
      ? { text: "New", className: "bg-[#FBEFD6] text-[#7A4E00]" }
      : { text: "New", className: "bg-[#DDF0E4] text-[#1D6340]" };
  }
  const delta = Math.round(((now - last) / last) * 100);
  const good = invert ? delta <= 0 : delta >= 0;
  return {
    text: `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}%`,
    className: good ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]",
  };
}

function waitingDays(oldest: string, today: string) {
  const start = Date.parse(`${dayOf(oldest)}T00:00:00.000Z`);
  const end = Date.parse(`${today}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export default async function AffiliateOverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const query = await searchParams;
  const actor = await adminSessionActor();
  const canInvite = Boolean(actor && adminHasFullAccess(actor));
  const range = rangeOf(query.range);
  const today = new Date().toISOString().slice(0, 10);
  const currentPeriod = currentPayoutPeriod();
  const priorPeriod = previousPayoutPeriod(currentPeriod) ?? currentPeriod;
  const beforePrior = previousPayoutPeriod(priorPeriod) ?? priorPeriod;
  const selected =
    range === "this"
      ? { start: `${currentPeriod}-01`, end: today, periods: [currentPeriod], word: "this month", previousName: "last month" }
      : range === "last"
        ? { start: `${priorPeriod}-01`, end: monthEnd(priorPeriod), periods: [priorPeriod], word: "last month", previousName: "the month before" }
        : { start: shiftDay(today, -89), end: today, periods: monthsBetween(shiftDay(today, -89), today), word: "in 90 days", previousName: "the previous 90 days" };
  const previous =
    range === "this"
      ? { start: `${priorPeriod}-01`, end: monthEnd(priorPeriod) }
      : range === "last"
        ? { start: `${beforePrior}-01`, end: monthEnd(beforePrior) }
        : { start: shiftDay(selected.start, -90), end: shiftDay(selected.start, -1) };
  const eventMonths = [...new Set([currentPeriod, priorPeriod, beforePrior, ...selected.periods])];

  const [core, postsBundle, applications, websiteBundle, agreementBundle, unpaidResult, keepsResult] = await Promise.all([
    Promise.all([memo("admin-overview", () => loadAffiliateOverview()), memo("payout-records:all", () => loadPayoutRecords())]).then(
      (value) => ({ ok: true as const, value }),
      (caught: unknown) => ({ ok: false as const, caught }),
    ),
    Promise.all([memo("submissions:all", () => loadContentSubmissions()), memo("payments:all", () => loadDeliverablePayments())]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    canInvite
      ? memo("open-applications", () => listOpenApplications()).then(
          (rows) => ({ unavailable: false, count: rows.length as number | null }),
          () => ({ unavailable: true, count: null as number | null }),
        )
      : Promise.resolve({ unavailable: false, count: null as number | null }),
    Promise.all([
      memo("payment-rates", () => loadPaymentRates()),
      memo("website-events", () => loadWebsiteEvents()),
      ...eventMonths.map((period) => memo(`marketing-events:${period}`, () => loadMarketingEvents({ period }))),
      ...eventMonths.map((period) => memo(`website-payouts-period:${period}`, () => loadWebsitePayouts(period))),
    ]).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    Promise.all(eventMonths.map((period) => memo(`agreement-payouts-period:${period}`, () => loadAgreementPayouts(period)))).then(
      (payouts) =>
        memo("agreements:all", () => loadAffiliateAgreements()).then(
          (loaded) => ({ ok: true as const, value: [loaded, payouts.flat()] as const }),
          () => ({ ok: false as const }),
        ),
      () => Promise.resolve({ ok: false as const }),
    ),
    memo("unpaid-orders", () => loadUncommissionedPendingOrders()).then(
      (value) => ({ ok: true as const, value }),
      () => ({ ok: false as const }),
    ),
    memo(`traffic-keeps:${currentPeriod}`, () => loadTrafficKeeps(currentPeriod)).then(
      (value) => value,
      () => [],
    ),
  ]);

  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let payouts: PayoutRecord[] = [];
  let loadError = "";
  if (core.ok) {
    affiliates = core.value[0].affiliates;
    conversions = core.value[0].conversions;
    payouts = core.value[1];
  } else {
    loadError = core.caught instanceof AffiliateStoreError ? core.caught.message : "Could not load affiliate records.";
  }

  let contentPosts: ContentSubmission[] = [];
  let deliverablePayments: DeliverablePayment[] = [];
  let postsReady = false;
  if (postsBundle.ok) {
    [contentPosts, deliverablePayments] = postsBundle.value;
    postsReady = true;
  }

  let contentRates: PaymentRates | null = null;
  let marketingEvents: Awaited<ReturnType<typeof loadMarketingEvents>> = [];
  let websiteSnapshots: Awaited<ReturnType<typeof loadWebsitePayouts>> = [];
  let websiteVisits: WebsiteVisit[] = [];
  let websiteReady = false;
  if (websiteBundle.ok) {
    const [rates, website, ...rest] = websiteBundle.value;
    contentRates = rates as PaymentRates | null;
    websiteVisits = (website as { visits: WebsiteVisit[] }).visits;
    const events = rest.slice(0, eventMonths.length) as Awaited<ReturnType<typeof loadMarketingEvents>>[];
    const snapshots = rest.slice(eventMonths.length) as Awaited<ReturnType<typeof loadWebsitePayouts>>[];
    marketingEvents = events.flat();
    websiteSnapshots = snapshots.flat();
    websiteReady = true;
  }

  let agreements: AffiliateAgreement[] = [];
  let agreementPayouts: AgreementPayoutRow[] = [];
  if (agreementBundle.ok) {
    [agreements, agreementPayouts] = agreementBundle.value;
  }

  const unpaidByCode = new Map<string, number>();
  if (unpaidResult.ok) {
    for (const code of unpaidResult.value.values()) unpaidByCode.set(code, (unpaidByCode.get(code) ?? 0) + 1);
  }
  const unpaidTotal = unpaidResult.ok ? [...unpaidByCode.values()].reduce((sum, count) => sum + count, 0) : null;

  const labLines: PayoutLine[] = loadError ? [] : payoutLines({ affiliates, orders: conversions, payouts });
  const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const periodSet = new Set(selected.periods);

  function earn(code: string, period: string) {
    const social = postsReady
      ? socialMonthCents({
          period,
          posts: contentPosts.filter((post) => post.code === code),
          payments: deliverablePayments.filter((payment) => payment.code === code),
        })
      : null;
    const monthly = agreementMonthEarning({
      agreements,
      posts: contentPosts,
      code,
      period,
      snapshot: agreementPayouts.find((row) => row.code === code && row.period === period) ?? null,
    });
    const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
    const website = websiteReady && contentRates ? websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents : null;
    const lab = !LAB_COMMISSIONS_ENABLED || loadError ? null : labLines.filter((line) => line.code === code && line.period === period).reduce((sum, line) => sum + line.earnedCents, 0);
    return {
      agreement: monthly.status === "short" || monthly.status === "none" ? 0 : monthly.earnedCents,
      social: social ? social.socialCents + social.adjustmentCents : null,
      website,
      lab,
      verified: monthly.verifiedPosts,
      required: monthly.requiredPosts,
    };
  }

  function earnedParts(code: string, periods: string[]) {
    return periods.reduce(
      (sum, period) => {
        const month = earn(code, period);
    return {
          agreement: sum.agreement + month.agreement,
          social: sum.social + (month.social ?? 0),
          website: sum.website + (month.website ?? 0),
          lab: sum.lab + (month.lab ?? 0),
          verified: sum.verified + month.verified,
          required: sum.required + month.required,
        };
      },
      { agreement: 0, social: 0, website: 0, lab: 0, verified: 0, required: 0 },
    );
  }

  function paidOrders(code: string, start: string, end: string, kind?: "lab" | "treatment") {
    return conversions.filter(
      (conversion) =>
        conversion.code === code &&
        !conversion.dryRun &&
        inSpan(conversion.createdAt, start, end) &&
        remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0 &&
        (kind == null || conversion.orderKind === kind),
    );
  }

  function promoUses(code: string, start: string, end: string) {
    return paidOrders(code, start, end).filter((conversion) => conversion.promoCode);
  }

  function visitsFor(code: string, start: string, end: string) {
    if (!websiteReady) return null;
    return websiteVisits.filter((visit) => visit.code === code && inSpan(visit.createdAt, start, end)).length;
  }

  function viewsFor(code: string, start: string, end: string) {
    if (!postsReady) return null;
    return contentPosts
      .filter((post) => post.code === code && inSpan(post.publishedAt, start, end))
      .reduce((sum, post) => sum + countOf(post.views), 0);
  }

  function engagementsFor(code: string, start: string, end: string) {
    if (!postsReady) return null;
    return contentPosts
      .filter((post) => post.code === code && inSpan(post.publishedAt, start, end))
      .reduce((sum, post) => sum + engagementOf(post), 0);
  }

  const viewNow = affiliates.reduce((sum, affiliate) => sum + (viewsFor(affiliate.code, selected.start, selected.end) ?? 0), 0);
  const viewThen = affiliates.reduce((sum, affiliate) => sum + (viewsFor(affiliate.code, previous.start, previous.end) ?? 0), 0);
  const viewChange = changeNote(viewNow, viewThen, selected.previousName);
  const visitNow = websiteReady ? websiteVisits.filter((visit) => inSpan(visit.createdAt, selected.start, selected.end)).length : null;
  const labOrders = conversions.filter(
    (conversion) => !conversion.dryRun && conversion.orderKind === "lab" && inSpan(conversion.createdAt, selected.start, selected.end) && remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0,
  );
  const labSales = labOrders.reduce((sum, conversion) => sum + remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents), 0);
  const promoPaid = conversions.filter(
    (conversion) => conversion.promoCode && !conversion.dryRun && inSpan(conversion.createdAt, selected.start, selected.end) && remainingSalesCents(conversion.amountCents, conversion.refundedAmountCents) > 0,
  );
  const promoLab = promoPaid.filter((conversion) => conversion.orderKind === "lab").length;
  const clicks = marketingEvents.filter((event) => event.kind === "click" && event.payable && event.excluded !== true && inSpan(event.createdAt, selected.start, selected.end)).length;
  const pageViews = marketingEvents.filter((event) => event.kind === "page_view" && event.payable && event.excluded !== true && inSpan(event.createdAt, selected.start, selected.end)).length;
  const verifiedNow = affiliates.reduce((sum, affiliate) => sum + earnedParts(affiliate.code, selected.periods).verified, 0);
  const requiredNow = affiliates.reduce((sum, affiliate) => sum + earnedParts(affiliate.code, selected.periods).required, 0);
  const activeCount = affiliates.filter((affiliate) => affiliate.active).length;
  const joined = affiliates.filter((affiliate) => inSpan(affiliate.createdAt, selected.start, selected.end)).length;

  const programParts = affiliates.reduce(
    (sum, affiliate) => {
      const parts = earnedParts(affiliate.code, selected.periods);
      return {
        agreement: sum.agreement + parts.agreement,
        social: sum.social + parts.social,
        website: sum.website + parts.website,
        lab: sum.lab + parts.lab,
      };
    },
    { agreement: 0, social: 0, website: 0, lab: 0 },
  );
  const payAmounts = [programParts.agreement, programParts.social, programParts.website, LAB_COMMISSIONS_ENABLED ? programParts.lab : 0];
  const payTotal = payAmounts.reduce((sum, value) => sum + value, 0);
  const paySegments: OverviewPay[] = PAY_COLORS.map(([label, color], index) => ({
    label,
    color,
    value: index === 3 && !LAB_COMMISSIONS_ENABLED ? "Not active" : formatCents(payAmounts[index] ?? 0),
    width: payTotal > 0 ? `${(((payAmounts[index] ?? 0) / payTotal) * 100).toFixed(1)}%` : "0%",
  }));
  const paidRecorded =
    labLines.filter((line) => periodSet.has(line.period) && line.status === "paid").reduce((sum, line) => sum + (line.paidCents ?? 0), 0) +
    deliverablePayments.filter((payment) => payment.status === "paid" && periodSet.has(eventPeriod(payment.paidAt ?? ""))).reduce((sum, payment) => sum + (payment.paidCents ?? 0) + (payment.adjustmentCents ?? 0), 0) +
    agreementPayouts.filter((row) => periodSet.has(row.period) && row.status === "paid").reduce((sum, row) => sum + row.amountCents, 0);
  const approvedWaiting =
    labLines.filter((line) => periodSet.has(line.period) && line.status === "approved").reduce((sum, line) => sum + line.earnedCents, 0) +
    deliverablePayments.filter((payment) => payment.status === "approved" && periodSet.has(eventPeriod(payment.approvedAt ?? ""))).reduce((sum, payment) => sum + payment.amountCents, 0) +
    agreementPayouts.filter((row) => periodSet.has(row.period) && row.status === "approved").reduce((sum, row) => sum + row.amountCents, 0);

  const waitingPosts = contentPosts.filter((post) => post.contentStatus === "submitted");
  const oldest = waitingPosts.map((post) => post.submittedAt).filter((value): value is string => Boolean(value)).sort()[0];
  const age = oldest ? waitingDays(oldest, today) : null;
  const questions = agreements.filter((agreement) => agreement.status === "awaiting_signature" && openAgreementQuestion(agreement));
  const failedLinks = contentPosts.filter((post) => post.publicationStatus === "verification_failed");
  const spikeRows = trafficReview({
    period: currentPeriod,
    today,
    affiliates: affiliates.map((affiliate) => ({ code: affiliate.code, name: affiliate.name })),
    events: marketingEvents.filter((event) => event.createdAt.slice(0, 7) === currentPeriod),
    keeps: keepsResult,
  }).rows.filter((row) => row.status === "flagged");
  const questionName = names.get(questions[0]?.code ?? "") ?? "An affiliate";
  const failedName = names.get(failedLinks[0]?.code ?? "") ?? "An affiliate";

  const todos: OverviewTodo[] = [
    {
      n: postsReady ? String(waitingPosts.length) : "—",
      title: "Posts to review",
      sub: !postsReady ? "Unavailable right now" : waitingPosts.length === 0 ? "None waiting" : age == null ? "Submitted content" : age === 0 ? "Oldest waiting today" : `Oldest waiting ${age} ${age === 1 ? "day" : "days"}`,
      href: "/admin/affiliates/posts/pending",
      active: postsReady && waitingPosts.length > 0,
      urgent: false,
    },
    {
      n: String(questions.length),
      title: "Agreement changes",
      sub: questions.length === 0 ? "No open questions" : questions.length === 1 ? `${questionName} asked about the agreement` : `${questions.length} affiliates asked about an agreement`,
      href: questions.length === 1 ? `/admin/affiliates/accounts?code=${encodeURIComponent(questions[0]?.code ?? "")}&view=agreements` : "/admin/affiliates/accounts",
      active: questions.length > 0,
      urgent: false,
    },
    {
      n: formatCents(approvedWaiting),
      title: "Approved, not sent",
      sub: approvedWaiting > 0 ? "Send manually, then record it" : "Nothing waiting to send",
      href: "/admin/affiliates/payouts",
      active: approvedWaiting > 0,
      urgent: false,
    },
    ...(canInvite
      ? [
          {
            n: applications.unavailable || applications.count == null ? "—" : String(applications.count),
            title: "Application to approve",
            sub: applications.unavailable ? "Unavailable right now" : "Waiting for approval",
            href: "/admin/affiliates/applications",
            active: !applications.unavailable && (applications.count ?? 0) > 0,
            urgent: false,
          },
        ]
      : []),
    {
      n: postsReady ? String(failedLinks.length) : "—",
      title: "Link check failed",
      sub: !postsReady ? "Unavailable right now" : failedLinks.length === 0 ? "No live posts need a link fix" : failedLinks.length === 1 ? `${failedName} · link needs a fix` : "Tracking link missing on a live post",
      href: "/admin/affiliates/posts/published",
      active: postsReady && failedLinks.length > 0,
      urgent: false,
    },
    {
      n: websiteReady ? String(spikeRows.length) : "—",
      title: "Traffic spike to review",
      sub: !websiteReady ? "Unavailable right now" : spikeRows.length === 0 ? "No spike this month" : `${spikeRows[0]?.name ?? "An affiliate"} · ${spikeRows[0]?.spikeLabel ?? "unusual clicks"}`,
      href: "/admin/affiliates/reporting",
      active: websiteReady && spikeRows.length > 0,
      urgent: false,
    },
  ].map((item, index) => ({ ...item, urgent: index < 3 && item.active }));

  const kpis: OverviewKpi[] = [
    {
      label: "Active affiliates",
      value: `${activeCount} of ${affiliates.length}`,
      note: `${joined === 0 ? "None new" : `${joined} new joined`}${canInvite ? ` · ${applications.unavailable || applications.count == null ? "—" : applications.count} waiting` : ""}`,
      noteClass: "text-[#4A3A37]",
    },
    { label: "Views", value: postsReady ? viewNow.toLocaleString("en-US") : "—", note: postsReady ? viewChange.text : "Unavailable right now", noteClass: postsReady ? viewChange.className : "text-[#4A3A37]" },
    { label: "Visits", value: visitNow == null ? "—" : String(visitNow), note: visitNow == null ? "Unavailable right now" : "Tracking + promo links", noteClass: "text-[#4A3A37]" },
    {
      label: "Paid lab orders",
      value: String(labOrders.length),
      note: unpaidTotal == null ? "Unpaid count unavailable" : `${unpaidTotal} unpaid, not counted`,
      noteClass: unpaidTotal ? "text-[#7A4E00]" : "text-[#4A3A37]",
    },
    { label: "Agreement posts verified", value: `${verifiedNow} of ${requiredNow}`, note: "Across all agreements", noteClass: "text-[#4A3A37]" },
  ];

  const stats: OverviewStat[] = [
    { label: "Lab sales", value: LAB_COMMISSIONS_ENABLED ? formatCents(labSales) : "Not active", note: "Earns commission", noteClass: "text-[#1D6340]", tip: "Paid lab orders only" },
    {
      label: "Promo code uses",
      value: String(promoPaid.length),
      note: `Lab ${promoLab} · Other products ${promoPaid.length - promoLab}`,
      noteClass: "text-[#6B5A57]",
      tip: "Paid orders that used the code. Commission is lab orders only.",
    },
    { label: "Link clicks", value: websiteReady ? clicks.toLocaleString("en-US") : "—", note: "Verified clicks", noteClass: "text-[#6B5A57]", tip: "Verified link clicks" },
    { label: "Page views", value: websiteReady ? pageViews.toLocaleString("en-US") : "—", note: "Public pages", noteClass: "text-[#6B5A57]", tip: "Public page views" },
  ];

  const chartDays = daySpan(selected.end, Math.max(1, Math.round((Date.parse(`${selected.end}T00:00:00.000Z`) - Date.parse(`${selected.start}T00:00:00.000Z`)) / 86_400_000) + 1));
  const chartPosts = contentPosts.flatMap((post) => {
    const day = dayOf(post.publishedAt);
    if (!day || day < selected.start || day > selected.end) return [];
    return [{ day, platform: chartPlatform(post), views: countOf(post.views), engagements: engagementOf(post) }];
  });

  const agreementRows: OverviewAgreement[] = affiliates.flatMap((affiliate) => {
    const agreement = agreementForMonth(agreements, affiliate.code, currentPeriod);
    if (!agreement) return [];
    const inMonth = contentPosts.filter(
      (post) => post.code === affiliate.code && post.agreementId === agreement.id && agreementPostMonth(post) === currentPeriod && post.contentStatus !== "rejected" && post.contentStatus !== "withdrawn" && post.contentStatus !== "draft",
    );
    const verified = inMonth.filter((post) => post.publicationStatus === "tracking_active").length;
    const review = inMonth.filter((post) => post.publicationStatus !== "tracking_active").length;
    const required = agreementMonthEarning({
      agreements,
      posts: contentPosts,
      code: affiliate.code,
      period: currentPeriod,
      snapshot: agreementPayouts.find((row) => row.code === affiliate.code && row.period === currentPeriod) ?? null,
    }).requiredPosts;
    const left = Math.max(0, Number(monthEnd(currentPeriod).slice(8, 10)) - Number(today.slice(8, 10)));
    const parts = [`${verified} verified`];
    if (review) parts.push(`${review} in review`);
    if (today.slice(0, 7) === currentPeriod) parts.push(left === 0 ? "Month ends today" : `${left} ${left === 1 ? "day" : "days"} left`);
    const onTrack = required > 0 && verified >= required;
    const moving = verified + review > 0;
    const mix = agreement.posts
      .filter((post) => post.count > 0)
      .map((post) => `${post.count} ${post.platform} ${post.count === 1 ? "post" : "posts"}`)
      .join(", ");
    return [
      {
        initials: initials(affiliate.name),
        name: affiliate.name,
        terms: `${agreement.monthlyCents ? `${formatCents(agreement.monthlyCents)}/month` : "No monthly amount"}${mix ? ` · ${mix}` : ""}`,
        pips: Array.from({ length: required }, (_, index) => (index < verified ? "#1D6340" : index < verified + review ? "#E9C98A" : "#E8DEDC")),
        progress: parts.join(" · "),
        label: onTrack ? "Complete" : moving ? "On track" : "Behind",
        pillClass: onTrack || moving ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBEFD6] text-[#7A4E00]",
        href: `/admin/affiliates/accounts?code=${encodeURIComponent(affiliate.code)}&view=agreements`,
      },
    ];
  });

  function compareRows(code: string): OverviewCompareRow[] {
    const nowViews = viewsFor(code, `${currentPeriod}-01`, today) ?? 0;
    const lastViews = viewsFor(code, `${priorPeriod}-01`, monthEnd(priorPeriod)) ?? 0;
    const nowEng = engagementsFor(code, `${currentPeriod}-01`, today) ?? 0;
    const lastEng = engagementsFor(code, `${priorPeriod}-01`, monthEnd(priorPeriod)) ?? 0;
    const nowVisits = visitsFor(code, `${currentPeriod}-01`, today) ?? 0;
    const lastVisits = visitsFor(code, `${priorPeriod}-01`, monthEnd(priorPeriod)) ?? 0;
    const nowPaid = paidOrders(code, `${currentPeriod}-01`, today).length;
    const lastPaid = paidOrders(code, `${priorPeriod}-01`, monthEnd(priorPeriod)).length;
    const unpaid = unpaidByCode.get(code) ?? 0;
    const nowPromo = promoUses(code, `${currentPeriod}-01`, today).length;
    const lastPromo = promoUses(code, `${priorPeriod}-01`, monthEnd(priorPeriod)).length;
    const nowEarn = earn(code, currentPeriod);
    const lastEarn = earn(code, priorPeriod);
    const counts: { label: string; now: number; last: number; invert?: boolean; note?: string }[] = [
      { label: "Views", now: nowViews, last: lastViews },
      { label: "Engagements", now: nowEng, last: lastEng },
      { label: "Visits", now: nowVisits, last: lastVisits },
      { label: "Paid orders", now: nowPaid, last: lastPaid },
      { label: "Unpaid orders", now: unpaid, last: 0, invert: true, note: "All time. Not a promo use, and no commission." },
      { label: "Promo code uses", now: nowPromo, last: lastPromo },
    ];
    const rows: OverviewCompareRow[] = counts.map((row) => {
      const delta = row.label === "Unpaid orders" ? { text: "—", className: "bg-[#F7F3F2] text-[#6B5A57]" } : countDelta(row.now, row.last, row.invert);
      return {
        label: row.label,
        note: row.note ?? "",
        now: row.now.toLocaleString("en-US"),
        last: row.label === "Unpaid orders" ? "—" : row.last.toLocaleString("en-US"),
        nowClass: row.invert && row.now > 0 ? "text-[#7A4E00]" : "text-[#2A1714]",
        strong: false,
        delta: delta.text,
        deltaClass: delta.className,
        rowClass: "",
      };
    });
    rows.push({
      label: "Agreement posts verified",
      note: "",
      now: `${nowEarn.verified} of ${nowEarn.required}`,
      last: `${lastEarn.verified} of ${lastEarn.required}`,
      nowClass: "text-[#2A1714]",
      strong: false,
      delta: "",
      deltaClass: "",
      rowClass: "",
    });
    const moneyRows = [
      ["Agreement earnings", nowEarn.agreement, lastEarn.agreement],
      ["Social earnings", nowEarn.social ?? 0, lastEarn.social ?? 0],
      ["Website earnings", nowEarn.website ?? 0, lastEarn.website ?? 0],
      ["Lab earnings", nowEarn.lab ?? 0, lastEarn.lab ?? 0],
    ] as const;
    for (const [label, now, last] of moneyRows) {
      rows.push({
        label,
        note: "",
        now: formatCents(now),
        last: formatCents(last),
        nowClass: now ? "text-[#2A1714]" : "text-[#B3A5A2]",
        strong: false,
        delta: "",
        deltaClass: "",
        rowClass: "",
      });
    }
    const nowTotal = nowEarn.agreement + (nowEarn.social ?? 0) + (nowEarn.website ?? 0) + (nowEarn.lab ?? 0);
    const lastTotal = lastEarn.agreement + (lastEarn.social ?? 0) + (lastEarn.website ?? 0) + (lastEarn.lab ?? 0);
    rows.push({
      label: "Total earned",
      note: nowEarn.agreement ? "" : "Agreement pay comes once all posts are verified",
      now: formatCents(nowTotal),
      last: formatCents(lastTotal),
      nowClass: "text-[#2A1714]",
      strong: true,
      delta: "",
      deltaClass: "",
      rowClass: "bg-[#FBF9F8]",
    });
    return rows;
  }

  const ranked = affiliates
    .map((affiliate) => {
      const parts = earnedParts(affiliate.code, selected.periods);
      const earned = parts.agreement + parts.social + parts.website + parts.lab;
      return { affiliate, views: viewsFor(affiliate.code, selected.start, selected.end) ?? 0, earned };
    })
    .sort((left, right) => right.views - left.views || right.earned - left.earned || left.affiliate.name.localeCompare(right.affiliate.name))
    .slice(0, 5);

  const top: OverviewAffiliate[] = ranked.map((row, index) => {
    const agreement = agreementForMonth(agreements, row.affiliate.code, currentPeriod);
    const mix = agreement?.platforms.filter(Boolean).join(", ");
    const sub = agreement
      ? `${row.affiliate.active ? "Active" : "Inactive"} · ${agreement.monthlyCents ? `${formatCents(agreement.monthlyCents)}/month agreement` : "Agreement"}${mix ? ` · ${mix}` : ""}`
      : `${row.affiliate.active ? "Active" : "Inactive"} · no agreement`;
    const engagements = engagementsFor(row.affiliate.code, selected.start, selected.end);
    const labOrders = paidOrders(row.affiliate.code, selected.start, selected.end, "lab").length;
    return {
      code: row.affiliate.code,
      rank: String(index + 1),
      name: row.affiliate.name,
      views: (viewsFor(row.affiliate.code, selected.start, selected.end) ?? 0).toLocaleString("en-US"),
      visits: visitsFor(row.affiliate.code, selected.start, selected.end)?.toLocaleString("en-US") ?? "—",
      engagements: engagements == null ? "—" : engagements.toLocaleString("en-US"),
      labOrders: String(labOrders),
      labClass: labOrders > 0 ? "text-[#1D6340]" : "text-[#B3A5A2]",
      earned: formatCents(row.earned),
      initials: initials(row.affiliate.name),
      sub,
      rows: compareRows(row.affiliate.code),
    };
  });

  const activity: OverviewActivity[] = [
    ...contentPosts.flatMap((post) => {
      const name = names.get(post.code) ?? post.code;
      const items: { at: string; text: string; color: string }[] = [];
      if (post.contentStatus === "submitted" && post.submittedAt) items.push({ at: post.submittedAt, text: `Post sent for review · ${name}`, color: "#33130F" });
      if (post.publicationStatus === "tracking_active" && post.publishedAt) items.push({ at: post.publishedAt, text: `Post verified · ${name}`, color: "#1D6340" });
      return items;
    }),
    ...payouts.flatMap((payout) => {
      if (payout.status !== "paid" || !payout.paidAt || payout.paidCents == null) return [];
      const name = names.get(payout.code) ?? payout.code;
      return [{ at: payout.paidAt, text: `${formatPayoutMonth(payout.period)} payout recorded · ${name} · ${formatCents(payout.paidCents)}`, color: "#1D6340" }];
    }),
  ]
    .filter((item) => !Number.isNaN(new Date(item.at).getTime()))
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, 5)
    .map((item) => ({ text: item.text, when: shortWhen(item.at), color: item.color }));

  const openTodos = todos.filter((item) => item.active).length;
  const currentEnd = monthEnd(currentPeriod);

  return (
    <div className="flex flex-col gap-4">
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      <AdminOverviewBoard
        ranges={RANGE_LINKS.map((item) => ({ ...item, href: overviewHref(item.id), current: item.id === range }))}
        rangeText={rangeLabel(selected.start, selected.end)}
        todoCount={openTodos === 0 ? "Nothing waiting" : openTodos === 1 ? "1 needs action" : `${openTodos} need action`}
        todos={todos}
        kpis={kpis}
        days={chartDays}
        axisStart={shortDay(chartDays[0] ?? selected.start)}
        axisEnd={shortDay(chartDays[chartDays.length - 1] ?? selected.end)}
        posts={chartPosts}
        stats={stats}
        agreements={agreementRows}
        owed={formatCents(payTotal)}
        periodWord={selected.word}
        payLabel={`Earnings by type: ${paySegments.map((segment) => `${segment.label} ${segment.value}`).join(", ")}`}
        paySegments={paySegments}
        paid={formatCents(paidRecorded)}
        affiliates={top}
        monthNote={today < currentEnd ? `This month runs ${rangeLabel(`${currentPeriod}-01`, today)}, so it isn’t complete yet. Order numbers are counts only.` : "Order numbers are counts only."}
        activity={activity}
      />
    </div>
  );
}
