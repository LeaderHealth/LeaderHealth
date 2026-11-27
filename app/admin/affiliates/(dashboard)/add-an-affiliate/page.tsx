import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationLinkForm } from "@/components/affiliate/ApplicationLinkForm";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { createApplicationLinkAction, sendApplicationLinkAction } from "../../actions";
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
  const actor = await adminSessionActor();
  if (!actor || !adminHasFullAccess(actor)) redirect("/admin/affiliates/overview");
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";

  return (
    <div className="space-y-6">
      {error ? <TimedNotice message={error} tone="warn" query="error" /> : null}
      {query.declined === "1" ? <TimedNotice message="That application was declined." tone="plain" query="declined" /> : null}
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-4xl">Send an application link</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-taupe">
          Choose how this affiliate gets paid, then create the link. You&apos;ll approve them before their account is made.
        </p>
        <ApplicationLinkForm createLink={createApplicationLinkAction} sendLink={sendApplicationLinkAction} />
      </section>
    </div>
  );
}
