"use server";

import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliateSignInEmail } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, clearPortalSession, setPortalSession } from "@/lib/affiliate/session";
import {
  acceptAffiliateInvitation,
  affiliateCodeForPassword,
  clearAffiliateMagicLink,
  issueAffiliateMagicLink,
} from "@/lib/affiliate/store";

function fail(error: string, method: "password" | "link" = "password"): never {
  const methodQuery = method === "link" ? "&method=link" : "";
  redirect(`/affiliates?error=${encodeURIComponent(error)}${methodQuery}`);
}

function portalReady() {
  return affiliateAdminConfigured() && affiliateFirebaseConfigured();
}

const ACTIVATE_TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

function activateFail(token: string, error: string): never {
  const params = new URLSearchParams({ error });
  if (ACTIVATE_TOKEN.test(token)) params.set("token", token);
  redirect(`/affiliates/activate?${params.toString()}`);
}

export async function activateAffiliateAccount(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!portalReady()) activateFail(token, "unavailable");
  let result: Awaited<ReturnType<typeof acceptAffiliateInvitation>>;
  try {
    result = await acceptAffiliateInvitation(token, String(formData.get("password") ?? ""));
  } catch (error) {
    console.error("[affiliate] activation failed", error instanceof Error ? error.message : "unknown");
    activateFail(token, "unavailable");
  }
  if (result.status !== "ok") activateFail(token, result.status);
  if (!(await setPortalSession(result.code))) activateFail(token, "signin");
  redirect("/affiliates/overview");
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
  redirect("/affiliates/overview");
}

export async function requestAffiliateLink(formData: FormData) {
  if (!portalReady() || !affiliateEmailConfigured()) fail("unconfigured", "link");
  let issued: Awaited<ReturnType<typeof issueAffiliateMagicLink>>;
  try {
    issued = await issueAffiliateMagicLink(String(formData.get("email") ?? ""));
  } catch (error) {
    console.error("[affiliate] sign-in link failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "link");
  }
  if (issued.status === "limited") fail("limited", "link");
  if (issued.status === "unavailable") fail("unavailable", "link");
  if (issued.status !== "sent") fail("denied", "link");
  try {
    await sendAffiliateSignInEmail(issued.email, issued.url);
  } catch (error) {
    try {
      await clearAffiliateMagicLink(issued.code);
    } catch (clearError) {
      console.error("[affiliate] sign-in link clear failed", clearError instanceof Error ? clearError.message : "unknown");
    }
    console.error("[affiliate] sign-in email failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "link");
  }
  redirect("/affiliates?sent=1&method=link");
}

export async function logoutAffiliatePortal() {
  await clearPortalSession();
  redirect("/affiliates");
}
