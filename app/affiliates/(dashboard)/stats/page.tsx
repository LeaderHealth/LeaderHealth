import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AffiliateStatsBoard } from "@/components/affiliate/AffiliateStatsBoard";
import { memo } from "@/lib/affiliate/memo";
import { loadMarketingEvents } from "@/lib/affiliate/marketing-events";
import { loadContentSubmissions, refreshDueMetrics, type ContentSubmission } from "@/lib/affiliate/post-review";
import { utcDay, type StatsBoardDay, type StatsBoardPost } from "@/lib/affiliate/stats-board";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const socialErrors: Record<string, string> = {
  social: "That social account could not be connected.",
  "social-setup": "Reporting is not set up for that network.",
  "social-denied": "The connection was cancelled.",
  "social-page": "Connect a Facebook Page to import posts.",
};

function titleOf(caption: string) {
  const line = caption.split("\n").map((part) => part.trim()).find(Boolean) ?? "";
  return line.slice(0, 80) || "Untitled post";
}

function postedOn(post: ContentSubmission) {
  return (post.publishedAt || post.createdAt || "").slice(0, 10);
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
  const day = postedOn(post);
  if (!day) return null;
  const platform = boardPlatform(post);
  const kind = platform === "tiktok" || platform === "youtube" ? "Video" : platform === "instagram" && post.format === "instagram_reel" ? "Reel" : post.files.length > 1 ? "Carousel" : "Post";
  return {
    id: post.id,
    title: titleOf(post.caption),
    platform,
    kind,
    campaign: post.campaign,
    postedOn: day,
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: post.comments ?? 0,
    shares: post.shares ?? 0,
    saves: post.saves ?? 0,
  };
}

function published(post: ContentSubmission) {
  return post.contentStatus === "approved" && (post.publicationStatus === "tracking_active" || Boolean(post.postUrl));
}

function trafficDays(events: { kind: string; payable: boolean; excluded?: boolean; createdAt: string }[]): StatsBoardDay[] {
  const days = new Map<string, StatsBoardDay>();
  for (const event of events) {
    if (!event.payable || event.excluded || (event.kind !== "click" && event.kind !== "page_view")) continue;
    const day = event.createdAt.slice(0, 10);
    const current = days.get(day) ?? { day, clicks: 0, pageViews: 0 };
    if (event.kind === "click") current.clicks += 1;
    else current.pageViews += 1;
    days.set(day, current);
  }
  return [...days.values()];
}

export default async function AffiliateStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const socialError = query.error ? socialErrors[query.error] ?? "" : "";
  let posts: StatsBoardPost[] = [];
  let traffic: StatsBoardDay[] = [];
  let unavailable = "";
  try {
    await memo(`stats-refresh:${affiliate.code}`, () => refreshDueMetrics(affiliate.code, 8));
    posts = (await memo(`submissions:${affiliate.code}`, () => loadContentSubmissions(affiliate.code))).filter(published).map(boardPost).filter((post): post is StatsBoardPost => post !== null);
    traffic = trafficDays(await memo(`marketing-events:${affiliate.code}`, () => loadMarketingEvents({ code: affiliate.code })));
  } catch {
    unavailable = "Stats are unavailable right now.";
  }

  return (
    <section className="min-w-0" aria-labelledby="portal-stats-title">
      <h2 id="portal-stats-title" className="sr-only">Stats</h2>
      {socialError ? <p role="alert" className="mb-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">{socialError}</p> : null}
      {query.notice === "connected" ? <p role="status" className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">Account connected.</p> : null}
      {query.notice === "disconnected" ? <p role="status" className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">Account disconnected.</p> : null}
      {query.notice === "disconnected-facebook" ? <p role="status" className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">Leader Health is disconnected. You can also remove Leader Health in Facebook under Settings, Security, Apps and websites.</p> : null}
      {query.notice === "disconnected-tiktok" ? <p role="status" className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">Leader Health is disconnected. You can also remove Leader Health in TikTok under Settings, Security, Manage app permissions.</p> : null}
      {unavailable ? <p className="text-ink">{unavailable}</p> : <AffiliateStatsBoard today={utcDay()} posts={posts} traffic={traffic} />}
    </section>
  );
}
