import { viewWindowEnded } from "./manual-checkpoint";

export const DELIVERABLE_HOLD_MS = 14 * 24 * 60 * 60 * 1000;

export type DeliverableLineStatus =
  | "review"
  | "changes"
  | "closed"
  | "waiting"
  | "measuring"
  | "hold"
  | "recheck"
  | "forfeited"
  | "pending"
  | "approved"
  | "paid";

export type DeliverableSnapshot = {
  contentStatus: string | null;
  publicationStatus: string | null;
  agreedFeeCents: number | null;
  viewRateCents: number | null;
  maxPayCents: number | null;
  trackingDays: number | null;
  views: number | null;
  publishedAt: string | null;
  deliverableHoldStartedAt: string | null;
  deliverableRecheckedAt: string | null;
  deliverableForfeitedAt: string | null;
};

export function holdStartedAt(post: DeliverableSnapshot) {
  if (post.deliverableHoldStartedAt) return post.deliverableHoldStartedAt;
  if (post.publicationStatus === "tracking_active" && post.publishedAt) return post.publishedAt;
  return null;
}

export function holdEndsAt(post: DeliverableSnapshot) {
  const start = holdStartedAt(post);
  if (!start) return null;
  const time = Date.parse(start);
  if (Number.isNaN(time)) return null;
  return new Date(time + DELIVERABLE_HOLD_MS).toISOString();
}

function livePhase(post: DeliverableSnapshot, now: number): DeliverableLineStatus {
  if (post.deliverableForfeitedAt) return "forfeited";
  const end = holdEndsAt(post);
  const endTime = end ? Date.parse(end) : Number.NaN;
  if (!end || Number.isNaN(endTime) || now < endTime) return "hold";
  if (!post.deliverableRecheckedAt) return "recheck";
  return "pending";
}

function contentPhase(post: DeliverableSnapshot): DeliverableLineStatus | null | "live" {
  const content = post.contentStatus;
  if (content === "rejected" || content === "withdrawn") return "closed";
  if (content === "submitted") return "review";
  if (content === "revision_requested") return "changes";
  if (content == null) {
    if (post.publicationStatus === "tracking_active") return "live";
    if (post.publicationStatus) return "waiting";
    return null;
  }
  if (content !== "approved") return null;
  if (post.publicationStatus !== "tracking_active") return "waiting";
  return "live";
}

function ratePhase(post: DeliverableSnapshot, now: number): DeliverableLineStatus | null {
  const content = contentPhase(post);
  if (content !== "live") return content;
  if (!viewWindowEnded(post.publishedAt, now, post.trackingDays) || post.views == null) return "measuring";
  return "pending";
}

export function deliverablePhase(post: DeliverableSnapshot, now: number): DeliverableLineStatus | null {
  if (post.viewRateCents != null) return ratePhase(post, now);
  if (post.agreedFeeCents == null) return null;
  const content = contentPhase(post);
  if (content !== "live") return content;
  return livePhase(post, now);
}

export function deliverableStatusLabel(status: DeliverableLineStatus, adjusted = false) {
  if (status === "review") return "In review";
  if (status === "changes") return "Changes requested";
  if (status === "waiting" || status === "measuring") return "Not ready";
  if (status === "closed") return "Closed";
  if (status === "hold" || status === "recheck") return "On hold";
  if (status === "forfeited") return "Forfeited";
  if (status === "pending") return "Needs approval";
  if (status === "approved") return "Earned";
  return adjusted ? "Adjusted" : "Paid";
}

export function deliverableDetail(status: DeliverableLineStatus, holdEndsLabel: string | null) {
  if (status === "review") return "The rate, maximum, and tracking period locked when the post was sent.";
  if (status === "changes") return "Changes were requested. The locked rate stays with this post.";
  if (status === "closed") return "Declined or withdrawn. This post is closed.";
  if (status === "waiting") return "Approved. Views start once the link is live.";
  if (status === "measuring") return "The rate is locked. Pay is calculated from recorded views after the tracking period.";
  if (status === "hold") return `Live and the link is verified. The fee is held until ${holdEndsLabel ?? "the hold ends"}.`;
  if (status === "recheck") return "The hold ended. Re-check that the post is still up before this fee can be paid.";
  if (status === "forfeited") return "Removed or edited during the hold. An admin can review this and reinstate the fee.";
  if (status === "pending") return "Ready for payout.";
  if (status === "approved") return "Approved for payout. Record the payment when it is sent.";
  return "Payout approved. Lab commission stays on its own payout.";
}

export function deliverableNote(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text) return null;
  return text.slice(0, 300);
}

export function deliverableAdjustmentCents(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,]/g, "") : "";
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars === 0 || Math.abs(dollars) > 100000) return null;
  return Math.round(dollars * 100);
}
