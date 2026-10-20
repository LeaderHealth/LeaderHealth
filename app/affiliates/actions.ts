"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateEmailConfigured, sendAffiliateSignInEmail } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, clearPortalSession, portalAffiliateCode, setPortalSession } from "@/lib/affiliate/session";
import {
  AffiliateStoreError,
  affiliateCodeForPassword,
  clearAffiliateMagicLink,
  issueAffiliateMagicLink,
  loadSavedPromoCodes,
  removeAffiliatePromoCode,
  saveAffiliatePromoCode,
} from "@/lib/affiliate/store";
import { listPromoCodes, promoRowsForAffiliate } from "@/lib/genhealth/promocodes";

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
  redirect("/affiliates/overview");
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
