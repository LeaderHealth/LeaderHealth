import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApprovedPostsNotice } from "@/components/affiliate/ApprovedPostsNotice";
import { PortalLegalLinks } from "@/components/affiliate/PortalLegalLinks";
import { AreaNav, type AreaNavItem } from "@/components/affiliate/AreaNav";
import { DashboardSections, type DashboardGroup } from "@/components/affiliate/DashboardSections";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { remindManualReports } from "@/lib/affiliate/manual-report";
import { newCampaignInvitations } from "@/lib/affiliate/affiliate-campaigns";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { readSocialOnboarding } from "@/lib/affiliate/social-onboarding";
import { changeAffiliatePassword, logoutAffiliatePortal } from "../actions";
import { currentAffiliate } from "../current";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const overview = "/affiliates/overview";
const plans = "/affiliates/offers";
const createPost = "/affiliates/posts/new";
const submissions = "/affiliates/posts";
const myCampaigns = "/affiliates/campaigns";
const stats = "/affiliates/stats";
const payments = "/affiliates/payouts";
const orders = "/affiliates/orders";
const agreements = "/affiliates/contracts";
const acknowledgments = "/affiliates/compliance";
const connected = "/affiliates/connect";

function needsPostAction(post: { contentStatus: string; publicationStatus: string | null }) {
  if (post.contentStatus === "revision_requested" || post.publicationStatus === "verification_failed") return true;
  return post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus === null);
}

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const onboarding = await readSocialOnboarding(affiliate.code).catch(() => "skipped" as const);
  if (onboarding === "pending") redirect("/affiliates/connect");
  const postsOpen = await disclosureAcknowledged(affiliate.code).catch(() => false);
  let approvedIds: string[] = [];
  let postsNeedingAction = 0;
  let ownPosts: { campaign: string; contentStatus: string }[] = [];
  if (postsOpen) {
    try {
      const posts = await loadContentSubmissions(affiliate.code);
      ownPosts = posts;
      try {
        await remindManualReports(affiliate.email, posts);
      } catch (error) {
        console.error("[affiliate] manual report reminder failed", error instanceof Error ? error.message : "unknown");
      }
      approvedIds = posts.filter((post) => post.contentStatus === "approved" && post.publicationStatus === "awaiting_publication").map((post) => post.id);
      postsNeedingAction = posts.filter(needsPostAction).length;
    } catch {
      approvedIds = [];
      postsNeedingAction = 0;
    }
  }
  let campaignInvites = 0;
  try {
    campaignInvites = newCampaignInvitations(await loadMarketingCampaignRecords(), affiliate.code, ownPosts);
  } catch {
    campaignInvites = 0;
  }
  const submissionBadge = postsOpen && postsNeedingAction > 0 ? postsNeedingAction : undefined;
  const campaignBadge = campaignInvites > 0 ? campaignInvites : undefined;
  const closed = { disabled: true, hint: "Accept the sponsorship agreement on your referral link." };
  const createItem: AreaNavItem = postsOpen ? { href: createPost, label: "Create post" } : { href: createPost, label: "Create post", ...closed };
  const submissionsItem: AreaNavItem = postsOpen
    ? { href: submissions, label: "My posts", badge: submissionBadge }
    : { href: submissions, label: "My posts", ...closed };
  const nav: AreaNavItem[] = [
    { href: overview, label: "Overview", active: [overview, "/affiliates/tracking-link"] },
    { href: submissions, label: "Content", active: [submissions, createPost, myCampaigns, plans], badge: submissionBadge },
    { href: stats, label: "Stats", active: [stats] },
    { href: payments, label: "Payouts", active: [payments, orders] },
    { href: agreements, label: "Settings", active: [agreements, acknowledgments] },
  ];
  const groups: DashboardGroup[] = [
    {
      paths: [submissions, createPost, myCampaigns, plans],
      items: [createItem, submissionsItem, { href: myCampaigns, label: "My campaigns", badge: campaignBadge }],
    },
    {
      paths: [payments, orders],
      items: [
        { href: payments, label: "Payments" },
        { href: orders, label: "Lab commission by month" },
      ],
    },
    {
      paths: [agreements, acknowledgments],
      items: [
        { href: agreements, label: "Agreements" },
        { href: acknowledgments, label: "Acknowledgments" },
        { href: connected, label: "Connected accounts" },
      ],
    },
  ];

  return (
    <section className="bg-background px-4 pt-32 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+7.5rem)] text-ink sm:px-6 min-[765px]:pb-20">
      <div className="mx-auto max-w-6xl">
        <h1>
          <PortalBrand badge="Affiliates" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          See your posts, campaigns, stats, payouts, and settings.
        </p>
        <PortalLegalLinks className="mt-3" />
        {approvedIds.length > 0 ? (
          <ApprovedPostsNotice
            code={affiliate.code}
            ids={approvedIds}
            message={
              approvedIds.length === 1
                ? "A post was approved. Publish it, then paste the Instagram link."
                : `${approvedIds.length} posts were approved. Publish each one, then paste the Instagram link.`
            }
          />
        ) : null}
        <div className="mt-8 xl:grid xl:grid-cols-[minmax(18rem,max-content)_minmax(0,1fr)] xl:items-start xl:gap-8">
          <div className="z-20 flex flex-col gap-4 xl:sticky xl:top-28 xl:self-start">
            <ProfileCard
              name={affiliate.name}
              email={affiliate.email}
              role="Affiliate"
              avatarUrl={affiliate.avatarUrl}
              signOut={logoutAffiliatePortal}
              changePassword={changeAffiliatePassword}
            />
            <AreaNav label="Affiliate portal" items={nav} />
          </div>
          <div className="mt-8 min-w-0 xl:mt-0">
            <DashboardSections groups={groups}>{children}</DashboardSections>
          </div>
        </div>
      </div>
    </section>
  );
}
