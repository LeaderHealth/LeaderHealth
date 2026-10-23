import { adjustedCommissionCents } from "./refunds";

export type StatClick = {
  path: string;
  referrer: string | null;
  createdAt: string | null;
};

export type StatOrder = {
  createdAt: string | null;
  commissionCents: number;
  commissionRefundedCents?: number;
  dryRun: boolean;
};

export type DailyAffiliateStat = {
  date: string;
  visits: number;
  referringPages: string[];
  landingPages: string[];
  orders: number;
  commissionCents: number;
};

function dayKey(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function remember(pages: string[], page: string) {
  if (page && !pages.includes(page)) pages.push(page);
}

export function dailyAffiliateStats(clicks: readonly StatClick[], orders: readonly StatOrder[]) {
  const days = new Map<string, DailyAffiliateStat>();
  const rowFor = (date: string) => {
    const current = days.get(date);
    if (current) return current;
    const created: DailyAffiliateStat = {
      date,
      visits: 0,
      referringPages: [],
      landingPages: [],
      orders: 0,
      commissionCents: 0,
    };
    days.set(date, created);
    return created;
  };

  for (const click of clicks) {
    const date = dayKey(click.createdAt);
    if (!date) continue;
    const row = rowFor(date);
    row.visits += 1;
    remember(row.landingPages, click.path.trim());
    if (click.referrer === null) continue;
    remember(row.referringPages, click.referrer.trim() || "Direct");
  }

  for (const order of orders) {
    if (order.dryRun) continue;
    const date = dayKey(order.createdAt);
    if (!date) continue;
    const row = rowFor(date);
    row.orders += 1;
    row.commissionCents += adjustedCommissionCents(order.commissionCents, order.commissionRefundedCents ?? 0);
  }

  return [...days.values()].sort((left, right) => right.date.localeCompare(left.date));
}

export function conversionLabel(orders: number, visits: number) {
  if (visits <= 0) return "—";
  const percent = Math.round((orders / visits) * 1000) / 10;
  return `${percent}%`;
}

export function earningsPerClickCents(commissionCents: number, visits: number) {
  if (visits <= 0) return null;
  return Math.round(commissionCents / visits);
}
