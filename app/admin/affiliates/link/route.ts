import { redirect } from "next/navigation";
import { redeemSubAdminMagicLink } from "@/lib/affiliate/admins";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured, setStoredAdminSession } from "@/lib/affiliate/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!affiliateAdminConfigured() || !affiliateFirebaseConfigured()) redirect("/admin/affiliates?error=link-unavailable&method=link");
  const token = new URL(request.url).searchParams.get("token");
  let admin: Awaited<ReturnType<typeof redeemSubAdminMagicLink>> = null;
  try {
    admin = await redeemSubAdminMagicLink(token);
  } catch (error) {
    console.error("[affiliate] admin sign-in link redeem failed", error instanceof Error ? error.message : "unknown");
    redirect("/admin/affiliates?error=link-unavailable&method=link");
  }
  if (!admin || !(await setStoredAdminSession(admin.id, admin.role))) redirect("/admin/affiliates?error=link-invalid&method=link");
  redirect("/admin/affiliates/overview");
}
