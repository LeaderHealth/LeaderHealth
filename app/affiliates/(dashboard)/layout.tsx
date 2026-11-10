import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaNav } from "@/components/affiliate/AreaNav";
import { PortalBrand } from "@/components/affiliate/PortalBrand";
import { ProfileCard } from "@/components/affiliate/ProfileCard";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { changeAffiliatePassword, logoutAffiliatePortal } from "../actions";
import { currentAffiliate } from "../current";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const items = [
  { href: "/affiliates/overview", label: "Overview" },
  { href: "/affiliates/tracking-link", label: "Referral link" },
  { href: "/affiliates/posts", label: "Posts" },
  { href: "/affiliates/stats", label: "Stats" },
  { href: "/affiliates/compliance", label: "Compliance" },
  { href: "/affiliates/orders", label: "Orders" },
  { href: "/affiliates/payouts", label: "Payouts" },
];

function needsPostAction(post: { contentStatus: string; publicationStatus: string | null }) {
  if (post.contentStatus === "revision_requested" || post.publicationStatus === "verification_failed") return true;
  return post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus === null);
}

export default async function AffiliateDashboardLayout({ children }: { children: ReactNode }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let approvedWaiting = 0;
  let postsNeedingAction = 0;
  try {
    const posts = await loadContentSubmissions(affiliate.code);
    approvedWaiting = posts.filter((post) => post.contentStatus === "approved" && post.publicationStatus === "awaiting_publication").length;
    postsNeedingAction = posts.filter(needsPostAction).length;
  } catch {
    approvedWaiting = 0;
    postsNeedingAction = 0;
  }

  return (
    <section className="bg-background px-4 pt-32 pb-[calc(max(0.5rem,env(safe-area-inset-bottom))+7.5rem)] text-ink sm:px-6 min-[765px]:pb-20">
      <div className="mx-auto max-w-6xl">
        <h1>
          <PortalBrand badge="Affiliates" />
        </h1>
        <p className="mt-4 max-w-2xl text-taupe">
          See your referral link, promo code, orders, earnings, and payouts.
        </p>
        {approvedWaiting > 0 ? (
          <p role="status" className="mt-4 max-w-2xl rounded-2xl bg-white px-4 py-3 text-sm text-ink">
            {approvedWaiting === 1
              ? "A post was approved. Publish it, then paste the Instagram link."
              : `${approvedWaiting} posts were approved. Publish each one, then paste the Instagram link.`}{" "}
            <Link href="/affiliates/posts" className="font-medium underline underline-offset-4">
              Open posts
            </Link>
          </p>
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
            <AreaNav label="Affiliate portal" items={items.map((item) => (item.href === "/affiliates/posts" && postsNeedingAction > 0 ? { ...item, badge: postsNeedingAction } : item))} />
          </div>
          <div className="mt-8 min-w-0 xl:mt-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
