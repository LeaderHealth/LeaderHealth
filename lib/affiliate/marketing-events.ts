import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { marketingEventId, marketingPayPath, marketingPlacementId, marketingVisitorAllowed, shouldRecordMarketingEvent } from "./marketing-path";
import { loadPaymentRates } from "./payment-store";
import { eventPeriod, websiteMonthAmount, type MarketingEventQuote, type WebsiteSnapshot } from "./payment-rates";

export type MarketingEventKind = "impression" | "click" | "page_view";

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function categoryFor(kind: MarketingEventKind) {
  if (kind === "impression") return "impressions" as const;
  if (kind === "click") return "clicks" as const;
  return "pageViews" as const;
}

function asIso(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : "";
  }
  return "";
}

function eventFrom(id: string, data: DocumentData | undefined): (MarketingEventQuote & { id: string }) | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const kind = data.kind === "impression" || data.kind === "click" || data.kind === "page_view" ? data.kind : null;
  const createdAt = asIso(data.createdAt);
  if (!code || !kind || !createdAt) return null;
  return { id, code, kind, payable: data.payable === true, excluded: data.excluded === true, createdAt };
}

export async function recordMarketingEvent(input: { code: unknown; visitorId: unknown; kind: MarketingEventKind; path: unknown; placement?: unknown; userAgent: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  const visitorId = typeof input.visitorId === "string" ? input.visitorId : "";
  const path = marketingPayPath(input.path);
  const placement = input.kind === "impression" ? marketingPlacementId(input.placement) : "";
  if (!code || !VISITOR_ID.test(visitorId) || !path || !marketingVisitorAllowed(input.userAgent)) return "skipped" as const;
  if (input.kind === "impression" && !placement) return "skipped" as const;
  if (!affiliateFirebaseConfigured()) return "skipped" as const;
  const db = affiliateFirestore();
  const day = dayKey();
  const id = marketingEventId({ code, visitorId, kind: input.kind, path, day, placement: placement || undefined });
  const clickId = marketingEventId({ code, visitorId, kind: "click", path, day });
  const rates = await loadPaymentRates();
  const ref = db.collection("marketingEvents").doc(id);
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    const click = input.kind === "page_view" ? await tx.get(db.collection("marketingEvents").doc(clickId)) : null;
    if (!shouldRecordMarketingEvent({ alreadyRecorded: existing.exists, kind: input.kind, clickRecorded: Boolean(click?.exists) })) return;
    tx.set(ref, {
      code,
      visitorId,
      kind: input.kind,
      path,
      ...(placement ? { placement } : {}),
      day,
      payable: rates[categoryFor(input.kind)].enabled,
      createdAt: new Date(),
    });
  });
  return "recorded" as const;
}

export async function loadMarketingEvents(input: { code?: string; period?: string; all?: boolean } = {}) {
  if (!affiliateFirebaseConfigured()) return [];
  const db = affiliateFirestore();
  const period = input.period && /^\d{4}-\d{2}$/.test(input.period) ? input.period : "";
  const code = input.code ? normalizeAffiliateCode(input.code) : "";
  if (input.code && !code) return [];
  const start = period ? new Date(`${period}-01T00:00:00.000Z`) : null;
  const end = start ? new Date(start) : null;
  if (end && start) end.setUTCMonth(start.getUTCMonth() + 1);
  const snap = code
    ? await db.collection("marketingEvents").where("code", "==", code).get()
    : start && end
      ? await db.collection("marketingEvents").where("createdAt", ">=", start).where("createdAt", "<", end).get()
      : input.all
      ? await db.collection("marketingEvents").get()
      : await db.collection("marketingEvents").orderBy("createdAt", "desc").limit(500).get();
  return snap.docs
    .map((doc) => eventFrom(doc.id, doc.data()))
    .filter((event): event is MarketingEventQuote & { id: string } => event != null)
    .filter((event) => !period || !input.code || eventPeriod(event.createdAt) === period);
}

function payoutStamp(data: DocumentData | undefined) {
  const reference = typeof data?.reference === "string" ? data.reference.trim().slice(0, 80) : "";
  return {
    paidAt: asIso(data?.paidAt) || null,
    approvedAt: asIso(data?.approvedAt) || null,
    reference,
  };
}

function snapshotFrom(data: DocumentData | undefined): WebsiteSnapshot | null {
  if (!data || (data.status !== "approved" && data.status !== "paid")) return null;
  const count = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0);
  return {
    impressions: count(data.impressions),
    clicks: count(data.clicks),
    pageViews: count(data.pageViews),
    impressionRateCents: count(data.impressionRateCents),
    clickRateCents: count(data.clickRateCents),
    pageViewRateCents: count(data.pageViewRateCents),
    amountCents: count(data.amountCents),
    status: data.status,
  };
}

export async function loadWebsitePayout(code: string, period: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !/^\d{4}-\d{2}$/.test(period) || !affiliateFirebaseConfigured()) return null;
  const snap = await affiliateFirestore().collection("websitePayouts").doc(`${normalized}_${period}`).get();
  const snapshot = snapshotFrom(snap.data());
  return snapshot ? { code: normalized, period, ...snapshot } : null;
}

export async function loadWebsitePayoutsForCode(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("websitePayouts").where("code", "==", normalized).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      const period = typeof data.period === "string" ? data.period : "";
      const snapshot = snapshotFrom(data);
      return /^\d{4}-\d{2}$/.test(period) && snapshot ? { code: normalized, period, ...snapshot, ...payoutStamp(data) } : null;
    })
    .filter((row): row is { code: string; period: string; paidAt: string | null; approvedAt: string | null; reference: string } & WebsiteSnapshot => row != null);
}

export async function loadAllWebsitePayouts() {
  if (!affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("websitePayouts").get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      const code = normalizeAffiliateCode(data.code);
      const period = typeof data.period === "string" ? data.period : "";
      const snapshot = snapshotFrom(data);
      return code && /^\d{4}-\d{2}$/.test(period) && snapshot ? { code, period, ...snapshot } : null;
    })
    .filter((row): row is { code: string; period: string } & WebsiteSnapshot => row != null);
}

export async function loadWebsitePayouts(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period) || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("websitePayouts").where("period", "==", period).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      const code = normalizeAffiliateCode(data.code);
      const snapshot = snapshotFrom(data);
      return code && snapshot ? { code, period, ...snapshot } : null;
    })
    .filter((row): row is { code: string; period: string } & WebsiteSnapshot => row != null);
}

export async function approveWebsitePayout(code: string, period: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !/^\d{4}-\d{2}$/.test(period)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const db = affiliateFirestore();
  const ref = db.collection("websitePayouts").doc(`${normalized}_${period}`);
  const existing = snapshotFrom((await ref.get()).data());
  if (existing) return null;
  if (await trafficMonthLocked(period)) throw new Error("locked");
  const [events, rates] = await Promise.all([loadMarketingEvents({ code: normalized, period }), loadPaymentRates()]);
  const quote = websiteMonthAmount({ events, code: normalized, period, rates, snapshot: null });
  const saved = {
    code: normalized,
    period,
    impressions: quote.impressions,
    clicks: quote.clicks,
    pageViews: quote.pageViews,
    impressionRateCents: quote.impressionRateCents,
    clickRateCents: quote.clickRateCents,
    pageViewRateCents: quote.pageViewRateCents,
    amountCents: quote.amountCents,
    status: "approved" as const,
    approvedAt: new Date(),
  };
  await ref.set(saved);
  return quote.amountCents;
}

export async function markWebsitePayoutPaid(input: { code: string; period: string; paidCents: number; paidAt: Date; reference: string }) {
  const normalized = normalizeAffiliateCode(input.code);
  if (!normalized || !/^\d{4}-\d{2}$/.test(input.period)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const ref = affiliateFirestore().collection("websitePayouts").doc(`${normalized}_${input.period}`);
  const current = snapshotFrom((await ref.get()).data());
  if (!current || current.status === "paid") throw new Error("status");
  await ref.set(
    {
      status: "paid",
      paidCents: input.paidCents,
      paidAt: input.paidAt,
      reference: input.reference,
    },
    { merge: true },
  );
}

export async function trafficMonthLocked(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period) || !affiliateFirebaseConfigured()) return false;
  const snap = await affiliateFirestore().collection("trafficMonthLocks").doc(period).get();
  return snap.exists;
}

export async function loadTrafficKeeps(period: string) {
  if (!/^\d{4}-\d{2}$/.test(period) || !affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("trafficReviews").where("period", "==", period).get();
  return snap.docs.flatMap((doc) => {
    const data = doc.data();
    const code = normalizeAffiliateCode(data.code);
    const hour = typeof data.hour === "string" ? data.hour : "";
    if (!code || data.decision !== "keep" || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) return [];
    return [{ code, hour }];
  });
}

export async function keepTrafficSpike(code: string, period: string, hour: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !/^\d{4}-\d{2}$/.test(period) || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  await affiliateFirestore().collection("trafficReviews").doc(`${normalized}_${period}`).set({
    code: normalized,
    period,
    hour,
    decision: "keep",
    updatedAt: new Date(),
  });
}

export async function excludeTrafficSpike(code: string, period: string, hour: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !/^\d{4}-\d{2}$/.test(period) || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) throw new Error("missing");
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const events = await loadMarketingEvents({ code: normalized, period });
  const ids = events
    .filter((event) => event.kind === "click" && event.payable && event.excluded !== true && event.createdAt.slice(0, 13) === hour && event.id)
    .map((event) => event.id as string);
  if (ids.length === 0) throw new Error("missing");
  const db = affiliateFirestore();
  for (let index = 0; index < ids.length; index += 400) {
    const batch = db.batch();
    for (const id of ids.slice(index, index + 400)) batch.set(db.collection("marketingEvents").doc(id), { excluded: true }, { merge: true });
    await batch.commit();
  }
  await db.collection("trafficReviews").doc(`${normalized}_${period}`).set({
    code: normalized,
    period,
    hour,
    decision: "exclude",
    count: ids.length,
    updatedAt: new Date(),
  });
  return ids.length;
}
