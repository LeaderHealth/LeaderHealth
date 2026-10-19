import type { DocumentData, DocumentReference, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";

export type PayoutStatus = "pending" | "approved" | "paid";
export type PayoutRange = "30" | "90" | "all";

export type PayoutRecord = {
  id: string;
  code: string;
  period: string;
  status: "approved" | "paid";
  earnedCents: number;
  approvedAt: string | null;
  paidCents: number | null;
  paidAt: string | null;
  reference: string;
};

export type PayoutLine = {
  key: string;
  code: string;
  name: string;
  period: string;
  status: PayoutStatus;
  earnedCents: number;
  paidCents: number | null;
  paidAt: string | null;
  reference: string;
};

type EarnedOrder = {
  code: string;
  commissionCents: number;
  dryRun: boolean;
  createdAt: string | null;
};

export class PayoutError extends Error {
  code: "empty" | "status" | "amount" | "date" | "missing" | "unavailable";

  constructor(code: PayoutError["code"], message: string) {
    super(message);
    this.name = "PayoutError";
    this.code = code;
  }
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function asTimestamp(value: unknown) {
  const date = asDate(value);
  return date ? date.toISOString() : null;
}

export function payoutPeriod(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentPayoutPeriod(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizePayoutPeriod(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  return value;
}

export function formatPayoutMonth(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatPayoutDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function payoutAmountCents(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,]/g, "") : "";
  if (!raw) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars < 0 || dollars > 100000) return null;
  return Math.round(dollars * 100);
}

export function payoutPaidAt(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function payoutReference(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
}

function recordFrom(id: string, data: DocumentData | undefined): PayoutRecord | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const period = normalizePayoutPeriod(data.period);
  const status = data.status === "paid" ? "paid" : data.status === "approved" ? "approved" : null;
  if (!code || !period || !status) return null;
  return {
    id,
    code,
    period,
    status,
    earnedCents: Math.max(0, Math.round(asNumber(data.earnedCents))),
    approvedAt: asTimestamp(data.approvedAt),
    paidCents: status === "paid" ? Math.max(0, Math.round(asNumber(data.paidCents))) : null,
    paidAt: status === "paid" ? asTimestamp(data.paidAt) : null,
    reference: payoutReference(data.reference),
  };
}

function earnedFor(orders: EarnedOrder[], code: string, period: string) {
  return orders.reduce((sum, order) => {
    if (order.dryRun || order.code !== code || payoutPeriod(order.createdAt) !== period) return sum;
    return sum + Math.max(0, Math.round(order.commissionCents));
  }, 0);
}

export function payoutLines(input: {
  affiliates: { code: string; name: string }[];
  orders: EarnedOrder[];
  payouts: PayoutRecord[];
  period?: string;
}): PayoutLine[] {
  const names = new Map(input.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const periods = new Set<string>();
  for (const order of input.orders) {
    if (order.dryRun) continue;
    const period = payoutPeriod(order.createdAt);
    if (period && names.has(order.code)) periods.add(`${order.code}|${period}`);
  }
  for (const payout of input.payouts) {
    if (names.has(payout.code)) periods.add(`${payout.code}|${payout.period}`);
  }

  const lines: PayoutLine[] = [];
  for (const key of periods) {
    const [code, period] = key.split("|");
    if (input.period && period !== input.period) continue;
    const earned = earnedFor(input.orders, code, period);
    const records = input.payouts.filter((payout) => payout.code === code && payout.period === period);
    const paid = records.filter((payout) => payout.status === "paid");
    const approved = records.find((payout) => payout.status === "approved");
    const covered = paid.reduce((sum, payout) => sum + payout.earnedCents, 0) + (approved?.earnedCents ?? 0);
    const pending = Math.max(0, earned - covered);
    const name = names.get(code) || code;
    if (pending > 0) {
      lines.push({
        key: `${code}-${period}-pending`,
        code,
        name,
        period,
        status: "pending",
        earnedCents: pending,
        paidCents: null,
        paidAt: null,
        reference: "",
      });
    }
    if (approved) {
      lines.push({
        key: approved.id,
        code,
        name,
        period,
        status: "approved",
        earnedCents: approved.earnedCents,
        paidCents: null,
        paidAt: null,
        reference: "",
      });
    }
    for (const payout of paid) {
      lines.push({
        key: payout.id,
        code,
        name,
        period,
        status: "paid",
        earnedCents: payout.earnedCents,
        paidCents: payout.paidCents,
        paidAt: payout.paidAt,
        reference: payout.reference,
      });
    }
  }

  const statusOrder: Record<PayoutStatus, number> = { pending: 0, approved: 1, paid: 2 };
  return lines.sort(
    (left, right) =>
      right.period.localeCompare(left.period) ||
      left.name.localeCompare(right.name) ||
      statusOrder[left.status] - statusOrder[right.status],
  );
}

export function payoutMonths(orders: EarnedOrder[], payouts: PayoutRecord[], now = new Date()) {
  const months = new Set<string>([currentPayoutPeriod(now)]);
  for (const order of orders) {
    if (order.dryRun) continue;
    const period = payoutPeriod(order.createdAt);
    if (period) months.add(period);
  }
  for (const payout of payouts) months.add(payout.period);
  return [...months].sort((left, right) => right.localeCompare(left));
}

export function paidOutInRange(payouts: PayoutRecord[], range: PayoutRange, now = Date.now()) {
  const cutoff = range === "all" ? null : now - (range === "30" ? 30 : 90) * 24 * 60 * 60 * 1000;
  return payouts.reduce((sum, payout) => {
    if (payout.status !== "paid" || payout.paidCents == null || !payout.paidAt) return sum;
    if (cutoff != null && new Date(payout.paidAt).getTime() < cutoff) return sum;
    return sum + payout.paidCents;
  }, 0);
}

async function requireStore() {
  if (!affiliateFirebaseConfigured()) {
    throw new PayoutError("unavailable", "Payouts are unavailable right now.");
  }
  return affiliateFirestore();
}

export async function loadPayoutRecords(code?: string) {
  const db = await requireStore();
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const query = normalized
    ? db.collection("payouts").where("code", "==", normalized)
    : db.collection("payouts");
  const snapshot = await query.get();
  return snapshot.docs
    .map((doc) => recordFrom(doc.id, doc.data()))
    .filter((record): record is PayoutRecord => record != null);
}

export async function approvePayout(code: string, period: string) {
  const normalized = normalizeAffiliateCode(code);
  const month = normalizePayoutPeriod(period);
  if (!normalized || !month) throw new PayoutError("missing", "That affiliate was not found.");
  const db = await requireStore();
  const affiliateRef = db.collection("affiliates").doc(normalized);

  await db.runTransaction(async (tx) => {
    const affiliate = await tx.get(affiliateRef);
    if (!affiliate.exists) throw new PayoutError("missing", "That affiliate was not found.");
    const [orders, payouts] = await Promise.all([
      tx.get(db.collection("conversions").where("code", "==", normalized)),
      tx.get(db.collection("payouts").where("code", "==", normalized)),
    ]);
    const earned = orders.docs.reduce((sum, doc) => {
      const data = doc.data();
      if (data.dryRun === true || payoutPeriod(asTimestamp(data.createdAt)) !== month) return sum;
      return sum + Math.max(0, Math.round(asNumber(data.commissionCents)));
    }, 0);
    const records = payouts.docs
      .map((doc) => ({ ref: doc.ref, record: recordFrom(doc.id, doc.data()) }))
      .filter((item): item is { ref: DocumentReference; record: PayoutRecord } => item.record?.period === month);
    const covered = records.reduce((sum, item) => sum + item.record.earnedCents, 0);
    const pending = earned - covered;
    if (pending <= 0) throw new PayoutError("empty", "There is no new commission to approve for that month.");
    const approved = records.find((item) => item.record.status === "approved");
    if (approved) {
      tx.update(approved.ref, {
        earnedCents: approved.record.earnedCents + pending,
        approvedAt: new Date(),
      });
      return;
    }
    tx.set(db.collection("payouts").doc(), {
      code: normalized,
      period: month,
      status: "approved",
      earnedCents: pending,
      approvedAt: new Date(),
      paidCents: null,
      paidAt: null,
      reference: "",
    });
  });
}

export async function markPayoutPaid(input: { code: string; period: string; amount: unknown; paidOn: unknown; reference: unknown }) {
  const normalized = normalizeAffiliateCode(input.code);
  const month = normalizePayoutPeriod(input.period);
  if (!normalized || !month) throw new PayoutError("missing", "That affiliate was not found.");
  const paidCents = payoutAmountCents(input.amount);
  if (paidCents == null) throw new PayoutError("amount", "Enter a paid amount of zero or more.");
  const paidAt = payoutPaidAt(input.paidOn);
  if (!paidAt) throw new PayoutError("date", "Enter the payment date.");
  const reference = payoutReference(input.reference);
  const db = await requireStore();

  await db.runTransaction(async (tx) => {
    const payouts = await tx.get(db.collection("payouts").where("code", "==", normalized));
    const approved = payouts.docs.find((doc) => {
      const record = recordFrom(doc.id, doc.data());
      return record?.period === month && record.status === "approved";
    });
    if (!approved) throw new PayoutError("status", "Approve the payout before marking it paid.");
    tx.update(approved.ref, {
      status: "paid",
      paidCents,
      paidAt,
      reference,
    });
  });
}
