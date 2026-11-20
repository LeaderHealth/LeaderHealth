import { normalizeAffiliateCode } from "./code";
import { loadDisclosureProofs } from "./disclosures";
import { currentReportMonth, reportMonth } from "./marketing";
import { MarketingReportError, saveMarketingReport } from "./marketing-store";
import { loadMatchedFacebookPosts, saveMatchedFacebookPosts } from "./matched-posts";
import { campaignReports, rememberedFacebookPosts, type SocialPost } from "./social-match";
import { fetchFacebookPosts, fetchInstagramPosts, fetchTikTokPosts, readFacebookPost } from "./social-fetch";
import { refreshTikTokToken } from "./social-oauth";
import {
  SocialError,
  loadConnectionSecrets,
  markSocialReconnect,
  saveTikTokConnection,
  type FacebookPageSecret,
  type TikTokConnectionSecret,
} from "./social-store";

export type SocialSyncAccount = {
  network: "facebook" | "instagram" | "tiktok";
  accountId: string;
  accountName: string;
  months: string[];
};

export async function syncAffiliateSocialReports(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new SocialError("invalid");
  const connections = await loadConnectionSecrets(normalized);
  if (connections.length === 0) throw new SocialError("unconnected");
  const proofs = await loadDisclosureProofs(normalized);
  const proofUrls = proofs.flatMap((proof) => (proof.postUrl ? [proof.postUrl] : []));
  const accounts: SocialSyncAccount[] = [];
  const failed: SocialSyncAccount[] = [];
  for (const connection of connections) {
    if (connection.network === "facebook") {
      for (const page of connection.pages) {
        await syncFacebookPage({
          code: normalized,
          proofUrls,
          page,
          accounts,
          failed,
        });
        if (!page.instagramAccountId) continue;
        await syncAccount({
          code: normalized,
          proofUrls,
          network: "instagram",
          accountId: page.instagramAccountId,
          accountName: page.instagramAccountName ?? page.instagramAccountId,
          load: () => fetchInstagramPosts(page),
          accounts,
          failed,
        });
      }
      continue;
    }
    if (connection.network === "youtube") continue;
    await syncAccount({
      code: normalized,
      proofUrls,
      network: "tiktok",
      accountId: connection.accountId,
      accountName: connection.accountName,
      load: async () => {
        const current = await freshTikTok(connection);
        return fetchTikTokPosts(current);
      },
      accounts,
      failed,
    });
  }
  if (accounts.length === 0) throw new SocialError("unavailable");
  return { code: normalized, accounts, failed };
}

async function syncFacebookPage(input: {
  code: string;
  proofUrls: string[];
  page: FacebookPageSecret;
  accounts: SocialSyncAccount[];
  failed: SocialSyncAccount[];
}) {
  const page = input.page;
  try {
    const saved = await loadMatchedFacebookPosts(input.code, page.accountId);
    const feed = await fetchFacebookPosts(page);
    const refreshed: SocialPost[] = [];
    for (const post of saved) {
      const next = await readFacebookPost(page, post.id);
      if (next) refreshed.push(next);
    }
    const posts = rememberedFacebookPosts({
      saved,
      refreshed,
      feed,
      code: input.code,
      proofUrls: input.proofUrls,
    });
    await saveMatchedFacebookPosts(input.code, posts);
    const rows = campaignReports({
      code: input.code,
      posts,
      proofUrls: input.proofUrls,
      accounts: [{ network: "facebook", accountId: page.accountId, accountName: page.accountName }],
      monthsByAccount: new Map([[`facebook:${page.accountId}`, monthsIn(posts)]]),
      alreadyMatched: true,
    });
    if (rows.length === 0) throw new SocialError("invalid");
    for (const row of rows) await saveMarketingReport(row);
    await markSocialReconnect(input.code, "facebook", false);
    input.accounts.push({
      network: "facebook",
      accountId: page.accountId,
      accountName: page.accountName,
      months: rows.map((row) => row.month),
    });
  } catch (error) {
    if (error instanceof MarketingReportError && error.code === "missing") throw new SocialError("invalid");
    if (error instanceof SocialError && error.code === "expired") await markSocialReconnect(input.code, "facebook", true);
    console.error("[affiliate] social sync failed", "facebook", error instanceof SocialError ? error.code : "unavailable");
    input.failed.push({ network: "facebook", accountId: page.accountId, accountName: page.accountName, months: [] });
  }
}

async function syncAccount(input: {
  code: string;
  proofUrls: string[];
  network: SocialSyncAccount["network"];
  accountId: string;
  accountName: string;
  load: () => Promise<SocialPost[]>;
  accounts: SocialSyncAccount[];
  failed: SocialSyncAccount[];
}) {
  try {
    const posts = await input.load();
    const months = monthsIn(posts);
    const rows = campaignReports({
      code: input.code,
      posts,
      proofUrls: input.proofUrls,
      accounts: [{ network: input.network, accountId: input.accountId, accountName: input.accountName }],
      monthsByAccount: new Map([[`${input.network}:${input.accountId}`, months]]),
    });
    if (rows.length === 0) throw new SocialError("invalid");
    for (const row of rows) await saveMarketingReport(row);
    await markSocialReconnect(input.code, input.network === "tiktok" ? "tiktok" : "facebook", false);
    input.accounts.push({
      network: input.network,
      accountId: input.accountId,
      accountName: input.accountName,
      months: rows.map((row) => row.month),
    });
  } catch (error) {
    if (error instanceof MarketingReportError && error.code === "missing") throw new SocialError("invalid");
    if (error instanceof SocialError && error.code === "expired") {
      await markSocialReconnect(input.code, input.network === "tiktok" ? "tiktok" : "facebook", true);
    }
    console.error("[affiliate] social sync failed", input.network, error instanceof SocialError ? error.code : "unavailable");
    input.failed.push({ network: input.network, accountId: input.accountId, accountName: input.accountName, months: [] });
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

export async function currentTikTokConnection(connection: TikTokConnectionSecret) {
  return freshTikTok(connection);
}

function tokenFresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  return Number.isFinite(time) && time > Date.now() + 60_000;
}

function monthsIn(posts: readonly SocialPost[]) {
  const months = new Set<string>([currentReportMonth()]);
  for (const post of posts) {
    const month = reportMonth(post.createdAt);
    if (month) months.add(month);
  }
  return [...months].sort();
}
