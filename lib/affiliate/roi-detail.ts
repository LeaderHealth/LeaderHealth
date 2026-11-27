import type { MarketingCampaignRecord } from "./campaign-record";
import { remainingSalesCents } from "./refunds";
import { insideCampaignPeriod, orderDay, roiCommissionCents, roiInRange, roiPostPayCents, roiSpentOn, type CampaignRankOrder, type RoiCost, type RoiPostPay, type RoiRange } from "./roi";

export type CampaignRoiPost = {
  code: string;
  campaign: string | null;
  contentStatus: string;
  publicationStatus: string | null;
  views: number;
  engagements: number;
};

export type CampaignPhase = "running" | "ended" | "upcoming" | "open";

export type CampaignRoiAffiliate = {
  code: string;
  name: string;
  verified: number;
  required: number;
  views: number;
  engagements: number;
  orders: number;
  salesCents: number;
};

export type CampaignRoiDetail = {
  name: string;
  startsOn: string;
  endsOn: string;
  phase: CampaignPhase;
  day: number;
  days: number;
  affiliates: CampaignRoiAffiliate[];
  verified: number;
  required: number;
  views: number;
  engagements: number;
  orders: number;
  refundedCents: number;
  salesCents: number;
  affiliatePayCents: number;
  marketingCents: number;
  costCents: number;
  netCents: number;
  roiPct: number | null;
  costs: { id: string; spentOn: string; costCents: number; note: string; recordedBy: string }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function same(left: string | null | undefined, right: string) {
  return (left ?? "").trim().toLowerCase() === right.trim().toLowerCase();
}

function dayNumber(value: string) {
  return Math.round(Date.parse(`${value}T00:00:00Z`) / DAY_MS);
}

export function campaignPhase(record: Pick<MarketingCampaignRecord, "startsOn" | "endsOn">, today: string) {
  const { startsOn, endsOn } = record;
  if (!startsOn && !endsOn) return { phase: "open" as const, day: 0, days: 0 };
  if (startsOn && today < startsOn) return { phase: "upcoming" as const, day: 0, days: 0 };
  if (endsOn && today > endsOn) return { phase: "ended" as const, day: 0, days: 0 };
  if (startsOn && endsOn) {
    return { phase: "running" as const, day: dayNumber(today) - dayNumber(startsOn) + 1, days: dayNumber(endsOn) - dayNumber(startsOn) + 1 };
  }
  return { phase: "running" as const, day: 0, days: 0 };
}

function dayLabel(value: string, withYear: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function campaignDay(value: string) {
  return dayLabel(value, true);
}

export function campaignDates(startsOn: string, endsOn: string) {
  if (startsOn && endsOn) return `${dayLabel(startsOn, startsOn.slice(0, 4) !== endsOn.slice(0, 4))} – ${dayLabel(endsOn, true)}`;
  if (startsOn) return `Starts ${dayLabel(startsOn, true)}`;
  if (endsOn) return `Ends ${dayLabel(endsOn, true)}`;
  return "No dates";
}

export function campaignPhaseLabel(detail: { phase: CampaignPhase; day: number; days: number }, long = false) {
  if (detail.phase === "ended") return "Ended";
  if (detail.phase === "upcoming") return "Upcoming";
  if (detail.phase === "open") return "Open";
  return long && detail.days > 0 ? `Running · day ${detail.day} of ${detail.days}` : "Running";
}

export function formatRoi(pct: number | null) {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

export function roiPercent(salesCents: number, costCents: number) {
  if (costCents <= 0) return null;
  return Math.round(((salesCents - costCents) / costCents) * 1000) / 10;
}

export function campaignRoiDetail(input: {
  record: MarketingCampaignRecord;
  orders: readonly CampaignRankOrder[];
  costs: readonly RoiCost[];
  posts: readonly CampaignRoiPost[];
  postPay?: readonly RoiPostPay[];
  names?: ReadonlyMap<string, string>;
  today?: string;
  range?: RoiRange;
  now?: number;
}): CampaignRoiDetail {
  const { record } = input;
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const range = input.range ?? "all";
  const now = input.now ?? Date.now();
  const names = input.names ?? new Map<string, string>();
  const rows = new Map<string, CampaignRoiAffiliate>();
  const row = (code: string) => {
    const existing = rows.get(code);
    if (existing) return existing;
    const created = { code, name: names.get(code) ?? code, verified: 0, required: record.postsRequired, views: 0, engagements: 0, orders: 0, salesCents: 0 };
    rows.set(code, created);
    return created;
  };
  for (const code of record.assignedCodes) row(code);

  let views = 0;
  let engagements = 0;
  let verified = 0;
  for (const post of input.posts) {
    if (!same(post.campaign, record.name) || post.contentStatus !== "approved") continue;
    const target = row(post.code);
    const postViews = Math.max(0, Math.round(post.views));
    const postEngagements = Math.max(0, Math.round(post.engagements));
    target.views += postViews;
    target.engagements += postEngagements;
    views += postViews;
    engagements += postEngagements;
    if (post.publicationStatus === "tracking_active") {
      target.verified += 1;
      verified += 1;
    }
  }

  let orders = 0;
  let salesCents = 0;
  let refundedCents = 0;
  let affiliatePayCents = 0;
  for (const order of input.orders) {
    if (order.dryRun || !same(order.promoCode, record.name)) continue;
    if (!roiInRange(order.createdAt, range, now) || !insideCampaignPeriod(orderDay(order.createdAt), record)) continue;
    const remaining = remainingSalesCents(order.amountCents, order.refundedAmountCents);
    refundedCents += Math.max(0, (order.amountCents ?? 0) - remaining);
    if (remaining <= 0) continue;
    affiliatePayCents += roiCommissionCents(order);
    orders += 1;
    salesCents += remaining;
    if (order.code) {
      const target = row(order.code);
      target.orders += 1;
      target.salesCents += remaining;
    }
  }

  const costs = input.costs
    .filter((cost) => same(cost.campaign, record.name) && cost.costCents > 0 && roiInRange(cost.spentOn ?? null, range, now) && insideCampaignPeriod(orderDay(cost.spentOn ?? null), record))
    .map((cost) => ({
      id: cost.id ?? "",
      spentOn: roiSpentOn(cost.spentOn ?? "") ?? "",
      costCents: Math.round(cost.costCents),
      note: cost.note ?? "",
      recordedBy: cost.recordedBy ?? "",
    }))
    .sort((left, right) => right.spentOn.localeCompare(left.spentOn));
  for (const pay of input.postPay ?? []) {
    if (!same(pay.campaign, record.name)) continue;
    if (!roiInRange(pay.approvedAt, range, now) || !insideCampaignPeriod(orderDay(pay.approvedAt), record)) continue;
    affiliatePayCents += roiPostPayCents(pay);
  }
  const marketingCents = costs.reduce((sum, cost) => sum + cost.costCents, 0);
  const costCents = affiliatePayCents + marketingCents;
  const affiliates = [...rows.values()].sort((left, right) => right.salesCents - left.salesCents || right.views - left.views || left.name.localeCompare(right.name));

  return {
    name: record.name,
    startsOn: record.startsOn,
    endsOn: record.endsOn,
    ...campaignPhase(record, today),
    affiliates,
    verified,
    required: record.assignedCodes.length * record.postsRequired,
    views,
    engagements,
    orders,
    refundedCents,
    salesCents,
    affiliatePayCents,
    marketingCents,
    costCents,
    netCents: salesCents - costCents,
    roiPct: roiPercent(salesCents, costCents),
    costs,
  };
}

export function campaignAdvice(detail: CampaignRoiDetail) {
  if (detail.affiliates.length === 0) return "Assign affiliates to this campaign so it can start earning.";
  if (detail.phase === "upcoming") return `Starts ${campaignDay(detail.startsOn)}. Results appear once posts go live.`;
  if (detail.costCents <= 0) return "Add this campaign’s costs to see its return.";
  const missing = detail.required - detail.verified;
  if (detail.phase !== "ended" && missing > 0) {
    return `${missing} of ${detail.required} required posts aren’t verified yet. Follow up with those affiliates.`;
  }
  if (detail.orders === 0) {
    return detail.views > 0
      ? "Posts are getting views but no orders. Check that affiliates share their promo code."
      : "No views or orders yet. Ask affiliates to post and share their promo code.";
  }
  const top = detail.affiliates.reduce((best, item) => (item.salesCents > best.salesCents ? item : best), detail.affiliates[0]);
  const share = detail.salesCents > 0 ? Math.round((top.salesCents / detail.salesCents) * 100) : 0;
  const lead = top.salesCents > 0 && detail.affiliates.length > 1 ? ` ${top.name} brought in ${share}% of sales.` : "";
  const roi = formatRoi(detail.roiPct);
  if ((detail.roiPct ?? 0) >= 0) {
    return detail.phase === "ended" ? `Paid off at ${roi}.${lead} Invite the same affiliates to your next campaign.` : `On track at ${roi}.${lead}`;
  }
  return detail.phase === "ended"
    ? `Lost money at ${roi}.${lead} Try a different offer or affiliates in your next campaign.`
    : `At ${roi} so far.${lead} Lean on your top affiliates to close the gap.`;
}

function csvCell(value: string | number) {
  const raw = String(value);
  const text = /^[=+\-@]/.test(raw) && !/^-?\d+(\.\d+)?$/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function campaignRoiCsv(detail: CampaignRoiDetail) {
  const dollars = (cents: number) => (cents / 100).toFixed(2);
  const lines: (string | number)[][] = [
    ["Campaign", detail.name],
    ["Starts", detail.startsOn],
    ["Ends", detail.endsOn],
    ["Revenue", dollars(detail.salesCents)],
    ["Affiliate pay", dollars(detail.affiliatePayCents)],
    ["Marketing costs", dollars(detail.marketingCents)],
    ["Cost", dollars(detail.costCents)],
    ["Profit", dollars(detail.netCents)],
    ["ROI %", detail.roiPct == null ? "" : detail.roiPct.toFixed(1)],
    ["Paid orders", detail.orders],
    ["Refunded", dollars(detail.refundedCents)],
    ["Views", detail.views],
    ["Engagements", detail.engagements],
    ["Posts verified", `${detail.verified} of ${detail.required}`],
    [],
    ["Affiliate", "Posts verified", "Views", "Engagements", "Paid orders", "Revenue"],
    ...detail.affiliates.map((affiliate) => [
      affiliate.name,
      `${affiliate.verified} of ${affiliate.required}`,
      affiliate.views,
      affiliate.engagements,
      affiliate.orders,
      dollars(affiliate.salesCents),
    ]),
    [],
    ["Spent on", "What for", "Recorded by", "Cost"],
    ...detail.costs.map((cost) => [cost.spentOn, cost.note, cost.recordedBy, dollars(cost.costCents)]),
  ];
  return lines.map((line) => line.map(csvCell).join(",")).join("\n");
}
