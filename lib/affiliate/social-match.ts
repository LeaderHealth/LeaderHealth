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
  now?: Date;
}) {
  const matched = selectCampaignPosts(input.posts, input.code, input.proofUrls);
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
