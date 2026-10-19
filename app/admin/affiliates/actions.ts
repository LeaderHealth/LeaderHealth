"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AffiliateStoreError, createAffiliate, setAffiliateActive, setAffiliatePassword } from "@/lib/affiliate/store";
import { PromoCodeError, assignPromoCode, unassignPromoCode } from "@/lib/genhealth/promocodes";
import {
  adminCredentialsMatch,
  adminIsSignedIn,
  adminLoginConfigured,
  clearAdminSession,
  setAdminSession,
} from "@/lib/affiliate/session";

function fail(error: string, path = "/admin/affiliates"): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function loginAffiliateAdmin(formData: FormData) {
  if (!adminLoginConfigured()) fail("unconfigured");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!adminCredentialsMatch(email, password)) fail("password");
  await setAdminSession();
  redirect("/admin/affiliates/accounts");
}

export async function logoutAffiliateAdmin() {
  await clearAdminSession();
  redirect("/admin/affiliates");
}

async function requireAdmin() {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");
}

export async function createAffiliateAction(formData: FormData) {
  await requireAdmin();
  let code = "";
  try {
    code = await createAffiliate({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      commissionMode: formData.get("commissionMode"),
      commissionPercent: formData.get("commissionPercent"),
      commissionFixed: formData.get("commissionFixed"),
      password: String(formData.get("password") ?? ""),
    });
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code, "/admin/affiliates/add");
    console.error("[affiliate] create failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "/admin/affiliates/add");
  }
  redirect(`/admin/affiliates/accounts?created=${encodeURIComponent(code)}`);
}

export async function setAffiliatePasswordAction(formData: FormData) {
  await requireAdmin();
  try {
    await setAffiliatePassword(String(formData.get("code") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code, "/admin/affiliates/accounts");
    console.error("[affiliate] password update failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "/admin/affiliates/accounts");
  }
  redirect("/admin/affiliates/accounts");
}

export async function setAffiliateActiveAction(formData: FormData) {
  await requireAdmin();
  const active = String(formData.get("active") ?? "") === "true";
  try {
    await setAffiliateActive(String(formData.get("code") ?? ""), active);
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code, "/admin/affiliates/accounts");
    console.error("[affiliate] status update failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "/admin/affiliates/accounts");
  }
  redirect("/admin/affiliates/accounts");
}

const PROMO_PATH = "/admin/affiliates/promo-codes";
const ACCOUNTS_PATH = "/admin/affiliates/accounts";

function refreshAssignments() {
  revalidatePath(PROMO_PATH);
  revalidatePath(ACCOUNTS_PATH);
}

export async function assignPromoCodeAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  try {
    await assignPromoCode(code, String(formData.get("affiliate") ?? ""));
  } catch (error) {
    if (error instanceof PromoCodeError) fail(error.code, PROMO_PATH);
    console.error("[affiliate] promo assign failed", error instanceof Error ? error.message : "unknown");
    fail("assign", PROMO_PATH);
  }
  refreshAssignments();
  redirect(`${PROMO_PATH}?assigned=${encodeURIComponent(code)}`);
}

export async function unassignPromoCodeAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  try {
    await unassignPromoCode(code, String(formData.get("affiliate") ?? ""));
  } catch (error) {
    if (error instanceof PromoCodeError) fail(error.code, PROMO_PATH);
    console.error("[affiliate] promo unassign failed", error instanceof Error ? error.message : "unknown");
    fail("assign", PROMO_PATH);
  }
  refreshAssignments();
  redirect(`${PROMO_PATH}?removed=${encodeURIComponent(code)}`);
}
