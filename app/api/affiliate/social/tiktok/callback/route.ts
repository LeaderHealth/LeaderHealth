import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/schema";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { exchangeTikTokCode, openTikTokVerifier, readSocialState, TIKTOK_PKCE_COOKIE } from "@/lib/affiliate/social-oauth";
import { setSocialOnboarding } from "@/lib/affiliate/social-onboarding";
import { saveTikTokConnection, SocialError } from "@/lib/affiliate/social-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stats(query: string) {
  const response = NextResponse.redirect(absoluteUrl(`/affiliates/stats?${query}`));
  response.cookies.set(TIKTOK_PKCE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const code = await portalAffiliateCode();
  if (!code) return NextResponse.redirect(absoluteUrl("/affiliates"));
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return stats("error=social-denied");
  const state = readSocialState(url.searchParams.get("state") ?? "");
  const oauthCode = cleanCode(url.searchParams.get("code"));
  const jar = await cookies();
  const verifier = openTikTokVerifier(jar.get(TIKTOK_PKCE_COOKIE)?.value ?? "");
  if (!state || state.network !== "tiktok" || state.code !== code || !oauthCode || !verifier) return stats("error=social");
  try {
    const account = await exchangeTikTokCode(oauthCode, verifier);
    await saveTikTokConnection({ ...account, code });
    try {
      await setSocialOnboarding(code, "done");
    } catch (error) {
      console.error("[affiliate] social onboarding update failed", error instanceof Error ? error.message : "unknown");
    }
  } catch (error) {
    if (error instanceof SocialError && error.code === "setup") return stats("error=social-setup");
    console.error("[affiliate] tiktok connect failed", error instanceof SocialError ? error.code : "unavailable");
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
