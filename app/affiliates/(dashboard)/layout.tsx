import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { logoutAffiliatePortal } from "../actions";
import { currentAffiliate } from "../current";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/affiliates/overview", label: "Overview" },
  { href: "/affiliates/tracking-link", label: "Referral link" },
  { href: "/affiliates/stats", label: "Stats" },
  { href: "/affiliates/orders", label: "Orders" },
  { href: "/affiliates/payouts", label: "Payouts" },
];

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1>
          <PortalBrand badge="Affiliates" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          See your referral link, promo code, orders, earnings, and payouts.
        </p>
        <div className="mt-8 xl:grid xl:grid-cols-[minmax(18rem,max-content)_minmax(0,1fr)] xl:items-start xl:gap-8">
          <div className="z-20 flex flex-col gap-4 xl:sticky xl:top-28 xl:self-start">
            <ProfileCard
              name={affiliate.name}
              email={affiliate.email}
              role="Affiliate"
              avatarUrl={affiliate.avatarUrl}
              signOut={logoutAffiliatePortal}
            />
            <AreaNav label="Affiliate portal" items={items} />
          </div>
          <div className="mt-8 min-w-0 xl:mt-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
