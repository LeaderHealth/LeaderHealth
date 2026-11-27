import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PendingApplications } from "@/components/affiliate/PendingApplications";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { listOpenApplications, type AffiliateApplication } from "@/lib/affiliate/applications";
import { reportHandledAffiliateError } from "@/lib/affiliate/report";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { approveAffiliateApplicationAction, declineAffiliateApplicationAction } from "../../actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Pending applications",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PendingApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; declined?: string }>;
}) {
  const actor = await adminSessionActor();
  if (!actor || !adminHasFullAccess(actor)) redirect("/admin/affiliates/overview");
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  let applications: AffiliateApplication[] = [];
  let applicationsError = "";
  try {
    applications = await listOpenApplications();
  } catch (caught) {
    reportHandledAffiliateError("[affiliate] applications failed", caught);
    applicationsError = "Applications are unavailable right now.";
  }

  return (
    <div className="space-y-6">
      {error ? <TimedNotice message={error} tone="warn" query="error" /> : null}
      {query.declined === "1" ? <TimedNotice message="That application was declined." tone="plain" query="declined" /> : null}
      <section className="rounded-[28px] bg-white pb-4">
        <h2 id="pending-applications-title" className="px-4 pt-6 text-2xl">Pending applications</h2>
        <p className="px-4 pt-2 text-sm text-brown">
          {applicationsError
            ? applicationsError
            : `${applications.length} waiting. Approve creates the account and sends the invitation. Decline leaves no account.`}
        </p>
        {applicationsError ? null : (
          <PendingApplications applications={applications} approveAction={approveAffiliateApplicationAction} declineAction={declineAffiliateApplicationAction} />
        )}
      </section>
    </div>
  );
}
