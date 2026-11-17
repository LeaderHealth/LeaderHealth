import type { Metadata } from "next";
import { ADMIN_ERRORS } from "@/app/admin/affiliates/messages";
import { CampaignList } from "@/components/affiliate/CampaignList";
import { campaignListRows } from "@/lib/affiliate/campaign-list";
import { loadContentSubmissions } from "@/lib/affiliate/post-review";
import { loadMarketingCampaignRecords } from "@/lib/affiliate/roi-store";
import { loadAffiliateOverview } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Campaigns",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const notice = query.notice === "created" || query.notice === "updated" ? "Campaign saved." : query.notice === "exists" ? "That campaign is already on the list." : "";
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  let loadError = "";
  let rows: ReturnType<typeof campaignListRows> = [];
  try {
    const [records, posts, overview] = await Promise.all([
      loadMarketingCampaignRecords(),
      loadContentSubmissions(),
      loadAffiliateOverview(),
    ]);
    rows = campaignListRows({
      records,
      posts: posts
        .filter((post) => post.contentStatus !== "withdrawn")
        .map((post) => ({
          id: post.id,
          code: post.code,
          campaign: post.campaign,
          contentStatus: post.contentStatus,
          publicationStatus: post.publicationStatus,
          createdAt: post.createdAt,
        })),
      affiliates: overview.affiliates.map((affiliate) => ({ code: affiliate.code, name: affiliate.name })),
    });
  } catch {
    loadError = "Campaigns are unavailable right now.";
  }

  return (
    <div className="flex flex-col gap-4">
      {notice ? <p className="text-sm text-ink">{notice}</p> : null}
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      {loadError ? <p className="text-ink">{loadError}</p> : <CampaignList rows={rows} />}
    </div>
  );
}
