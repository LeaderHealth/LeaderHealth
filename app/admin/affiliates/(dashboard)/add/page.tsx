import type { Metadata } from "next";
import { CommissionOptions } from "@/components/affiliate/CommissionOptions";
import { createAffiliateAction } from "../../actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Add an affiliate",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function AddAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      <form action={createAffiliateAction} className="grid gap-4 rounded-[28px] bg-white p-4 sm:p-8 md:grid-cols-2">
        <h2 className="text-2xl md:col-span-2">Add an affiliate</h2>
        <p className="text-sm text-brown md:col-span-2">
          A unique ID and an optional tracking link are created when you save this account. Each affiliate gets one promo code. Assign an existing Gen Health code and lock it to this affiliate. An invitation email lets them set a password and open the portal.
        </p>
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
        <CommissionOptions />
        <div className="md:col-span-2">
          <button type="submit" className={buttonClass}>
            Create affiliate
          </button>
        </div>
      </form>
    </div>
  );
}
