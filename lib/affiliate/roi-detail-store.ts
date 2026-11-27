import { loadDeliverablePayments, type DeliverablePayment } from "./deliverable-payments";
import { listAffiliateChoices } from "./marketing-store";
import { memo } from "./memo";
import { loadContentSubmissions, type ContentSubmission } from "./post-review";
import type { RoiPostPay, RoiRange } from "./roi";
import { campaignRoiDetail, type CampaignRoiPost } from "./roi-detail";
import { loadCampaignOrders, loadMarketingCampaignRecords, loadMarketingCosts } from "./roi-store";

function roiPost(post: ContentSubmission): CampaignRoiPost {
  return {
    code: post.code,
    campaign: post.campaign,
    contentStatus: post.contentStatus,
    publicationStatus: post.publicationStatus,
    views: post.views ?? 0,
    engagements: (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0) + (post.saves ?? 0),
  };
}

function loadSubmissions() {
  return memo("submissions:all", () => loadContentSubmissions()).catch(() => [] as ContentSubmission[]);
}

export async function loadPostPay(): Promise<RoiPostPay[]> {
  const [posts, payments] = await Promise.all([
    loadSubmissions(),
    memo("deliverable-payments", () => loadDeliverablePayments()).catch(() => [] as DeliverablePayment[]),
  ]);
  const campaigns = new Map(posts.filter((post) => post.campaign).map((post) => [post.id, post.campaign]));
  return payments.map((payment) => ({
    code: payment.code,
    campaign: campaigns.get(payment.postId) ?? "",
    amountCents: (payment.paidCents ?? payment.amountCents) + (payment.adjustmentCents ?? 0),
    approvedAt: payment.approvedAt ?? payment.paidAt,
  }));
}

export async function loadCampaignRoiDetail(name: string, range: RoiRange = "all", now = Date.now()) {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return null;
  const records = await memo("marketing-campaign-records", () => loadMarketingCampaignRecords());
  const record = records.find((item) => item.status !== "draft" && item.name.toLowerCase() === wanted);
  if (!record) return null;
  const [orders, costs, posts, postPay, affiliates] = await Promise.all([
    memo("roi-orders", () => loadCampaignOrders()),
    memo("roi-costs", () => loadMarketingCosts()),
    loadSubmissions(),
    memo("roi-post-pay", () => loadPostPay()).catch(() => [] as RoiPostPay[]),
    memo("affiliate-choices", () => listAffiliateChoices()).catch(() => []),
  ]);
  return campaignRoiDetail({
    record,
    orders,
    costs,
    posts: posts.map(roiPost),
    postPay,
    names: new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name])),
    range,
    now,
  });
}
