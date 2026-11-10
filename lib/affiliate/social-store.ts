import type { DocumentData } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { type SocialNetwork } from "./marketing";

export class SocialError extends Error {
  code: "invalid" | "unavailable" | "unconnected" | "denied" | "page" | "setup";

  constructor(code: SocialError["code"]) {
    super(code);
    this.name = "SocialError";
    this.code = code;
  }
}

export type SocialAccountView = {
  code: string;
  network: SocialNetwork;
  accountId: string;
  accountName: string;
};

export type FacebookPageSecret = {
  accountId: string;
  accountName: string;
  accessToken: string;
  instagramAccountId: string | null;
  instagramAccountName: string | null;
};

export type FacebookConnectionSecret = {
  code: string;
  network: "facebook";
  pages: FacebookPageSecret[];
};

export type TikTokConnectionSecret = {
  code: string;
  network: "tiktok";
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
};

export type ConnectionSecret = FacebookConnectionSecret | TikTokConnectionSecret;

const ACCOUNT_ID = /^[A-Za-z0-9._-]{1,128}$/;

function requireDb() {
  if (!affiliateFirebaseConfigured()) throw new SocialError("unavailable");
  return affiliateFirestore();
}

function documentId(code: string, network: "facebook" | "tiktok") {
  return `${code}_${network}`;
}

function accountIdOf(value: unknown) {
  return typeof value === "string" && ACCOUNT_ID.test(value) ? value : null;
}

function labelOf(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text || text.length > 120) return null;
  return text;
}

function tokenOf(value: unknown) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!token || token.length > 4096 || /[\u0000-\u001f]/.test(token)) return null;
  return token;
}

function pageSecret(value: unknown): FacebookPageSecret | null {
  if (!value || typeof value !== "object") return null;
  const page = value as DocumentData;
  const accountId = accountIdOf(page.accountId);
  const accessToken = tokenOf(page.accessToken);
  if (!accountId || !accessToken) return null;
  return {
    accountId,
    accountName: labelOf(page.accountName) ?? accountId,
    accessToken,
    instagramAccountId: accountIdOf(page.instagramAccountId),
    instagramAccountName: labelOf(page.instagramAccountName),
  };
}

function viewsFrom(data: DocumentData | undefined): SocialAccountView[] {
  if (!data) return [];
  const code = normalizeAffiliateCode(data.code);
  if (!code) return [];
  if (data.network === "tiktok") {
    const accountId = accountIdOf(data.accountId);
    if (!accountId) return [];
    return [{ code, network: "tiktok", accountId, accountName: labelOf(data.accountName) ?? accountId }];
  }
  if (data.network !== "facebook" || !Array.isArray(data.pages)) return [];
  return data.pages.flatMap((page) => {
    const secret = pageSecret(page);
    if (!secret) return [];
    const accounts: SocialAccountView[] = [
      { code, network: "facebook", accountId: secret.accountId, accountName: secret.accountName },
    ];
    if (secret.instagramAccountId) {
      accounts.push({
        code,
        network: "instagram",
        accountId: secret.instagramAccountId,
        accountName: secret.instagramAccountName ?? secret.instagramAccountId,
      });
    }
    return accounts;
  });
}

function secretFrom(data: DocumentData | undefined): ConnectionSecret | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  if (!code) return null;
  if (data.network === "tiktok") {
    const accountId = accountIdOf(data.accountId);
    const accessToken = tokenOf(data.accessToken);
    if (!accountId || !accessToken) return null;
    return {
      code,
      network: "tiktok",
      accountId,
      accountName: labelOf(data.accountName) ?? accountId,
      accessToken,
      refreshToken: tokenOf(data.refreshToken) ?? "",
      expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null,
    };
  }
  if (data.network !== "facebook" || !Array.isArray(data.pages)) return null;
  const pages = data.pages.flatMap((page) => {
    const secret = pageSecret(page);
    return secret ? [secret] : [];
  });
  if (pages.length === 0) return null;
  return { code, network: "facebook", pages };
}

export async function loadSocialAccounts(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const db = affiliateFirestore();
  const snap = normalized
    ? await db.collection("socialConnections").where("code", "==", normalized).get()
    : await db.collection("socialConnections").get();
  return snap.docs
    .flatMap((doc) => viewsFrom(doc.data()))
    .sort((left, right) => left.code.localeCompare(right.code) || left.network.localeCompare(right.network) || left.accountName.localeCompare(right.accountName));
}

export async function loadConnectionSecrets(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return [];
  const db = requireDb();
  const snap = await db.collection("socialConnections").where("code", "==", normalized).get();
  return snap.docs.flatMap((doc) => {
    const secret = secretFrom(doc.data());
    return secret ? [secret] : [];
  });
}

export async function saveFacebookConnection(code: string, pages: FacebookPageSecret[]) {
  const normalized = normalizeAffiliateCode(code);
  const stored = pages.flatMap((page) => {
    const accountId = accountIdOf(page.accountId);
    const accessToken = tokenOf(page.accessToken);
    if (!accountId || !accessToken) return [];
    return [
      {
        accountId,
        accountName: labelOf(page.accountName) ?? accountId,
        accessToken,
        instagramAccountId: accountIdOf(page.instagramAccountId),
        instagramAccountName: labelOf(page.instagramAccountName),
      },
    ];
  });
  if (!normalized || stored.length === 0) throw new SocialError("invalid");
  await requireDb().collection("socialConnections").doc(documentId(normalized, "facebook")).set({
    code: normalized,
    network: "facebook",
    pages: stored,
    updatedAt: new Date(),
  });
}

export async function saveTikTokConnection(input: TikTokConnectionSecret) {
  const code = normalizeAffiliateCode(input.code);
  const accountId = accountIdOf(input.accountId);
  const accessToken = tokenOf(input.accessToken);
  if (!code || !accountId || !accessToken) throw new SocialError("invalid");
  await requireDb().collection("socialConnections").doc(documentId(code, "tiktok")).set({
    code,
    network: "tiktok",
    accountId,
    accountName: labelOf(input.accountName) ?? accountId,
    accessToken,
    refreshToken: tokenOf(input.refreshToken) ?? "",
    expiresAt: input.expiresAt,
    updatedAt: new Date(),
  });
}

export async function deleteSocialConnection(code: string, network: "facebook" | "tiktok") {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new SocialError("invalid");
  await requireDb().collection("socialConnections").doc(documentId(normalized, network)).delete();
}
