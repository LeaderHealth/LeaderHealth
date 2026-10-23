import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { adminAccountProfile } from "@/lib/affiliate/admin-profile";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { adminSessionActor } from "@/lib/affiliate/session";
import { logoutAffiliateAdmin } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/admin/affiliates/overview", label: "Overview" },
  { href: "/admin/affiliates/add-an-affiliate", label: "Add an affiliate" },
  { href: "/admin/affiliates/accounts", label: "Accounts" },
  { href: "/admin/affiliates/tracking-links", label: "Referral links" },
  { href: "/admin/affiliates/promo-codes", label: "Promo codes" },
  { href: "/admin/affiliates/orders", label: "Orders" },
  { href: "/admin/affiliates/payouts", label: "Payouts" },
];

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const actor = await adminSessionActor();
  if (!actor) redirect("/admin/affiliates");
  const nav = actor.role === "owner" ? [...items, { href: "/admin/affiliates/team", label: "Team" }] : items;
  const admin = await adminAccountProfile();

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-[96rem]">
        <h1>
          <PortalBrand badge="Admin" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Manage affiliate accounts, referral links, promo codes, orders, and payouts.
        </p>
        {affiliateFirebaseConfigured() ? (
          <div className="mt-8 xl:grid xl:grid-cols-[minmax(18rem,max-content)_minmax(0,1fr)] xl:items-start xl:gap-8">
            <div className="z-20 flex flex-col gap-4 xl:sticky xl:top-28 xl:self-start">
              {admin ? (
                <ProfileCard
                  name={admin.name}
                  email={admin.email}
                  role="Admin"
                  avatarUrl={admin.avatarUrl}
                  signOut={logoutAffiliateAdmin}
                />
              ) : null}
              <AreaNav label="Affiliate admin" items={nav} />
            </div>
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
