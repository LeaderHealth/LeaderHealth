import { deliverablePhase, type DeliverableLineStatus } from "./deliverable-flow";
import { formatCents } from "./format";
import { resolvedTrackingDays, socialPayCents } from "./manual-checkpoint";

export type PayoutBoardKind = "base" | "social" | "web" | "lab";
export type PayoutBoardStatus = "review" | "approved" | "paid" | "hold";
export type PayoutBoardRange = "30" | "90" | "all";

export type PayoutBoardItem = {
  id: string;
  title: string;
  kind: PayoutBoardKind;
  amountCents: number;
  earnedOn: string;
  status: PayoutBoardStatus;
  terms: string;
  work: string;
  approved: string;
  paymentNote: string;
  paidOn: string | null;
  reference: string;
};

export type PayoutBoardPost = {
  id: string;
  caption: string;
  format: string | null;
  campaign: string;
  publishedAt: string | null;
  createdAt: string | null;
  agreedFeeCents: number | null;
  viewRateCents: number | null;
  engagementRateCents: number | null;
  maxPayCents: number | null;
  trackingDays: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  contentStatus: string | null;
  publicationStatus: string | null;
  deliverableHoldStartedAt: string | null;
  deliverableRecheckedAt: string | null;
  deliverableForfeitedAt: string | null;
};

export type PayoutBoardPayment = {
  postId: string;
  amountCents: number;
  status: "approved" | "paid";
  approvedAt: string | null;
  paidCents: number | null;
  paidAt: string | null;
  reference: string;
  adjustmentCents: number | null;
  adjustmentReason: string;
};

export type PayoutBoardWebsite = {
  period: string;
  clicks: number;
  pageViews: number;
  amountCents: number;
  status: "pending" | "approved" | "paid";
  clickRateCents: number;
  pageViewRateCents: number;
  paidAt: string | null;
  approvedAt: string | null;
  reference: string;
};

export const PAYOUT_KINDS: Record<PayoutBoardKind, { label: string; color: string; detail: string }> = {
  base: { label: "Base payments", color: "#33130F", detail: "Monthly posting rate and fixed post fees" },
  social: { label: "Social performance", color: "#A8706A", detail: "Views and engagement" },
  web: { label: "Website performance", color: "#E39A93", detail: "Clicks and page views" },
  lab: { label: "Lab commission", color: "#C9A27E", detail: "Monthly total from lab orders" },
};

export const PAYOUT_STATUSES: Record<PayoutBoardStatus, { label: string; background: string; color: string }> = {
  review: { label: "In review", background: "#DBD4BD", color: "#331110" },
  approved: { label: "Approved, not sent", background: "#F3E6E3", color: "#5A2A24" },
  paid: { label: "Paid", background: "#DDF0E4", color: "#1D6340" },
  hold: { label: "On hold", background: "#FBE3DF", color: "#9B2C1F" },
};

const KIND_ORDER: PayoutBoardKind[] = ["base", "social", "web", "lab"];

export function payoutDay(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
  return date.toISOString().slice(0, 10);
}

export function payoutDateLabel(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00.000Z`));
}

export function payoutMonthLabel(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

export function payoutMonthShort(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)));
}

function countOf(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function engagementsOf(post: Pick<PayoutBoardPost, "likes" | "comments" | "shares" | "saves">) {
  return countOf(post.likes) + countOf(post.comments) + countOf(post.shares) + countOf(post.saves);
}

function titleOf(post: PayoutBoardPost) {
  const line = post.caption.split("\n").map((part) => part.trim()).find(Boolean) ?? "";
  const name = line.slice(0, 80) || formatName(post.format);
  return post.campaign ? `${post.campaign} · ${name}` : name;
}

function formatName(format: string | null) {
  if (format === "tiktok") return "TikTok video";
  if (format === "instagram_reel") return "Instagram reel";
  if (format === "instagram_post") return "Instagram post";
  return "Post";
}

function boardStatus(status: DeliverableLineStatus | "pending" | "approved" | "paid"): PayoutBoardStatus | null {
  if (status === "approved") return "approved";
  if (status === "paid") return "paid";
  if (status === "hold" || status === "recheck") return "hold";
  if (status === "closed" || status === "forfeited") return null;
  return "review";
}

function paymentNote(status: PayoutBoardStatus, paidOn: string | null) {
  if (status === "paid") return paidOn ? `Paid ${payoutDateLabel(paidOn)}` : "Paid";
  if (status === "approved") return "In the next manual payout";
  if (status === "hold") return "Waiting on review";
  return "After approval";
}

function socialAmount(post: PayoutBoardPost) {
  if (post.viewRateCents == null) return post.agreedFeeCents ?? 0;
  return (
    socialPayCents({
      views: post.views ?? 0,
      viewRateCents: post.viewRateCents,
      engagementRateCents: post.engagementRateCents ?? 0,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      saves: post.saves,
      maxPayCents: post.maxPayCents,
    }) ?? 0
  );
}

function socialTerms(post: PayoutBoardPost) {
  if (post.viewRateCents == null) return post.agreedFeeCents == null ? "Agreed post payment" : `${formatCents(post.agreedFeeCents)} per post`;
  const cap = post.maxPayCents == null ? "" : ` Maximum ${formatCents(post.maxPayCents)}.`;
  return `Social rates: ${formatCents(post.viewRateCents)} per 1,000 views + ${formatCents(post.engagementRateCents ?? 0)} per engagement.${cap}`;
}

function socialWork(post: PayoutBoardPost, status: PayoutBoardStatus) {
  const views = countOf(post.views);
  const engagements = engagementsOf(post);
  if (status === "review" || status === "hold") {
    const end = countEnds(post);
    const counted = `${views.toLocaleString("en-US")} views so far`;
    return end ? `${counted}. The count ends ${payoutDateLabel(end)}.` : `${counted}.`;
  }
  return `${views.toLocaleString("en-US")} views and ${engagements.toLocaleString("en-US")} engagements.`;
}

function countEnds(post: PayoutBoardPost) {
  const start = payoutDay(post.publishedAt);
  if (!start) return "";
  const date = new Date(`${start}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + resolvedTrackingDays(post.trackingDays));
  return date.toISOString().slice(0, 10);
}

function postItem(post: PayoutBoardPost, payment: PayoutBoardPayment | undefined, today: string): PayoutBoardItem | null {
  const phase = deliverablePhase(
    {
      contentStatus: post.contentStatus,
      publicationStatus: post.publicationStatus,
      agreedFeeCents: post.agreedFeeCents,
      viewRateCents: post.viewRateCents,
      maxPayCents: post.maxPayCents,
      trackingDays: post.trackingDays,
      views: post.views,
      publishedAt: post.publishedAt,
      deliverableHoldStartedAt: post.deliverableHoldStartedAt,
      deliverableRecheckedAt: post.deliverableRecheckedAt,
      deliverableForfeitedAt: post.deliverableForfeitedAt,
    },
    Date.parse(`${today}T12:00:00.000Z`) || Date.now(),
  );
  const status = boardStatus(payment?.status ?? phase ?? "closed");
  if (!status) return null;
  if (!payment && post.viewRateCents == null && post.agreedFeeCents == null) return null;
  const paidOn = payoutDay(payment?.paidAt);
  const approvedOn = payoutDay(payment?.approvedAt) || paidOn;
  const kind: PayoutBoardKind = post.viewRateCents == null && post.agreedFeeCents != null ? "base" : "social";
  const amountCents = payment
    ? (payment.status === "paid" ? (payment.paidCents ?? payment.amountCents) : payment.amountCents) + (payment.adjustmentCents ?? 0)
    : socialAmount(post);
  const adjustment = payment?.adjustmentReason ? ` ${payment.adjustmentReason}` : "";
  return {
    id: post.id,
    title: titleOf(post),
    kind,
    amountCents: Math.max(0, amountCents),
    earnedOn: payoutDay(post.publishedAt) || payoutDay(post.createdAt) || approvedOn || today,
    status,
    terms: socialTerms(post),
    work: `${socialWork(post, status)}${adjustment}`.trim(),
    approved: status === "hold" ? "On hold" : approvedOn ? payoutDateLabel(approvedOn) : "Not yet",
    paymentNote: paymentNote(status, paidOn),
    paidOn: paidOn || null,
    reference: payment?.reference ?? "",
  };
}

function periodDay(period: string, today: string) {
  if (period === today.slice(0, 7)) return today;
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return today;
  const last = new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
  return `${period}-${String(last).padStart(2, "0")}`;
}

function websiteItem(row: PayoutBoardWebsite, today: string): PayoutBoardItem | null {
  if (row.amountCents <= 0 && row.status === "pending") return null;
  const status: PayoutBoardStatus = row.status === "paid" ? "paid" : row.status === "approved" ? "approved" : "review";
  const paidOn = payoutDay(row.paidAt);
  const approvedOn = payoutDay(row.approvedAt) || paidOn;
  return {
    id: `web-${row.period}`,
    title: `${payoutMonthLabel(row.period)} website traffic`,
    kind: "web",
    amountCents: Math.max(0, row.amountCents),
    earnedOn: paidOn || periodDay(row.period, today),
    status,
    terms: `Website rates: ${formatCents(row.clickRateCents)} per click + ${formatCents(row.pageViewRateCents)} per 1,000 page views`,
    work: `${row.clicks.toLocaleString("en-US")} verified link clicks and ${row.pageViews.toLocaleString("en-US")} public page views.`,
    approved: approvedOn ? payoutDateLabel(approvedOn) : "Not yet",
    paymentNote: paymentNote(status, paidOn),
    paidOn: paidOn || null,
    reference: row.reference,
  };
}

export type PayoutBoardMonthly = {
  period: string;
  rateCents: number;
  requiredPosts: number;
  verifiedPosts: number;
  earnedCents: number;
  status: "earned" | "short" | "approved" | "paid";
  approvedAt: string | null;
  paidAt: string | null;
  reference: string;
};

function monthlyItem(row: PayoutBoardMonthly, today: string): PayoutBoardItem | null {
  if (row.status === "short" && row.period !== today.slice(0, 7)) return null;
  const status: PayoutBoardStatus = row.status === "paid" ? "paid" : row.status === "approved" ? "approved" : "review";
  const paidOn = payoutDay(row.paidAt);
  const approvedOn = payoutDay(row.approvedAt) || paidOn;
  const live = `${row.verifiedPosts} of ${row.requiredPosts} required posts live.`;
  return {
    id: `monthly-${row.period}`,
    title: `${payoutMonthLabel(row.period)} monthly posting rate`,
    kind: "base",
    amountCents: Math.max(0, row.earnedCents),
    earnedOn: paidOn || periodDay(row.period, today),
    status,
    terms: `${formatCents(row.rateCents)} for each month all ${row.requiredPosts} required posts are live`,
    work: row.status === "short" ? `${live} The monthly rate is earned once every required post is live.` : live,
    approved: approvedOn ? payoutDateLabel(approvedOn) : "Not yet",
    paymentNote: paymentNote(status, paidOn),
    paidOn: paidOn || null,
    reference: row.reference,
  };
}

export type PayoutLabRef = { id: string; source: "Promo code" | "Tracking link" };

export type PayoutLabInput = {
  period: string;
  amountCents: number;
  conversions: number;
  status: "pending" | "approved" | "paid";
  paidOn: string | null;
  approvedOn: string | null;
  reference: string;
  terms: string;
  refs: PayoutLabRef[];
};

export type PayoutLabPeriod = {
  id: string;
  period: string;
  label: string;
  payNote: string;
  count: number;
  amountCents: number;
  tone: "progress" | "paid";
  earnedOn: string;
  refs: PayoutLabRef[];
};

export function labPayoutRows(rows: PayoutLabInput[], today: string) {
  const items: PayoutBoardItem[] = [];
  const periods: PayoutLabPeriod[] = [];
  for (const row of rows) {
    if (row.amountCents <= 0 && row.conversions === 0) continue;
    const status: PayoutBoardStatus = row.status === "paid" ? "paid" : row.status === "approved" ? "approved" : "review";
    const paidOn = payoutDay(row.paidOn);
    const approvedOn = payoutDay(row.approvedOn) || paidOn;
    const end = monthEnd(row.period);
    const earnedOn = row.period === today.slice(0, 7) ? today : end;
    const countLabel = row.conversions === 1 ? "1 order" : `${row.conversions.toLocaleString("en-US")} orders`;
    items.push({
      id: `lab-${row.period}-${row.status}`,
      title: `${payoutMonthLabel(row.period)} lab orders`,
      kind: "lab",
      amountCents: Math.max(0, row.amountCents),
      earnedOn,
      status,
      terms: row.terms,
      work: `${countLabel}. Included in this month's payout.`,
      approved: status === "review" ? (row.period === today.slice(0, 7) ? "After this month ends" : "Not yet") : approvedOn ? payoutDateLabel(approvedOn) : "Not yet",
      paymentNote: paymentNote(status, paidOn),
      paidOn: paidOn || null,
      reference: row.reference,
    });
    periods.push({
      id: `${row.period}-${row.status}`,
      period: row.period,
      label: payoutMonthLabel(row.period),
      payNote: status === "paid" && paidOn ? `Paid ${payoutDateLabel(paidOn)}` : status === "approved" ? "Approved, waiting to be sent" : row.period === today.slice(0, 7) ? `Closes ${payoutDateLabel(end)} · paid after approval` : "Waiting for approval",
      count: row.conversions,
      amountCents: Math.max(0, row.amountCents),
      tone: status === "paid" ? "paid" : "progress",
      earnedOn,
      refs: row.refs,
    });
  }
  return {
    items,
    periods: periods.sort((left, right) => right.period.localeCompare(left.period) || left.id.localeCompare(right.id)),
  };
}

function monthEnd(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return "";
  const last = new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
  return `${period}-${String(last).padStart(2, "0")}`;
}

export function buildPayoutItems(input: {
  posts: PayoutBoardPost[];
  payments: PayoutBoardPayment[];
  websites: PayoutBoardWebsite[];
  labs?: PayoutLabInput[];
  monthlies?: PayoutBoardMonthly[];
  today: string;
}) {
  const payments = new Map(input.payments.map((payment) => [payment.postId, payment]));
  const seen = new Set<string>();
  const items: PayoutBoardItem[] = [];
  for (const post of input.posts) {
    seen.add(post.id);
    const item = postItem(post, payments.get(post.id), input.today);
    if (item) items.push(item);
  }
  for (const payment of input.payments) {
    if (seen.has(payment.postId)) continue;
    const status = boardStatus(payment.status);
    if (!status) continue;
    const paidOn = payoutDay(payment.paidAt);
    items.push({
      id: payment.postId,
      title: "Post",
      kind: "social",
      amountCents: Math.max(0, (payment.status === "paid" ? (payment.paidCents ?? payment.amountCents) : payment.amountCents) + (payment.adjustmentCents ?? 0)),
      earnedOn: payoutDay(payment.approvedAt) || paidOn || input.today,
      status,
      terms: "Recorded social payment",
      work: payment.adjustmentReason || "The post payment is recorded.",
      approved: payoutDay(payment.approvedAt) ? payoutDateLabel(payoutDay(payment.approvedAt)) : "Not yet",
      paymentNote: paymentNote(status, paidOn),
      paidOn: paidOn || null,
      reference: payment.reference,
    });
  }
  for (const website of input.websites) {
    const item = websiteItem(website, input.today);
    if (item) items.push(item);
  }
  for (const monthly of input.monthlies ?? []) {
    const item = monthlyItem(monthly, input.today);
    if (item) items.push(item);
  }
  items.push(...labPayoutRows(input.labs ?? [], input.today).items);
  return items.sort((left, right) => right.earnedOn.localeCompare(left.earnedOn) || left.title.localeCompare(right.title));
}

export function payoutRangeStart(today: string, range: PayoutBoardRange) {
  if (range === "all") return "";
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - (Number(range) - 1));
  return date.toISOString().slice(0, 10);
}

export function itemsInRange<T extends { earnedOn: string }>(items: T[], today: string, range: PayoutBoardRange) {
  const start = payoutRangeStart(today, range);
  if (!start) return items;
  return items.filter((item) => item.earnedOn >= start && item.earnedOn <= today);
}

export function payoutCents(items: PayoutBoardItem[]) {
  return items.reduce((sum, item) => sum + item.amountCents, 0);
}

export function moneyTop(cents: number) {
  if (cents <= 0) return 100;
  const step = cents >= 10000 ? 10000 : cents >= 1000 ? 1000 : 100;
  return Math.ceil(cents / step) * step;
}

export type PayoutPeriodTotal = {
  period: string;
  label: string;
  total: number;
  base: number;
  social: number;
  web: number;
  lab: number;
  status: PayoutBoardStatus | "mixed";
  items: PayoutBoardItem[];
};

export function payoutPeriodTotals(items: PayoutBoardItem[]): PayoutPeriodTotal[] {
  const groups = new Map<string, PayoutBoardItem[]>();
  for (const item of items) {
    const period = item.earnedOn.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(period)) continue;
    const rows = groups.get(period) ?? [];
    rows.push(item);
    groups.set(period, rows);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([period, rows]) => {
      const statuses = new Set(rows.map((row) => row.status));
      const status = statuses.size === 1 ? [...statuses][0] : "mixed";
      return {
        period,
        label: payoutMonthLabel(period),
        base: payoutCents(rows.filter((row) => row.kind === "base")),
        social: payoutCents(rows.filter((row) => row.kind === "social")),
        web: payoutCents(rows.filter((row) => row.kind === "web")),
        lab: payoutCents(rows.filter((row) => row.kind === "lab")),
        total: payoutCents(rows),
        status,
        items: [...rows].sort((left, right) => payoutKindOrder().indexOf(left.kind) - payoutKindOrder().indexOf(right.kind) || left.title.localeCompare(right.title)),
      };
    });
}

export function payoutMonths(items: PayoutBoardItem[], today: string, range: PayoutBoardRange) {
  const earned = items.filter((item) => item.status === "approved" || item.status === "paid");
  const periods: string[] = [];
  if (range === "all") {
    const found = [...new Set(earned.map((item) => item.earnedOn.slice(0, 7)).filter((period) => /^\d{4}-\d{2}$/.test(period)))].sort();
    periods.push(...(found.length > 0 ? found : [today.slice(0, 7)]));
  } else {
    const start = payoutRangeStart(today, range).slice(0, 7);
    let cursor = start;
    const end = today.slice(0, 7);
    while (cursor && cursor <= end) {
      periods.push(cursor);
      const [year, month] = cursor.split("-").map(Number);
      const next = new Date(Date.UTC(year, month, 1));
      cursor = next.toISOString().slice(0, 7);
    }
  }
  return periods.map((period) => {
    const rows = earned.filter((item) => item.earnedOn.slice(0, 7) === period);
    const amounts = {
      base: payoutCents(rows.filter((item) => item.kind === "base")),
      social: payoutCents(rows.filter((item) => item.kind === "social")),
      web: payoutCents(rows.filter((item) => item.kind === "web")),
      lab: payoutCents(rows.filter((item) => item.kind === "lab")),
    };
    return { period, label: payoutMonthShort(period), ...amounts, total: amounts.base + amounts.social + amounts.web + amounts.lab };
  });
}

export type PayoutReceipt = {
  key: string;
  date: string;
  description: string;
  amountCents: number;
  reference: string;
  method: string;
  lines: { id: string; title: string; kind: PayoutBoardKind; amountCents: number }[];
};

export function payoutReceipts(items: PayoutBoardItem[], today: string, range: PayoutBoardRange): PayoutReceipt[] {
  const start = payoutRangeStart(today, range);
  const paid = items.filter((item) => {
    if (item.status !== "paid") return false;
    const day = item.paidOn || item.earnedOn;
    return !start || (day >= start && day <= today);
  });
  const groups = new Map<string, PayoutBoardItem[]>();
  for (const item of paid) {
    const key = `${item.paidOn ?? item.earnedOn}|${item.reference}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()]
    .map(([key, lines]) => {
      const periods = [...new Set(lines.map((line) => line.earnedOn.slice(0, 7)))];
      const date = lines[0]?.paidOn || lines[0]?.earnedOn || today;
      return {
        key,
        date,
        description: periods.length === 1 ? `${payoutMonthLabel(periods[0] ?? "")} payments` : "Marketing and lab payment",
        amountCents: payoutCents(lines),
        reference: lines[0]?.reference || "Payment",
        method: "Sent manually by Leader Health",
        lines: lines.map((line) => ({ id: line.id, title: line.title, kind: line.kind, amountCents: line.amountCents })),
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function payoutKindOrder() {
  return KIND_ORDER;
}
