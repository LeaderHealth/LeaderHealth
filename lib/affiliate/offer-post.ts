import { DEFAULT_TRACKING_DAYS } from "./manual-checkpoint";
import type { PostFormat } from "./post-format";

export type LockedPayTerms = {
  viewRateCents: number;
  maxPayCents: number | null;
  trackingDays: number;
  engagementRateCents: number;
};

export function formatForOfferKind(kind: string): PostFormat | null {
  if (kind === "tiktok") return "tiktok";
  if (kind === "instagram_reel") return "instagram_reel";
  if (kind === "instagram_post" || kind === "instagram_carousel" || kind === "instagram_story") return "instagram_post";
  return null;
}

export function offerSlideBounds(kind: string) {
  if (kind === "instagram_carousel") return { min: 2, max: 20 };
  if (kind === "instagram_story" || kind === "instagram_reel" || kind === "tiktok") return { min: 1, max: 1 };
  if (kind === "instagram_post") return { min: 1, max: 20 };
  return null;
}

export function lockedOfferFee(existingFee: number | null, offerFee: number | null) {
  return existingFee ?? offerFee;
}

export function lockedPayTerms(
  existing: { viewRateCents: number | null; maxPayCents?: number | null; trackingDays?: number | null; engagementRateCents?: number | null },
  incoming: LockedPayTerms,
): LockedPayTerms {
  if (existing.viewRateCents != null) {
    return {
      viewRateCents: existing.viewRateCents,
      maxPayCents: existing.maxPayCents ?? null,
      trackingDays: existing.trackingDays ?? DEFAULT_TRACKING_DAYS,
      engagementRateCents: existing.engagementRateCents ?? 0,
    };
  }
  return incoming;
}

export function offerPostTaken(
  posts: { id: string; offerId: string; contentStatus: string }[],
  offerId: string,
  postId: string,
) {
  return posts.some(
    (post) => post.offerId === offerId && post.id !== postId && post.contentStatus !== "withdrawn" && post.contentStatus !== "rejected",
  );
}

export function postSourceLabel(offerId: string) {
  return offerId ? "Marketing offer" : "Independent";
}
