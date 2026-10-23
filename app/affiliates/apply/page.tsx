import type { Metadata } from "next";
import { readApplicationLink } from "@/lib/affiliate/applications";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { submitAffiliateApplication } from "./actions";

export const metadata: Metadata = {
  title: "Apply to be an affiliate",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-white px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const ERRORS: Record<string, string> = {
  invalid: "Check the name and email.",
  taken: "We already have that email.",
  missing: "This application link is not valid. Ask an admin for a new one.",
  unavailable: "Applications are unavailable right now.",
};

export default async function AffiliateApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; link?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ERRORS[query.error] : "";
  const sent = query.sent === "1" && !error;
  const link = typeof query.link === "string" ? query.link : "";
  let commissionLabel = "";
  if (link && !sent) {
    try {
      const commission = await readApplicationLink(link);
      commissionLabel = commission ? formatCommissionRate(commission) : "";
    } catch (caught) {
      console.error("[affiliate] application link read failed", caught instanceof Error ? caught.message : "unknown");
    }
  }

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl">Apply to be an affiliate</h1>
        <p className="mt-4 text-sm text-brown">Enter your name and email. An admin reviews this before your account is created.</p>
        {commissionLabel ? <p className="mt-2 text-sm text-ink">Commission on this link: {commissionLabel}.</p> : null}
        {error ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            Thanks. An admin will review this application.
          </p>
        ) : commissionLabel ? (
          <form action={submitAffiliateApplication} className="mt-6 grid gap-4 rounded-[28px] bg-white p-4 sm:p-8">
            <input type="hidden" name="link" value={link} />
            <label className="block text-sm font-medium text-ink" htmlFor="application-name">
              Name
              <input id="application-name" name="name" required autoComplete="name" placeholder="Your name" className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-ink" htmlFor="application-email">
              Email
              <input
                id="application-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldClass}
              />
            </label>
            <div>
              <button type="submit" className={buttonClass}>
                Submit application
              </button>
            </div>
          </form>
        ) : error ? null : (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {ERRORS.missing}
          </p>
        )}
      </div>
    </section>
  );
}
