import { createHmac, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "@/lib/seo/schema";
import { normalizeAffiliateCode } from "./code";
import {
  SocialError,
  type FacebookPageSecret,
  type TikTokConnectionSecret,
} from "./social-store";

const GRAPH = "https://graph.facebook.com/v21.0";
const STATE_MS = 10 * 60 * 1000;
const ACCOUNT_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function metaConfigured() {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}

export function tiktokConfigured() {
  return Boolean(process.env.TIKTOK_CLIENT_KEY?.trim() && process.env.TIKTOK_CLIENT_SECRET?.trim());
}

export function metaRedirectUri() {
  return absoluteUrl("/api/affiliate/social/meta/callback");
}

export function tiktokRedirectUri() {
  return absoluteUrl("/api/affiliate/social/tiktok/callback");
}

export function signSocialState(input: { code: string; network: "facebook" | "tiktok"; now?: number }) {
  const code = normalizeAffiliateCode(input.code);
  const secret = sessionSecret();
  if (!code || !secret) return null;
  const body = Buffer.from(JSON.stringify({ code, network: input.network, exp: (input.now ?? Date.now()) + STATE_MS })).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readSocialState(value: string, now = Date.now()) {
  const secret = sessionSecret();
  const separator = value.lastIndexOf(".");
  if (!secret || separator <= 0) return null;
  const body = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { code?: unknown; network?: unknown; exp?: unknown };
    const code = normalizeAffiliateCode(parsed.code);
    const network = parsed.network === "facebook" || parsed.network === "tiktok" ? parsed.network : null;
    if (!code || !network || typeof parsed.exp !== "number" || parsed.exp < now) return null;
    return { code, network };
  } catch {
    return null;
  }
}

export function metaAuthorizeUrl(state: string) {
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", process.env.META_APP_ID?.trim() ?? "");
  url.searchParams.set("redirect_uri", metaRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_insights");
  return url.toString();
}

export function tiktokAuthorizeUrl(state: string) {
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY?.trim() ?? "");
  url.searchParams.set("redirect_uri", tiktokRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "user.info.basic,video.list");
  return url.toString();
}

export async function exchangeMetaCode(oauthCode: string) {
  if (!metaConfigured()) throw new SocialError("setup");
  const shortToken = await metaAccessToken({
    client_id: env("META_APP_ID"),
    client_secret: env("META_APP_SECRET"),
    redirect_uri: metaRedirectUri(),
    code: oauthCode,
  });
  const userToken = await metaAccessToken({
    grant_type: "fb_exchange_token",
    client_id: env("META_APP_ID"),
    client_secret: env("META_APP_SECRET"),
    fb_exchange_token: shortToken,
  });
  const pages = await metaPages(userToken);
  if (pages.length === 0) throw new SocialError("page");
  return pages;
}

export async function exchangeTikTokCode(oauthCode: string): Promise<Omit<TikTokConnectionSecret, "code">> {
  if (!tiktokConfigured()) throw new SocialError("setup");
  const token = await tiktokToken({
    client_key: env("TIKTOK_CLIENT_KEY"),
    client_secret: env("TIKTOK_CLIENT_SECRET"),
    code: oauthCode,
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
  const profile = await tiktokProfile(token.accessToken);
  return {
    network: "tiktok",
    accountId: profile.accountId ?? token.accountId,
    accountName: profile.accountName ?? token.accountId,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: token.expiresAt,
  };
}

export async function refreshTikTokToken(refreshToken: string) {
  if (!tiktokConfigured()) throw new SocialError("setup");
  return tiktokToken({
    client_key: env("TIKTOK_CLIENT_KEY"),
    client_secret: env("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function metaAccessToken(params: Record<string, string>) {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const body = await readJson(url);
  const token = typeof body.access_token === "string" ? body.access_token : "";
  if (!token) throw new SocialError("unavailable");
  return token;
}

async function metaPages(userToken: string) {
  const pages: FacebookPageSecret[] = [];
  let next: string | null = `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=50`;
  for (let page = 0; page < 5 && next; page += 1) {
    const body = await readJson(next, userToken);
    const data = Array.isArray(body.data) ? body.data : [];
    for (const item of data) pages.push(...pageFromGraph(item));
    next = typeof body.paging === "object" && body.paging && "next" in body.paging && typeof body.paging.next === "string" ? body.paging.next : null;
  }
  return pages;
}

function pageFromGraph(value: unknown): FacebookPageSecret[] {
  if (!value || typeof value !== "object") return [];
  const page = value as Record<string, unknown>;
  const accountId = asAccountId(page.id);
  const accessToken = typeof page.access_token === "string" ? page.access_token : "";
  if (!accountId || !accessToken) return [];
  const instagram = page.instagram_business_account;
  const instagramRecord = instagram && typeof instagram === "object" ? (instagram as Record<string, unknown>) : null;
  return [
    {
      accountId,
      accountName: label(page.name) ?? accountId,
      accessToken,
      instagramAccountId: instagramRecord ? asAccountId(instagramRecord.id) : null,
      instagramAccountName: instagramRecord ? label(instagramRecord.username) : null,
    },
  ];
}

async function tiktokToken(params: Record<string, string>) {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body !== "object") throw new SocialError("unavailable");
  const record = body as Record<string, unknown>;
  const accessToken = typeof record.access_token === "string" ? record.access_token : "";
  const account = asAccountId(record.open_id);
  if (!accessToken || !account) throw new SocialError("unavailable");
  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : 0;
  return {
    accessToken,
    refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : "",
    accountId: account,
    expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
  };
}

async function tiktokProfile(token: string) {
  const url = new URL("https://open.tiktokapis.com/v2/user/info/");
  url.searchParams.set("fields", "open_id,display_name");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => null);
  const user = body && typeof body === "object" && "data" in body && body.data && typeof body.data === "object" && "user" in body.data ? body.data.user : null;
  if (!user || typeof user !== "object") return { accountId: null, accountName: null };
  const record = user as Record<string, unknown>;
  return { accountId: asAccountId(record.open_id), accountName: label(record.display_name) };
}

async function readJson(url: string | URL, token?: string) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || typeof body !== "object") throw new SocialError("unavailable");
  return body as Record<string, unknown> & { data?: unknown; paging?: { next?: unknown } };
}

function sessionSecret() {
  return process.env.AFFILIATE_SESSION_SECRET?.trim() ?? "";
}

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function asAccountId(value: unknown) {
  return typeof value === "string" && ACCOUNT_ID.test(value) ? value : null;
}

function label(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text || text.length > 120) return null;
  return text;
}
