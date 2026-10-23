import type { Metadata } from "next";
import { ApplicationLinkForm } from "@/components/affiliate/ApplicationLinkForm";
import { PendingApplications } from "@/components/affiliate/PendingApplications";
import { listOpenApplications, type AffiliateApplication } from "@/lib/affiliate/applications";
import { approveAffiliateApplicationAction, createApplicationLinkAction, declineAffiliateApplicationAction, sendApplicationLinkAction } from "../../actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Add an affiliate",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AddAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; declined?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  let applications: AffiliateApplication[] = [];
  let applicationsError = "";
  try {
    applications = await listOpenApplications();
  } catch (caught) {
    console.error("[affiliate] applications failed", caught instanceof Error ? caught.message : "unknown");
    applicationsError = "Applications are unavailable right now.";
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {query.declined === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          That application was declined.
        </p>
      ) : null}
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-4xl">Send an application link</h2>
        <div className="mt-3 max-w-2xl space-y-3 text-sm leading-6 text-taupe">
          <p>Pick a commission and create a link. The rate stays with that link, and you approve each application before an account is created.</p>
          <p>Approval adds a unique ID, an optional tracking link, and one promo code. You can lock an existing Gen Health code to that affiliate.</p>
        </div>
        <ApplicationLinkForm createLink={createApplicationLinkAction} sendLink={sendApplicationLinkAction} />
        <PendingApplications
          applications={applications}
          approveAction={approveAffiliateApplicationAction}
          declineAction={declineAffiliateApplicationAction}
        />
      </section>
      {applicationsError ? <p className="text-ink">{applicationsError}</p> : null}
    </div>
  );
}
