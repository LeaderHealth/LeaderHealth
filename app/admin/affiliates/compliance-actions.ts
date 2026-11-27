"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAccountEmail, adminIsSignedIn, adminSessionActor } from "@/lib/affiliate/session";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { formatReportMonth, networkLabel } from "@/lib/affiliate/marketing";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { syncAffiliateSocialReports } from "@/lib/affiliate/social-sync";
import { SocialError } from "@/lib/affiliate/social-store";

const REPORTS = "/admin/affiliates/reporting";

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

function refreshReports() {
  revalidatePath(REPORTS);
  revalidatePath("/affiliates/stats");
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
