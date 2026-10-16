"use server";

import { redirect } from "next/navigation";
import { AffiliateStoreError, createAffiliate, setAffiliateActive, setAffiliatePassword } from "@/lib/affiliate/store";
import {
  adminCredentialsMatch,
  adminIsSignedIn,
  adminLoginConfigured,
  clearAdminSession,
  setAdminSession,
} from "@/lib/affiliate/session";

function fail(error: string): never {
  redirect(`/admin/affiliates?error=${encodeURIComponent(error)}`);
}

export async function loginAffiliateAdmin(formData: FormData) {
  if (!adminLoginConfigured()) fail("unconfigured");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!adminCredentialsMatch(email, password)) fail("password");
  await setAdminSession();
  redirect("/admin/affiliates");
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
  try {
    await createAffiliate({
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      commissionPercent: Number(formData.get("commissionPercent") ?? 10),
      password: String(formData.get("password") ?? ""),
    });
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code);
    console.error("[affiliate] create failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  redirect("/admin/affiliates");
}

export async function setAffiliatePasswordAction(formData: FormData) {
  await requireAdmin();
  try {
    await setAffiliatePassword(String(formData.get("code") ?? ""), String(formData.get("password") ?? ""));
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code);
    console.error("[affiliate] password update failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  redirect("/admin/affiliates");
}

export async function setAffiliateActiveAction(formData: FormData) {
  await requireAdmin();
  const active = String(formData.get("active") ?? "") === "true";
  try {
    await setAffiliateActive(String(formData.get("code") ?? ""), active);
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code);
    console.error("[affiliate] status update failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  redirect("/admin/affiliates");
}
