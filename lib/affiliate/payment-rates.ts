import { socialPayCents } from "./manual-checkpoint";

export const PAYMENT_CATEGORIES = ["views", "engagements", "impressions", "clicks", "pageViews"] as const;

export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];

export type CategoryRate = {
  enabled: boolean;
  rateCents: number;
};

export type PaymentRates = {
  views: CategoryRate;
  engagements: CategoryRate;
  impressions: CategoryRate;
  clicks: CategoryRate;
  pageViews: CategoryRate;
  overrides: Partial<Record<PaymentCategory, Record<string, number>>>;
};

export type WebsiteSnapshot = {
  impressions: number;
  clicks: number;
  pageViews: number;
  impressionRateCents: number;
  clickRateCents: number;
  pageViewRateCents: number;
  amountCents: number;
  status: "approved" | "paid";
};

export type MarketingEventQuote = {
  code: string;
  kind: "impression" | "click" | "page_view";
  payable: boolean;
  excluded?: boolean;
  createdAt: string;
};

const RATE_MAX = 10_000_000;

export function defaultPaymentRates(): PaymentRates {
  return {
    views: { enabled: true, rateCents: 200 },
    engagements: { enabled: true, rateCents: 5 },
    impressions: { enabled: false, rateCents: 0 },
    clicks: { enabled: true, rateCents: 10 },
    pageViews: { enabled: true, rateCents: 200 },
    overrides: {},
  };
}

export function paymentRateCents(value: unknown) {
  const raw = typeof value === "string" ? value.trim().replace(/^\$/, "") : typeof value === "number" ? String(value) : "";
  if (!raw) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const cents = Math.round(Number(raw) * 100);
  if (!Number.isInteger(cents) || cents < 0 || cents > RATE_MAX) return null;
  return cents;
}

export function storedRateCents(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > RATE_MAX) return 0;
  return value;
}

export function standingViewRateCents(rates: PaymentRates | null) {
  if (rates && rates.views.enabled && rates.views.rateCents > 0) return rates.views.rateCents;
  return null;
}

export function rateFor(rates: PaymentRates, category: PaymentCategory) {
  const base = rates[category];
  if (!base.enabled) return 0;
  return base.rateCents;
}

export function websitePayCents(input: { impressions: number; clicks: number; pageViews: number; impressionRateCents: number; clickRateCents: number; pageViewRateCents: number }) {
  const counts = [input.impressions, input.clicks, input.pageViews];
  const rates = [input.impressionRateCents, input.clickRateCents, input.pageViewRateCents];
  if (counts.some((count) => !Number.isInteger(count) || count < 0)) return null;
  if (rates.some((rate) => !Number.isInteger(rate) || rate < 0)) return null;
  return input.clicks * input.clickRateCents + Math.round((input.pageViews * input.pageViewRateCents) / 1000);
}

export function eventPeriod(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function websiteMonthAmount(input: {
  events: MarketingEventQuote[];
  code: string;
  period: string;
  rates: PaymentRates;
  snapshot: WebsiteSnapshot | null;
}) {
  if (input.snapshot) {
    return { ...input.snapshot, frozen: true as const };
  }
  const impressions = 0;
  const clicks = input.rates.clicks.enabled
    ? input.events.filter((event) => event.code === input.code && event.payable && event.excluded !== true && event.kind === "click" && eventPeriod(event.createdAt) === input.period).length
    : 0;
  const pageViews = input.rates.pageViews.enabled
    ? input.events.filter((event) => event.code === input.code && event.payable && event.excluded !== true && event.kind === "page_view" && eventPeriod(event.createdAt) === input.period).length
    : 0;
  const impressionRateCents = rateFor(input.rates, "impressions");
  const clickRateCents = rateFor(input.rates, "clicks");
  const pageViewRateCents = rateFor(input.rates, "pageViews");
  return {
    impressions,
    clicks,
    pageViews,
    impressionRateCents,
    clickRateCents,
    pageViewRateCents,
    amountCents: websitePayCents({ impressions, clicks, pageViews, impressionRateCents, clickRateCents, pageViewRateCents }) ?? 0,
    status: "pending" as const,
    frozen: false as const,
  };
}

export function socialMonthCents(input: {
  period: string;
  posts: {
    id: string;
    publishedAt?: string | null;
    viewRateCents?: number | null;
    engagementRateCents?: number | null;
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    saves?: number | null;
    maxPayCents?: number | null;
  }[];
  payments: { postId: string; amountCents: number; approvedAt?: string | null; paidAt?: string | null; adjustmentCents?: number | null }[];
}) {
  const paidIds = new Set(input.payments.map((payment) => payment.postId));
  let socialCents = 0;
  let adjustmentCents = 0;
  for (const payment of input.payments) {
    if (eventPeriod(payment.approvedAt ?? payment.paidAt ?? "") === input.period) socialCents += payment.amountCents;
    if (payment.adjustmentCents && eventPeriod(payment.paidAt ?? "") === input.period) adjustmentCents += payment.adjustmentCents;
  }
  for (const post of input.posts) {
    if (paidIds.has(post.id) || post.viewRateCents == null || post.views == null) continue;
    if (eventPeriod(post.publishedAt ?? "") !== input.period) continue;
    socialCents +=
      socialPayCents({
        views: post.views,
        viewRateCents: post.viewRateCents,
        engagementRateCents: post.engagementRateCents,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        saves: post.saves,
        maxPayCents: post.maxPayCents,
      }) ?? 0;
  }
  return { socialCents, adjustmentCents };
}

export function categoryLabel(category: PaymentCategory) {
  if (category === "views") return "Social views";
  if (category === "engagements") return "Social engagements";
  if (category === "impressions") return "Ad impressions";
  if (category === "clicks") return "Verified link clicks";
  return "Eligible public page views";
}
