import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured, setPortalSession } from "@/lib/affiliate/session";
import { redeemAffiliateMagicLink } from "@/lib/affiliate/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!affiliateAdminConfigured() || !affiliateFirebaseConfigured()) redirect("/affiliates?error=unconfigured");
  const token = new URL(request.url).searchParams.get("token");
  let code: string | null = null;
  try {
    code = await redeemAffiliateMagicLink(token);
  } catch (error) {
    console.error("[affiliate] sign-in link redeem failed", error instanceof Error ? error.message : "unknown");
    redirect("/affiliates?error=unavailable");
  }
  if (!code || !(await setPortalSession(code))) redirect("/affiliates?error=denied");
  redirect("/affiliates/tracking-link");
}
