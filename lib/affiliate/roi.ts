import { affiliateCampaign } from "./link";
import { remainingSalesCents } from "./refunds";

export const ROI_UNASSIGNED = "No promo code";

const CAMPAIGN_NAME = /^[A-Za-z0-9][A-Za-z0-9 '&.,-]{0,59}$/;

export type RoiRange = "30" | "90" | "all";

export type RoiOrder = {
  promoCode: string;
  amountCents: number | null;
  refundedAmountCents: number;
  dryRun: boolean;
  createdAt: string | null;
};

export type RoiCost = {
  campaign: string;
  costCents: number;
  spentOn: string | null;
};

export type RoiRow = {
  campaign: string;
  orders: number;
  costCents: number;
  revenueCents: number;
  profitCents: number;
};

export type RoiReport = {
  rows: RoiRow[];
  orders: number;
  costCents: number;
  revenueCents: number;
  profitCents: number;
};

export type CampaignSocialPost = {
  campaign: string | null;
  postedOn: string | null;
  views: number;
  engagements: number;
};

export type CampaignSocial = {
  campaign: string;
  views: number;
  engagements: number;
};

export type CampaignWindow = {
  name: string;
  startsOn: string;
  endsOn: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function roiRange(value: unknown): RoiRange {
  return value === "30" || value === "90" ? value : "all";
}

export function roiCampaignName(value: unknown) {
  return affiliateCampaign(value);
}

export function campaignDirectoryName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.toLowerCase() === ROI_UNASSIGNED.toLowerCase() || !CAMPAIGN_NAME.test(name)) return null;
  return name;
}

export function roiCostCents(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,]/g, "") : "";
  if (!raw) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars <= 0 || dollars > 100000) return null;
  return Math.round(dollars * 100);
}

export function roiSpentOn(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value;
}

export function campaignSocialTotals(posts: readonly CampaignSocialPost[], range: RoiRange, now = Date.now()): CampaignSocial[] {
  const buckets = new Map<string, CampaignSocial>();
  for (const post of posts) {
    const name = post.campaign?.trim() ?? "";
    if (!name || name.toLowerCase() === ROI_UNASSIGNED.toLowerCase()) continue;
    if (!roiInRange(post.postedOn, range, now)) continue;
    const key = name.toLowerCase();
    const current = buckets.get(key) ?? { campaign: name, views: 0, engagements: 0 };
    current.views += Math.max(0, Math.round(post.views));
    current.engagements += Math.max(0, Math.round(post.engagements));
    buckets.set(key, current);
  }
  return [...buckets.values()].sort((left, right) => left.campaign.localeCompare(right.campaign));
}

export function orderDay(createdAt: string | null) {
  if (!createdAt) return null;
  const day = createdAt.slice(0, 10);
  return roiSpentOn(day);
}

export function insideCampaignPeriod(day: string | null, window: Pick<CampaignWindow, "startsOn" | "endsOn"> | undefined) {
  if (!window || (!window.startsOn && !window.endsOn)) return true;
  if (!day) return false;
  if (window.startsOn && day < window.startsOn) return false;
  if (window.endsOn && day > window.endsOn) return false;
  return true;
}

export function ordersWithinCampaignPeriod(
  orders: readonly Pick<RoiOrder, "promoCode" | "dryRun" | "createdAt">[],
  windows: readonly CampaignWindow[],
  range: RoiRange,
  now = Date.now(),
) {
  const byName = new Map(windows.map((window) => [window.name.trim().toLowerCase(), window]));
  const counts = new Map<string, number>();
  for (const order of orders) {
    if (order.dryRun || !roiInRange(order.createdAt, range, now)) continue;
    const label = campaignLabel(order.promoCode);
    const window = label === ROI_UNASSIGNED ? undefined : byName.get(label.toLowerCase());
    if (!insideCampaignPeriod(orderDay(order.createdAt), window)) continue;
    const key = label.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function roiInRange(value: string | null, range: RoiRange, now: number) {
  if (!value) return false;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return false;
  if (range === "all") return true;
  const days = range === "30" ? 30 : 90;
  return time >= now - days * DAY_MS;
}

function campaignKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === ROI_UNASSIGNED.toLowerCase()) return "";
  return trimmed.toLowerCase();
}

function campaignLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === ROI_UNASSIGNED.toLowerCase()) return ROI_UNASSIGNED;
  return trimmed;
}

export function roiFigures(input: {
  orders: readonly RoiOrder[];
  costs: readonly RoiCost[];
  campaigns?: readonly string[];
  range: RoiRange;
  now?: number;
}): RoiReport {
  const now = input.now ?? Date.now();
  const buckets = new Map<string, { campaign: string; orders: number; costCents: number; revenueCents: number }>();

  function bucket(key: string, label: string) {
    const existing = buckets.get(key);
    if (existing) return existing;
    const created = { campaign: label, orders: 0, costCents: 0, revenueCents: 0 };
    buckets.set(key, created);
    return created;
  }

  for (const name of input.campaigns ?? []) {
    const key = campaignKey(name);
    if (!key) continue;
    bucket(key, campaignLabel(name));
  }

  for (const order of input.orders) {
    if (order.dryRun || !roiInRange(order.createdAt, input.range, now)) continue;
    const row = bucket(campaignKey(order.promoCode), campaignLabel(order.promoCode));
    row.orders += 1;
    row.revenueCents += remainingSalesCents(order.amountCents, order.refundedAmountCents);
  }

  for (const cost of input.costs) {
    const spentOn = roiSpentOn(cost.spentOn ?? "");
    if (!spentOn || !roiInRange(spentOn, input.range, now)) continue;
    const cents = Math.max(0, Math.round(cost.costCents));
    if (!Number.isFinite(cents) || cents <= 0) continue;
    const row = bucket(campaignKey(cost.campaign), campaignLabel(cost.campaign));
    row.costCents += cents;
  }

  const rows = [...buckets.entries()]
    .map(([key, row]) => ({
      key,
      campaign: row.campaign,
      orders: row.orders,
      costCents: row.costCents,
      revenueCents: row.revenueCents,
      profitCents: row.revenueCents - row.costCents,
    }))
    .sort((left, right) => {
      if (left.key === "") return 1;
      if (right.key === "") return -1;
      return left.campaign.localeCompare(right.campaign);
    })
    .map((row) => ({
      campaign: row.campaign,
      orders: row.orders,
      costCents: row.costCents,
      revenueCents: row.revenueCents,
      profitCents: row.profitCents,
    }));

  return {
    rows,
    orders: rows.reduce((sum, row) => sum + row.orders, 0),
    costCents: rows.reduce((sum, row) => sum + row.costCents, 0),
    revenueCents: rows.reduce((sum, row) => sum + row.revenueCents, 0),
    profitCents: rows.reduce((sum, row) => sum + row.profitCents, 0),
  };
}

export type CampaignRankPost = {
  code: string;
  campaign: string | null;
  postedOn: string | null;
  views: number;
  engagements: number;
};

export type CampaignRankOrder = {
  code: string;
  promoCode: string;
  amountCents: number | null;
  refundedAmountCents: number;
  dryRun: boolean;
  createdAt: string | null;
};

export type AffiliateCampaignRank = {
  rank: number;
  code: string;
  name: string;
  posts: number;
  views: number;
  engagements: number;
  orders: number;
  revenueCents: number;
};

export type CampaignAffiliateBoard = {
  campaign: string;
  affiliates: AffiliateCampaignRank[];
};

export function campaignAffiliateRanks(input: {
  posts: readonly CampaignRankPost[];
  orders: readonly CampaignRankOrder[];
  names?: ReadonlyMap<string, string>;
  windows?: readonly CampaignWindow[];
  range: RoiRange;
  now?: number;
}): CampaignAffiliateBoard[] {
  const now = input.now ?? Date.now();
  const names = input.names ?? new Map<string, string>();
  const windows = new Map((input.windows ?? []).map((window) => [window.name.trim().toLowerCase(), window]));
  const buckets = new Map<string, Omit<AffiliateCampaignRank, "rank" | "name"> & { campaign: string }>();

  function take(source: string, code: string) {
    const id = code.trim();
    if (!id) return null;
    const campaign = campaignLabel(source);
    const key = `${campaign.toLowerCase()}\n${id.toLowerCase()}`;
    const existing = buckets.get(key);
    if (existing) return existing;
    const created = { campaign, code: id, posts: 0, views: 0, engagements: 0, orders: 0, revenueCents: 0 };
    buckets.set(key, created);
    return created;
  }

  for (const post of input.posts) {
    const name = post.campaign?.trim() ?? "";
    if (!name || name.toLowerCase() === ROI_UNASSIGNED.toLowerCase()) continue;
    if (!roiInRange(post.postedOn, input.range, now)) continue;
    const row = take(name, post.code);
    if (!row) continue;
    row.posts += 1;
    row.views += Math.max(0, Math.round(post.views));
    row.engagements += Math.max(0, Math.round(post.engagements));
  }

  for (const order of input.orders) {
    if (order.dryRun || !roiInRange(order.createdAt, input.range, now)) continue;
    const label = campaignLabel(order.promoCode);
    const window = label === ROI_UNASSIGNED ? undefined : windows.get(label.toLowerCase());
    if (!insideCampaignPeriod(orderDay(order.createdAt), window)) continue;
    const row = take(order.promoCode, order.code);
    if (!row) continue;
    row.orders += 1;
    row.revenueCents += remainingSalesCents(order.amountCents, order.refundedAmountCents);
  }

  const boards = new Map<string, CampaignAffiliateBoard>();
  for (const row of buckets.values()) {
    if (row.posts === 0 && row.orders === 0) continue;
    const board = boards.get(row.campaign.toLowerCase()) ?? { campaign: row.campaign, affiliates: [] };
    board.affiliates.push({
      rank: 0,
      code: row.code,
      name: names.get(row.code) || names.get(row.code.toLowerCase()) || row.code,
      posts: row.posts,
      views: row.views,
      engagements: row.engagements,
      orders: row.orders,
      revenueCents: row.revenueCents,
    });
    boards.set(row.campaign.toLowerCase(), board);
  }

  return [...boards.values()]
    .map((board) => ({
      campaign: board.campaign,
      affiliates: board.affiliates
        .sort(
          (left, right) =>
            right.views - left.views ||
            right.engagements - left.engagements ||
            right.orders - left.orders ||
            right.revenueCents - left.revenueCents ||
            left.name.localeCompare(right.name),
        )
        .map((affiliate, index) => ({ ...affiliate, rank: index + 1 })),
    }))
    .sort((left, right) => {
      if (left.campaign === ROI_UNASSIGNED) return 1;
      if (right.campaign === ROI_UNASSIGNED) return -1;
      return left.campaign.localeCompare(right.campaign);
    });
}
