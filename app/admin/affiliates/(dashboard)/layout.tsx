import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { adminAccountProfile } from "@/lib/affiliate/admin-profile";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { logoutAffiliateAdmin } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/admin/affiliates/overview", label: "Overview" },
  { href: "/admin/affiliates/add-an-affiliate", label: "Add an affiliate" },
  { href: "/admin/affiliates/accounts", label: "Accounts" },
  { href: "/admin/affiliates/posts", label: "Post review" },
  { href: "/admin/affiliates/promo-codes", label: "Promo codes" },
  { href: "/admin/affiliates/orders", label: "Orders" },
  { href: "/admin/affiliates/payouts", label: "Payouts" },
  { href: "/admin/affiliates/records", label: "Records" },
];

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const actor = await adminSessionActor();
  if (!actor) redirect("/admin/affiliates");
  let waitingPosts = 0;
  try {
    const posts = await loadContentSubmissions();
    waitingPosts = posts.filter((post) => post.contentStatus === "submitted").length;
  } catch {
    waitingPosts = 0;
  }
  const fullAccess = adminHasFullAccess(actor);
  const visibleItems = fullAccess ? items : items.filter((item) => item.href !== "/admin/affiliates/add-an-affiliate");
  const withBadge = visibleItems.map((item) => (item.href === "/admin/affiliates/posts" && waitingPosts > 0 ? { ...item, badge: waitingPosts } : item));
  const nav = fullAccess ? [...withBadge, { href: "/admin/affiliates/team", label: "Team" }] : withBadge;
  const profileRole = actor.role === "owner" ? "Main admin" : actor.role === "admin" ? "Admin" : "Sub admin";
  const admin = await adminAccountProfile();

  return (
    <section className="bg-background px-4 pt-32 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+7.5rem)] text-ink sm:px-6 min-[765px]:pb-20">
      <div className="mx-auto max-w-[96rem]">
        <h1>
          <PortalBrand badge="Admin" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Manage affiliate accounts, referral links, promo codes, orders, and payouts.
        </p>
        {affiliateFirebaseConfigured() ? (
          <div className="mt-8 xl:grid xl:grid-cols-[minmax(18rem,max-content)_minmax(0,1fr)] xl:gap-8">
            <div className="z-20 xl:self-stretch">
              <div className="flex flex-col gap-4 xl:sticky xl:top-28">
                {admin ? (
                  <ProfileCard
                    name={admin.name}
                    email={admin.email}
                    role={profileRole}
                    avatarUrl={admin.avatarUrl}
                    signOut={logoutAffiliateAdmin}
                  />
                ) : null}
                <AreaNav label="Affiliate admin" items={nav} />
              </div>
            </div>
            <div className="mt-8 flex min-w-0 flex-col xl:mt-0">{children}</div>
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
