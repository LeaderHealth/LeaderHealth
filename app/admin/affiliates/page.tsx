import type { Metadata } from "next";
import { formatPrice } from "@/lib/genhealth/types";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { adminIsSignedIn, affiliateAdminConfigured } from "@/lib/affiliate/session";
import { AffiliateStoreError, loadAffiliateDashboard, type AffiliateSummary, type ConversionSummary } from "@/lib/affiliate/store";
import { SignInChoice } from "@/components/affiliate/SignInChoice";
import {
  createAffiliateAction,
  loginAffiliateAdmin,
  logoutAffiliateAdmin,
  setAffiliateActiveAction,
  setAffiliatePasswordAction,
} from "./actions";

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

const ERRORS: Record<string, string> = {
  password: "That email or password is incorrect.",
  unconfigured: "Set AFFILIATE_ADMIN_EMAIL and AFFILIATE_ADMIN_PASSWORD before signing in.",
  invalid: "Check the code, name, email, and commission. Codes use 3–24 letters, numbers, or hyphens. Passwords need 8–128 characters.",
  exists: "That code is already in use.",
  email: "That email is already in use.",
  weak: "Passwords need 8–128 characters.",
  missing: "That affiliate code was not found.",
  unavailable: "Affiliate tracking is unavailable right now.",
};

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AffiliatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ERRORS[query.error] : "";
  const signedIn = await adminIsSignedIn();

  return (
    <section className="bg-background px-6 pb-20 pt-32 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl">
          Affiliate <span className="font-serif-italic text-accent">tracking</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Share links like <span className="text-ink">/?ref=code</span>. Affiliates sign in at{" "}
          <span className="text-ink">/affiliates</span>. Clicks and paid orders are stored in Firestore. Commission totals
          skip dry-run checkouts.
        </p>
        {error ? (
          <p id="affiliate-admin-error" role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        {signedIn ? (
          <Dashboard />
        ) : (
          <>
            <SignInChoice role="admin" />
            <Login configured={affiliateAdminConfigured()} invalid={query.error === "password"} />
          </>
        )}
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

async function Dashboard() {
  if (!affiliateFirebaseConfigured()) {
    return (
      <p className="mt-10 max-w-xl text-ink">
        Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, then reload. For a local emulator, set
        FIREBASE_PROJECT_ID and FIRESTORE_EMULATOR_HOST instead.
      </p>
    );
  }

  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  try {
    const dashboard = await loadAffiliateDashboard();
    affiliates = dashboard.affiliates;
    conversions = dashboard.conversions;
  } catch (error) {
    const message = error instanceof AffiliateStoreError ? error.message : "Could not load affiliate records.";
    return <p className="mt-10 text-ink">{message}</p>;
  }

  return (
    <div className="mt-10 space-y-10">
      <form action={logoutAffiliateAdmin}>
        <button
          type="submit"
          className="text-sm font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sign out
        </button>
      </form>

      <form action={createAffiliateAction} className="grid gap-4 rounded-[28px] bg-white p-8 md:grid-cols-2">
        <h2 className="md:col-span-2 text-2xl">Add an affiliate</h2>
        <label className="block text-sm font-medium text-ink" htmlFor="affiliate-code">
          Code
          <input id="affiliate-code" name="code" required autoComplete="off" placeholder="clinic-partner" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-ink" htmlFor="affiliate-name">
          Name
          <input id="affiliate-name" name="name" required autoComplete="name" placeholder="Clinic Partner" className={fieldClass} />
        </label>
        <label className="block text-sm font-medium text-ink" htmlFor="affiliate-email">
          Email
          <input
            id="affiliate-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="partner@example.com"
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-ink" htmlFor="affiliate-commission">
          Commission percent
          <input
            id="affiliate-commission"
            name="commissionPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={10}
            required
            inputMode="decimal"
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-medium text-ink md:col-span-2" htmlFor="affiliate-password">
          Portal password
          <input
            id="affiliate-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="Optional, 8 or more characters"
            className={fieldClass}
          />
        </label>
        <p className="md:col-span-2 text-sm text-brown">
          Leave the password blank if this affiliate will sign in from an email link only.
        </p>
        <div className="md:col-span-2">
          <button type="submit" className={buttonClass}>
            Create code
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-[28px] bg-white">
        <table className="w-full min-w-[960px] text-left text-sm" aria-label="Affiliates">
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Code</th>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="px-4 py-3 font-medium">Rate</th>
              <th scope="col" className="px-4 py-3 font-medium">Clicks</th>
              <th scope="col" className="px-4 py-3 font-medium">Paid orders</th>
              <th scope="col" className="px-4 py-3 font-medium">Commission</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Password</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-brown">
                  No affiliates yet.
                </td>
              </tr>
            ) : (
              affiliates.map((affiliate) => (
                <tr key={affiliate.code} className="border-t border-rose/60">
                  <td className="px-4 py-3 font-medium">{affiliate.code}</td>
                  <td className="px-4 py-3">
                    <div>{affiliate.name}</div>
                    <div className="text-brown">{affiliate.email}</div>
                  </td>
                  <td className="px-4 py-3">{affiliate.commissionPercent}%</td>
                  <td className="px-4 py-3">{affiliate.clickCount}</td>
                  <td className="px-4 py-3">{affiliate.paidConversionCount}</td>
                  <td className="px-4 py-3">{formatCents(affiliate.commissionCents)}</td>
                  <td className="px-4 py-3">
                    <form action={setAffiliateActiveAction} className="flex items-center gap-3">
                      <input type="hidden" name="code" value={affiliate.code} />
                      <input type="hidden" name="active" value={affiliate.active ? "false" : "true"} />
                      <span>{affiliate.active ? "Active" : "Off"}</span>
                      <button
                        type="submit"
                        aria-label={affiliate.active ? `Deactivate ${affiliate.code}` : `Activate ${affiliate.code}`}
                        className="inline-flex min-h-11 items-center rounded-full border border-ink/40 px-3 text-xs font-medium hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        {affiliate.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={setAffiliatePasswordAction} className="flex items-center gap-2">
                      <input type="hidden" name="code" value={affiliate.code} />
                      <label className="sr-only" htmlFor={`portal-password-${affiliate.code}`}>
                        Portal password for {affiliate.code}
                      </label>
                      <input
                        id={`portal-password-${affiliate.code}`}
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        placeholder="8+ characters"
                        className="min-h-11 w-36 rounded-full border border-ink/40 bg-background px-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-full border border-ink/40 px-3 text-xs font-medium hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Set
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-[28px] bg-white">
        <h2 id="recent-orders-title" className="px-4 pt-4 text-2xl">
          Recent orders
        </h2>
        <table className="w-full min-w-[720px] text-left text-sm" aria-labelledby="recent-orders-title">
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Code</th>
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Product</th>
              <th scope="col" className="px-4 py-3 font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-brown">
                  No attributed orders yet.
                </td>
              </tr>
            ) : (
              conversions.map((conversion) => (
                <tr key={conversion.orderId} className="border-t border-rose/60">
                  <td className="px-4 py-3">{formatWhen(conversion.createdAt)}</td>
                  <td className="px-4 py-3">{conversion.code}</td>
                  <td className="px-4 py-3">
                    {conversion.orderId}
                    {conversion.dryRun ? <span className="ml-2 text-brown">Dry run</span> : null}
                  </td>
                  <td className="px-4 py-3">{conversion.productName}</td>
                  <td className="px-4 py-3">
                    {conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}
                  </td>
                  <td className="px-4 py-3">{formatCents(conversion.commissionCents)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
