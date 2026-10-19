import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInChoice } from "@/components/affiliate/SignInChoice";
import { affiliateAdminConfigured, adminIsSignedIn } from "@/lib/affiliate/session";
import { loginAffiliateAdmin } from "./actions";
import { ADMIN_ERRORS } from "./messages";

export const metadata: Metadata = {
  title: "Affiliates",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function AffiliatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await adminIsSignedIn()) redirect("/admin/affiliates/accounts");

  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";

  return (
    <section className="bg-background px-6 pb-20 pt-32 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl">
          Affiliate <span className="font-serif-italic text-accent">tracking</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Each new affiliate gets a unique ID and a tracking link with utm_source, utm_medium, and utm_campaign. Affiliates sign in at{" "}
          <span className="text-ink">/affiliates</span>. Clicks and paid orders are stored in Firestore. Commission totals
          skip dry-run checkouts.
        </p>
        {error ? (
          <p id="affiliate-admin-error" role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        <SignInChoice role="admin" />
        <Login configured={affiliateAdminConfigured()} invalid={query.error === "password"} />
      </div>
    </section>
  );
}

function Login({ configured, invalid }: { configured: boolean; invalid: boolean }) {
  if (!configured) {
    return (
      <p className="mt-6 max-w-xl text-ink">
        Set <span className="font-medium">AFFILIATE_ADMIN_EMAIL</span> and{" "}
        <span className="font-medium">AFFILIATE_ADMIN_PASSWORD</span> in the server environment, then reload this page.
      </p>
    );
  }

  return (
    <form
      action={loginAffiliateAdmin}
      aria-labelledby="affiliate-signin-title"
      className="mt-6 max-w-md space-y-5 rounded-[28px] border border-ink/15 bg-white p-8"
    >
      <h2 id="affiliate-signin-title" className="text-2xl text-ink">
        Sign in
      </h2>
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "affiliate-admin-error" : undefined}
          className={fieldClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "affiliate-admin-error" : undefined}
          className={fieldClass}
        />
      </div>
      <button type="submit" className={buttonClass}>
        Sign in
      </button>
    </form>
  );
}
