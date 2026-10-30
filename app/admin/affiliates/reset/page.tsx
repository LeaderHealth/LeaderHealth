import type { Metadata } from "next";
import Link from "next/link";
import { PasswordInput } from "@/components/affiliate/PasswordInput";
import { readSubAdminPasswordReset } from "@/lib/affiliate/admins";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { resetSubAdminPassword } from "../actions";

export const metadata: Metadata = {
  title: "Reset your admin password",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

const PROBLEMS: Record<string, string> = {
  expired: "This reset link has expired. Request a new one from the admin sign-in page.",
  missing: "This reset link is not valid. Request a new one from the admin sign-in page.",
  inactive: "This admin account is not active.",
  unavailable: "Password reset is unavailable right now.",
};

const buttonClass =
  "mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function ResetSubAdminPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" && TOKEN.test(query.token) ? query.token : "";
  let status = "unavailable";
  if (affiliateAdminConfigured() && affiliateFirebaseConfigured()) {
    try {
      status = await readSubAdminPasswordReset(token || null);
    } catch (error) {
      console.error("[affiliate] admin password reset read failed", error instanceof Error ? error.message : "unknown");
      status = "unavailable";
    }
  }

  const weak = status === "valid" && query.error === "weak";
  const saved = query.error === "signin";
  const problem = status === "valid" || saved ? "" : (PROBLEMS[status] ?? PROBLEMS.missing);

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl">Choose a new password</h1>
        <p className="mt-4 text-sm text-brown">This link works once. You can still sign in with an email link from the admin sign-in page.</p>
        {weak ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            Use a password of 8–128 characters.
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            Your password is saved. Sign in on the admin page to open the dashboard.
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {problem}
          </p>
        ) : null}
        {status === "valid" ? (
          <form action={resetSubAdminPassword} className="mt-6 rounded-[28px] bg-white p-4 sm:p-8">
            <input type="hidden" name="token" value={token} />
            <label className="block text-sm font-medium text-ink" htmlFor="admin-reset-password">
              New password
              <PasswordInput
                id="admin-reset-password"
                name="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="8 or more characters"
              />
            </label>
            <button type="submit" className={buttonClass}>
              Save password and continue
            </button>
          </form>
        ) : null}
        <p className="mt-6 text-sm text-brown">
          <Link href="/admin/affiliates" className="font-medium text-ink underline">
            Back to admin sign-in
          </Link>
        </p>
      </div>
    </section>
  );
}
