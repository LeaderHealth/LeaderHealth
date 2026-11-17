import { normalizeAffiliateCode } from "./code";
import { loadDisclosureProofs } from "./disclosures";
import { loadContentSubmissions } from "./post-review";
import { fetchTikTokPosts } from "./social-fetch";
import { postMatchesCampaign } from "./social-match";
import { refreshTikTokToken } from "./social-oauth";
import { SocialError, loadConnectionSecrets, saveTikTokConnection, type TikTokConnectionSecret } from "./social-store";

export type TikTokReviewVideo = {
  id: string;
  caption: string;
  shareUrl: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  matched: boolean;
};

export type TikTokReviewList = {
  accountName: string;
  status: "ready" | "empty" | "unavailable";
  videos: TikTokReviewVideo[];
};

export async function loadTikTokReviewList(code: string): Promise<TikTokReviewList | null> {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;
  const secrets = await loadConnectionSecrets(normalized);
  const connection = secrets.find((item): item is TikTokConnectionSecret => item.network === "tiktok");
  if (!connection) return null;
  try {
    const current = await freshTikTok(connection);
    const posts = await fetchTikTokPosts(current);
    const [proofs, submissions] = await Promise.all([loadDisclosureProofs(normalized), loadContentSubmissions(normalized)]);
    const proofUrls = [
      ...proofs.flatMap((proof) => (proof.postUrl ? [proof.postUrl] : [])),
      ...submissions.flatMap((post) => (post.postUrl ? [post.postUrl] : [])),
    ];
    const videos = posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      shareUrl: post.permalink,
      views: post.impressions,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      matched: postMatchesCampaign(post, normalized, proofUrls),
    }));
    return { accountName: current.accountName, status: videos.length ? "ready" : "empty", videos };
  } catch (error) {
    console.error("[affiliate] tiktok video list failed", error instanceof SocialError ? error.code : "unavailable");
    return { accountName: connection.accountName, status: "unavailable", videos: [] };
  }
}

async function freshTikTok(connection: TikTokConnectionSecret) {
  if (tokenFresh(connection.expiresAt) || !connection.refreshToken) return connection;
  const refreshed = await refreshTikTokToken(connection.refreshToken);
  const next: TikTokConnectionSecret = {
    ...connection,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken || connection.refreshToken,
    expiresAt: refreshed.expiresAt,
  };
  await saveTikTokConnection(next);
  return next;
}

function tokenFresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  return Number.isFinite(time) && time > Date.now() + 60_000;
}
