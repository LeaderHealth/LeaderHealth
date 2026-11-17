import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/schema";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { exchangeMetaCode, readSocialState } from "@/lib/affiliate/social-oauth";
import { setSocialOnboarding } from "@/lib/affiliate/social-onboarding";
import { saveFacebookConnection, SocialError } from "@/lib/affiliate/social-store";

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
  if (!state || state.network !== "facebook" || state.code !== code || !oauthCode) return stats("error=social");
  try {
    const connection = await exchangeMetaCode(oauthCode);
    await saveFacebookConnection(code, connection);
    try {
      await setSocialOnboarding(code, "done");
    } catch (error) {
      console.error("[affiliate] social onboarding update failed", error instanceof Error ? error.message : "unknown");
    }
  } catch (error) {
    if (error instanceof SocialError && error.code === "page") return stats("error=social-page");
    if (error instanceof SocialError && error.code === "setup") return stats("error=social-setup");
    console.error("[affiliate] facebook connect failed", error instanceof SocialError ? error.code : "unavailable");
    return stats("error=social");
  }
  return stats("notice=connected");
}

function cleanCode(value: string | null) {
  if (!value) return null;
  const code = value.trim();
  if (code.length < 4 || code.length > 2048 || /[\s\u0000-\u001f]/.test(code)) return null;
  return code;
}
