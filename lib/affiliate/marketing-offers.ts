import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { deliverableFeeCents } from "./deliverable-payments";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { formatCents, formatPublishDate, publishDateValue, viewPayTerms } from "./format";
import { DEFAULT_TRACKING_DAYS, trackingDaysOf } from "./manual-checkpoint";
import { payoutAmountCents } from "./payouts";
import { loadMarketingCampaigns } from "./roi-store";

const KINDS = ["instagram_post", "instagram_carousel", "instagram_reel", "instagram_story", "tiktok"] as const;
const STATUSES = ["sent", "countered", "accepted", "completed", "paid", "declined", "withdrawn"] as const;
const CAMPAIGN_NAME = /^[A-Za-z0-9][A-Za-z0-9 '&.,-]{0,59}$/;
const HOLD_MS = 7 * 24 * 60 * 60 * 1000;

export type OfferKind = (typeof KINDS)[number];
export type OfferStatus = (typeof STATUSES)[number];

export class MarketingOfferError extends Error {
  code: "invalid" | "missing" | "unavailable" | "status";

  constructor(code: MarketingOfferError["code"]) {
    super(code);
    this.name = "MarketingOfferError";
    this.code = code;
  }
}

export type OfferHistory = { text: string; at: string | null };

export type MarketingOffer = {
  id: string;
  code: string;
  kind: OfferKind;
  campaign: string;
  publishBy: string;
  amountCents: number;
  maxPayCents: number | null;
  trackingDays: number;
  brief: string;
  status: OfferStatus;
  counterAmountCents: number | null;
  counterPublishBy: string;
  counterNote: string;
  expiresAt: string | null;
  history: OfferHistory[];
  createdAt: string | null;
};

export const OFFER_KINDS: { id: OfferKind; label: string }[] = [
  { id: "instagram_post", label: "Instagram post" },
  { id: "instagram_carousel", label: "Instagram carousel" },
  { id: "instagram_reel", label: "Instagram reel" },
  { id: "instagram_story", label: "Instagram story" },
  { id: "tiktok", label: "TikTok video" },
];

export function offerKindLabel(kind: OfferKind) {
  return OFFER_KINDS.find((item) => item.id === kind)?.label ?? "Post";
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function cleanLine(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || text.length > max) return null;
  return text;
}

function offerKind(value: unknown): OfferKind | null {
  return KINDS.find((kind) => kind === value) ?? null;
}

function offerStatus(value: unknown): OfferStatus {
  return STATUSES.find((status) => status === value) ?? "sent";
}

function historyFrom(value: unknown): OfferHistory[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const text = cleanLine((item as { text?: unknown }).text, 240);
    if (!text) return [];
    return [{ text, at: asDate((item as { at?: unknown }).at) }];
  });
}

function offerFrom(id: string, data: DocumentData | undefined): MarketingOffer | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const amountCents = deliverableFeeCents(data.amountCents);
  if (!code || amountCents == null) return null;
  return {
    id,
    code,
    kind: offerKind(data.kind) ?? "instagram_post",
    campaign: typeof data.campaign === "string" && CAMPAIGN_NAME.test(data.campaign) ? data.campaign : "",
    publishBy: cleanLine(data.publishBy, 40) ?? "—",
    amountCents,
    maxPayCents: deliverableFeeCents(data.maxPayCents),
    trackingDays: trackingDaysOf(data.trackingDays) ?? DEFAULT_TRACKING_DAYS,
    brief: typeof data.brief === "string" ? data.brief.slice(0, 800) : typeof data.note === "string" ? data.note.slice(0, 800) : "",
    status: offerStatus(data.status),
    counterAmountCents: deliverableFeeCents(data.counterAmountCents),
    counterPublishBy: cleanLine(data.counterPublishBy, 40) ?? "",
    counterNote: cleanLine(data.counterNote, 400) ?? "",
    expiresAt: asDate(data.expiresAt),
    history: historyFrom(data.history),
    createdAt: asDate(data.createdAt),
  };
}

function requireDb() {
  if (!affiliateFirebaseConfigured()) throw new MarketingOfferError("unavailable");
  return affiliateFirestore();
}

export async function loadMarketingOffer(id: string) {
  const trimmed = id.trim();
  if (!trimmed || trimmed.includes("/") || !affiliateFirebaseConfigured()) return null;
  const snap = await affiliateFirestore().collection("marketingOffers").doc(trimmed).get();
  return offerFrom(snap.id, snap.data());
}

export async function loadMarketingOffers(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const db = affiliateFirestore();
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const query = normalized ? db.collection("marketingOffers").where("code", "==", normalized) : db.collection("marketingOffers");
  const snap = await query.get();
  return snap.docs
    .map((doc) => offerFrom(doc.id, doc.data()))
    .filter((offer): offer is MarketingOffer => offer != null)
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export function offerExpiresLabel(expiresAt: string | null, now = Date.now()) {
  if (!expiresAt) return "expires in 7 days";
  const days = Math.ceil((Date.parse(expiresAt) - now) / (24 * 60 * 60 * 1000));
  if (!Number.isFinite(days) || days <= 0) return "expired";
  return days === 1 ? "expires tomorrow" : `expires in ${days} days`;
}

function campaignName(value: unknown) {
  if (value == null || value === "") return "";
  const text = cleanLine(value, 60);
  if (!text || !CAMPAIGN_NAME.test(text)) return null;
  return text;
}

function briefText(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, " ").replace(/[ \t]+/g, " ").trim();
  if (text.length > 800) return null;
  return text;
}

function stamp(text: string) {
  return { text, at: new Date() };
}

function optionalMaxCents(value: unknown) {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  return payoutAmountCents(value) ?? undefined;
}

function trackingDaysInput(value: unknown) {
  if (value == null || (typeof value === "string" && value.trim() === "")) return DEFAULT_TRACKING_DAYS;
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(text)) return null;
  return trackingDaysOf(Number(text));
}

function offerTermsText(amountCents: number, maxPayCents: number | null, trackingDays: number, publishBy: string) {
  return `${viewPayTerms(amountCents, maxPayCents, trackingDays)}, ${formatPublishDate(publishBy)}`;
}

export async function saveMarketingOffer(input: {
  code: unknown;
  kind: unknown;
  amount: unknown;
  maxPay?: unknown;
  trackingDays?: unknown;
  publishBy: unknown;
  campaign: unknown;
  brief: unknown;
  offerId?: unknown;
}) {
  const db = requireDb();
  const code = normalizeAffiliateCode(input.code);
  const kind = offerKind(input.kind);
  const amountCents = payoutAmountCents(input.amount);
  const maxPayCents = optionalMaxCents(input.maxPay);
  const trackingDays = trackingDaysInput(input.trackingDays);
  const publishBy = publishDateValue(input.publishBy);
  const campaign = campaignName(input.campaign);
  const brief = briefText(input.brief);
  const offerId = typeof input.offerId === "string" ? input.offerId.trim() : "";
  if (!code || !kind || amountCents == null || maxPayCents === undefined || trackingDays == null || !publishBy || !campaign || brief == null) throw new MarketingOfferError("invalid");
  const knownCampaigns = campaign ? await loadMarketingCampaigns() : [];
  const savedCampaign = (current = "") => {
    if (!campaign) return "";
    const listed = knownCampaigns.find((item) => item.toLowerCase() === campaign.toLowerCase());
    if (listed) return listed;
    if (current && current.toLowerCase() === campaign.toLowerCase()) return current;
    throw new MarketingOfferError("invalid");
  };
  const affiliateRef = db.collection("affiliates").doc(code);
  const offerRef = offerId ? db.collection("marketingOffers").doc(offerId) : db.collection("marketingOffers").doc();
  const expiresAt = new Date(Date.now() + HOLD_MS);
  await db.runTransaction(async (tx) => {
    const affiliateSnap = await tx.get(affiliateRef);
    if (!affiliateSnap.exists) throw new MarketingOfferError("missing");
    if (!offerId) {
      tx.set(offerRef, {
        code,
        kind,
        campaign: savedCampaign(),
        publishBy,
        amountCents,
        maxPayCents,
        trackingDays,
        brief,
        status: "sent",
        counterAmountCents: null,
        counterPublishBy: "",
        counterNote: "",
        expiresAt,
        history: [stamp(`Offer sent: ${offerTermsText(amountCents, maxPayCents, trackingDays, publishBy)}`)],
        createdAt: new Date(),
      });
      return;
    }
    const offerSnap = await tx.get(offerRef);
    const offer = offerFrom(offerRef.id, offerSnap.data());
    if (!offer || offer.code !== code) throw new MarketingOfferError("missing");
    if (offer.status !== "sent" && offer.status !== "countered") throw new MarketingOfferError("status");
    tx.update(offerRef, {
      kind,
      campaign: savedCampaign(offer.campaign),
      publishBy,
      amountCents,
      maxPayCents,
      trackingDays,
      brief,
      status: "sent",
      counterAmountCents: null,
      counterPublishBy: "",
      counterNote: "",
      expiresAt,
      history: [stamp(`Revised offer sent: ${offerTermsText(amountCents, maxPayCents, trackingDays, publishBy)}`), ...offer.history.map((item) => ({ text: item.text, at: item.at ? new Date(item.at) : new Date() }))],
    });
  });
  return offerRef.id;
}

async function readOpen(id: string, allowed: OfferStatus[]) {
  const db = requireDb();
  const ref = db.collection("marketingOffers").doc(id);
  const snap = await ref.get();
  const offer = offerFrom(snap.id, snap.data());
  if (!offer) throw new MarketingOfferError("missing");
  if (!allowed.includes(offer.status)) throw new MarketingOfferError("status");
  return { db, ref, offer };
}

export async function acceptMarketingCounter(id: string) {
  const { ref, offer } = await readOpen(id, ["countered"]);
  if (offer.counterAmountCents == null) throw new MarketingOfferError("status");
  const publishBy = offer.counterPublishBy || offer.publishBy;
  await ref.update({
    status: "accepted",
    amountCents: offer.counterAmountCents,
    publishBy,
    history: [stamp("Counter accepted. Terms are locked."), ...offer.history.map((item) => ({ text: item.text, at: item.at ? new Date(item.at) : new Date() }))],
  });
}

export async function declineMarketingOffer(id: string) {
  const { ref, offer } = await readOpen(id, ["countered"]);
  await ref.update({
    status: "declined",
    history: [stamp("You declined the counter."), ...offer.history.map((item) => ({ text: item.text, at: item.at ? new Date(item.at) : new Date() }))],
  });
}

export async function withdrawMarketingOffer(id: string) {
  const { ref, offer } = await readOpen(id, ["sent"]);
  await ref.update({
    status: "withdrawn",
    history: [stamp("You withdrew the offer."), ...offer.history.map((item) => ({ text: item.text, at: item.at ? new Date(item.at) : new Date() }))],
  });
}

export async function respondToMarketingOffer(input: {
  id: unknown;
  code: unknown;
  decision: unknown;
  amount?: unknown;
  publishBy?: unknown;
  note?: unknown;
}) {
  const db = requireDb();
  const code = normalizeAffiliateCode(input.code);
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!code || !id) throw new MarketingOfferError("invalid");
  const ref = db.collection("marketingOffers").doc(id);
  const snap = await ref.get();
  const offer = offerFrom(snap.id, snap.data());
  if (!offer || offer.code !== code || offer.status !== "sent") throw new MarketingOfferError("status");
  const prior = offer.history.map((item) => ({ text: item.text, at: item.at ? new Date(item.at) : new Date() }));
  if (input.decision === "accept") {
    await ref.update({ status: "accepted", history: [stamp("Accepted."), ...prior] });
    return;
  }
  if (input.decision === "decline") {
    await ref.update({ status: "declined", history: [stamp("Declined."), ...prior] });
    return;
  }
  if (input.decision !== "counter") throw new MarketingOfferError("invalid");
  const amountCents = payoutAmountCents(input.amount);
  const publishBy = publishDateValue(input.publishBy);
  const note = cleanLine(input.note, 400);
  if (amountCents == null || !publishBy || !note) throw new MarketingOfferError("invalid");
  if (amountCents === offer.amountCents && publishBy === offer.publishBy) throw new MarketingOfferError("invalid");
  await ref.update({
    status: "countered",
    counterAmountCents: amountCents,
    counterPublishBy: publishBy,
    counterNote: note,
    history: [stamp(`Countered: ${formatCents(amountCents)} per 1,000 views, ${formatPublishDate(publishBy)}`), ...prior],
  });
}
