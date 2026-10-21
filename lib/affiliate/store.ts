import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { AFFILIATE_INVITE_DAYS } from "@/lib/affiliate/email";
import { affiliateCampaign, affiliateTrackingPath } from "@/lib/affiliate/link";
import { absoluteUrl } from "@/lib/seo/schema";
import {
  type CommissionMode,
  DEFAULT_COMMISSION_PERCENT,
  commissionForOrder,
  normalizeAffiliateCode,
  normalizeAffiliateEmail,
  normalizeAffiliateName,
  normalizeAffiliatePassword,
  normalizeCommissionMode,
  normalizeCommissionPercent,
  normalizeFixedCommissionCents,
} from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { savedPromosStillAssigned } from "./savedPromos";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEYLEN = 32;
const MAGIC_LINK_MS = 15 * 60 * 1000;
const MAGIC_LINK_COOLDOWN_MS = 60 * 1000;
const INVITE_MS = AFFILIATE_INVITE_DAYS * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;

export const AFFILIATE_COOKIE = "lh_aff";
export const AFFILIATE_CAMPAIGN_COOKIE = "lh_aff_campaign";
export const VISITOR_COOKIE = "lh_vid";
export const CLICK_LOG_COOKIE = "lh_aff_logged";

const AFFILIATE_MAX_AGE = 60 * 60 * 24 * 30;
const VISITOR_MAX_AGE = 60 * 60 * 24 * 400;
const CLICK_LOG_MAX_AGE = 60 * 60 * 24;

export function affiliateCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export { AFFILIATE_MAX_AGE, VISITOR_MAX_AGE, CLICK_LOG_MAX_AGE };

export class AffiliateStoreError extends Error {
  code: "exists" | "email" | "invalid" | "missing" | "unavailable" | "weak";

  constructor(code: AffiliateStoreError["code"], message: string) {
    super(message);
    this.name = "AffiliateStoreError";
    this.code = code;
  }
}

export type AffiliateSummary = {
  code: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
  active: boolean;
  pendingInvite: boolean;
  clickCount: number;
  paidConversionCount: number;
  commissionCents: number;
  createdAt: string | null;
};

export type ConversionSummary = {
  orderId: string;
  code: string;
  productName: string;
  amountCents: number | null;
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
  commissionCents: number;
  dryRun: boolean;
  createdAt: string | null;
};

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function commissionModeFrom(value: unknown): CommissionMode {
  return value === "default" || value === "fixed" ? value : "percent";
}

function asTimestamp(value: unknown) {
  const date = asDate(value);
  return date ? date.toISOString() : null;
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function passwordMatches(password: string, stored: string | null) {
  const parts = stored?.split("$") ?? [];
  const valid = parts.length === 3 && parts[0] === "scrypt";
  const salt = valid ? Buffer.from(parts[1], "base64url") : randomBytes(16);
  if (salt.length === 0) return false;
  try {
    const expected = valid ? Buffer.from(parts[2], "base64url") : Buffer.alloc(SCRYPT_KEYLEN);
    const actual = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
    if (!valid || expected.length !== actual.length) {
      timingSafeEqual(actual, Buffer.alloc(actual.length));
      return false;
    }
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function magicLinkHash(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function tokenShape(token: string | null | undefined): token is string {
  return Boolean(token && TOKEN_PATTERN.test(token));
}

function affiliateActivated(data: DocumentData | undefined) {
  if (!data) return false;
  return data.invitePending !== true;
}

const AFFILIATE_ID_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

function generateAffiliateCode() {
  const bytes = randomBytes(8);
  let code = "";
  for (let index = 0; index < bytes.length; index += 1) {
    code += AFFILIATE_ID_ALPHABET[bytes[index] % AFFILIATE_ID_ALPHABET.length];
  }
  return code;
}

function alreadyExists(error: unknown) {
  const codeNumber = (error as { code?: unknown }).code;
  return codeNumber === 6 || codeNumber === "already-exists" || codeNumber === "ALREADY_EXISTS";
}

function avatarUrlFrom(data: DocumentData) {
  const value = data.avatarUrl ?? data.photoURL ?? data.photoUrl;
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url.startsWith("https://") || url.length > 500) return null;
  return url;
}

function affiliateFrom(code: string, data: DocumentData | undefined): AffiliateSummary | null {
  if (!data) return null;
  return {
    code,
    name: typeof data.name === "string" ? data.name : code,
    email: typeof data.email === "string" ? data.email : "",
    avatarUrl: avatarUrlFrom(data),
    commissionMode: commissionModeFrom(data.commissionMode),
    commissionPercent: asNumber(data.commissionPercent),
    commissionFixedCents: asNumber(data.commissionFixedCents),
    active: data.active === true,
    pendingInvite: !affiliateActivated(data),
    clickCount: asNumber(data.clickCount),
    paidConversionCount: asNumber(data.paidConversionCount),
    commissionCents: asNumber(data.commissionCents),
    createdAt: asTimestamp(data.createdAt),
  };
}

function amountToCents(amount: number | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function productLabel(value: string) {
  const cleaned = value.replace(/[\u0000-\u001f]/g, "").trim();
  return (cleaned || "Order").slice(0, 160);
}

function orderDocId(orderId: string) {
  const id = orderId.trim();
  if (!id || id.length > 200 || id.includes("/")) return null;
  return id;
}

function conversionFrom(id: string, data: DocumentData): ConversionSummary {
  return {
    orderId: id,
    code: typeof data.code === "string" ? data.code : "",
    productName: typeof data.productName === "string" ? data.productName : "Order",
    amountCents: typeof data.amountCents === "number" ? data.amountCents : null,
    commissionMode: commissionModeFrom(data.commissionMode),
    commissionPercent: asNumber(data.commissionPercent),
    commissionFixedCents: asNumber(data.commissionFixedCents),
    commissionCents: asNumber(data.commissionCents),
    dryRun: data.dryRun === true,
    createdAt: asTimestamp(data.createdAt),
  };
}

async function singleAffiliateByEmail(email: string) {
  const snap = await affiliateFirestore().collection("affiliates").where("email", "==", email).limit(2).get();
  if (snap.size !== 1) return null;
  return snap.docs[0];
}

export async function getAffiliate(code: string) {
  if (!affiliateFirebaseConfigured()) return null;
  const snap = await affiliateFirestore().collection("affiliates").doc(code).get();
  return affiliateFrom(code, snap.data());
}

export async function logClick(input: { code: string; path: string; visitorId: string }) {
  if (!affiliateFirebaseConfigured()) return;
  const db = affiliateFirestore();
  const day = new Date().toISOString().slice(0, 10);
  const affiliateRef = db.collection("affiliates").doc(input.code);
  const clickRef = db.collection("clicks").doc(`${input.code}_${input.visitorId}_${day}`);
  await db.runTransaction(async (tx) => {
    const affiliate = await tx.get(affiliateRef);
    const existing = await tx.get(clickRef);
    if (!affiliate.exists || affiliate.data()?.active !== true) {
      throw new AffiliateStoreError("missing", "Affiliate is not active.");
    }
    if (existing.exists) return;
    const clickCount = asNumber(affiliate.data()?.clickCount);
    tx.set(clickRef, {
      code: input.code,
      path: input.path,
      visitorId: input.visitorId,
      createdAt: new Date(),
    });
    tx.update(affiliateRef, { clickCount: clickCount + 1 });
  });
}

export async function recordAffiliateConversion(input: {
  code: string;
  orderId: string;
  amount: number | null;
  productName: string;
  dryRun: boolean;
  createdAt?: Date;
}) {
  if (!affiliateFirebaseConfigured()) return false;
  const code = normalizeAffiliateCode(input.code);
  const orderId = orderDocId(input.orderId);
  if (!code || !orderId) return false;

  const db = affiliateFirestore();
  const affiliateRef = db.collection("affiliates").doc(code);
  const conversionRef = db.collection("conversions").doc(orderId);
  const amountCents = amountToCents(input.amount);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(conversionRef);
    if (existing.exists) return false;
    const affiliate = await tx.get(affiliateRef);
    if (!affiliate.exists || affiliate.data()?.active !== true) return false;
    const affiliateData = affiliate.data();
    const commissionMode = commissionModeFrom(affiliateData?.commissionMode);
    const commissionPercent = asNumber(affiliateData?.commissionPercent);
    const commissionFixedCents = asNumber(affiliateData?.commissionFixedCents);
    const commissionCents = commissionForOrder({
      mode: commissionMode,
      percent: commissionPercent,
      fixedCents: commissionFixedCents,
      amountCents,
    });
    tx.set(conversionRef, {
      code,
      orderId,
      amountCents,
      productName: productLabel(input.productName),
      commissionMode,
      commissionPercent,
      commissionFixedCents,
      commissionCents,
      dryRun: input.dryRun,
      createdAt:
        input.createdAt instanceof Date && !Number.isNaN(input.createdAt.getTime())
          ? input.createdAt
          : new Date(),
    });
    if (!input.dryRun) {
      tx.update(affiliateRef, {
        paidConversionCount: asNumber(affiliate.data()?.paidConversionCount) + 1,
        commissionCents: asNumber(affiliate.data()?.commissionCents) + commissionCents,
      });
    }
    return true;
  });
}

export async function savePendingAffiliateOrder(input: { code: string; orderId: string }) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  const code = normalizeAffiliateCode(input.code);
  const orderId = orderDocId(input.orderId);
  if (!code || !orderId) return "invalid" as const;

  const db = affiliateFirestore();
  const orderRef = db.collection("pendingOrders").doc(orderId);
  const affiliateRef = db.collection("affiliates").doc(code);
  return db.runTransaction(async (tx) => {
    const existing = await tx.get(orderRef);
    if (existing.exists) return "exists" as const;
    const affiliate = await tx.get(affiliateRef);
    if (!affiliate.exists || affiliate.data()?.active !== true) return "inactive" as const;
    tx.set(orderRef, { code, orderId, commissioned: false });
    return "saved" as const;
  });
}

export async function pendingAffiliateCode(orderId: string) {
  if (!affiliateFirebaseConfigured()) return null;
  const id = orderDocId(orderId);
  if (!id) return null;
  const snap = await affiliateFirestore().collection("pendingOrders").doc(id).get();
  if (!snap.exists) return null;
  return normalizeAffiliateCode(snap.data()?.code);
}

export async function loadUncommissionedPendingOrders() {
  const rows = new Map<string, string>();
  if (!affiliateFirebaseConfigured()) return rows;
  const snap = await affiliateFirestore().collection("pendingOrders").where("commissioned", "==", false).get();
  for (const doc of snap.docs) {
    const code = normalizeAffiliateCode(doc.data().code);
    const orderId = orderDocId(doc.id);
    if (code && orderId) rows.set(orderId, code);
  }
  return rows;
}

export async function markPendingOrderCommissioned(orderId: string) {
  if (!affiliateFirebaseConfigured()) return;
  const id = orderDocId(orderId);
  if (!id) return;
  const db = affiliateFirestore();
  const conversion = await db.collection("conversions").doc(id).get();
  if (!conversion.exists) return;
  await db.collection("pendingOrders").doc(id).set({ commissioned: true }, { merge: true });
}

export async function affiliateCodeFromCookies() {
  const jar = await cookies();
  return normalizeAffiliateCode(jar.get(AFFILIATE_COOKIE)?.value);
}

export async function affiliateCampaignFromCookies() {
  const jar = await cookies();
  return affiliateCampaign(jar.get(AFFILIATE_CAMPAIGN_COOKIE)?.value);
}

export async function createAffiliate(input: {
  name: string;
  email: string;
  commissionMode?: unknown;
  commissionPercent?: unknown;
  commissionFixed?: unknown;
  password?: string;
}) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const name = normalizeAffiliateName(input.name);
  const email = normalizeAffiliateEmail(input.email);
  const commissionMode = normalizeCommissionMode(input.commissionMode) ?? "percent";
  const commissionPercent =
    commissionMode === "default"
      ? DEFAULT_COMMISSION_PERCENT
      : commissionMode === "fixed"
        ? 0
        : normalizeCommissionPercent(input.commissionPercent, null);
  const commissionFixedCents = commissionMode === "fixed" ? normalizeFixedCommissionCents(input.commissionFixed) : 0;
  const passwordProvided = typeof input.password === "string" && input.password.length > 0;
  const password = passwordProvided ? normalizeAffiliatePassword(input.password) : null;
  if (!name || !email || commissionPercent == null || commissionFixedCents == null || (passwordProvided && !password)) {
    throw new AffiliateStoreError("invalid", "Check the name, email, commission, and password.");
  }
  const db = affiliateFirestore();
  const taken = await db.collection("affiliates").where("email", "==", email).limit(1).get();
  if (!taken.empty) throw new AffiliateStoreError("email", "That email is already in use.");
  const passwordHash = password ? await hashPassword(password) : null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateAffiliateCode();
    try {
      await db.collection("affiliates").doc(code).create({
        name,
        email,
        commissionMode,
        commissionPercent,
        commissionFixedCents,
        passwordHash,
        active: true,
        invitePending: true,
        activatedAt: null,
        inviteTokenHash: null,
        inviteExpiresAt: null,
        inviteUsedAt: null,
        clickCount: 0,
        paidConversionCount: 0,
        commissionCents: 0,
        trackingPath: affiliateTrackingPath(code),
        createdAt: new Date(),
      });
      return code;
    } catch (error) {
      if (alreadyExists(error)) continue;
      throw error;
    }
  }
  throw new AffiliateStoreError("exists", "Could not assign a unique affiliate ID.");
}

export async function setAffiliateActive(code: string, active: boolean) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AffiliateStoreError("invalid", "Unknown affiliate code.");
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) throw new AffiliateStoreError("missing", "Unknown affiliate code.");
  await ref.update({ active });
}

export async function loadSavedPromoCodes(code: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return [];
  const snap = await affiliateFirestore().collection("affiliates").doc(normalized).get();
  const saved = snap.data()?.savedLinks;
  if (!Array.isArray(saved)) return [];
  return saved.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function loadAssignedSavedPromos(code: string, assignedCodes: readonly string[]) {
  const saved = await loadSavedPromoCodes(code);
  const kept = savedPromosStillAssigned(saved, assignedCodes);
  const keptKeys = new Set(kept.map((item) => item.trim().toLowerCase()));
  const stale = saved.filter((item) => !keptKeys.has(item.trim().toLowerCase()));
  if (stale.length === 0 || !affiliateFirebaseConfigured()) return kept;
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return kept;
  try {
    await affiliateFirestore().collection("affiliates").doc(normalized).update({
      savedLinks: FieldValue.arrayRemove(...stale),
    });
  } catch (error) {
    console.error("[affiliate] saved promo sync failed", error instanceof Error ? error.message : "unknown");
  }
  return kept;
}

export async function saveAffiliatePromoCode(code: string, promoCode: string) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  const promo = promoCode.trim();
  if (!normalized) throw new AffiliateStoreError("invalid", "Unknown affiliate code.");
  if (!promo || promo.length > 80 || /[\u0000-\u001f]/.test(promo)) {
    throw new AffiliateStoreError("invalid", "Unknown promo code.");
  }
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.active !== true) throw new AffiliateStoreError("missing", "Unknown affiliate code.");
  await ref.update({ savedLinks: FieldValue.arrayUnion(promo) });
}

export async function forgetAffiliateSavedPromo(code: string, promoCode: string) {
  if (!affiliateFirebaseConfigured()) return;
  const normalized = normalizeAffiliateCode(code);
  const promo = promoCode.trim().toLowerCase();
  if (!normalized || !promo) return;
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  const saved = snap.data()?.savedLinks;
  if (!snap.exists || !Array.isArray(saved)) return;
  const matches = saved.filter((item) => typeof item === "string" && item.trim().toLowerCase() === promo);
  if (matches.length === 0) return;
  await ref.update({ savedLinks: FieldValue.arrayRemove(...matches) });
}

export async function removeAffiliatePromoCode(code: string, promoCode: string) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  const promo = promoCode.trim();
  if (!normalized) throw new AffiliateStoreError("invalid", "Unknown affiliate code.");
  if (!promo || promo.length > 80 || /[\u0000-\u001f]/.test(promo)) {
    throw new AffiliateStoreError("invalid", "Unknown promo code.");
  }
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.active !== true) throw new AffiliateStoreError("missing", "Unknown affiliate code.");
  await ref.update({ savedLinks: FieldValue.arrayRemove(promo) });
}

export async function setAffiliatePassword(code: string, passwordInput: string) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  const password = normalizeAffiliatePassword(passwordInput);
  if (!normalized) throw new AffiliateStoreError("invalid", "Unknown affiliate code.");
  if (!password) throw new AffiliateStoreError("weak", "Use a password of 8–128 characters.");
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) throw new AffiliateStoreError("missing", "Unknown affiliate code.");
  await ref.update({
    passwordHash: await hashPassword(password),
    invitePending: false,
    activatedAt: new Date(),
    inviteTokenHash: null,
    inviteExpiresAt: null,
    inviteUsedAt: null,
  });
}

export async function affiliateCodeForPassword(emailInput: string, password: string) {
  if (!affiliateFirebaseConfigured() || !password) return null;
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) return null;
  const doc = await singleAffiliateByEmail(email);
  const data = doc?.data();
  const stored = typeof data?.passwordHash === "string" ? data.passwordHash : null;
  const matches = await passwordMatches(password, stored);
  if (!doc || !data || data.active !== true || !affiliateActivated(data) || !matches) return null;
  return doc.id;
}

export async function issueAffiliateMagicLink(emailInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) return { status: "denied" as const };
  const doc = await singleAffiliateByEmail(email);
  if (!doc || doc.data()?.active !== true || !affiliateActivated(doc.data())) return { status: "denied" as const };

  const token = randomBytes(32).toString("base64url");
  const hash = magicLinkHash(token);
  const expires = new Date(Date.now() + MAGIC_LINK_MS);
  const status = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(doc.ref);
    const data = snap.data();
    if (!snap.exists || data?.active !== true || !affiliateActivated(data) || data.email !== email) return "denied" as const;
    const last = asDate(data.lastMagicLinkAt);
    if (last && Date.now() - last.getTime() < MAGIC_LINK_COOLDOWN_MS) return "limited" as const;
    tx.update(doc.ref, {
      magicLinkHash: hash,
      magicLinkExpiresAt: expires,
      lastMagicLinkAt: new Date(),
    });
    return "sent" as const;
  });
  if (status !== "sent") return { status };
  return {
    status: "sent" as const,
    code: doc.id,
    email,
    url: absoluteUrl(`/affiliates/link?token=${encodeURIComponent(token)}`),
  };
}

export async function clearAffiliateMagicLink(code: string) {
  if (!affiliateFirebaseConfigured()) return;
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return;
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({ magicLinkHash: null, magicLinkExpiresAt: null, lastMagicLinkAt: null });
}

export type InvitationState = "valid" | "expired" | "reused" | "missing" | "inactive" | "unavailable";

function invitationState(data: DocumentData | undefined, hash: string): Exclude<InvitationState, "unavailable"> {
  if (!data || data.inviteTokenHash !== hash) return "missing";
  if (data.active !== true) return "inactive";
  if (asDate(data.inviteUsedAt)) return "reused";
  const expires = asDate(data.inviteExpiresAt);
  if (!expires || expires.getTime() <= Date.now()) return "expired";
  if (data.invitePending !== true) return "reused";
  return "valid";
}

async function invitationMatch(token: string) {
  const hash = magicLinkHash(token);
  const matches = await affiliateFirestore().collection("affiliates").where("inviteTokenHash", "==", hash).limit(2).get();
  if (matches.size !== 1) return null;
  return { hash, snap: matches.docs[0] };
}

export async function issueAffiliateInvitation(code: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return { status: "missing" as const };
  const token = randomBytes(32).toString("base64url");
  const hash = magicLinkHash(token);
  const expires = new Date(Date.now() + INVITE_MS);
  const ref = affiliateFirestore().collection("affiliates").doc(normalized);
  const result = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!snap.exists || !data || typeof data.email !== "string" || !data.email) return { status: "missing" as const };
    if (data.active !== true) return { status: "inactive" as const };
    if (affiliateActivated(data)) return { status: "activated" as const };
    tx.update(ref, {
      inviteTokenHash: hash,
      inviteExpiresAt: expires,
      inviteUsedAt: null,
    });
    return { status: "sent" as const, email: data.email };
  });
  if (result.status !== "sent") return result;
  return {
    status: "sent" as const,
    code: normalized,
    email: result.email,
    url: absoluteUrl(`/affiliates/activate?token=${encodeURIComponent(token)}`),
  };
}

export async function readAffiliateInvitation(token: string | null) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  if (!tokenShape(token)) return "missing" as const;
  const match = await invitationMatch(token);
  if (!match) return "missing" as const;
  return invitationState(match.snap.data(), match.hash);
}

export async function acceptAffiliateInvitation(token: string, passwordInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!tokenShape(token)) return { status: "missing" as const };
  const match = await invitationMatch(token);
  if (!match) return { status: "missing" as const };
  const preview = invitationState(match.snap.data(), match.hash);
  if (preview !== "valid") return { status: preview };
  const password = normalizeAffiliatePassword(passwordInput);
  if (!password) return { status: "weak" as const };
  const passwordHash = await hashPassword(password);
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(match.snap.ref);
    const state = invitationState(snap.data(), match.hash);
    if (state !== "valid") return { status: state };
    tx.update(match.snap.ref, {
      passwordHash,
      invitePending: false,
      activatedAt: new Date(),
      inviteUsedAt: new Date(),
    });
    return { status: "ok" as const, code: snap.id };
  });
}

export async function redeemAffiliateMagicLink(token: string | null) {
  if (!affiliateFirebaseConfigured() || !tokenShape(token)) return null;
  const hash = magicLinkHash(token);
  const matches = await affiliateFirestore().collection("affiliates").where("magicLinkHash", "==", hash).limit(2).get();
  if (matches.size !== 1) return null;
  const ref = matches.docs[0].ref;
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const expires = asDate(data?.magicLinkExpiresAt);
    const current =
      data?.active === true &&
      affiliateActivated(data) &&
      data.magicLinkHash === hash &&
      expires != null &&
      expires.getTime() > Date.now();
    if (snap.exists) tx.update(ref, { magicLinkHash: null, magicLinkExpiresAt: null });
    return current ? snap.id : null;
  });
}

export async function loadAffiliateActivity(code: string) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return { conversions: [] as ConversionSummary[], clickTimes: [] as string[] };
  const db = affiliateFirestore();
  const [conversionsSnap, clicksSnap] = await Promise.all([
    db.collection("conversions").where("code", "==", normalized).get(),
    db.collection("clicks").where("code", "==", normalized).get(),
  ]);
  const conversions = conversionsSnap.docs
    .map((doc) => conversionFrom(doc.id, doc.data()))
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
  const clickTimes = clicksSnap.docs
    .map((doc) => asTimestamp(doc.data().createdAt))
    .filter((value): value is string => Boolean(value));
  return { conversions, clickTimes };
}

export async function loadAffiliateConversions(code: string) {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return [];
  const snap = await affiliateFirestore().collection("conversions").where("code", "==", normalized).get();
  return snap.docs
    .map((doc) => conversionFrom(doc.id, doc.data()))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 20);
}

export async function loadAffiliateOverview() {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const db = affiliateFirestore();
  const [affiliatesSnap, conversionsSnap] = await Promise.all([
    db.collection("affiliates").get(),
    db.collection("conversions").get(),
  ]);
  const affiliates = affiliatesSnap.docs
    .map((doc) => affiliateFrom(doc.id, doc.data()))
    .filter((affiliate): affiliate is AffiliateSummary => affiliate != null);
  const conversions = conversionsSnap.docs.map((doc) => conversionFrom(doc.id, doc.data()));
  return { affiliates, conversions };
}

export async function loadAffiliateDashboard() {
  if (!affiliateFirebaseConfigured()) {
    throw new AffiliateStoreError("unavailable", "Firestore is not configured.");
  }
  const db = affiliateFirestore();
  const [affiliatesSnap, conversionsSnap] = await Promise.all([
    db.collection("affiliates").get(),
    db.collection("conversions").orderBy("createdAt", "desc").limit(20).get(),
  ]);

  const affiliates = affiliatesSnap.docs
    .map((doc) => affiliateFrom(doc.id, doc.data()))
    .filter((affiliate): affiliate is AffiliateSummary => affiliate != null)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const conversions: ConversionSummary[] = conversionsSnap.docs.map((doc) => conversionFrom(doc.id, doc.data()));

  return { affiliates, conversions };
}
