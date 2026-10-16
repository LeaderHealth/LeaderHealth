import type { Metadata } from "next";
import { formatPrice } from "@/lib/genhealth/types";
import { affiliateEmailConfigured } from "@/lib/affiliate/email";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { absoluteUrl } from "@/lib/seo/schema";
import { affiliateAdminConfigured, portalAffiliateCode } from "@/lib/affiliate/session";
import {
  AffiliateStoreError,
  getAffiliate,
  loadAffiliateConversions,
  type AffiliateSummary,
  type ConversionSummary,
} from "@/lib/affiliate/store";
import { SignInChoice } from "@/components/affiliate/SignInChoice";
import { loginAffiliatePortal, logoutAffiliatePortal, requestAffiliateLink } from "./actions";

export const metadata: Metadata = {
  title: "Affiliate sign-in",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const ERRORS: Record<string, string> = {
  denied: "That sign-in didn't work. Check the email and password, or request a new link.",
  limited: "Wait a minute, then request another link.",
  unconfigured: "Affiliate sign-in is unavailable right now.",
  unavailable: "Affiliate sign-in is unavailable right now.",
};

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AffiliatePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ERRORS[query.error] : "";
  const sent = query.sent === "1" && !error;
  const code = await portalAffiliateCode();
  let affiliate: AffiliateSummary | null = null;
  if (code && affiliateFirebaseConfigured()) {
    try {
      affiliate = await getAffiliate(code);
    } catch (error) {
      console.error("[affiliate] portal load failed", error instanceof Error ? error.message : "unknown");
    }
  }

  return (
    <section className="bg-background px-6 pb-20 pt-32 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl">
          Affiliate <span className="font-serif-italic text-accent">portal</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Sign in to see clicks, paid orders, and commission for your referral link.
        </p>
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
        {affiliate?.active ? (
          <Dashboard affiliate={affiliate} />
        ) : (
          <>
            <SignInChoice role="affiliate" />
            <Login
              ready={affiliateAdminConfigured() && affiliateFirebaseConfigured()}
              emailLinks={affiliateEmailConfigured()}
              invalid={query.error === "denied" || query.error === "limited"}
            />
          </>
        )}
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
    <div className="mt-6 grid max-w-3xl gap-6 md:grid-cols-2">
      <form
        action={loginAffiliatePortal}
        aria-labelledby="affiliate-password-title"
        className="space-y-5 rounded-[28px] border border-ink/15 bg-white p-8"
      >
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
        <form
          action={requestAffiliateLink}
          aria-labelledby="affiliate-link-title"
          className="space-y-5 rounded-[28px] border border-ink/15 bg-white p-8"
        >
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

async function Dashboard({ affiliate }: { affiliate: AffiliateSummary }) {
  let conversions: ConversionSummary[] = [];
  let loadError = "";
  try {
    conversions = await loadAffiliateConversions(affiliate.code);
  } catch (error) {
    loadError = error instanceof AffiliateStoreError ? error.message : "Could not load your orders.";
  }

  const referralLink = absoluteUrl(`/?ref=${affiliate.code}`);

  return (
    <div className="mt-10 space-y-10">
      <form action={logoutAffiliatePortal}>
        <button
          type="submit"
          className="text-sm font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sign out
        </button>
      </form>

      <div className="rounded-[28px] bg-white p-8">
        <h2 className="text-2xl">{affiliate.name}</h2>
        <p className="mt-2 text-brown">
          Code {affiliate.code} · {affiliate.commissionPercent}% commission
        </p>
        <label className="mt-6 block text-sm font-medium text-ink" htmlFor="referral-link">
          Referral link
          <input id="referral-link" readOnly value={referralLink} className={fieldClass} />
        </label>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[28px] bg-white p-6">
          <dt className="text-sm text-brown">Clicks</dt>
          <dd className="mt-2 text-3xl">{affiliate.clickCount}</dd>
        </div>
        <div className="rounded-[28px] bg-white p-6">
          <dt className="text-sm text-brown">Paid orders</dt>
          <dd className="mt-2 text-3xl">{affiliate.paidConversionCount}</dd>
        </div>
        <div className="rounded-[28px] bg-white p-6">
          <dt className="text-sm text-brown">Commission</dt>
          <dd className="mt-2 text-3xl">{formatCents(affiliate.commissionCents)}</dd>
        </div>
      </dl>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      {loadError ? null : <div className="overflow-x-auto rounded-[28px] bg-white">
        <h2 id="portal-orders-title" className="px-4 pt-4 text-2xl">
          Recent orders
        </h2>
        <table className="w-full min-w-[640px] text-left text-sm" aria-labelledby="portal-orders-title">
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-4 py-3 font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-brown">
                  No attributed orders yet.
                </td>
              </tr>
            ) : (
              conversions.map((conversion) => (
                <tr key={conversion.orderId} className="border-t border-rose/60">
                  <td className="px-4 py-3">{formatWhen(conversion.createdAt)}</td>
                  <td className="px-4 py-3">
                    {conversion.orderId}
                    {conversion.dryRun ? <span className="ml-2 text-brown">Dry run</span> : null}
                  </td>
                  <td className="px-4 py-3">{conversion.productName}</td>
                  <td className="px-4 py-3">{conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}</td>
                  <td className="px-4 py-3">{formatCents(conversion.commissionCents)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
