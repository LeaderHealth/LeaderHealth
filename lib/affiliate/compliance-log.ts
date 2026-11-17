import type { Timestamp } from "firebase-admin/firestore";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import {
  complianceEventFields,
  complianceEventMutation,
  type ComplianceAction,
} from "./compliance-rules";

export type ComplianceEvent = {
  id: string;
  actor: string;
  action: ComplianceAction;
  code: string | null;
  detail: string;
  createdAt: string | null;
};

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export async function recordComplianceEvent(input: {
  actor: unknown;
  action: unknown;
  code?: unknown;
  detail: unknown;
}) {
  const fields = complianceEventFields(input);
  if (!fields || !affiliateFirebaseConfigured()) return false;
  if (complianceEventMutation() !== "create") return false;
  await affiliateFirestore().collection("complianceEvents").add({
    ...fields,
    createdAt: new Date(),
  });
  return true;
}

export async function noteComplianceEvent(input: {
  actor: unknown;
  action: unknown;
  code?: unknown;
  detail: unknown;
}) {
  try {
    await recordComplianceEvent(input);
  } catch (error) {
    console.error("[affiliate] compliance event failed", error instanceof Error ? error.message : "unknown");
  }
}

export async function loadComplianceEvents(filter?: { code?: string | null; actor?: string | null; action?: ComplianceAction | null }) {
  if (!affiliateFirebaseConfigured()) return [];
  const db = affiliateFirestore();
  const code = filter?.code ?? null;
  const actor = filter?.actor?.trim() || null;
  const action = filter?.action ?? null;
  const query = code
    ? db.collection("complianceEvents").where("code", "==", code)
    : action
      ? db.collection("complianceEvents").where("action", "==", action)
      : db.collection("complianceEvents");
  const snap = await query.get();
  return snap.docs
    .flatMap((doc) => {
      const data = doc.data();
      const fields = complianceEventFields({
        actor: data.actor,
        action: data.action,
        code: data.code,
        detail: data.detail,
      });
      if (!fields) return [];
      if (action && fields.action !== action) return [];
      if (actor && fields.actor !== actor) return [];
      return [
        {
          id: doc.id,
          ...fields,
          createdAt: asDate(doc.data().createdAt)?.toISOString() ?? null,
        },
      ];
    })
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .slice(0, 200);
}
