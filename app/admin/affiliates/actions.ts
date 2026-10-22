"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { affiliateEmailConfigured, sendAffiliateInvitationEmail } from "@/lib/affiliate/email";
import { approvePayout, markPayoutPaid, PayoutError } from "@/lib/affiliate/payouts";
import { AffiliateStoreError, createAffiliate, issueAffiliateInvitation, setAffiliateActive, setAffiliatePassword } from "@/lib/affiliate/store";
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
  redirect("/admin/affiliates/overview");
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
  if (!affiliateEmailConfigured()) fail("mail", "/admin/affiliates/add");
  let code = "";
  try {
    code = await createAffiliate({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      commissionMode: formData.get("commissionMode"),
      commissionPercent: formData.get("commissionPercent"),
      commissionFixed: formData.get("commissionFixed"),
    });
  } catch (error) {
    if (error instanceof AffiliateStoreError) fail(error.code, "/admin/affiliates/add");
    console.error("[affiliate] create failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", "/admin/affiliates/add");
  }
  const created = `/admin/affiliates/accounts?created=${encodeURIComponent(code)}`;
  let issued: Awaited<ReturnType<typeof issueAffiliateInvitation>>;
  try {
    issued = await issueAffiliateInvitation(code);
  } catch (error) {
    console.error("[affiliate] invitation failed", error instanceof Error ? error.message : "unknown");
    redirect(`${created}&error=invite`);
  }
  if (issued.status !== "sent") {
    const reason = issued.status === "inactive" ? "inactive" : issued.status === "missing" ? "missing" : "unavailable";
    redirect(`${created}&error=${reason}`);
  }
  try {
    await sendAffiliateInvitationEmail(issued.email, issued.url);
  } catch (error) {
    console.error("[affiliate] invitation email failed", error instanceof Error ? error.message : "unknown");
    redirect(`${created}&error=invite`);
  }
  redirect(`${created}&invited=1`);
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

export async function resendAffiliateInvitationAction(formData: FormData) {
  await requireAdmin();
  if (!affiliateEmailConfigured()) fail("mail", ACCOUNTS_PATH);
  let issued: Awaited<ReturnType<typeof issueAffiliateInvitation>>;
  try {
    issued = await issueAffiliateInvitation(String(formData.get("code") ?? ""));
  } catch (error) {
    console.error("[affiliate] invitation resend failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", ACCOUNTS_PATH);
  }
  if (issued.status === "activated") fail("activated", ACCOUNTS_PATH);
  if (issued.status === "inactive") fail("inactive", ACCOUNTS_PATH);
  if (issued.status === "missing") fail("missing", ACCOUNTS_PATH);
  if (issued.status !== "sent") fail("unavailable", ACCOUNTS_PATH);
  try {
    await sendAffiliateInvitationEmail(issued.email, issued.url);
  } catch (error) {
    console.error("[affiliate] invitation resend failed", error instanceof Error ? error.message : "unknown");
    fail("invite", ACCOUNTS_PATH);
  }
  redirect(`${ACCOUNTS_PATH}?resent=1`);
}

function refreshAssignments() {
  revalidatePath(PROMO_PATH);
  revalidatePath(ACCOUNTS_PATH);
  revalidatePath("/admin/affiliates/tracking-links");
  revalidatePath("/affiliates/overview");
  revalidatePath("/affiliates/tracking-link");
}

export async function assignPromoCodeAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  const affiliate = String(formData.get("affiliate") ?? "");
  try {
    await assignPromoCode(code, affiliate);
  } catch (error) {
    console.error("[affiliate] promo assign failed", error instanceof Error ? error.message : "unknown");
    if (error instanceof PromoCodeError) fail(error.code, PROMO_PATH);
    fail("assign", PROMO_PATH);
  }
  refreshAssignments();
  redirect(`${PROMO_PATH}?assigned=${encodeURIComponent(code)}`);
}

export async function unassignPromoCodeAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "").trim();
  const affiliate = String(formData.get("affiliate") ?? "");
  try {
    await unassignPromoCode(code, affiliate);
  } catch (error) {
    if (error instanceof PromoCodeError) fail(error.code, PROMO_PATH);
    console.error("[affiliate] promo unassign failed", error instanceof Error ? error.message : "unknown");
    fail("assign", PROMO_PATH);
  }
  refreshAssignments();
  redirect(`${PROMO_PATH}?removed=${encodeURIComponent(code)}`);
}

const PAYOUT_PATH = "/admin/affiliates/payouts";

function refreshPayouts() {
  revalidatePath(PAYOUT_PATH);
  revalidatePath("/admin/affiliates/overview");
  revalidatePath("/affiliates/payouts");
  revalidatePath("/affiliates/overview");
}

function payoutFail(code: string, period: string): never {
  const params = new URLSearchParams({ error: `payout-${code}` });
  if (/^\d{4}-\d{2}$/.test(period)) params.set("month", period);
  redirect(`${PAYOUT_PATH}?${params.toString()}`);
}

function payoutDone(period: string, notice: string): never {
  const params = new URLSearchParams({ notice });
  if (/^\d{4}-\d{2}$/.test(period)) params.set("month", period);
  redirect(`${PAYOUT_PATH}?${params.toString()}`);
}

export async function approvePayoutAction(formData: FormData) {
  await requireAdmin();
  const period = String(formData.get("period") ?? "");
  try {
    await approvePayout(String(formData.get("code") ?? ""), period);
  } catch (error) {
    if (error instanceof PayoutError) payoutFail(error.code, period);
    console.error("[affiliate] payout approve failed", error instanceof Error ? error.message : "unknown");
    payoutFail("unavailable", period);
  }
  refreshPayouts();
  payoutDone(period, "approved");
}

export async function markPayoutPaidAction(formData: FormData) {
  await requireAdmin();
  const period = String(formData.get("period") ?? "");
  try {
    await markPayoutPaid({
      code: String(formData.get("code") ?? ""),
      period,
      amount: formData.get("amount"),
      paidOn: formData.get("paidOn"),
      reference: formData.get("reference"),
    });
  } catch (error) {
    if (error instanceof PayoutError) payoutFail(error.code, period);
    console.error("[affiliate] payout payment failed", error instanceof Error ? error.message : "unknown");
    payoutFail("unavailable", period);
  }
  refreshPayouts();
  payoutDone(period, "paid");
}
