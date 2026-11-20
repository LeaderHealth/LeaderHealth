import { normalizeAffiliateCode } from "./code";
import {
  currentReportMonth,
  marketingReportFields,
  reportMonth,
  type MarketingReportFields,
  type SocialNetwork,
} from "./marketing";

const COUNT_MAX = 1_000_000_000;

export type SocialPost = {
  id: string;
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  caption: string;
  links: readonly string[];
  permalink: string;
  createdAt: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export type AccountMonthTotals = {
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  month: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export function canonicalPostUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "");
  return `${host}${path}`;
}

export function samePublishedPost(left: string | null, right: string | null) {
  if (!left || !right) return false;
  const a = canonicalPostUrl(left);
  const b = canonicalPostUrl(right);
  if (a && b && a === b) return true;
  const videoId = (value: string) => value.match(/\/video\/(\d{8,30})/)?.[1] ?? null;
  const leftId = videoId(left);
  const rightId = videoId(right);
  return Boolean(leftId && leftId === rightId);
}

export function textHasTrackingCode(text: string, code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !text) return false;
  return urlsInText(text).some((url) => {
    const ref = normalizeAffiliateCode(url.searchParams.get("ref"));
    const source = normalizeAffiliateCode(url.searchParams.get("utm_source"));
    return ref === normalized || source === normalized;
  });
}

export function postMatchesCampaign(post: Pick<SocialPost, "caption" | "links" | "permalink">, code: string, proofUrls: readonly string[]) {
  if ([post.caption, ...post.links].some((text) => textHasTrackingCode(text, code))) return true;
  const permalink = canonicalPostUrl(post.permalink);
  if (!permalink) return false;
  return proofUrls.some((url) => canonicalPostUrl(url) === permalink);
}

export function selectCampaignPosts(posts: readonly SocialPost[], code: string, proofUrls: readonly string[]) {
  const kept = new Map<string, SocialPost>();
  for (const post of posts) {
    const id = post.id.trim();
    if (!id) continue;
    const key = `${post.network}:${id}`;
    if (kept.has(key)) continue;
    if (!postMatchesCampaign(post, code, proofUrls)) continue;
    kept.set(key, post);
  }
  return [...kept.values()];
}

export function tiktokVideoId(value: string) {
  return /^[0-9]{8,30}$/.test(value) ? value : null;
}

export function selectTikTokUpdate(input: { videoId: string | null; postUrl: string | null; videos: readonly SocialPost[] }) {
  const saved = input.videoId ? tiktokVideoId(input.videoId) : null;
  if (saved) {
    const video = input.videos.find((item) => item.network === "tiktok" && item.id === saved);
    return video ? { videoId: saved, video } : null;
  }
  if (!input.postUrl) return null;
  const video = input.videos.find((item) => item.network === "tiktok" && samePublishedPost(input.postUrl, item.permalink));
  const id = video ? tiktokVideoId(video.id) : null;
  return video && id ? { videoId: id, video } : null;
}

export function rememberedFacebookPosts(input: {
  saved: readonly SocialPost[];
  refreshed: readonly SocialPost[];
  feed: readonly SocialPost[];
  code: string;
  proofUrls: readonly string[];
}) {
  const kept = new Map<string, SocialPost>();
  for (const post of input.saved) {
    if (post.network !== "facebook" || !post.id.trim()) continue;
    kept.set(post.id, post);
  }
  for (const post of input.refreshed) {
    if (post.network !== "facebook" || !kept.has(post.id)) continue;
    kept.set(post.id, post);
  }
  for (const post of selectCampaignPosts(input.feed, input.code, input.proofUrls)) {
    if (post.network !== "facebook" || kept.has(post.id)) continue;
    kept.set(post.id, post);
  }
  return [...kept.values()];
}

export function totalsByAccountMonth(posts: readonly SocialPost[]) {
  const totals = new Map<string, AccountMonthTotals>();
  for (const post of posts) {
    const month = reportMonth(post.createdAt);
    if (!month) continue;
    const key = `${post.network}:${post.accountId}:${month}`;
    const current = totals.get(key) ?? {
      network: post.network,
      accountId: post.accountId,
      accountName: post.accountName,
      month,
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    };
    current.accountName = post.accountName || current.accountName;
    current.impressions = addCount(current.impressions, post.impressions);
    current.reach = addCount(current.reach, post.reach);
    current.likes = addCount(current.likes, post.likes);
    current.comments = addCount(current.comments, post.comments);
    current.shares = addCount(current.shares, post.shares);
    current.saves = addCount(current.saves, post.saves);
    totals.set(key, current);
  }
  return [...totals.values()];
}

export function campaignReports(input: {
  code: string;
  posts: readonly SocialPost[];
  proofUrls: readonly string[];
  accounts: readonly { network: SocialNetwork; accountId: string; accountName: string }[];
  monthsByAccount: ReadonlyMap<string, readonly string[]>;
  alreadyMatched?: boolean;
  now?: Date;
}) {
  const matched = input.alreadyMatched ? dedupePosts(input.posts) : selectCampaignPosts(input.posts, input.code, input.proofUrls);
  const totals = totalsByAccountMonth(matched);
  const rows: MarketingReportFields[] = [];
  for (const account of input.accounts) {
    const key = `${account.network}:${account.accountId}`;
    const listed = input.monthsByAccount.get(key) ?? [];
    const months = listed.length > 0 ? listed : [currentReportMonth(input.now)];
    for (const month of months) {
      const total = totals.find(
        (item) => item.network === account.network && item.accountId === account.accountId && item.month === month,
      );
      const fields = marketingReportFields({
        code: input.code,
        month,
        network: account.network,
        accountId: account.accountId,
        accountName: account.accountName,
        impressions: total?.impressions ?? 0,
        reach: total?.reach ?? 0,
        likes: total?.likes ?? 0,
        comments: total?.comments ?? 0,
        shares: total?.shares ?? 0,
        saves: total?.saves ?? 0,
      });
      if (fields) rows.push(fields);
    }
  }
  return rows;
}

function dedupePosts(posts: readonly SocialPost[]) {
  const kept = new Map<string, SocialPost>();
  for (const post of posts) {
    const id = post.id.trim();
    if (!id) continue;
    const key = `${post.network}:${id}`;
    if (!kept.has(key)) kept.set(key, post);
  }
  return [...kept.values()];
}

function urlsInText(text: string) {
  const found: URL[] = [];
  const withProtocol = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const bare = text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi) ?? [];
  for (const raw of [...withProtocol, ...bare.map((item) => `https://${item}`)]) {
    const url = parseUrl(raw);
    if (url) found.push(url);
  }
  return found;
}

function parseUrl(raw: string) {
  try {
    return new URL(raw.replace(/[),.;]+$/g, ""));
  } catch {
    return null;
  }
}

function addCount(current: number, value: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return current;
  return Math.min(COUNT_MAX, current + Math.floor(value));
}
