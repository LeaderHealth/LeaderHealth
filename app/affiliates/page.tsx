import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInChoice } from "@/components/affiliate/SignInChoice";
import { affiliateEmailConfigured } from "@/lib/affiliate/email";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { loginAffiliatePortal, requestAffiliateLink } from "./actions";
import { currentAffiliate } from "./current";

export const metadata: Metadata = {
  title: "Affiliate sign-in",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "mt-auto inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const panelClass =
  "flex min-h-[22.5rem] w-full max-w-md flex-col gap-5 rounded-[28px] border border-ink/15 bg-white p-8";

const ERRORS: Record<string, string> = {
  denied: "That sign-in didn't work. Check the email and password, or request a new link.",
  limited: "Wait a minute, then request another link.",
  unconfigured: "Affiliate sign-in is unavailable right now.",
  unavailable: "Affiliate sign-in is unavailable right now.",
};

export default async function AffiliatePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  if (await currentAffiliate()) redirect("/affiliates/overview");

  const query = await searchParams;
  const error = query.error ? ERRORS[query.error] : "";
  const sent = query.sent === "1" && !error;

  return (
    <section className="bg-background px-6 pb-20 pt-32 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl">
          Affiliate <span className="font-serif-italic text-accent">portal</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">Sign in to see your tracking link, clicks, paid orders, and commission.</p>
        {error ? (
          <p id="affiliate-portal-error" role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            Check your email for a sign-in link. It expires in 15 minutes and works once.
          </p>
        ) : null}
        <SignInChoice role="affiliate" />
        <Login
          ready={affiliateAdminConfigured() && affiliateFirebaseConfigured()}
          emailLinks={affiliateEmailConfigured()}
          invalid={query.error === "denied" || query.error === "limited"}
        />
      </div>
    </section>
  );
}

function Login({ ready, emailLinks, invalid }: { ready: boolean; emailLinks: boolean; invalid: boolean }) {
  if (!ready) {
    return (
      <p className="mt-6 max-w-xl text-ink">
        Affiliate sign-in needs AFFILIATE_ADMIN_PASSWORD and Firestore configured on the server.
      </p>
    );
  }

  return (
    <div className={`mt-6 flex flex-col gap-6 ${emailLinks ? "lg:flex-row" : ""}`}>
      <form action={loginAffiliatePortal} aria-labelledby="affiliate-password-title" className={panelClass}>
        <h2 id="affiliate-password-title" className="text-2xl text-ink">
          Sign in
        </h2>
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="portal-email">
            Email
          </label>
          <input
            id="portal-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "affiliate-portal-error" : undefined}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="portal-password">
            Password
          </label>
          <input
            id="portal-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "affiliate-portal-error" : undefined}
            className={fieldClass}
          />
        </div>
        <button type="submit" className={buttonClass}>
          Sign in
        </button>
      </form>
      {emailLinks ? (
        <form action={requestAffiliateLink} aria-labelledby="affiliate-link-title" className={panelClass}>
          <h2 id="affiliate-link-title" className="text-2xl text-ink">
            Email me a link
          </h2>
          <p className="text-sm text-taupe">We will send a one-time link to the email on your affiliate account.</p>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="portal-link-email">
              Email
            </label>
            <input
              id="portal-link-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? "affiliate-portal-error" : undefined}
              className={fieldClass}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Send link
          </button>
        </form>
      ) : null}
    </div>
  );
}
