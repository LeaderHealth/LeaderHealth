import { type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { getAffiliate } from "./store";

export type DashboardRole = "owner" | "sub" | "affiliate";

export type DashboardSessionRecord = {
  id: string;
  role: DashboardRole;
  subject: string;
  userAgent: string;
  createdAt: string | null;
  expiresAt: number;
};

const SESSION_ID = /^[A-Za-z0-9_-]{20,80}$/;

function sessions() {
  return affiliateFirestore().collection("dashboardSessions");
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function roleOf(value: unknown): DashboardRole | null {
  if (value === "owner" || value === "sub" || value === "affiliate") return value;
  return null;
}

function recordFrom(id: string, data: DocumentData | undefined): DashboardSessionRecord | null {
  if (!data || data.revoked === true) return null;
  const role = roleOf(data.role);
  const expires = asDate(data.expiresAt);
  if (!role || !expires || expires.getTime() <= Date.now()) return null;
  const subject = typeof data.subject === "string" ? data.subject.trim() : "";
  if (role === "sub" && !SESSION_ID.test(subject)) return null;
  if (role === "affiliate" && !normalizeAffiliateCode(subject)) return null;
  if (role === "owner" && !subject) return null;
  const created = asDate(data.createdAt);
  const userAgent = typeof data.userAgent === "string" ? data.userAgent : "";
  return {
    id,
    role,
    subject: role === "affiliate" ? normalizeAffiliateCode(subject) ?? subject : subject,
    userAgent,
    createdAt: created ? created.toISOString() : null,
    expiresAt: expires.getTime(),
  };
}

async function accountStillActive(session: DashboardSessionRecord) {
  if (session.role === "owner") return true;
  if (session.role === "sub") {
    const { subAdminSessionActive } = await import("./admins");
    return subAdminSessionActive(session.subject);
  }
  const affiliate = await getAffiliate(session.subject);
  return affiliate?.active === true;
}

export async function createDashboardSession(input: {
  id: string;
  role: DashboardRole;
  subject: string;
  userAgent: string;
  expiresAt: number;
}) {
  if (!affiliateFirebaseConfigured() || !SESSION_ID.test(input.id)) return false;
  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return false;
  await sessions().doc(input.id).create({
    role: input.role,
    subject: input.subject,
    userAgent: input.userAgent,
    createdAt: new Date(),
    expiresAt,
    revoked: false,
  });
  return true;
}

export async function activeDashboardSession(id: string) {
  if (!affiliateFirebaseConfigured() || !SESSION_ID.test(id)) return null;
  const snap = await sessions().doc(id).get();
  const session = recordFrom(snap.id, snap.data());
  if (!session) return null;
  return (await accountStillActive(session)) ? session : null;
}

export async function listOpenDashboardSessions() {
  if (!affiliateFirebaseConfigured()) return [] as DashboardSessionRecord[];
  const snap = await sessions().get();
  const open: DashboardSessionRecord[] = [];
  for (const doc of snap.docs) {
    const session = recordFrom(doc.id, doc.data());
    if (!session || !(await accountStillActive(session))) continue;
    open.push(session);
  }
  return open.sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export async function revokeDashboardSession(id: string) {
  if (!affiliateFirebaseConfigured() || !SESSION_ID.test(id)) return "unavailable" as const;
  const ref = sessions().doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.revoked === true) return "missing" as const;
  await ref.set({ revoked: true }, { merge: true });
  return "ok" as const;
}
