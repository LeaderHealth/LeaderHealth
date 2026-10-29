"use server";

import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliatePasswordResetEmail, sendAffiliateSignInEmail } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, clearPortalSession, setPortalSession } from "@/lib/affiliate/session";
import {
  acceptAffiliateInvitation,
  acceptAffiliatePasswordReset,
  affiliateCodeForPassword,
  clearAffiliateMagicLink,
  clearAffiliatePasswordReset,
  issueAffiliateMagicLink,
  issueAffiliatePasswordReset,
} from "@/lib/affiliate/store";

function fail(error: string, method: "password" | "link" | "reset" = "password"): never {
  const methodQuery = method === "password" ? "" : `&method=${method}`;
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

function resetFail(token: string, error: string): never {
  const params = new URLSearchParams({ error });
  if (ACTIVATE_TOKEN.test(token)) params.set("token", token);
  redirect(`/affiliates/reset?${params.toString()}`);
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
  if (!code || !(await setPortalSession(code, formData.get("remember") === "on"))) fail("denied");
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

export async function requestAffiliatePasswordReset(formData: FormData) {
  if (!portalReady() || !affiliateEmailConfigured()) fail("unconfigured", "reset");
  let issued: Awaited<ReturnType<typeof issueAffiliatePasswordReset>>;
  try {
    issued = await issueAffiliatePasswordReset(String(formData.get("email") ?? ""));
  } catch (error) {
    console.error("[affiliate] password reset failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "reset");
  }
  if (issued.status === "limited") fail("limited", "reset");
  if (issued.status === "unavailable") fail("unavailable", "reset");
  if (issued.status !== "sent") fail("denied", "reset");
  try {
    await sendAffiliatePasswordResetEmail(issued.email, issued.url);
  } catch (error) {
    try {
      await clearAffiliatePasswordReset(issued.code);
    } catch (clearError) {
      console.error("[affiliate] password reset clear failed", clearError instanceof Error ? clearError.message : "unknown");
    }
    console.error("[affiliate] password reset email failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "reset");
  }
  redirect("/affiliates?sent=1&method=reset");
}

export async function resetAffiliatePassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!portalReady()) resetFail(token, "unavailable");
  let result: Awaited<ReturnType<typeof acceptAffiliatePasswordReset>>;
  try {
    result = await acceptAffiliatePasswordReset(token, String(formData.get("password") ?? ""));
  } catch (error) {
    console.error("[affiliate] password reset save failed", error instanceof Error ? error.message : "unknown");
    resetFail(token, "unavailable");
  }
  if (result.status !== "ok") resetFail(token, result.status);
  if (!(await setPortalSession(result.code))) resetFail(token, "signin");
  redirect("/affiliates/overview");
}

export async function logoutAffiliatePortal() {
  await clearPortalSession();
  redirect("/affiliates");
}
