import { normalizeAffiliateCode } from "./code";
import { loadDisclosureProofs } from "./disclosures";
import { currentReportMonth, reportMonth } from "./marketing";
import { MarketingReportError, saveMarketingReport } from "./marketing-store";
import { campaignReports, type SocialPost } from "./social-match";
import { fetchFacebookPosts, fetchInstagramPosts, fetchTikTokPosts } from "./social-fetch";
import { refreshTikTokToken } from "./social-oauth";
import {
  SocialError,
  loadConnectionSecrets,
  saveTikTokConnection,
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
        await syncAccount({
          code: normalized,
          proofUrls,
          network: "facebook",
          accountId: page.accountId,
          accountName: page.accountName,
          load: () => fetchFacebookPosts(page),
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
    input.accounts.push({
      network: input.network,
      accountId: input.accountId,
      accountName: input.accountName,
      months: rows.map((row) => row.month),
    });
  } catch (error) {
    if (error instanceof MarketingReportError && error.code === "missing") throw new SocialError("invalid");
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
