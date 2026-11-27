import type { Metadata } from "next";
import { AdminSocialStats, type AdminSocialPost } from "@/components/affiliate/AdminSocialStats";
import { memo } from "@/lib/affiliate/memo";
import { listAffiliateChoices } from "@/lib/affiliate/marketing-store";
import { loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { utcDay, type StatsBoardPost } from "@/lib/affiliate/stats-board";

export const metadata: Metadata = {
  title: "Social media stats",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleOf(caption: string) {
  const line = caption.split("\n").map((part) => part.trim()).find(Boolean) ?? "";
  return line.slice(0, 80) || "Untitled post";
}

function boardPlatform(post: ContentSubmission): StatsBoardPost["platform"] {
  if (post.format === "tiktok") return "tiktok";
  if (post.format === "instagram_reel" || post.format === "instagram_post") return "instagram";
  const host = (() => {
    try {
      return new URL(post.postUrl ?? "").hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host === "fb.com" || host === "fb.watch") return "facebook";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  return "other";
}

function boardPost(post: ContentSubmission): StatsBoardPost | null {
  const day = (post.publishedAt || post.createdAt || "").slice(0, 10);
  if (!day) return null;
  const platform = boardPlatform(post);
  const kind = platform === "tiktok" || platform === "youtube" ? "Video" : platform === "instagram" && post.format === "instagram_reel" ? "Reel" : post.files.length > 1 ? "Carousel" : "Post";
  return {
    id: post.id,
    title: titleOf(post.caption),
    platform,
    kind,
    campaign: post.campaign,
    agreementLabel: post.agreementLabel,
    postedOn: day,
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: post.comments ?? 0,
    shares: post.shares ?? 0,
    saves: post.saves ?? 0,
  };
}

function published(post: ContentSubmission) {
  return post.contentStatus === "approved" && post.publicationStatus === "tracking_active";
}

export default async function AdminSocialStatsPage() {
  let posts: AdminSocialPost[] = [];
  let unavailable = "";
  try {
    const [submissions, affiliates] = await Promise.all([
      memo("submissions:all", () => loadContentSubmissions()),
      memo("affiliate-choices", () => listAffiliateChoices()),
    ]);
    const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
    posts = submissions.filter(published).flatMap((post) => {
      const board = boardPost(post);
      return board ? [{ ...board, code: post.code, name: names.get(post.code) || post.code }] : [];
    });
  } catch {
    unavailable = "Social media stats are unavailable right now.";
  }

  if (unavailable) return <p className="text-ink">{unavailable}</p>;
  return <AdminSocialStats today={utcDay()} posts={posts} />;
}
