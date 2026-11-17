import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { currentReportMonth, reportMonth } from "./marketing";

export type WebsiteVisit = {
  code: string;
  createdAt: string | null;
  promoCode: string | null;
};

export type WebsiteOrder = {
  code: string;
  createdAt: string | null;
  promoCode: string | null;
  dryRun: boolean;
};

export type WebsitePromoUse = {
  code: string;
  visits: number;
  orders: number;
};

export type WebsiteMonthReport = {
  month: string;
  trackingVisits: number;
  trackingOrders: number;
  promoVisits: number;
  promoOrders: number;
  promos: WebsitePromoUse[];
};

export function websiteReportMonths(input: {
  code: string;
  visits: readonly WebsiteVisit[];
  orders: readonly WebsiteOrder[];
  now?: Date;
}) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) return [];
  const months = new Map<string, WebsiteMonthReport>();
  const monthFor = (createdAt: string | null) => {
    const month = reportMonth(createdAt);
    if (!month) return null;
    const current = months.get(month);
    if (current) return current;
    const created: WebsiteMonthReport = {
      month,
      trackingVisits: 0,
      trackingOrders: 0,
      promoVisits: 0,
      promoOrders: 0,
      promos: [],
    };
    months.set(month, created);
    return created;
  };
  for (const visit of input.visits) {
    if (normalizeAffiliateCode(visit.code) !== code) continue;
    const month = monthFor(visit.createdAt);
    if (!month) continue;
    const promo = promoLabel(visit.promoCode);
    if (!promo) {
      month.trackingVisits += 1;
      continue;
    }
    month.promoVisits += 1;
    promoRow(month, promo).visits += 1;
  }
  for (const order of input.orders) {
    if (order.dryRun || normalizeAffiliateCode(order.code) !== code) continue;
    const month = monthFor(order.createdAt);
    if (!month) continue;
    const promo = promoLabel(order.promoCode);
    if (!promo) {
      month.trackingOrders += 1;
      continue;
    }
    month.promoOrders += 1;
    promoRow(month, promo).orders += 1;
  }
  if (months.size === 0) {
    months.set(currentReportMonth(input.now), {
      month: currentReportMonth(input.now),
      trackingVisits: 0,
      trackingOrders: 0,
      promoVisits: 0,
      promoOrders: 0,
      promos: [],
    });
  }
  return [...months.values()]
    .map((month) => ({ ...month, promos: month.promos.sort((left, right) => left.code.localeCompare(right.code)) }))
    .sort((left, right) => right.month.localeCompare(left.month));
}

export async function loadWebsiteEvents(code?: string) {
  const empty = { visits: [] as WebsiteVisit[], orders: [] as WebsiteOrder[] };
  if (!affiliateFirebaseConfigured()) return empty;
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return empty;
  const db = affiliateFirestore();
  const clicks = normalized
    ? db.collection("clicks").where("code", "==", normalized)
    : db.collection("clicks");
  const conversions = normalized
    ? db.collection("conversions").where("code", "==", normalized)
    : db.collection("conversions");
  const [clickSnap, orderSnap] = await Promise.all([clicks.get(), conversions.get()]);
  return {
    visits: clickSnap.docs.flatMap((doc) => {
      const data = doc.data();
      const visitCode = normalizeAffiliateCode(data.code);
      if (!visitCode) return [];
      return [{ code: visitCode, createdAt: dateText(data.createdAt), promoCode: textOrNull(data.campaign) }];
    }),
    orders: orderSnap.docs.flatMap((doc) => {
      const data = doc.data();
      const orderCode = normalizeAffiliateCode(data.code);
      if (!orderCode) return [];
      return [
        {
          code: orderCode,
          createdAt: dateText(data.createdAt),
          promoCode: textOrNull(data.promoCode),
          dryRun: data.dryRun === true,
        },
      ];
    }),
  };
}

function promoRow(month: WebsiteMonthReport, code: string) {
  const current = month.promos.find((promo) => promo.code.toLowerCase() === code.toLowerCase());
  if (current) return current;
  const created = { code, visits: 0, orders: 0 };
  month.promos.push(created);
  return created;
}

function promoLabel(value: string | null) {
  const text = value?.trim() ?? "";
  return text ? text.slice(0, 80) : null;
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 80) : null;
}

function dateText(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  return null;
}
