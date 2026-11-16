import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/schema";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { sealTikTokVerifier, signSocialState, TIKTOK_PKCE_COOKIE, tiktokAuthorizeUrl, tiktokCodeVerifier, tiktokConfigured } from "@/lib/affiliate/social-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const code = await portalAffiliateCode();
  if (!code) return NextResponse.redirect(absoluteUrl("/affiliates"));
  if (!tiktokConfigured()) return NextResponse.redirect(absoluteUrl("/affiliates/stats?error=social-setup"));
  const state = signSocialState({ code, network: "tiktok" });
  const verifier = tiktokCodeVerifier();
  const sealed = sealTikTokVerifier(verifier);
  if (!state || !sealed) return NextResponse.redirect(absoluteUrl("/affiliates/stats?error=social-setup"));
  const response = NextResponse.redirect(tiktokAuthorizeUrl(state, verifier));
  response.cookies.set(TIKTOK_PKCE_COOKIE, sealed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
