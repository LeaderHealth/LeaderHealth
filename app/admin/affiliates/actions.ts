"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  acceptSubAdminPasswordReset,
  clearSubAdminMagicLink,
  clearSubAdminPasswordReset,
  deletePendingSubAdmin,
  issueSubAdminInvitation,
  issueSubAdminMagicLink,
  issueSubAdminPasswordReset,
  removeSubAdmin,
  resendSubAdminInvitation,
  setSubAdminActive,
  subAdminIdForPassword,
  acceptSubAdminInvitation,
} from "@/lib/affiliate/admins";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import {
  affiliateEmailConfigured,
  sendAdminInvitationEmail,
  sendAffiliateInvitationEmail,
  sendApplicationLinkEmail,
  sendSubAdminPasswordResetEmail,
  sendSubAdminSignInEmail,
} from "@/lib/affiliate/email";
import { approvePayout, markPayoutPaid, PayoutError } from "@/lib/affiliate/payouts";
import {
  ApplicationError,
  applicationCommission,
  claimAffiliateApplication,
  createApplicationLink,
  declineAffiliateApplication,
  existingAffiliateCode,
  finishAffiliateApplication,
  readApplicationLink,
  releaseAffiliateApplication,
} from "@/lib/affiliate/applications";
import { normalizeAffiliateEmail } from "@/lib/affiliate/code";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { absoluteUrl } from "@/lib/seo/schema";
import { AffiliateStoreError, createAffiliate, issueAffiliateInvitation, setAffiliateActive, setAffiliatePassword } from "@/lib/affiliate/store";
import { PromoCodeError, assignPromoCode, unassignPromoCode } from "@/lib/genhealth/promocodes";
import {
  adminCredentialsMatch,
  adminIsSignedIn,
  adminLoginConfigured,
  adminSessionActor,
  clearAdminSession,
  currentAdminSessionId,
  setAdminSession,
  setSubAdminSession,
} from "@/lib/affiliate/session";
import { revokeDashboardSession } from "@/lib/affiliate/dashboard-sessions";

function fail(error: string, path = "/admin/affiliates"): never {
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

export async function loginAffiliateAdmin(formData: FormData) {
  if (!adminLoginConfigured()) fail("unconfigured");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const rememberDevice = formData.get("remember") === "on";
  if (adminCredentialsMatch(email, password)) {
    if (!(await setAdminSession(rememberDevice))) fail("unavailable");
    redirect("/admin/affiliates/overview");
  }
  let subAdminId: string | null = null;
  try {
    subAdminId = await subAdminIdForPassword(email, password);
  } catch (error) {
    console.error("[affiliate] sub-admin sign-in failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  if (!subAdminId || !(await setSubAdminSession(subAdminId, rememberDevice))) fail("password");
  redirect("/admin/affiliates/overview");
}

function signInFail(error: string, method: "link" | "reset"): never {
  redirect(`/admin/affiliates?error=${encodeURIComponent(error)}&method=${method}`);
}

export async function requestSubAdminLink(formData: FormData) {
  if (!adminLoginConfigured() || !affiliateFirebaseConfigured() || !affiliateEmailConfigured()) signInFail("link-unavailable", "link");
  let issued: Awaited<ReturnType<typeof issueSubAdminMagicLink>>;
  try {
    issued = await issueSubAdminMagicLink(String(formData.get("email") ?? ""));
  } catch (error) {
    console.error("[affiliate] admin sign-in link failed", error instanceof Error ? error.message : "unknown");
    signInFail("link-unavailable", "link");
  }
  if (issued.status === "limited") signInFail("link-limited", "link");
  if (issued.status === "owner") signInFail("link-owner", "link");
  if (issued.status === "unavailable") signInFail("link-unavailable", "link");
  if (issued.status !== "sent") signInFail("link-denied", "link");
  try {
    await sendSubAdminSignInEmail(issued.email, issued.url);
  } catch (error) {
    try {
      await clearSubAdminMagicLink(issued.id);
    } catch (clearError) {
      console.error("[affiliate] admin sign-in link clear failed", clearError instanceof Error ? clearError.message : "unknown");
    }
    console.error("[affiliate] admin sign-in email failed", error instanceof Error ? error.message : "unknown");
    signInFail("link-unavailable", "link");
  }
  redirect("/admin/affiliates?sent=1&method=link");
}

export async function requestSubAdminPasswordReset(formData: FormData) {
  if (!adminLoginConfigured() || !affiliateFirebaseConfigured() || !affiliateEmailConfigured()) signInFail("link-unavailable", "reset");
  let issued: Awaited<ReturnType<typeof issueSubAdminPasswordReset>>;
  try {
    issued = await issueSubAdminPasswordReset(String(formData.get("email") ?? ""));
  } catch (error) {
    console.error("[affiliate] admin password reset failed", error instanceof Error ? error.message : "unknown");
    signInFail("link-unavailable", "reset");
  }
  if (issued.status === "limited") signInFail("link-limited", "reset");
  if (issued.status === "owner") signInFail("link-owner", "reset");
  if (issued.status === "unavailable") signInFail("link-unavailable", "reset");
  if (issued.status !== "sent") signInFail("link-denied", "reset");
  try {
    await sendSubAdminPasswordResetEmail(issued.email, issued.url);
  } catch (error) {
    try {
      await clearSubAdminPasswordReset(issued.id);
    } catch (clearError) {
      console.error("[affiliate] admin password reset clear failed", clearError instanceof Error ? clearError.message : "unknown");
    }
    console.error("[affiliate] admin password reset email failed", error instanceof Error ? error.message : "unknown");
    signInFail("link-unavailable", "reset");
  }
  redirect("/admin/affiliates?sent=1&method=reset");
}

function resetFail(token: string, error: string): never {
  const params = new URLSearchParams({ error });
  if (/^[A-Za-z0-9_-]{20,200}$/.test(token)) params.set("token", token);
  redirect(`/admin/affiliates/reset?${params.toString()}`);
}

export async function resetSubAdminPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!adminLoginConfigured() || !affiliateFirebaseConfigured()) resetFail(token, "unavailable");
  let result: Awaited<ReturnType<typeof acceptSubAdminPasswordReset>>;
  try {
    result = await acceptSubAdminPasswordReset(token, String(formData.get("password") ?? ""));
  } catch (error) {
    console.error("[affiliate] admin password reset save failed", error instanceof Error ? error.message : "unknown");
    resetFail(token, "unavailable");
  }
  if (result.status !== "ok") resetFail(token, result.status);
  if (!(await setSubAdminSession(result.id))) resetFail(token, "signin");
  redirect("/admin/affiliates/overview");
}

export async function logoutAffiliateAdmin() {
  await clearAdminSession();
  redirect("/admin/affiliates");
}

async function requireAdmin() {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");
}

async function requireOwner() {
  const actor = await adminSessionActor();
  if (!actor) redirect("/admin/affiliates");
  if (actor.role !== "owner") redirect("/admin/affiliates/overview");
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

const APPLY_PATH = "/admin/affiliates/add-an-affiliate";

function applicationFail(error: unknown): never {
  if (error instanceof ApplicationError) {
    if (error.code === "email") fail("email", APPLY_PATH);
    if (error.code === "invalid") fail("invalid", APPLY_PATH);
    if (error.code === "missing" || error.code === "decided") fail("application", APPLY_PATH);
    fail("unavailable", APPLY_PATH);
  }
  if (error instanceof AffiliateStoreError) fail(error.code, APPLY_PATH);
  console.error("[affiliate] application action failed", error instanceof Error ? error.message : "unknown");
  fail("unavailable", APPLY_PATH);
}

export async function createApplicationLinkAction(formData: FormData) {
  await requireAdmin();
  const input = {
    commissionMode: formData.get("commissionMode"),
    commissionPercent: formData.get("commissionPercent"),
    commissionFixed: formData.get("commissionFixed"),
  };
  try {
    const token = await createApplicationLink(input);
    const commission = applicationCommission(input);
    if (!commission) return { error: "Check the commission, then create the link again." };
    return {
      url: absoluteUrl(`/affiliates/apply?link=${encodeURIComponent(token)}`),
      token,
      commissionLabel: formatCommissionRate(commission),
    };
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "invalid") {
      return { error: "Check the commission, then create the link again." };
    }
    console.error("[affiliate] application link failed", error instanceof Error ? error.message : "unknown");
    return { error: "The link could not be created." };
  }
}

export async function sendApplicationLinkAction(formData: FormData) {
  await requireAdmin();
  const email = normalizeAffiliateEmail(formData.get("email"));
  if (!email) return { error: "Check the email address." };
  if (!affiliateEmailConfigured()) return { error: "Email is not set up. Copy the link instead." };
  const token = formData.get("link");
  try {
    const commission = await readApplicationLink(token);
    if (!commission || typeof token !== "string") return { error: "This link is no longer valid. Create it again." };
    await sendApplicationLinkEmail(email, absoluteUrl(`/affiliates/apply?link=${encodeURIComponent(token)}`), formatCommissionRate(commission));
    return { sent: true as const };
  } catch (error) {
    console.error("[affiliate] application link email failed", error instanceof Error ? error.message : "unknown");
    return { error: "The email could not be sent. Copy the link instead." };
  }
}

export async function approveAffiliateApplicationAction(formData: FormData) {
  await requireAdmin();
  if (!affiliateEmailConfigured()) fail("mail", APPLY_PATH);
  let claimed: Awaited<ReturnType<typeof claimAffiliateApplication>>;
  try {
    claimed = await claimAffiliateApplication(formData.get("email"));
  } catch (error) {
    applicationFail(error);
  }
  let code = "";
  try {
    code = await createAffiliate({
      name: claimed.name,
      email: claimed.email,
      commissionMode: claimed.commissionMode,
      commissionPercent: claimed.commissionPercent,
      commissionFixed: (claimed.commissionFixedCents / 100).toFixed(2),
    });
  } catch (error) {
    if (error instanceof AffiliateStoreError && error.code === "email") {
      code = (await existingAffiliateCode(claimed.email)) ?? "";
    }
    if (!code) {
      try {
        await releaseAffiliateApplication(claimed.email);
      } catch (releaseError) {
        console.error("[affiliate] application release failed", releaseError instanceof Error ? releaseError.message : "unknown");
      }
      applicationFail(error);
    }
  }
  try {
    await finishAffiliateApplication(claimed.email, code);
  } catch (error) {
    console.error("[affiliate] application finish failed", error instanceof Error ? error.message : "unknown");
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

export async function declineAffiliateApplicationAction(formData: FormData) {
  await requireAdmin();
  try {
    await declineAffiliateApplication(formData.get("email"));
  } catch (error) {
    applicationFail(error);
  }
  redirect(`${APPLY_PATH}?declined=1`);
}

const TEAM_PATH = "/admin/affiliates/team";
const ACTIVATE_TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

function teamFail(error: string): never {
  fail(error, TEAM_PATH);
}

function activateFail(token: string, error: string): never {
  const params = new URLSearchParams({ error });
  if (ACTIVATE_TOKEN.test(token)) params.set("token", token);
  redirect(`/admin/affiliates/activate?${params.toString()}`);
}

export async function inviteSubAdminAction(formData: FormData) {
  await requireOwner();
  if (!affiliateEmailConfigured()) teamFail("mail");
  let issued: Awaited<ReturnType<typeof issueSubAdminInvitation>>;
  try {
    issued = await issueSubAdminInvitation(formData.get("email"));
  } catch (error) {
    console.error("[affiliate] sub-admin invite failed", error instanceof Error ? error.message : "unknown");
    teamFail("unavailable");
  }
  if (issued.status === "invalid") teamFail("team-email");
  if (issued.status === "owner") teamFail("team-owner");
  if (issued.status === "exists") teamFail("email");
  if (issued.status !== "sent") teamFail("unavailable");
  try {
    await sendAdminInvitationEmail(issued.email, issued.url);
  } catch (error) {
    console.error("[affiliate] sub-admin invite email failed", error instanceof Error ? error.message : "unknown");
    try {
      await deletePendingSubAdmin(issued.id);
    } catch (deleteError) {
      console.error("[affiliate] sub-admin invite rollback failed", deleteError instanceof Error ? deleteError.message : "unknown");
    }
    teamFail("team-invite");
  }
  redirect(`${TEAM_PATH}?sent=1`);
}

export async function resendSubAdminInvitationAction(formData: FormData) {
  await requireOwner();
  if (!affiliateEmailConfigured()) teamFail("mail");
  let issued: Awaited<ReturnType<typeof resendSubAdminInvitation>>;
  try {
    issued = await resendSubAdminInvitation(String(formData.get("id") ?? ""));
  } catch (error) {
    console.error("[affiliate] sub-admin resend failed", error instanceof Error ? error.message : "unknown");
    teamFail("unavailable");
  }
  if (issued.status === "missing") teamFail("team-missing");
  if (issued.status === "inactive") teamFail("team-inactive");
  if (issued.status === "activated") teamFail("team-activated");
  if (issued.status !== "sent") teamFail("unavailable");
  try {
    await sendAdminInvitationEmail(issued.email, issued.url);
  } catch (error) {
    console.error("[affiliate] sub-admin resend email failed", error instanceof Error ? error.message : "unknown");
    teamFail("team-invite");
  }
  redirect(`${TEAM_PATH}?resent=1`);
}

export async function setSubAdminActiveAction(formData: FormData) {
  await requireOwner();
  const active = String(formData.get("active") ?? "") === "true";
  try {
    const result = await setSubAdminActive(String(formData.get("id") ?? ""), active);
    if (result.status === "missing") teamFail("team-missing");
    if (result.status !== "ok") teamFail("unavailable");
  } catch (error) {
    console.error("[affiliate] sub-admin status failed", error instanceof Error ? error.message : "unknown");
    teamFail("unavailable");
  }
  redirect(`${TEAM_PATH}?updated=1`);
}

export async function removeSubAdminAction(formData: FormData) {
  await requireOwner();
  try {
    const result = await removeSubAdmin(String(formData.get("id") ?? ""));
    if (result.status === "missing") teamFail("team-missing");
    if (result.status !== "ok") teamFail("unavailable");
  } catch (error) {
    console.error("[affiliate] sub-admin remove failed", error instanceof Error ? error.message : "unknown");
    teamFail("unavailable");
  }
  redirect(`${TEAM_PATH}?removed=1`);
}

export async function revokeDashboardSessionAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  const current = await currentAdminSessionId();
  try {
    const result = await revokeDashboardSession(id);
    if (result === "missing") teamFail("team-session");
    if (result !== "ok") teamFail("unavailable");
  } catch (error) {
    console.error("[affiliate] session revoke failed", error instanceof Error ? error.message : "unknown");
    teamFail("unavailable");
  }
  if (current === id) {
    await clearAdminSession();
    redirect("/admin/affiliates");
  }
  redirect(`${TEAM_PATH}?signedout=1`);
}

export async function activateSubAdminAccount(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!adminLoginConfigured() || !affiliateFirebaseConfigured()) activateFail(token, "unavailable");
  let result: Awaited<ReturnType<typeof acceptSubAdminInvitation>>;
  try {
    result = await acceptSubAdminInvitation(token, formData.get("name"), formData.get("email"), String(formData.get("password") ?? ""));
  } catch (error) {
    console.error("[affiliate] sub-admin activation failed", error instanceof Error ? error.message : "unknown");
    activateFail(token, "unavailable");
  }
  if (result.status === "invalid") activateFail(token, "team-invalid");
  if (result.status === "owner") activateFail(token, "team-owner");
  if (result.status === "exists") activateFail(token, "email");
  if (result.status !== "ok") activateFail(token, result.status);
  if (!(await setSubAdminSession(result.id))) activateFail(token, "signin");
  redirect("/admin/affiliates/overview");
}
