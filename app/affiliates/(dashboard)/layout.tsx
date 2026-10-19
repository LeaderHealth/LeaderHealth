import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { logoutAffiliatePortal } from "../actions";
import { currentAffiliate } from "../current";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/affiliates/tracking-link", label: "Tracking link" },
  { href: "/affiliates/promo-codes", label: "Promo codes" },
  { href: "/affiliates/results", label: "Results" },
  { href: "/affiliates/orders", label: "Orders" },
];

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  if (!(await currentAffiliate())) redirect("/affiliates");

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl sm:text-5xl">
          Affiliate <span className="font-serif-italic text-accent">portal</span>
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Sign in to see your tracking link, promo codes, clicks, paid orders, and commission.
        </p>
        <div className="mt-8 xl:grid xl:grid-cols-[12rem_minmax(0,1fr)] xl:items-start xl:gap-8">
          <AreaNav label="Affiliate portal" items={items}>
            <form action={logoutAffiliatePortal}>
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
      </div>
    </section>
  );
}
