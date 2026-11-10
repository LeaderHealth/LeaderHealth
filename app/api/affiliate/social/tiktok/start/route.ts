import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/schema";
import { portalAffiliateCode } from "@/lib/affiliate/session";
import { signSocialState, tiktokAuthorizeUrl, tiktokConfigured } from "@/lib/affiliate/social-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const code = await portalAffiliateCode();
  if (!code) return NextResponse.redirect(absoluteUrl("/affiliates"));
  if (!tiktokConfigured()) return NextResponse.redirect(absoluteUrl("/affiliates/stats?error=social-setup"));
  const state = signSocialState({ code, network: "tiktok" });
  if (!state) return NextResponse.redirect(absoluteUrl("/affiliates/stats?error=social-setup"));
  return NextResponse.redirect(tiktokAuthorizeUrl(state));
}
