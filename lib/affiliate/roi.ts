import { affiliateCampaign } from "./link";
import { remainingSalesCents } from "./refunds";

export const ROI_UNASSIGNED = "No promo code";

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

const DAY_MS = 24 * 60 * 60 * 1000;

export function roiRange(value: unknown): RoiRange {
  return value === "30" || value === "90" ? value : "all";
}

export function roiCampaignName(value: unknown) {
  return affiliateCampaign(value);
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
