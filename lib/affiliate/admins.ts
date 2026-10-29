import { createHash, randomBytes } from "node:crypto";
import { type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { AFFILIATE_INVITE_DAYS } from "@/lib/affiliate/email";
import { absoluteUrl } from "@/lib/seo/schema";
import { normalizeAffiliateEmail, normalizeAffiliateName, normalizeAffiliatePassword } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { reportHandledAffiliateError } from "./report";
import { hashPassword, passwordMatches } from "./store";

const INVITE_MS = AFFILIATE_INVITE_DAYS * 24 * 60 * 60 * 1000;
const LINK_MS = 15 * 60 * 1000;
const LINK_COOLDOWN_MS = 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,200}$/;
const ADMIN_ID = /^[A-Za-z0-9_-]{20,80}$/;

export type SubAdminRecord = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  invitePending: boolean;
  createdAt: string | null;
};

export type SubAdminInvitationState = "valid" | "expired" | "reused" | "missing" | "inactive" | "unavailable";

function admins() {
  return affiliateFirestore().collection("admins");
}

function mainAdminEmail() {
  return normalizeAffiliateEmail(process.env.AFFILIATE_ADMIN_EMAIL);
}

function emailKey(email: string) {
  return createHash("sha256").update(`admin:${email}`).digest("base64url");
}

function newAdminId() {
  return randomBytes(32).toString("base64url");
}

function adminEmails() {
  return affiliateFirestore().collection("adminEmails");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function tokenShape(token: string | null | undefined): token is string {
  return Boolean(token && TOKEN_PATTERN.test(token));
}

function adminIdShape(id: string) {
  return ADMIN_ID.test(id);
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function alreadyExists(error: unknown) {
  const codeNumber = (error as { code?: unknown }).code;
  return codeNumber === 6 || codeNumber === "already-exists" || codeNumber === "ALREADY_EXISTS";
}

function recordFrom(id: string, data: DocumentData): SubAdminRecord {
  const created = asDate(data.createdAt);
  const loginEmail = typeof data.email === "string" ? data.email : "";
  const sentTo = typeof data.inviteEmail === "string" ? data.inviteEmail : "";
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    email: loginEmail || sentTo,
    active: data.active === true,
    invitePending: data.invitePending === true,
    createdAt: created ? created.toISOString() : null,
  };
}

function invitationState(data: DocumentData | undefined, hash: string): Exclude<SubAdminInvitationState, "unavailable"> {
  if (!data || data.inviteTokenHash !== hash) return "missing";
  if (data.active !== true) return "inactive";
  if (asDate(data.inviteUsedAt)) return "reused";
  const expires = asDate(data.inviteExpiresAt);
  if (!expires || expires.getTime() <= Date.now()) return "expired";
  if (data.invitePending !== true) return "reused";
  return "valid";
}

function inviteUrl(token: string) {
  return absoluteUrl(`/admin/affiliates/activate?token=${encodeURIComponent(token)}`);
}

async function invitationMatch(token: string) {
  const hash = tokenHash(token);
  const matches = await admins().where("inviteTokenHash", "==", hash).limit(2).get();
  if (matches.size !== 1) return null;
  return { hash, snap: matches.docs[0] };
}

export async function subAdminSessionActive(id: string) {
  if (!affiliateFirebaseConfigured() || !adminIdShape(id)) return false;
  try {
    const snap = await admins().doc(id).get();
    const data = snap.data();
    return snap.exists && data?.active === true && data.invitePending !== true;
  } catch (error) {
    reportHandledAffiliateError("[affiliate] sub-admin session check failed", error);
    return false;
  }
}

export async function subAdminIdForPassword(email: string, password: string) {
  if (!affiliateFirebaseConfigured()) return null;
  const normalized = normalizeAffiliateEmail(email);
  const passwordOk = normalizeAffiliatePassword(password);
  if (!normalized || !passwordOk) {
    await passwordMatches(password, null);
    return null;
  }
  const matches = await admins().where("email", "==", normalized).limit(2).get();
  const snap = matches.size === 1 ? matches.docs[0] : null;
  const data = snap?.data();
  const stored = typeof data?.passwordHash === "string" ? data.passwordHash : null;
  const passwordOkMatch = await passwordMatches(passwordOk, stored);
  if (!snap || !data || data.active !== true || data.invitePending === true || !passwordOkMatch) return null;
  return snap.id;
}

export async function readSubAdmin(id: string) {
  if (!affiliateFirebaseConfigured() || !adminIdShape(id)) return null;
  const snap = await admins().doc(id).get();
  const data = snap.data();
  if (!snap.exists || !data) return null;
  return recordFrom(snap.id, data);
}

export async function listSubAdmins() {
  if (!affiliateFirebaseConfigured()) return [] as SubAdminRecord[];
  const snap = await admins().get();
  return snap.docs
    .map((doc) => recordFrom(doc.id, doc.data()))
    .filter((admin) => admin.email)
    .sort((left, right) => left.name.localeCompare(right.name) || left.email.localeCompare(right.email));
}

async function emailTaken(email: string) {
  const [logins, invites] = await Promise.all([
    admins().where("email", "==", email).limit(1).get(),
    admins().where("inviteEmail", "==", email).limit(1).get(),
  ]);
  return !logins.empty || !invites.empty;
}

export async function issueSubAdminInvitation(emailInput: unknown) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) return { status: "invalid" as const };
  if (email === mainAdminEmail()) return { status: "owner" as const };
  if (await emailTaken(email)) return { status: "exists" as const };
  const token = randomBytes(32).toString("base64url");
  const id = newAdminId();
  try {
    await admins().doc(id).create({
      name: "",
      email: "",
      inviteEmail: email,
      emailKey: null,
      passwordHash: null,
      active: true,
      invitePending: true,
      inviteTokenHash: tokenHash(token),
      inviteExpiresAt: new Date(Date.now() + INVITE_MS),
      inviteUsedAt: null,
      createdAt: new Date(),
    });
  } catch (error) {
    if (alreadyExists(error)) return { status: "exists" as const };
    throw error;
  }
  return { status: "sent" as const, id, email, url: inviteUrl(token) };
}

export async function resendSubAdminInvitation(id: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!adminIdShape(id)) return { status: "missing" as const };
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const ref = admins().doc(id);
  const result = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const delivery = typeof data?.inviteEmail === "string" && data.inviteEmail ? data.inviteEmail : data?.email;
    if (!snap.exists || !data || typeof delivery !== "string" || !delivery) return { status: "missing" as const };
    if (data.active !== true) return { status: "inactive" as const };
    if (data.invitePending !== true) return { status: "activated" as const };
    tx.update(ref, {
      inviteTokenHash: hash,
      inviteExpiresAt: new Date(Date.now() + INVITE_MS),
      inviteUsedAt: null,
    });
    return { status: "sent" as const, email: delivery };
  });
  if (result.status !== "sent") return result;
  return { status: "sent" as const, id, email: result.email, url: inviteUrl(token) };
}

export async function deletePendingSubAdmin(id: string) {
  if (!affiliateFirebaseConfigured() || !adminIdShape(id)) return;
  const ref = admins().doc(id);
  await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data()?.invitePending !== true) return;
    tx.delete(ref);
  });
}

export async function readSubAdminInvitation(token: string | null) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  if (!tokenShape(token)) return "missing" as const;
  const match = await invitationMatch(token);
  if (!match) return "missing" as const;
  return invitationState(match.snap.data(), match.hash);
}

export async function acceptSubAdminInvitation(token: string, nameInput: unknown, emailInput: unknown, passwordInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!tokenShape(token)) return { status: "missing" as const };
  const match = await invitationMatch(token);
  if (!match) return { status: "missing" as const };
  const preview = invitationState(match.snap.data(), match.hash);
  if (preview !== "valid") return { status: preview };
  const name = normalizeAffiliateName(nameInput);
  const email = normalizeAffiliateEmail(emailInput);
  if (!name || !email) return { status: "invalid" as const };
  if (email === mainAdminEmail()) return { status: "owner" as const };
  const password = normalizeAffiliatePassword(passwordInput);
  if (!password) return { status: "weak" as const };
  const passwordHash = await hashPassword(password);
  const key = emailKey(email);
  const lockRef = adminEmails().doc(key);
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(match.snap.ref);
    const state = invitationState(snap.data(), match.hash);
    if (state !== "valid") return { status: state };
    const lock = await tx.get(lockRef);
    const lockOwner = lock.data()?.adminId;
    if (lock.exists && lockOwner !== snap.id) return { status: "exists" as const };
    tx.set(lockRef, { adminId: snap.id });
    tx.update(match.snap.ref, {
      name,
      email,
      emailKey: key,
      passwordHash,
      invitePending: false,
      inviteUsedAt: new Date(),
    });
    return { status: "ok" as const, id: snap.id };
  });
}

export async function setSubAdminActive(id: string, active: boolean) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!adminIdShape(id)) return { status: "missing" as const };
  const ref = admins().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { status: "missing" as const };
  await ref.update({ active });
  return { status: "ok" as const };
}

async function activatedSubAdmin(email: string) {
  if (email === mainAdminEmail()) return { status: "owner" as const };
  const matches = await admins().where("email", "==", email).limit(2).get();
  const snap = matches.size === 1 ? matches.docs[0] : null;
  const data = snap?.data();
  if (!snap || !data || data.active !== true || data.invitePending === true || data.email !== email) {
    return { status: "denied" as const };
  }
  return { status: "ok" as const, id: snap.id, ref: snap.ref };
}

export async function issueSubAdminMagicLink(emailInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) return { status: "denied" as const };
  const found = await activatedSubAdmin(email);
  if (found.status !== "ok") return { status: found.status };

  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const expires = new Date(Date.now() + LINK_MS);
  const status = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(found.ref);
    const data = snap.data();
    if (!snap.exists || data?.active !== true || data.invitePending === true || data.email !== email) return "denied" as const;
    const last = asDate(data.lastMagicLinkAt);
    if (last && Date.now() - last.getTime() < LINK_COOLDOWN_MS) return "limited" as const;
    tx.update(found.ref, {
      magicLinkHash: hash,
      magicLinkExpiresAt: expires,
      lastMagicLinkAt: new Date(),
    });
    return "sent" as const;
  });
  if (status !== "sent") return { status };
  return {
    status: "sent" as const,
    id: found.id,
    email,
    url: absoluteUrl(`/admin/affiliates/link?token=${encodeURIComponent(token)}`),
  };
}

export async function clearSubAdminMagicLink(id: string) {
  if (!affiliateFirebaseConfigured() || !adminIdShape(id)) return;
  const ref = admins().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({ magicLinkHash: null, magicLinkExpiresAt: null, lastMagicLinkAt: null });
}

export async function redeemSubAdminMagicLink(token: string | null) {
  if (!affiliateFirebaseConfigured() || !tokenShape(token)) return null;
  const hash = tokenHash(token);
  const matches = await admins().where("magicLinkHash", "==", hash).limit(2).get();
  if (matches.size !== 1) return null;
  const ref = matches.docs[0].ref;
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const expires = asDate(data?.magicLinkExpiresAt);
    const current =
      data?.active === true &&
      data.invitePending !== true &&
      data.magicLinkHash === hash &&
      expires != null &&
      expires.getTime() > Date.now();
    if (snap.exists) tx.update(ref, { magicLinkHash: null, magicLinkExpiresAt: null });
    return current ? snap.id : null;
  });
}

export async function issueSubAdminPasswordReset(emailInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) return { status: "denied" as const };
  const found = await activatedSubAdmin(email);
  if (found.status !== "ok") return { status: found.status };

  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  const expires = new Date(Date.now() + LINK_MS);
  const status = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(found.ref);
    const data = snap.data();
    if (!snap.exists || data?.active !== true || data.invitePending === true || data.email !== email) return "denied" as const;
    const last = asDate(data.lastPasswordResetAt);
    if (last && Date.now() - last.getTime() < LINK_COOLDOWN_MS) return "limited" as const;
    tx.update(found.ref, {
      passwordResetHash: hash,
      passwordResetExpiresAt: expires,
      lastPasswordResetAt: new Date(),
    });
    return "sent" as const;
  });
  if (status !== "sent") return { status };
  return {
    status: "sent" as const,
    id: found.id,
    email,
    url: absoluteUrl(`/admin/affiliates/reset?token=${encodeURIComponent(token)}`),
  };
}

export async function clearSubAdminPasswordReset(id: string) {
  if (!affiliateFirebaseConfigured() || !adminIdShape(id)) return;
  const ref = admins().doc(id);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({ passwordResetHash: null, passwordResetExpiresAt: null, lastPasswordResetAt: null });
}

async function subAdminPasswordResetMatch(token: string) {
  const hash = tokenHash(token);
  const matches = await admins().where("passwordResetHash", "==", hash).limit(2).get();
  if (matches.size !== 1) return null;
  return { hash, snap: matches.docs[0] };
}

function subAdminPasswordResetState(data: DocumentData | undefined, hash: string) {
  if (!data || data.passwordResetHash !== hash) return "missing" as const;
  if (data.active !== true) return "inactive" as const;
  const expires = asDate(data.passwordResetExpiresAt);
  if (!expires || expires.getTime() <= Date.now()) return "expired" as const;
  if (data.invitePending === true) return "missing" as const;
  return "valid" as const;
}

export async function readSubAdminPasswordReset(token: string | null) {
  if (!affiliateFirebaseConfigured()) return "unavailable" as const;
  if (!tokenShape(token)) return "missing" as const;
  const match = await subAdminPasswordResetMatch(token);
  if (!match) return "missing" as const;
  return subAdminPasswordResetState(match.snap.data(), match.hash);
}

export async function acceptSubAdminPasswordReset(token: string, passwordInput: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!tokenShape(token)) return { status: "missing" as const };
  const match = await subAdminPasswordResetMatch(token);
  if (!match) return { status: "missing" as const };
  const preview = subAdminPasswordResetState(match.snap.data(), match.hash);
  if (preview !== "valid") return { status: preview };
  const password = normalizeAffiliatePassword(passwordInput);
  if (!password) return { status: "weak" as const };
  const passwordHash = await hashPassword(password);
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(match.snap.ref);
    const state = subAdminPasswordResetState(snap.data(), match.hash);
    if (state !== "valid") return { status: state };
    tx.update(match.snap.ref, {
      passwordHash,
      passwordResetHash: null,
      passwordResetExpiresAt: null,
    });
    return { status: "ok" as const, id: snap.id };
  });
}

export async function removeSubAdmin(id: string) {
  if (!affiliateFirebaseConfigured()) return { status: "unavailable" as const };
  if (!adminIdShape(id)) return { status: "missing" as const };
  const ref = admins().doc(id);
  const removed = await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const key = snap.data()?.emailKey;
    tx.delete(ref);
    if (typeof key === "string" && key) tx.delete(adminEmails().doc(key));
    return true;
  });
  return { status: removed ? ("ok" as const) : ("missing" as const) };
}
