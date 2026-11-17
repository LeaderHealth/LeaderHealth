import type { DocumentData } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { noteComplianceEvent } from "./compliance-log";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import {
  PAYMENT_CATEGORIES,
  categoryLabel,
  defaultPaymentRates,
  storedRateCents,
  type PaymentCategory,
  type PaymentRates,
} from "./payment-rates";

const SETTINGS_DOC = "paymentRates";

function categoryFrom(value: unknown, enabled: boolean) {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { enabled: data.enabled === true || (data.enabled == null && enabled), rateCents: storedRateCents(data.rateCents) };
}

function overridesFrom(value: unknown) {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const overrides: PaymentRates["overrides"] = {};
  for (const category of PAYMENT_CATEGORIES) {
    const rows = source[category];
    if (!rows || typeof rows !== "object") continue;
    const parsed: Record<string, number> = {};
    for (const [code, rate] of Object.entries(rows as Record<string, unknown>)) {
      const normalized = normalizeAffiliateCode(code);
      const cents = storedRateCents(rate);
      if (normalized && typeof rate === "number") parsed[normalized] = cents;
    }
    if (Object.keys(parsed).length) overrides[category] = parsed;
  }
  return overrides;
}

export function paymentRatesFrom(data: DocumentData | undefined): PaymentRates {
  if (!data) return defaultPaymentRates();
  const defaults = defaultPaymentRates();
  return {
    views: categoryFrom(data.views, defaults.views.enabled),
    engagements: categoryFrom(data.engagements, defaults.engagements.enabled),
    impressions: categoryFrom(data.impressions, defaults.impressions.enabled),
    clicks: categoryFrom(data.clicks, defaults.clicks.enabled),
    pageViews: categoryFrom(data.pageViews, defaults.pageViews.enabled),
    overrides: overridesFrom(data.overrides),
  };
}

export async function loadPaymentRates() {
  if (!affiliateFirebaseConfigured()) return defaultPaymentRates();
  const snap = await affiliateFirestore().collection("settings").doc(SETTINGS_DOC).get();
  return paymentRatesFrom(snap.data());
}

export async function loadPaymentRateHistory() {
  if (!affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("paymentRateHistory").orderBy("savedAt", "desc").limit(8).get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      actor: typeof data.actor === "string" ? data.actor : "",
      savedAt: data.savedAt?.toDate?.() instanceof Date ? data.savedAt.toDate().toISOString() : null,
      rates: paymentRatesFrom(data.rates),
    };
  });
}

export async function savePaymentRates(input: { rates: PaymentRates; actor: string }) {
  if (!affiliateFirebaseConfigured()) throw new Error("unavailable");
  const db = affiliateFirestore();
  const previous = await loadPaymentRates();
  const savedAt = new Date();
  await db.collection("settings").doc(SETTINGS_DOC).set({ ...input.rates, updatedAt: savedAt });
  await db.collection("paymentRateHistory").add({ actor: input.actor, savedAt, rates: input.rates });
  for (const category of PAYMENT_CATEGORIES) {
    if (previous[category].enabled || !input.rates[category].enabled) continue;
    await noteComplianceEvent({
      actor: input.actor,
      action: "payment-method-approved",
      detail: `${categoryLabel(category)} approved at ${input.rates[category].rateCents} cents.`,
    });
  }
}
