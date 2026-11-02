"use server";

import { redirect } from "next/navigation";
import { normalizeAffiliateEmail } from "@/lib/affiliate/code";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliatePasswordResetEmail, sendAffiliateSignInEmail, sendLoginLockEmail } from "@/lib/affiliate/email";
import { clearLoginFailures, loginBlocked, recordLoginFailure } from "@/lib/affiliate/login-guard";
import { affiliateAdminConfigured, clearPortalSession, setPortalSession } from "@/lib/affiliate/session";
import { absoluteUrl } from "@/lib/seo/schema";
import {
  acceptAffiliateInvitation,
  acceptAffiliatePasswordReset,
  affiliateCodeForPassword,
  clearAffiliateMagicLink,
  clearAffiliatePasswordReset,
  getAffiliate,
  issueAffiliateMagicLink,
  issueAffiliatePasswordReset,
} from "@/lib/affiliate/store";

function fail(error: string, method: "password" | "link" | "reset" = "password", mailed = false): never {
  const methodQuery = method === "password" ? "" : `&method=${method}`;
  const mailedQuery = mailed ? "&mailed=1" : "";
  redirect(`/affiliates?error=${encodeURIComponent(error)}${methodQuery}${mailedQuery}`);
}

function portalReady() {
  return affiliateAdminConfigured() && affiliateFirebaseConfigured();
}

async function notifyAffiliateLock(email: string) {
  if (!affiliateEmailConfigured()) return false;
  const issued = await issueAffiliatePasswordReset(email);
  if (issued.status === "sent") {
    await sendLoginLockEmail(issued.email, { role: "affiliate", url: issued.url, changePassword: "link" });
    return true;
  }
  if (issued.status === "limited") {
    const to = normalizeAffiliateEmail(email);
    if (!to) return false;
    await sendLoginLockEmail(to, {
      role: "affiliate",
      url: absoluteUrl("/affiliates?method=reset"),
      changePassword: "request",
    });
    return true;
  }
  return false;
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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let blocked = false;
  try {
    blocked = await loginBlocked("affiliate", email);
  } catch (error) {
    console.error("[affiliate] portal sign-in lock check failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (blocked) fail("locked");
  let code: string | null = null;
  try {
    code = await affiliateCodeForPassword(email, password);
  } catch (error) {
    console.error("[affiliate] portal sign-in failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (!code) {
    let locked = false;
    try {
      locked = await recordLoginFailure("affiliate", email);
    } catch (error) {
      console.error("[affiliate] portal sign-in lock record failed", error instanceof Error ? error.message : "unknown");
      fail("unavailable");
    }
    if (locked) {
      let mailed = false;
      try {
        mailed = await notifyAffiliateLock(email);
      } catch (error) {
        console.error("[affiliate] portal sign-in lock email failed", error instanceof Error ? error.message : "unknown");
      }
      fail("locked", "password", mailed);
    }
    fail("denied");
  }
  try {
    await clearLoginFailures("affiliate", email);
  } catch (error) {
    console.error("[affiliate] portal sign-in lock clear failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (!(await setPortalSession(code, formData.get("remember") === "on"))) fail("denied");
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
  try {
    const affiliate = await getAffiliate(result.code);
    if (affiliate?.email) await clearLoginFailures("affiliate", affiliate.email);
  } catch (error) {
    console.error("[affiliate] portal sign-in lock clear failed", error instanceof Error ? error.message : "unknown");
  }
  if (!(await setPortalSession(result.code))) resetFail(token, "signin");
  redirect("/affiliates/overview");
}

export async function logoutAffiliatePortal() {
  await clearPortalSession();
  redirect("/affiliates");
}
