import type { Metadata } from "next";
import Link from "next/link";
import { PasswordInput } from "@/components/affiliate/PasswordInput";
import { readSubAdminInvitation, type SubAdminInvitationState } from "@/lib/affiliate/admins";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { activateSubAdminAccount } from "../actions";
import { ADMIN_ERRORS } from "../messages";

export const metadata: Metadata = {
  title: "Activate your admin account",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

const PROBLEMS: Record<Exclude<SubAdminInvitationState, "valid">, string> = {
  expired: "This invitation has expired. Ask the main admin to send a new one.",
  reused: "This invitation has already been used.",
  missing: "This invitation link is not valid. Ask the main admin to send a new one.",
  inactive: "This admin account is not active.",
  unavailable: "Admin activation is unavailable right now.",
};

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function ActivateSubAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" && TOKEN.test(query.token) ? query.token : "";
  let status: SubAdminInvitationState = "unavailable";
  if (affiliateAdminConfigured() && affiliateFirebaseConfigured()) {
    try {
      status = await readSubAdminInvitation(token || null);
    } catch (error) {
      console.error("[affiliate] sub-admin invitation read failed", error instanceof Error ? error.message : "unknown");
      status = "unavailable";
    }
  }

  const saved = query.error === "signin";
  const formError = status === "valid" && query.error && query.error !== "signin" ? (ADMIN_ERRORS[query.error] ?? "") : "";
  const problem = status === "valid" || saved ? "" : PROBLEMS[status];

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl">Activate your account</h1>
        <p className="mt-4 text-sm text-brown">Choose the name, email, and password you will use to sign in. This link works once.</p>
        {formError ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {formError}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            Your password is saved. Sign in to open the dashboard.
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {problem}
          </p>
        ) : null}
        {status === "valid" ? (
          <form action={activateSubAdminAccount} className="mt-6 space-y-4 rounded-[28px] bg-white p-4 sm:p-8">
            <input type="hidden" name="token" value={token} />
            <label className="block text-sm font-medium text-ink" htmlFor="activate-name">
              Name
              <input id="activate-name" name="name" required maxLength={80} autoComplete="name" className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-ink" htmlFor="activate-email">
              Email
              <input id="activate-email" name="email" type="email" required maxLength={120} autoComplete="email" className={fieldClass} />
            </label>
            <label className="block text-sm font-medium text-ink" htmlFor="activate-password">
              Password
              <PasswordInput
                id="activate-password"
                name="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="8 or more characters"
              />
            </label>
            <button type="submit" className={buttonClass}>
              Activate and continue
            </button>
          </form>
        ) : null}
        {status === "reused" || saved ? (
          <p className="mt-6 text-sm text-brown">
            <Link href="/admin/affiliates" className="font-medium text-ink underline">
              Sign in
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
