import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApprovedPostsNotice } from "@/components/affiliate/ApprovedPostsNotice";
import { PortalLegalLinks } from "@/components/affiliate/PortalLegalLinks";
import { AreaNav, type AreaNavItem } from "@/components/affiliate/AreaNav";
import { DashboardSections, type DashboardGroup } from "@/components/affiliate/DashboardSections";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { hasAcceptedAgreement, loadAffiliateAgreements } from "@/lib/affiliate/agreements";
import { remindManualReports } from "@/lib/affiliate/manual-report";
import { newCampaignInvitations } from "@/lib/affiliate/affiliate-campaigns";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { namedPlatform, type PostFormat } from "@/lib/affiliate/post-format";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { changeAffiliatePassword, logoutAffiliatePortal } from "../actions";
import { currentAffiliate } from "../current";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const overview = "/affiliates/overview";
const createPost = "/affiliates/posts/new";
const submissions = "/affiliates/posts";
const myCampaigns = "/affiliates/campaigns";
const stats = "/affiliates/stats";
const payments = "/affiliates/payouts";
const orders = "/affiliates/orders";
const agreements = "/affiliates/contracts";
const legacyCompliance = "/affiliates/compliance";
const connected = "/affiliates/connect";

function needsPostAction(post: { contentStatus: string; publicationStatus: string | null; liveFixNote?: string }) {
  if (post.liveFixNote && post.publicationStatus !== "verification_pending") return true;
  if (post.contentStatus === "revision_requested" || post.publicationStatus === "verification_failed") return true;
  return post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus === null);
}

const PLATFORM_ORDER = ["TikTok", "Instagram", "Facebook", "YouTube"] as const;

function approvedPlatform(post: { format: PostFormat | null; agreementPlatform: string }) {
  return namedPlatform(post.format, post.agreementPlatform);
}

function approvedLinkWords(posts: { format: PostFormat | null; agreementPlatform: string }[]) {
  const names = PLATFORM_ORDER.filter((name) => posts.some((post) => approvedPlatform(post) === name));
  if (names.length === 0) return "live";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

function approvedMessage(posts: { format: PostFormat | null; agreementPlatform: string }[]) {
  const where = approvedLinkWords(posts);
  if (posts.length === 1) return `A post was approved. Publish it, then paste the ${where} link.`;
  return `${posts.length} posts were approved. Publish each one, then paste the ${where} link.`;
}

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const ownAgreements = await loadAffiliateAgreements(affiliate.code).catch(() => null);
  const postsOpen = ownAgreements ? hasAcceptedAgreement(ownAgreements) : false;
  let approvedPosts: { id: string; format: PostFormat | null; agreementPlatform: string }[] = [];
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
      approvedPosts = posts
        .filter((post) => post.contentStatus === "approved" && post.publicationStatus === "awaiting_publication")
        .map((post) => ({ id: post.id, format: post.format, agreementPlatform: post.agreementPlatform }));
      postsNeedingAction = posts.filter(needsPostAction).length;
    } catch {
      approvedPosts = [];
      postsNeedingAction = 0;
    }
  }
  const agreementWaiting = ownAgreements?.some((agreement) => agreement.status === "awaiting_signature") ?? false;
  let campaignInvites = 0;
  try {
    campaignInvites = newCampaignInvitations(await loadMarketingCampaignRecords(), affiliate.code, ownPosts);
  } catch {
    campaignInvites = 0;
  }
  const submissionBadge = postsOpen && postsNeedingAction > 0 ? postsNeedingAction : undefined;
  const campaignBadge = campaignInvites > 0 ? campaignInvites : undefined;
  const closed = { disabled: true, hint: "Accept the agreement in My agreement first." };
  const createItem: AreaNavItem = postsOpen ? { href: createPost, label: "Create post" } : { href: createPost, label: "Create post", ...closed };
  const submissionsItem: AreaNavItem = postsOpen
    ? { href: submissions, label: "My posts", badge: submissionBadge }
    : { href: submissions, label: "My posts", ...closed };
  const nav: AreaNavItem[] = [
    { href: overview, label: "Overview", active: [overview, "/affiliates/tracking-link"] },
    { href: submissions, label: "Content", active: [submissions, createPost, myCampaigns, agreements], badge: submissionBadge },
    { href: stats, label: "Stats", active: [stats] },
    { href: payments, label: "Payouts", active: [payments, orders] },
    { href: connected, label: "Settings", active: [legacyCompliance, connected] },
  ];
  const groups: DashboardGroup[] = [
    {
      paths: [submissions, createPost, myCampaigns, agreements],
      items: [createItem, submissionsItem, { href: myCampaigns, label: "My campaigns", badge: campaignBadge }, { href: agreements, label: "My agreement", badge: agreementWaiting ? 1 : undefined }],
    },
  ];

  return (
    <section className="bg-background px-4 pt-32 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+7.5rem)] text-ink sm:px-6 min-[765px]:pb-20">
      <div className="mx-auto max-w-[96rem]">
        <h1>
          <PortalBrand badge="Affiliates" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          See your posts, campaigns, stats, payouts, and settings.
        </p>
        <PortalLegalLinks className="mt-3" />
        {approvedPosts.length > 0 ? (
          <ApprovedPostsNotice
            code={affiliate.code}
            ids={approvedPosts.map((post) => post.id)}
            message={approvedMessage(approvedPosts)}
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
