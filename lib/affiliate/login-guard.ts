import { type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateEmail } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { nextLoginAttempt, type LoginAttempt } from "./login-attempt";

export { LOGIN_FAIL_LIMIT, LOGIN_LOCK_MS, nextLoginAttempt, type LoginAttempt } from "./login-attempt";

export type LoginScope = "affiliate" | "admin";

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function attemptFrom(data: DocumentData | undefined): LoginAttempt | null {
  if (!data) return null;
  const failures = typeof data.failures === "number" && Number.isFinite(data.failures) ? Math.max(0, Math.floor(data.failures)) : 0;
  const locked = asDate(data.lockedUntil);
  return { failures, lockedUntil: locked ? locked.getTime() : null };
}

function attemptRef(scope: LoginScope, email: string) {
  const normalized = normalizeAffiliateEmail(email);
  if (!normalized || !affiliateFirebaseConfigured()) return null;
  return affiliateFirestore().collection("loginAttempts").doc(`${scope}_${normalized}`);
}

export async function loginBlocked(scope: LoginScope, email: string) {
  const ref = attemptRef(scope, email);
  if (!ref) {
    if (!normalizeAffiliateEmail(email)) return false;
    throw new Error("Firestore is not configured.");
  }
  const snap = await ref.get();
  const attempt = attemptFrom(snap.data());
  return attempt?.lockedUntil != null && attempt.lockedUntil > Date.now();
}

export async function recordLoginFailure(scope: LoginScope, email: string) {
  const ref = attemptRef(scope, email);
  if (!ref) {
    if (!normalizeAffiliateEmail(email)) return false;
    throw new Error("Firestore is not configured.");
  }
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const current = attemptFrom(snap.data());
    const wasLocked = current?.lockedUntil != null && current.lockedUntil > now;
    const next = nextLoginAttempt(current, now);
    tx.set(ref, {
      failures: next.failures,
      lockedUntil: next.lockedUntil == null ? null : new Date(next.lockedUntil),
    });
    return !wasLocked && next.lockedUntil != null;
  });
}

export async function clearLoginFailures(scope: LoginScope, email: string) {
  const ref = attemptRef(scope, email);
  if (!ref) {
    if (!normalizeAffiliateEmail(email)) return;
    throw new Error("Firestore is not configured.");
  }
  await ref.delete();
}
