import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AreaNav, type AreaNavItem } from "@/components/affiliate/AreaNav";
import { DashboardSections, type DashboardGroup } from "@/components/affiliate/DashboardSections";
import { PortalLegalLinks } from "@/components/affiliate/PortalLegalLinks";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { adminAccountProfile } from "@/lib/affiliate/admin-profile";
import { listOpenApplications } from "@/lib/affiliate/applications";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { logoutAffiliateAdmin } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const overview = "/admin/affiliates/overview";
const accounts = "/admin/affiliates/accounts";
const applications = "/admin/affiliates/add-an-affiliate";
const pendingApplications = "/admin/affiliates/applications";
const promoCodes = "/admin/affiliates/promo-codes";
const trackingLinks = "/admin/affiliates/tracking-links";
const plans = "/admin/affiliates/offers";
const submissions = "/admin/affiliates/posts";
const pending = "/admin/affiliates/posts/pending";
const published = "/admin/affiliates/posts/published";
const campaigns = "/admin/affiliates/campaigns";
const campaignNew = "/admin/affiliates/campaigns/new";
const roi = "/admin/affiliates/roi";
const website = "/admin/affiliates/reporting";
const payouts = "/admin/affiliates/payouts";
const orders = "/admin/affiliates/orders";
const team = "/admin/affiliates/team";
const payments = "/admin/affiliates/settings/payments";
const records = "/admin/affiliates/records";
const compliance = "/admin/affiliates/compliance";

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
  let openApplications = 0;
  if (fullAccess) {
    try {
      openApplications = (await listOpenApplications()).length;
    } catch {
      openApplications = 0;
    }
  }
  const reviewBadge = waitingPosts > 0 ? waitingPosts : undefined;
  const nav: AreaNavItem[] = [
    { href: overview, label: "Overview", active: [overview] },
    {
      href: accounts,
      label: "Affiliates",
      active: [accounts, applications, pendingApplications, "/admin/affiliates/add", promoCodes, trackingLinks],
    },
    { href: submissions, label: "Content", active: [submissions, pending, published, campaigns, campaignNew, plans], badge: reviewBadge },
    { href: roi, label: "Stats", active: [roi, website] },
    { href: payouts, label: "Payouts", active: [payouts, orders] },
    { href: records, label: "Settings", active: [records, compliance, team, payments] },
  ];
  const groups: DashboardGroup[] = [
    {
      paths: [accounts, applications, pendingApplications, "/admin/affiliates/add", promoCodes, trackingLinks],
      items: [
        { href: accounts, label: "Accounts" },
        ...(fullAccess ? [{ href: applications, label: "Applications" }] : []),
        ...(fullAccess ? [{ href: pendingApplications, label: "Pending applications", badge: openApplications > 0 ? openApplications : undefined }] : []),
        { href: promoCodes, label: "Promo codes" },
        { href: trackingLinks, label: "Tracking links" },
      ],
    },
    {
      paths: [submissions, pending, published, campaigns, campaignNew, plans],
      items: [
        { href: submissions, label: "All submissions" },
        { href: pending, label: "Pending approvals", badge: reviewBadge },
        { href: campaigns, label: "Campaigns" },
        { href: published, label: "Published content" },
      ],
    },
    {
      paths: [roi, website],
      items: [
        { href: roi, label: "ROI" },
        { href: website, label: "Website traffic" },
      ],
    },
    {
      paths: [payouts, orders],
      items: [
        { href: payouts, label: "Marketing and lab payouts" },
        { href: orders, label: "Orders" },
      ],
    },
    {
      paths: [records, compliance, team, payments],
      items: [
        ...(fullAccess ? [{ href: team, label: "Team" }] : []),
        ...(fullAccess ? [{ href: payments, label: "Payment rates" }] : []),
        { href: records, label: "Compliance records", active: [records, compliance] },
      ],
    },
  ];
  const profileRole = actor.role === "owner" ? "Main admin" : actor.role === "admin" ? "Admin" : "Sub admin";
  const admin = await adminAccountProfile();

  return (
    <section className="bg-background px-4 pt-32 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+7.5rem)] text-ink sm:px-6 min-[765px]:pb-20">
      <div className="mx-auto max-w-[96rem]">
        <h1>
          <PortalBrand badge="Admin" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          Manage affiliate accounts, content, stats, payouts, and settings.
        </p>
        <PortalLegalLinks className="mt-3" />
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
            <div className="mt-8 flex min-w-0 flex-col xl:mt-0">
              <DashboardSections groups={groups}>{children}</DashboardSections>
            </div>
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
