import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import {
  deliverableAdjustmentCents,
  deliverableDetail,
  deliverableNote,
  deliverablePhase,
  holdEndsAt,
  type DeliverableLineStatus,
  type DeliverableSnapshot,
} from "./deliverable-flow";
import { formatCents, formatWhen } from "./format";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { resolvedTrackingDays, socialPayCents, trackingDaysOf } from "./manual-checkpoint";
import { payoutAmountCents, payoutPaidAt, payoutReference } from "./payouts";
import { postCheckpointOpen } from "./report-gate";

export type DeliverablePaymentStatus = "approved" | "paid";

export type DeliverablePayment = {
  postId: string;
  code: string;
  amountCents: number;
  status: DeliverablePaymentStatus;
  approvedAt: string | null;
  paidCents: number | null;
  paidAt: string | null;
  reference: string;
  adjustmentCents: number | null;
  adjustmentReason: string;
};

export type DeliverablePost = {
  id: string;
  code: string;
  publicationStatus: string | null;
  agreedFeeCents: number | null;
  viewRateCents?: number | null;
  engagementRateCents?: number | null;
  maxPayCents?: number | null;
  trackingDays?: number | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  format: string | null;
  contentStatus?: string | null;
  publishedAt?: string | null;
  deliverableHoldStartedAt?: string | null;
  deliverableRecheckedAt?: string | null;
  deliverableForfeitedAt?: string | null;
};

export type DeliverableLine = {
  postId: string;
  code: string;
  name: string;
  label: string;
  status: DeliverableLineStatus;
  detail: string;
  amountCents: number;
  paidCents: number | null;
  paidAt: string | null;
  reference: string;
  adjustmentCents: number | null;
  adjustmentReason: string;
};

export class DeliverablePaymentError extends Error {
  code: "missing" | "status" | "amount" | "date" | "unavailable" | "unpublished" | "report" | "hold" | "recheck" | "forfeited" | "reason" | "adjustment" | "early" | "phase" | "duplicate" | "window";

  constructor(code: DeliverablePaymentError["code"], message: string) {
    super(message);
    this.name = "DeliverablePaymentError";
    this.code = code;
  }
}

const POST_ID = /^[A-Za-z0-9]{8,40}$/;

export function deliverableFeeCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10_000_000) return null;
  return value;
}

export function canReleaseDeliverablePayment(role: string) {
  return role === "owner" || role === "admin";
}

export function approvalDecision(
  post: {
    publicationStatus: string | null;
    agreedFeeCents: number | null;
    viewRateCents?: number | null;
    maxPayCents?: number | null;
    trackingDays?: number | null;
    views?: number | null;
    contentStatus?: string | null;
    publishedAt?: string | null;
    deliverableHoldStartedAt?: string | null;
    deliverableRecheckedAt?: string | null;
    deliverableForfeitedAt?: string | null;
  },
  payment: { postId: string } | null,
  now = Date.now(),
) {
  if (payment) return "exists" as const;
  const phase = deliverablePhase(snapshotFrom(post), now);
  if (phase === "pending") return "create" as const;
  if (post.viewRateCents != null) return phase === "measuring" ? "window" as const : "unpublished" as const;
  if (phase === "hold") return "hold" as const;
  if (phase === "recheck") return "recheck" as const;
  if (phase === "forfeited") return "forfeited" as const;
  return "unpublished" as const;
}

export function markPaidDecision(payment: { status: string } | null) {
  if (!payment || payment.status !== "approved") return "status" as const;
  return "pay" as const;
}

function postLabel(format: string | null) {
  if (format === "tiktok") return "TikTok";
  if (format === "instagram_reel") return "Instagram reel";
  if (format === "instagram_post") return "Instagram post";
  return "Post";
}

function snapshotFrom(post: {
  contentStatus?: string | null;
  publicationStatus: string | null;
  agreedFeeCents: number | null;
  viewRateCents?: number | null;
  maxPayCents?: number | null;
  trackingDays?: number | null;
  views?: number | null;
  publishedAt?: string | null;
  deliverableHoldStartedAt?: string | null;
  deliverableRecheckedAt?: string | null;
  deliverableForfeitedAt?: string | null;
}): DeliverableSnapshot {
  return {
    contentStatus: post.contentStatus ?? null,
    publicationStatus: post.publicationStatus,
    agreedFeeCents: post.agreedFeeCents,
    viewRateCents: post.viewRateCents ?? null,
    maxPayCents: post.maxPayCents ?? null,
    trackingDays: post.trackingDays ?? null,
    views: post.views ?? null,
    publishedAt: post.publishedAt ?? null,
    deliverableHoldStartedAt: post.deliverableHoldStartedAt ?? null,
    deliverableRecheckedAt: post.deliverableRecheckedAt ?? null,
    deliverableForfeitedAt: post.deliverableForfeitedAt ?? null,
  };
}

function lineAmount(post: DeliverablePost, status: DeliverableLineStatus) {
  if (post.viewRateCents != null) {
    if (status !== "pending") return 0;
    return (
      socialPayCents({
        views: post.views ?? 0,
        viewRateCents: post.viewRateCents,
        engagementRateCents: post.engagementRateCents ?? 0,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        saves: post.saves,
        maxPayCents: post.maxPayCents ?? null,
      }) ?? 0
    );
  }
  return post.agreedFeeCents ?? 0;
}

function lineDetail(status: DeliverableLineStatus, post: DeliverableSnapshot, engagementRateCents = 0) {
  if (post.viewRateCents != null && (status === "review" || status === "changes" || status === "waiting" || status === "measuring")) {
    const days = resolvedTrackingDays(post.trackingDays);
    const cap = post.maxPayCents == null ? "There is no maximum." : `The maximum is ${formatCents(post.maxPayCents)}.`;
    const basis = engagementRateCents > 0 ? "recorded views and engagements" : "recorded views";
    const engagement = engagementRateCents > 0 ? ` Engagements are ${formatCents(engagementRateCents)} each.` : "";
    return `The rate is locked. Pay is calculated from ${basis} after ${days} days live.${engagement} ${cap}`;
  }
  const ends = holdEndsAt(post);
  return deliverableDetail(status, ends ? formatWhen(ends) : null);
}

export function deliverableLines(
  input: {
    affiliates: { code: string; name: string }[];
    posts: DeliverablePost[];
    payments: DeliverablePayment[];
  },
  now = Date.now(),
): DeliverableLine[] {
  const names = new Map(input.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const paidIds = new Set(input.payments.map((payment) => payment.postId));
  const posts = new Map(input.posts.map((post) => [post.id, post]));
  const lines: DeliverableLine[] = [];

  for (const post of input.posts) {
    if (paidIds.has(post.id)) continue;
    const snapshot = snapshotFrom(post);
    const status = deliverablePhase(snapshot, now);
    if (!status || (post.viewRateCents == null && post.agreedFeeCents == null)) continue;
    lines.push({
      postId: post.id,
      code: post.code,
      name: names.get(post.code) ?? post.code,
      label: postLabel(post.format),
      status,
      detail: lineDetail(status, snapshot, post.engagementRateCents ?? 0),
      amountCents: lineAmount(post, status),
      paidCents: null,
      paidAt: null,
      reference: "",
      adjustmentCents: null,
      adjustmentReason: "",
    });
  }

  for (const payment of input.payments) {
    const post = posts.get(payment.postId);
    const snapshot = post ? snapshotFrom(post) : null;
    const status = payment.status;
    lines.push({
      postId: payment.postId,
      code: payment.code,
      name: names.get(payment.code) ?? payment.code,
      label: postLabel(post?.format ?? null),
      status,
      detail: snapshot ? lineDetail(status, snapshot, post?.engagementRateCents ?? 0) : deliverableDetail(status, null),
      amountCents: payment.amountCents,
      paidCents: payment.paidCents,
      paidAt: payment.paidAt,
      reference: payment.reference,
      adjustmentCents: payment.adjustmentCents,
      adjustmentReason: payment.adjustmentReason,
    });
  }

  const rank: Record<DeliverableLineStatus, number> = {
    recheck: 0,
    pending: 1,
    approved: 2,
    hold: 3,
    measuring: 4,
    review: 5,
    changes: 6,
    waiting: 7,
    forfeited: 8,
    paid: 9,
    closed: 10,
  };
  return lines.sort(
    (left, right) => rank[left.status] - rank[right.status] || left.name.localeCompare(right.name) || left.postId.localeCompare(right.postId),
  );
}

export function marketingTotals(lines: DeliverableLine[]) {
  return {
    pendingCents: lines.filter((line) => line.status === "pending").reduce((sum, line) => sum + line.amountCents, 0),
    heldCents: lines.filter((line) => line.status === "hold" || line.status === "recheck").reduce((sum, line) => sum + line.amountCents, 0),
    approvedCents: lines.filter((line) => line.status === "approved").reduce((sum, line) => sum + line.amountCents, 0),
    paidCents: lines.filter((line) => line.status === "paid").reduce((sum, line) => sum + (line.paidCents ?? 0) + (line.adjustmentCents ?? 0), 0),
  };
}

function viewCount(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 1_000_000_000) return null;
  return value;
}

function storedAdjustmentCents(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value === 0 || Math.abs(value) > 10_000_000) return null;
  return value;
}

function asTimestamp(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  }
  return null;
}

function paymentFrom(id: string, data: DocumentData | undefined): DeliverablePayment | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const postId = typeof data.postId === "string" && POST_ID.test(data.postId) ? data.postId : POST_ID.test(id) ? id : "";
  const amountCents = deliverableFeeCents(data.amountCents);
  const status = data.status === "paid" ? "paid" : data.status === "approved" ? "approved" : null;
  if (!code || !postId || amountCents == null || !status) return null;
  const paidCents = deliverableFeeCents(data.paidCents);
  const adjustmentCents = storedAdjustmentCents(data.adjustmentCents);
  return {
    postId,
    code,
    amountCents,
    status,
    approvedAt: asTimestamp(data.approvedAt),
    paidCents,
    paidAt: asTimestamp(data.paidAt),
    reference: typeof data.reference === "string" ? data.reference : "",
    adjustmentCents,
    adjustmentReason: typeof data.adjustmentReason === "string" ? data.adjustmentReason : "",
  };
}

function requireStore() {
  if (!affiliateFirebaseConfigured()) throw new DeliverablePaymentError("unavailable", "Payouts are unavailable right now.");
  return affiliateFirestore();
}

export async function loadDeliverablePayments(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const db = affiliateFirestore();
  const query = code
    ? db.collection("deliverablePayments").where("code", "==", normalizeAffiliateCode(code))
    : db.collection("deliverablePayments");
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => paymentFrom(doc.id, doc.data())).filter((payment): payment is DeliverablePayment => payment != null);
}

export async function approveDeliverablePayment(postId: string) {
  if (!POST_ID.test(postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  if (await postCheckpointOpen(postId)) throw new DeliverablePaymentError("report", "This post needs this week's numbers before it can be paid.");
  const db = requireStore();
  const postRef = db.collection("contentSubmissions").doc(postId);
  const payRef = db.collection("deliverablePayments").doc(postId);
  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef);
    const paySnap = await tx.get(payRef);
    if (!postSnap.exists) throw new DeliverablePaymentError("missing", "That post was not found.");
    const data = postSnap.data();
    const code = normalizeAffiliateCode(data?.code);
    const fee = deliverableFeeCents(data?.agreedFeeCents);
    const viewRateCents = deliverableFeeCents(data?.viewRateCents);
    const maxPayCents = deliverableFeeCents(data?.maxPayCents);
    const trackingDays = trackingDaysOf(data?.trackingDays);
    const views = viewCount(data?.views);
    const likes = viewCount(data?.likes);
    const comments = viewCount(data?.comments);
    const shares = viewCount(data?.shares);
    const saves = viewCount(data?.saves);
    const engagementRateCents = deliverableFeeCents(data?.engagementRateCents) ?? 0;
    const publicationStatus = typeof data?.publicationStatus === "string" ? data.publicationStatus : null;
    if (!code) throw new DeliverablePaymentError("missing", "That post was not found.");
    const offerId = typeof data?.offerId === "string" ? data.offerId : "";
    if (offerId) {
      const siblings = await tx.get(db.collection("contentSubmissions").where("offerId", "==", offerId));
      for (const sibling of siblings.docs) {
        if (sibling.id === postId) continue;
        const payment = await tx.get(db.collection("deliverablePayments").doc(sibling.id));
        if (payment.exists) throw new DeliverablePaymentError("duplicate", "This offer already has a marketing payment.");
      }
    }
    const decision = approvalDecision(
      {
        contentStatus: typeof data?.contentStatus === "string" ? data.contentStatus : null,
        publicationStatus,
        agreedFeeCents: viewRateCents == null ? fee : null,
        viewRateCents,
        maxPayCents,
        trackingDays,
        views,
        publishedAt: asTimestamp(data?.publishedAt),
        deliverableHoldStartedAt: asTimestamp(data?.deliverableHoldStartedAt),
        deliverableRecheckedAt: asTimestamp(data?.deliverableRecheckedAt),
        deliverableForfeitedAt: asTimestamp(data?.deliverableForfeitedAt),
      },
      paySnap.exists ? { postId } : null,
    );
    if (decision === "exists") return;
    if (decision === "window") throw new DeliverablePaymentError("window", `This rate can be paid after the post has been live for ${resolvedTrackingDays(trackingDays)} days and the views are on file.`);
    if (decision === "hold") throw new DeliverablePaymentError("hold", "This fee stays on hold until the post has been live for 14 days.");
    if (decision === "recheck") throw new DeliverablePaymentError("recheck", "Re-check that the post is still up before approving this fee.");
    if (decision === "forfeited") throw new DeliverablePaymentError("forfeited", "This fee was forfeited. Reinstate it before it can be paid.");
    const amountCents =
      viewRateCents == null
        ? fee
        : views == null
          ? null
          : socialPayCents({
              views,
              viewRateCents,
              engagementRateCents,
              likes,
              comments,
              shares,
              saves,
              maxPayCents,
            });
    if (decision !== "create" || amountCents == null) {
      throw new DeliverablePaymentError("unpublished", "Approve a post only after its link is live.");
    }
    tx.set(payRef, {
      code,
      postId,
      amountCents,
      status: "approved",
      approvedAt: new Date(),
      paidCents: null,
      paidAt: null,
      reference: "",
    });
  });
}

export async function markDeliverablePaid(input: { postId: string; amount: unknown; paidOn: unknown; reference: unknown }) {
  if (!POST_ID.test(input.postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  if (await postCheckpointOpen(input.postId)) throw new DeliverablePaymentError("report", "This post needs this week's numbers before it can be paid.");
  const paidCents = payoutAmountCents(input.amount);
  if (paidCents == null) throw new DeliverablePaymentError("amount", "Enter a paid amount of zero or more.");
  const paidAt = payoutPaidAt(input.paidOn);
  if (!paidAt) throw new DeliverablePaymentError("date", "Enter the payment date.");
  const reference = payoutReference(input.reference);
  const db = requireStore();
  const payRef = db.collection("deliverablePayments").doc(input.postId);
  await db.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    const payment = paymentFrom(input.postId, paySnap.data());
    if (markPaidDecision(payment) !== "pay") {
      throw new DeliverablePaymentError("status", "Approve the marketing payment before marking it paid.");
    }
    tx.update(payRef, {
      status: "paid",
      paidCents,
      paidAt,
      reference,
    });
  });
}

export async function recheckDeliverable(postId: string) {
  if (!POST_ID.test(postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  const db = requireStore();
  const ref = db.collection("contentSubmissions").doc(postId);
  const payRef = db.collection("deliverablePayments").doc(postId);
  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(ref);
    const paySnap = await tx.get(payRef);
    if (!postSnap.exists) throw new DeliverablePaymentError("missing", "That post was not found.");
    const data = postSnap.data();
    const fee = deliverableFeeCents(data?.agreedFeeCents);
    const decision = approvalDecision(decisionPost(data, fee), paySnap.exists ? { postId } : null);
    if (decision !== "recheck") throw new DeliverablePaymentError("early", "Re-check a post after its 14-day hold has ended.");
    tx.update(ref, { deliverableRecheckedAt: new Date() });
  });
}

export async function forfeitDeliverable(postId: string, note: unknown) {
  if (!POST_ID.test(postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  const reason = deliverableNote(note);
  if (!reason) throw new DeliverablePaymentError("reason", "Enter what changed on the post.");
  const db = requireStore();
  const ref = db.collection("contentSubmissions").doc(postId);
  const payRef = db.collection("deliverablePayments").doc(postId);
  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(ref);
    const paySnap = await tx.get(payRef);
    if (!postSnap.exists) throw new DeliverablePaymentError("missing", "That post was not found.");
    if (paySnap.exists) throw new DeliverablePaymentError("phase", "This fee is already in a payout. Use a clawback instead.");
    const data = postSnap.data();
    const fee = deliverableFeeCents(data?.agreedFeeCents);
    const phase = deliverablePhase(snapshotFrom(decisionPost(data, fee)), Date.now());
    if (phase !== "hold" && phase !== "recheck") throw new DeliverablePaymentError("phase", "Forfeit a fee while it is on hold.");
    tx.update(ref, {
      deliverableForfeitedAt: new Date(),
      deliverableForfeitNote: reason,
      deliverableRecheckedAt: FieldValue.delete(),
    });
  });
}

export async function reinstateDeliverable(postId: string) {
  if (!POST_ID.test(postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  const db = requireStore();
  const ref = db.collection("contentSubmissions").doc(postId);
  const payRef = db.collection("deliverablePayments").doc(postId);
  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(ref);
    const paySnap = await tx.get(payRef);
    if (!postSnap.exists) throw new DeliverablePaymentError("missing", "That post was not found.");
    if (paySnap.exists) throw new DeliverablePaymentError("phase", "This fee is already in a payout.");
    const data = postSnap.data();
    if (!asTimestamp(data?.deliverableForfeitedAt)) throw new DeliverablePaymentError("phase", "This fee is not forfeited.");
    tx.update(ref, {
      deliverableForfeitedAt: FieldValue.delete(),
      deliverableForfeitNote: FieldValue.delete(),
      deliverableRecheckedAt: FieldValue.delete(),
    });
  });
}

export async function adjustDeliverablePayment(input: { postId: string; amount: unknown; reason: unknown }) {
  if (!POST_ID.test(input.postId)) throw new DeliverablePaymentError("missing", "That post was not found.");
  const adjustmentCents = deliverableAdjustmentCents(input.amount);
  if (adjustmentCents == null) throw new DeliverablePaymentError("adjustment", "Enter a bonus or clawback other than zero.");
  const reason = deliverableNote(input.reason);
  if (!reason) throw new DeliverablePaymentError("reason", "Enter a reason for the adjustment.");
  const db = requireStore();
  const payRef = db.collection("deliverablePayments").doc(input.postId);
  await db.runTransaction(async (tx) => {
    const paySnap = await tx.get(payRef);
    const payment = paymentFrom(input.postId, paySnap.data());
    if (!payment || payment.status !== "paid" || payment.paidCents == null) {
      throw new DeliverablePaymentError("phase", "Record the payment before adding a bonus or clawback.");
    }
    if (adjustmentCents < 0 && Math.abs(adjustmentCents) > payment.paidCents) {
      throw new DeliverablePaymentError("adjustment", "A clawback cannot be more than the amount paid.");
    }
    tx.update(payRef, {
      adjustmentCents,
      adjustmentReason: reason,
      adjustedAt: new Date(),
    });
  });
}

function decisionPost(data: DocumentData | undefined, fee: number | null) {
  return {
    contentStatus: typeof data?.contentStatus === "string" ? data.contentStatus : null,
    publicationStatus: typeof data?.publicationStatus === "string" ? data.publicationStatus : null,
    agreedFeeCents: fee,
    publishedAt: asTimestamp(data?.publishedAt),
    deliverableHoldStartedAt: asTimestamp(data?.deliverableHoldStartedAt),
    deliverableRecheckedAt: asTimestamp(data?.deliverableRecheckedAt),
    deliverableForfeitedAt: asTimestamp(data?.deliverableForfeitedAt),
  };
}
