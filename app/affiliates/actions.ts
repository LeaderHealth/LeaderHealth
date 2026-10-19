"use server";

import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliateSignInEmail } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, clearPortalSession, setPortalSession } from "@/lib/affiliate/session";
import { affiliateCodeForPassword, clearAffiliateMagicLink, issueAffiliateMagicLink } from "@/lib/affiliate/store";

function fail(error: string): never {
  redirect(`/affiliates?error=${encodeURIComponent(error)}`);
}

function portalReady() {
  return affiliateAdminConfigured() && affiliateFirebaseConfigured();
}

export async function loginAffiliatePortal(formData: FormData) {
  if (!portalReady()) fail("unconfigured");
  let code: string | null = null;
  try {
    code = await affiliateCodeForPassword(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    console.error("[affiliate] portal sign-in failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (!code || !(await setPortalSession(code))) fail("denied");
  redirect("/affiliates/tracking-link");
}

export async function requestAffiliateLink(formData: FormData) {
  if (!portalReady() || !affiliateEmailConfigured()) fail("unconfigured");
  let issued: Awaited<ReturnType<typeof issueAffiliateMagicLink>>;
  try {
    issued = await issueAffiliateMagicLink(String(formData.get("email") ?? ""));
  } catch (error) {
    console.error("[affiliate] sign-in link failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (issued.status === "limited") fail("limited");
  if (issued.status === "unavailable") fail("unavailable");
  if (issued.status !== "sent") fail("denied");
  try {
    await sendAffiliateSignInEmail(issued.email, issued.url);
  } catch (error) {
    try {
      await clearAffiliateMagicLink(issued.code);
    } catch (clearError) {
      console.error("[affiliate] sign-in link clear failed", clearError instanceof Error ? clearError.message : "unknown");
    }
    console.error("[affiliate] sign-in email failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  redirect("/affiliates?sent=1");
}

export async function logoutAffiliatePortal() {
  await clearPortalSession();
  redirect("/affiliates");
}
