import { SocialError, type FacebookPageSecret, type TikTokConnectionSecret } from "./social-store";
import type { SocialPost } from "./social-match";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function fetchFacebookPosts(page: FacebookPageSecret) {
  const fields = "id,message,permalink_url,created_time,shares,comments.summary(true).limit(0),reactions.type(LIKE).limit(0).summary(true)";
  const fallback = "id,message,permalink_url,created_time,shares,comments.summary(true).limit(0)";
  const posts = await graphList(`/${page.accountId}/published_posts`, page.accessToken, fields, fallback);
  return mapPool(posts, 4, async (item) => {
    const id = text(item.id);
    if (!id) return null;
    const insights = await insightValues(id, page.accessToken, ["post_impressions", "post_impressions_unique"], ["post_media_view", "post_total_media_view_unique"]);
    const caption = text(item.message);
    return {
      id,
      network: "facebook" as const,
      accountId: page.accountId,
      accountName: page.accountName,
      caption,
      links: urlsIn(caption),
      permalink: text(item.permalink_url),
      createdAt: text(item.created_time),
      impressions: insights.get("post_impressions") ?? insights.get("post_media_view") ?? 0,
      reach: insights.get("post_impressions_unique") ?? insights.get("post_total_media_view_unique") ?? 0,
      likes: summaryCount(item.reactions),
      comments: summaryCount(item.comments),
      shares: nestedCount(item.shares),
      saves: 0,
    } satisfies SocialPost;
  });
}

export type InstagramMediaSnapshot = {
  id: string;
  permalink: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  views: number | null;
};

export async function fetchInstagramMedia(page: FacebookPageSecret) {
  if (!page.instagramAccountId) return [];
  const posts = await graphList(`/${page.instagramAccountId}/media`, page.accessToken, "id,caption,permalink,like_count,comments_count");
  const results: (InstagramMediaSnapshot | null)[] = [];
  let index = 0;
  async function worker() {
    while (index < posts.length) {
      const current = index;
      index += 1;
      results[current] = await mediaSnapshot(posts[current], page);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, posts.length) }, () => worker()));
  return results.flatMap((item) => (item ? [item] : []));
}

export async function readInstagramMedia(page: FacebookPageSecret, mediaId: string) {
  if (!page.instagramAccountId || !/^[0-9]{5,32}$/.test(mediaId)) return null;
  const url = new URL(`${GRAPH}/${mediaId}`);
  url.searchParams.set("fields", "id,caption,permalink,like_count,comments_count,owner");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${page.accessToken}` },
    signal: AbortSignal.timeout(15000),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (text(record.id) !== mediaId) return null;
  const owner = record.owner && typeof record.owner === "object" && "id" in record.owner ? text((record.owner as { id?: unknown }).id) : "";
  if (owner && owner !== page.instagramAccountId) return null;
  return mediaSnapshot(record, page);
}

async function mediaSnapshot(item: Record<string, unknown>, page: FacebookPageSecret): Promise<InstagramMediaSnapshot | null> {
  const id = text(item.id);
  if (!id || !page.instagramAccountId) return null;
  const insights = await insightKnown(id, page.accessToken);
  return {
    id,
    permalink: text(item.permalink),
    caption: text(item.caption),
    likes: count(item.like_count),
    comments: count(item.comments_count),
    shares: insightMetric(insights, "shares"),
    saves: insightMetric(insights, "saved"),
    reach: insightMetric(insights, "reach"),
    views: insightMetric(insights, "views"),
  };
}

async function insightKnown(id: string, token: string) {
  const primary = await insightMap(id, token, ["views", "reach", "saved", "shares"]);
  if (primary.size > 0) return primary;
  return insightMap(id, token, ["reach", "saved"]);
}

function insightMetric(map: Map<string, number>, key: string) {
  return map.has(key) ? (map.get(key) ?? null) : null;
}

export async function fetchInstagramPosts(page: FacebookPageSecret) {
  if (!page.instagramAccountId) return [];
  const accountId = page.instagramAccountId;
  const accountName = page.instagramAccountName ?? accountId;
  const posts = await graphList(`/${accountId}/media`, page.accessToken, "id,caption,permalink,timestamp,like_count,comments_count");
  return mapPool(posts, 4, async (item) => {
    const id = text(item.id);
    if (!id) return null;
    const insights = await insightValues(id, page.accessToken, ["views", "reach", "saved", "shares"], ["reach", "saved"]);
    const caption = text(item.caption);
    return {
      id,
      network: "instagram" as const,
      accountId,
      accountName,
      caption,
      links: urlsIn(caption),
      permalink: text(item.permalink),
      createdAt: text(item.timestamp),
      impressions: insights.get("views") ?? 0,
      reach: insights.get("reach") ?? 0,
      likes: count(item.like_count),
      comments: count(item.comments_count),
      shares: insights.get("shares") ?? 0,
      saves: insights.get("saved") ?? 0,
    } satisfies SocialPost;
  });
}

export async function fetchTikTokPosts(connection: Pick<TikTokConnectionSecret, "accountId" | "accountName" | "accessToken">) {
  const videos: Record<string, unknown>[] = [];
  let cursor: number | null = 0;
  for (let page = 0; page < 3 && cursor != null; page += 1) {
    const url = new URL("https://open.tiktokapis.com/v2/video/list/");
    url.searchParams.set("fields", "id,title,video_description,share_url,create_time,like_count,comment_count,share_count,view_count");
    const response: Response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${connection.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ max_count: 20, cursor }),
      signal: AbortSignal.timeout(15000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") throw new SocialError("unavailable");
    const data: Record<string, unknown> = "data" in body && body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
    const batch = Array.isArray(data.videos) ? data.videos : [];
    for (const video of batch) {
      if (video && typeof video === "object") videos.push(video as Record<string, unknown>);
    }
    cursor = data.has_more === true && typeof data.cursor === "number" ? data.cursor : null;
  }
  return videos.flatMap((video) => {
    const id = text(video.id);
    if (!id) return [];
    const caption = [text(video.title), text(video.video_description)].filter(Boolean).join("\n");
    const created = typeof video.create_time === "number" ? new Date(video.create_time * 1000).toISOString() : "";
    const post: SocialPost = {
      id,
      network: "tiktok",
      accountId: connection.accountId,
      accountName: connection.accountName,
      caption,
      links: urlsIn(caption),
      permalink: text(video.share_url),
      createdAt: created,
      impressions: count(video.view_count),
      reach: 0,
      likes: count(video.like_count),
      comments: count(video.comment_count),
      shares: count(video.share_count),
      saves: 0,
    };
    return [post];
  });
}

async function graphList(path: string, token: string, fields: string, fallback?: string) {
  try {
    return await graphPages(path, token, fields);
  } catch (error) {
    if (!fallback) throw error;
    return graphPages(path, token, fallback);
  }
}

async function graphPages(path: string, token: string, fields: string) {
  const items: Record<string, unknown>[] = [];
  const first = new URL(`${GRAPH}${path}`);
  first.searchParams.set("fields", fields);
  first.searchParams.set("limit", "25");
  let next: string | null = first.toString();
  for (let page = 0; page < 3 && next; page += 1) {
    const response: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") throw new SocialError("unavailable");
    const data = "data" in body && Array.isArray(body.data) ? body.data : [];
    for (const item of data) {
      if (item && typeof item === "object") items.push(item as Record<string, unknown>);
    }
    const paging: { next?: unknown } = "paging" in body && body.paging && typeof body.paging === "object" ? (body.paging as { next?: unknown }) : {};
    next = typeof paging.next === "string" ? paging.next : null;
  }
  return items;
}

async function insightValues(id: string, token: string, metrics: string[], fallback: string[]) {
  const primary = await insightMap(id, token, metrics);
  if (primary.size > 0) return primary;
  return insightMap(id, token, fallback);
}

async function insightMap(id: string, token: string, metrics: string[]) {
  const url = new URL(`${GRAPH}/${id}/insights`);
  url.searchParams.set("metric", metrics.join(","));
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => null);
  const values = new Map<string, number>();
  if (!response.ok || !body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) return values;
  for (const item of body.data) {
    if (!item || typeof item !== "object") continue;
    const record = item as { name?: unknown; values?: unknown };
    const name = text(record.name);
    const list = Array.isArray(record.values) ? record.values : [];
    const latest = list.at(-1);
    const value = latest && typeof latest === "object" && "value" in latest ? count((latest as { value?: unknown }).value) : 0;
    if (name) values.set(name, value);
  }
  return values;
}

async function mapPool(items: Record<string, unknown>[], limit: number, map: (item: Record<string, unknown>) => Promise<SocialPost | null>) {
  const results: (SocialPost | null)[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await map(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results.flatMap((item) => (item ? [item] : []));
}

function urlsIn(text: string) {
  return text.match(/https?:\/\/[^\s<>"']+/gi)?.map((url) => url.replace(/[),.;]+$/g, "")) ?? [];
}

function summaryCount(value: unknown) {
  if (!value || typeof value !== "object" || !("summary" in value)) return 0;
  const summary = (value as { summary?: unknown }).summary;
  if (!summary || typeof summary !== "object" || !("total_count" in summary)) return 0;
  return count((summary as { total_count?: unknown }).total_count);
}

function nestedCount(value: unknown) {
  if (!value || typeof value !== "object" || !("count" in value)) return 0;
  return count((value as { count?: unknown }).count);
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return "";
}
