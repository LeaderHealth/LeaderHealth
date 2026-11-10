"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAccountEmail, adminIsSignedIn, adminSessionActor } from "@/lib/affiliate/session";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import {
  ComplianceFlagError,
  openComplianceFlag,
  requestFlagCorrection,
  resolveComplianceFlag,
} from "@/lib/affiliate/compliance-flags";
import { flagReasonLabel } from "@/lib/affiliate/compliance-rules";
import { DisclosureError, acceptDisclosureProof } from "@/lib/affiliate/disclosures";
import { formatReportMonth, networkLabel } from "@/lib/affiliate/marketing";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { syncAffiliateSocialReports } from "@/lib/affiliate/social-sync";
import { SocialError } from "@/lib/affiliate/social-store";

const REPORTS = "/admin/affiliates/reporting";
const COMPLIANCE = "/admin/affiliates/compliance";
const ACCOUNTS = "/admin/affiliates/accounts";

async function requireAdmin() {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");
}

async function actor() {
  const session = await adminSessionActor();
  if (session && "id" in session) return session.id;
  return adminAccountEmail() ?? "owner";
}

function reportFail(error: string): never {
  redirect(`${REPORTS}?error=${encodeURIComponent(error)}`);
}

function complianceBase(formData: FormData) {
  return formData.get("from") === "accounts" ? ACCOUNTS : COMPLIANCE;
}

function complianceFail(formData: FormData, error: string): never {
  redirect(`${complianceBase(formData)}?error=${encodeURIComponent(error)}`);
}

function complianceDone(formData: FormData, notice: string, hash = ""): never {
  refreshCompliance();
  const base = complianceBase(formData);
  redirect(`${base}?notice=${encodeURIComponent(notice)}${base === COMPLIANCE ? hash : ""}`);
}

function refreshReports() {
  revalidatePath(REPORTS);
  revalidatePath("/affiliates/stats");
}

function refreshCompliance() {
  revalidatePath(COMPLIANCE);
  revalidatePath(ACCOUNTS);
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/affiliates/compliance");
  revalidatePath("/affiliates/tracking-link");
  revalidatePath("/affiliates/posts");
}

export async function syncMarketingReportsAction(formData: FormData) {
  await requireAdmin();
  const code = normalizeAffiliateCode(formData.get("code"));
  if (!code) reportFail("affiliate");
  let result;
  try {
    result = await syncAffiliateSocialReports(code);
  } catch (error) {
    if (error instanceof SocialError && error.code === "unconnected") reportFail("sync-none");
    if (error instanceof SocialError && error.code === "invalid") reportFail("report-missing");
    console.error("[affiliate] marketing sync failed", error instanceof SocialError ? error.code : "unavailable");
    reportFail("sync");
  }
  const who = await actor();
  for (const account of result.accounts) {
    const months = account.months.map((month) => formatReportMonth(month)).join(", ");
    await noteComplianceEvent({
      actor: who,
      action: "marketing-report-saved",
      code,
      detail: `${networkLabel(account.network)} · ${account.accountName}: ${months}. Reporting only.`,
    });
  }
  refreshReports();
  redirect(`${REPORTS}?notice=${result.failed.length > 0 ? "partial" : "synced"}`);
}

export async function openComplianceFlagAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const reason = formData.get("reason");
  const note = String(formData.get("note") ?? "");
  let id = "";
  try {
    id = await openComplianceFlag({ code, reason, note });
  } catch (error) {
    if (error instanceof ComplianceFlagError && (error.code === "invalid" || error.code === "missing")) complianceFail(formData, "flag");
    console.error("[affiliate] compliance flag failed", error instanceof Error ? error.message : "unknown");
    complianceFail(formData, "unavailable");
  }
  const label = flagReasonLabel(reason === "missing_disclosure" || reason === "misleading_claim" || reason === "unauthorized_content" ? reason : "missing_disclosure");
  await noteComplianceEvent({
    actor: await actor(),
    action: "flag-opened",
    code,
    detail: `${label}. ${note}`.trim(),
  });
  complianceDone(formData, "flagged", `#${id}`);
}

export async function requestFlagCorrectionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let flag;
  try {
    flag = await requestFlagCorrection(id);
  } catch (error) {
    if (error instanceof ComplianceFlagError && error.code === "status") complianceFail(formData, "flag-status");
    if (error instanceof ComplianceFlagError && error.code === "missing") complianceFail(formData, "flag");
    console.error("[affiliate] correction request failed", error instanceof Error ? error.message : "unknown");
    complianceFail(formData, "unavailable");
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "correction-requested",
    code: flag.code,
    detail: flag.note,
  });
  complianceDone(formData, "correction");
}

export async function resolveComplianceFlagAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let flag;
  try {
    flag = await resolveComplianceFlag(id);
  } catch (error) {
    if (error instanceof ComplianceFlagError && error.code === "status") complianceFail(formData, "flag-status");
    if (error instanceof ComplianceFlagError && error.code === "missing") complianceFail(formData, "flag");
    console.error("[affiliate] flag resolve failed", error instanceof Error ? error.message : "unknown");
    complianceFail(formData, "unavailable");
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "flag-resolved",
    code: flag.code,
    detail: flag.note,
  });
  complianceDone(formData, "resolved");
}

export async function acceptDisclosureProofAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  let proof;
  try {
    proof = await acceptDisclosureProof(id);
  } catch (error) {
    if (error instanceof DisclosureError && error.code === "missing") complianceFail(formData, "proof");
    console.error("[affiliate] disclosure proof accept failed", error instanceof Error ? error.message : "unknown");
    complianceFail(formData, "unavailable");
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "disclosure-proof-accepted",
    code: proof.code,
    detail: proof.postUrl ?? "Screenshot accepted.",
  });
  complianceDone(formData, "accepted");
}

export async function requestProofCorrectionAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const note = String(formData.get("note") ?? "");
  try {
    await openComplianceFlag({ code, reason: "missing_disclosure", note, status: "correction_requested" });
  } catch (error) {
    if (error instanceof ComplianceFlagError && (error.code === "invalid" || error.code === "missing")) complianceFail(formData, "flag");
    console.error("[affiliate] proof correction failed", error instanceof Error ? error.message : "unknown");
    complianceFail(formData, "unavailable");
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "correction-requested",
    code,
    detail: note,
  });
  complianceDone(formData, "correction");
}
