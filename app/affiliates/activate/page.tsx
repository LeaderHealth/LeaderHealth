import type { Metadata } from "next";
import Link from "next/link";
import { PasswordInput } from "@/components/affiliate/PasswordInput";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { readAffiliateInvitation, type InvitationState } from "@/lib/affiliate/store";
import { activateAffiliateAccount } from "../actions";

export const metadata: Metadata = {
  title: "Activate your affiliate account",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

const PROBLEMS: Record<Exclude<InvitationState, "valid">, string> = {
  expired: "This invitation has expired. Ask an admin to send a new one.",
  reused: "This invitation has already been used.",
  missing: "This invitation link is not valid. Ask an admin to send a new one.",
  inactive: "This affiliate account is not active.",
  unavailable: "Affiliate activation is unavailable right now.",
};

const buttonClass =
  "mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function ActivateAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" && TOKEN.test(query.token) ? query.token : "";
  let status: InvitationState = "unavailable";
  if (affiliateAdminConfigured() && affiliateFirebaseConfigured()) {
    try {
      status = await readAffiliateInvitation(token || null);
    } catch (error) {
      console.error("[affiliate] invitation read failed", error instanceof Error ? error.message : "unknown");
      status = "unavailable";
    }
  }

  const weak = status === "valid" && query.error === "weak";
  const saved = query.error === "signin";
  const problem = status === "valid" || saved ? "" : PROBLEMS[status];

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl">Activate your account</h1>
        <p className="mt-4 text-sm text-brown">Set a portal password to open your affiliate dashboard. This link works once.</p>
        {weak ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            Use a password of 8–128 characters.
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            Your password is saved. Sign in to open your dashboard.
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {problem}
          </p>
        ) : null}
        {status === "valid" ? (
          <form action={activateAffiliateAccount} className="mt-6 rounded-[28px] bg-white p-4 sm:p-8">
            <input type="hidden" name="token" value={token} />
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
            <Link href="/affiliates" className="font-medium text-ink underline">
              Sign in
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
