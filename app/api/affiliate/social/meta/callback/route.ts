import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/schema";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { exchangeInstagramCode, exchangeMetaCode, readSocialState } from "@/lib/affiliate/social-oauth";
import { setSocialOnboarding } from "@/lib/affiliate/social-onboarding";
import { loadConnectionSecrets, saveFacebookConnection, SocialError, type FacebookConnectionSecret, type FacebookPageSecret } from "@/lib/affiliate/social-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stats(query: string) {
  return NextResponse.redirect(absoluteUrl(`/affiliates/stats?${query}`));
}

export async function GET(request: Request) {
  const code = await portalAffiliateCode();
  if (!code) return NextResponse.redirect(absoluteUrl("/affiliates"));
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return stats("error=social-denied");
  const state = readSocialState(url.searchParams.get("state") ?? "");
  const oauthCode = cleanCode(url.searchParams.get("code"));
  if (!state || (state.network !== "facebook" && state.network !== "instagram") || state.code !== code || !oauthCode) return stats("error=social");
  try {
    const exchanged = state.network === "instagram" ? await exchangeInstagramCode(oauthCode) : await exchangeMetaCode(oauthCode);
    const connection = state.network === "instagram" ? await keepFacebookPages(code, exchanged) : exchanged;
    await saveFacebookConnection(code, connection);
    try {
      await setSocialOnboarding(code, "done");
    } catch (error) {
      console.error("[affiliate] social onboarding update failed", error instanceof Error ? error.message : "unknown");
    }
  } catch (error) {
    if (error instanceof SocialError && error.code === "page") return stats("error=social-page");
    if (error instanceof SocialError && error.code === "setup") return stats("error=social-setup");
    console.error("[affiliate] meta connect failed", state.network, error instanceof SocialError ? error.code : "unavailable");
    return stats("error=social");
  }
  return stats("notice=connected");
}

async function keepFacebookPages(code: string, incoming: { userAccessToken: string | null; pages: FacebookPageSecret[] }) {
  const secrets = await loadConnectionSecrets(code);
  const current = secrets.find((item): item is FacebookConnectionSecret => item.network === "facebook");
  if (!current) return incoming;
  const pages = new Map(current.pages.map((page) => [page.accountId, page]));
  for (const page of incoming.pages) pages.set(page.accountId, page);
  return { userAccessToken: current.userAccessToken ?? incoming.userAccessToken, pages: [...pages.values()] };
}

function cleanCode(value: string | null) {
  if (!value) return null;
  const code = value.trim();
  if (code.length < 4 || code.length > 2048 || /[\s\u0000-\u001f]/.test(code)) return null;
  return code;
}
