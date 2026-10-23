import { randomBytes } from "node:crypto";
import {
  type CommissionMode,
  DEFAULT_COMMISSION_PERCENT,
  normalizeAffiliateEmail,
  normalizeAffiliateName,
  normalizeCommissionMode,
  normalizeCommissionPercent,
  normalizeFixedCommissionCents,
} from "./code";
import { formatCommissionRate } from "./format";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";

const LINK_TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

export type ApplicationCommission = {
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
};

export function applicationCommission(input: {
  commissionMode: unknown;
  commissionPercent: unknown;
  commissionFixed: unknown;
}): ApplicationCommission | null {
  const commissionMode = normalizeCommissionMode(input.commissionMode);
  if (!commissionMode) return null;
  const commissionPercent =
    commissionMode === "default"
      ? DEFAULT_COMMISSION_PERCENT
      : commissionMode === "fixed"
        ? 0
        : normalizeCommissionPercent(input.commissionPercent, null);
  const commissionFixedCents = commissionMode === "fixed" ? normalizeFixedCommissionCents(input.commissionFixed) : 0;
  if (commissionPercent == null || commissionFixedCents == null) return null;
  return { commissionMode, commissionPercent, commissionFixedCents };
}

export class ApplicationError extends Error {
  code: "invalid" | "taken" | "unavailable" | "missing" | "decided" | "email";

  constructor(code: ApplicationError["code"]) {
    super(code);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export type AffiliateApplication = {
  email: string;
  name: string;
  createdAt: string | null;
  commissionLabel: string | null;
};

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function applicationRef(email: string) {
  return affiliateFirestore().collection("affiliateApplications").doc(email);
}

async function affiliateCodeForEmail(email: string) {
  const snap = await affiliateFirestore().collection("affiliates").where("email", "==", email).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

function storedCommission(value: unknown): ApplicationCommission | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return applicationCommission({
    commissionMode: data.commissionMode,
    commissionPercent: data.commissionPercent,
    commissionFixed: typeof data.commissionFixedCents === "number" ? data.commissionFixedCents / 100 : data.commissionFixedCents,
  });
}

export async function createApplicationLink(input: {
  commissionMode: unknown;
  commissionPercent: unknown;
  commissionFixed: unknown;
}) {
  const commission = applicationCommission(input);
  if (!commission) throw new ApplicationError("invalid");
  if (!affiliateFirebaseConfigured()) throw new ApplicationError("unavailable");
  const token = randomBytes(32).toString("base64url");
  await affiliateFirestore().collection("applicationLinks").doc(token).create({
    ...commission,
    createdAt: new Date(),
  });
  return token;
}

export async function readApplicationLink(token: unknown) {
  if (typeof token !== "string" || !LINK_TOKEN.test(token)) return null;
  if (!affiliateFirebaseConfigured()) return null;
  const snap = await affiliateFirestore().collection("applicationLinks").doc(token).get();
  if (!snap.exists) return null;
  return storedCommission(snap.data());
}

export async function saveAffiliateApplication(input: { name: unknown; email: unknown; link: unknown }) {
  const name = normalizeAffiliateName(input.name);
  const email = normalizeAffiliateEmail(input.email);
  const commission = await readApplicationLink(input.link);
  if (!name || !email || !commission) throw new ApplicationError("invalid");
  if (!affiliateFirebaseConfigured()) throw new ApplicationError("unavailable");
  if (await affiliateCodeForEmail(email)) throw new ApplicationError("taken");
  const ref = applicationRef(email);
  await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const status = snap.get("status");
    if (snap.exists && status !== "declined") throw new ApplicationError("taken");
    tx.set(ref, {
      name,
      email,
      ...commission,
      status: "pending",
      createdAt: new Date(),
      decidedAt: null,
      affiliateCode: null,
    });
  });
}

export async function listOpenApplications() {
  if (!affiliateFirebaseConfigured()) return [];
  const snap = await affiliateFirestore().collection("affiliateApplications").where("status", "in", ["pending", "approving"]).get();
  return snap.docs
    .map((doc) => {
      const data = doc.data();
      const name = typeof data.name === "string" ? data.name : "";
      const email = typeof data.email === "string" ? data.email : doc.id;
      const commission = storedCommission(data);
      return {
        name,
        email,
        createdAt: asDate(data.createdAt)?.toISOString() ?? null,
        commissionLabel: commission ? formatCommissionRate(commission) : null,
      };
    })
    .filter((application) => application.name && application.email)
    .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? ""));
}

export async function claimAffiliateApplication(emailInput: unknown) {
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) throw new ApplicationError("invalid");
  if (!affiliateFirebaseConfigured()) throw new ApplicationError("unavailable");
  if (await affiliateCodeForEmail(email)) throw new ApplicationError("email");
  const ref = applicationRef(email);
  return affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const status = data?.status;
    if (!snap.exists || !data || typeof data.name !== "string" || !data.name) throw new ApplicationError("missing");
    if (status !== "pending" && status !== "approving") throw new ApplicationError("decided");
    const commission = storedCommission(data);
    if (!commission) throw new ApplicationError("invalid");
    tx.update(ref, { status: "approving" });
    return { name: data.name, email, ...commission };
  });
}

export async function releaseAffiliateApplication(email: string) {
  if (!affiliateFirebaseConfigured()) return;
  const ref = applicationRef(email);
  await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.get("status") === "approving") tx.update(ref, { status: "pending" });
  });
}

export async function finishAffiliateApplication(email: string, code: string) {
  if (!affiliateFirebaseConfigured()) return;
  const ref = applicationRef(email);
  await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    tx.update(ref, { status: "approved", affiliateCode: code, decidedAt: new Date() });
  });
}

export async function declineAffiliateApplication(emailInput: unknown) {
  const email = normalizeAffiliateEmail(emailInput);
  if (!email) throw new ApplicationError("invalid");
  if (!affiliateFirebaseConfigured()) throw new ApplicationError("unavailable");
  const ref = applicationRef(email);
  await affiliateFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const status = snap.get("status");
    if (!snap.exists) throw new ApplicationError("missing");
    if (status !== "pending" && status !== "approving") throw new ApplicationError("decided");
    tx.update(ref, { status: "declined", decidedAt: new Date() });
  });
}

export async function existingAffiliateCode(email: string) {
  if (!affiliateFirebaseConfigured()) return null;
  return affiliateCodeForEmail(email);
}
