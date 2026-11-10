import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import {
  complianceNote,
  flagAfter,
  flagReason,
  type FlagReason,
  type FlagStatus,
} from "./compliance-rules";

export class ComplianceFlagError extends Error {
  code: "invalid" | "missing" | "status" | "unavailable";

  constructor(code: ComplianceFlagError["code"]) {
    super(code);
    this.name = "ComplianceFlagError";
    this.code = code;
  }
}

export type ComplianceFlag = {
  id: string;
  code: string;
  reason: FlagReason;
  status: FlagStatus;
  note: string;
  reply: string;
  createdAt: string | null;
  repliedAt: string | null;
};

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function asStatus(value: unknown): FlagStatus | null {
  if (value === "open" || value === "correction_requested" || value === "resolved") return value;
  return null;
}

function flagFrom(id: string, data: DocumentData | undefined): ComplianceFlag | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const reason = flagReason(data.reason);
  const status = asStatus(data.status);
  const note = typeof data.note === "string" ? data.note : "";
  if (!code || !reason || !status || !note) return null;
  return {
    id,
    code,
    reason,
    status,
    note,
    reply: typeof data.reply === "string" ? data.reply : "",
    createdAt: asDate(data.createdAt)?.toISOString() ?? null,
    repliedAt: asDate(data.repliedAt)?.toISOString() ?? null,
  };
}

function requireDb() {
  if (!affiliateFirebaseConfigured()) throw new ComplianceFlagError("unavailable");
  return affiliateFirestore();
}

export async function openComplianceFlag(input: {
  code: unknown;
  reason: unknown;
  note: unknown;
  status?: FlagStatus;
}) {
  const code = normalizeAffiliateCode(input.code);
  const reason = flagReason(input.reason);
  const note = complianceNote(input.note);
  const status = input.status ?? "open";
  if (!code || !reason || !note || (status !== "open" && status !== "correction_requested")) {
    throw new ComplianceFlagError("invalid");
  }
  const db = requireDb();
  const affiliate = await db.collection("affiliates").doc(code).get();
  if (!affiliate.exists) throw new ComplianceFlagError("missing");
  const ref = db.collection("complianceFlags").doc();
  await ref.set({
    code,
    reason,
    status,
    note,
    reply: "",
    createdAt: new Date(),
    repliedAt: null,
  });
  return ref.id;
}

export async function loadComplianceFlags(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const db = affiliateFirestore();
  const query = normalized
    ? db.collection("complianceFlags").where("code", "==", normalized)
    : db.collection("complianceFlags");
  const snap = await query.get();
  return snap.docs
    .map((doc) => flagFrom(doc.id, doc.data()))
    .filter((flag): flag is ComplianceFlag => flag != null)
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

async function updateFlag(id: string, step: "request" | "reply" | "resolve", extra?: { reply?: string; code?: string }) {
  const db = requireDb();
  const ref = db.collection("complianceFlags").doc(id);
  const snap = await ref.get();
  const flag = flagFrom(snap.id, snap.data());
  if (!flag) throw new ComplianceFlagError("missing");
  if (extra?.code && extra.code !== flag.code) throw new ComplianceFlagError("missing");
  const status = flagAfter(flag.status, step);
  if (!status) throw new ComplianceFlagError("status");
  if (step === "reply") {
    const reply = complianceNote(extra?.reply);
    if (!reply) throw new ComplianceFlagError("invalid");
    await ref.update({ status, reply, repliedAt: new Date() });
    return flag;
  }
  await ref.update({ status });
  return flag;
}

export async function requestFlagCorrection(id: string) {
  return updateFlag(id, "request");
}

export async function replyToComplianceFlag(input: { id: string; code: string; reply: unknown }) {
  return updateFlag(input.id, "reply", { reply: typeof input.reply === "string" ? input.reply : "", code: input.code });
}

export async function resolveComplianceFlag(id: string) {
  return updateFlag(id, "resolve");
}
