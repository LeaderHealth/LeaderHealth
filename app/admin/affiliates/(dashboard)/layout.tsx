import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { adminIsSignedIn } from "@/lib/affiliate/session";
import { logoutAffiliateAdmin } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/admin/affiliates/add", label: "Add" },
  { href: "/admin/affiliates/accounts", label: "Accounts" },
  { href: "/admin/affiliates/tracking-links", label: "Tracking links" },
  { href: "/admin/affiliates/promo-codes", label: "Promo codes" },
  { href: "/admin/affiliates/orders", label: "Orders" },
];

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-[96rem]">
        <h1 className="text-4xl sm:text-5xl">
          Affiliate <span className="font-serif-italic text-accent">tracking</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Each new affiliate gets a unique ID and a tracking link with utm_source, utm_medium, and utm_campaign. Affiliates sign in at{" "}
          <span className="text-ink">/affiliates</span>. Clicks and paid orders are stored in Firestore. Commission totals
          skip dry-run checkouts.
        </p>
        {affiliateFirebaseConfigured() ? (
          <div className="mt-8 xl:grid xl:grid-cols-[12rem_minmax(0,1fr)] xl:items-start xl:gap-8">
            <AreaNav label="Affiliate admin" items={items}>
              <form action={logoutAffiliateAdmin}>
                <button
                  type="submit"
                  className="text-sm font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Sign out
                </button>
              </form>
            </AreaNav>
            <div className="mt-8 min-w-0 xl:mt-0">{children}</div>
          </div>
        ) : (
          <p className="mt-10 max-w-xl text-ink">
            Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, then reload. For a local emulator, set
            FIREBASE_PROJECT_ID and FIRESTORE_EMULATOR_HOST instead.
          </p>
        )}
      </div>
    </section>
  );
}
