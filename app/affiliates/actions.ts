"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliateSignInEmail } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, clearPortalSession, portalAffiliateCode, setPortalSession } from "@/lib/affiliate/session";
import {
  AffiliateStoreError,
  acceptAffiliateInvitation,
  affiliateCodeForPassword,
  clearAffiliateMagicLink,
  issueAffiliateMagicLink,
  loadSavedPromoCodes,
  removeAffiliatePromoCode,
  saveAffiliatePromoCode,
} from "@/lib/affiliate/store";
import { listPromoCodes, promoRowsForAffiliate } from "@/lib/genhealth/promocodes";

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

export async function saveAffiliateLinkAction(promoCode: string) {
  const code = await portalAffiliateCode();
  if (!code) return { ok: false, message: "Sign in to save this link." };
  try {
    const assigned = promoRowsForAffiliate(await listPromoCodes(), code).some((promo) => promo.code === promoCode.trim());
    if (!assigned) return { ok: false, message: "That promo code is not assigned to you." };
    await saveAffiliatePromoCode(code, promoCode);
  } catch (error) {
    console.error("[affiliate] save link failed", error instanceof Error ? error.message : "unknown");
    const message = error instanceof AffiliateStoreError ? error.message : "Couldn't save this link.";
    return { ok: false, message };
  }
  revalidatePath("/affiliates/promo-codes");
  revalidatePath("/affiliates/saved-links");
  revalidatePath("/affiliates/overview");
  return { ok: true, message: "Saved to your links." };
}

export async function removeAffiliateLinkAction(promoCode: string) {
  const code = await portalAffiliateCode();
  if (!code) return { ok: false, message: "Sign in to remove this link." };
  try {
    const saved = await loadSavedPromoCodes(code);
    if (!saved.includes(promoCode.trim())) return { ok: false, message: "That link is not in your saved links." };
    await removeAffiliatePromoCode(code, promoCode);
  } catch (error) {
    console.error("[affiliate] remove link failed", error instanceof Error ? error.message : "unknown");
    const message = error instanceof AffiliateStoreError ? error.message : "Couldn't remove this link.";
    return { ok: false, message };
  }
  revalidatePath("/affiliates/saved-links");
  revalidatePath("/affiliates/overview");
  revalidatePath("/affiliates/promo-codes");
  return { ok: true, message: "Removed from your links." };
}

export async function logoutAffiliatePortal() {
  await clearPortalSession();
  redirect("/affiliates");
}
