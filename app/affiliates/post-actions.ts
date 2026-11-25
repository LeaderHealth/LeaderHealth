"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { POST_BATCH_LIMIT, PostReviewError, assignPostCampaign, cancelMetricChange, confirmManualMetrics, requestMetricChange, saveContentDrafts, saveManualMetrics, submitContentBatch, submitLiveInstagramUrl, withdrawContentPost, type BatchPostInput, type PostFileSlot } from "@/lib/affiliate/post-review";
import { postFormat } from "@/lib/affiliate/post-format";

const LINK = "/affiliates/posts";

function linkFail(error: string, formData?: FormData): never {
  const campaigns = formData && String(formData.get("returnTo") ?? "") === "campaigns";
  redirect(`${campaigns ? "/affiliates/campaigns" : LINK}?error=${encodeURIComponent(error)}`);
}

function donePath(formData: FormData, query: string) {
  const campaigns = String(formData.get("returnTo") ?? "") === "campaigns";
  return `${campaigns ? "/affiliates/campaigns" : LINK}?${query}`;
}

function refresh() {
  clearAffiliateMemo();
  revalidatePath(LINK);
  revalidatePath("/affiliates/posts/new");
  revalidatePath("/affiliates/campaigns");
  revalidatePath("/affiliates/offers");
  revalidatePath("/affiliates/stats");
  revalidatePath("/admin/affiliates/accounts");
  revalidatePath("/admin/affiliates/posts");
  revalidatePath("/admin/affiliates/posts/pending");
  revalidatePath("/admin/affiliates/posts/published");
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/admin/affiliates/overview");
}

function slotsFrom(formData: FormData, index: number): PostFileSlot[] | null {
  if (!formData.has(`slots${index}`)) return null;
  const count = Number(formData.get(`slots${index}`));
  if (!Number.isInteger(count) || count < 0 || count > 20) throw new PostReviewError("invalid");
  const slots: PostFileSlot[] = [];
  for (let slide = 0; slide < count; slide += 1) {
    const file = formData.get(`file${index}_${slide}`);
    const marker = String(formData.get(`slot${index}_${slide}`) ?? "");
    if (file instanceof File && file.size > 0) {
      slots.push({ kind: "upload", file });
      continue;
    }
    const match = /^existing:(\d{1,2})$/.exec(marker);
    if (!match) throw new PostReviewError("file");
    const existingIndex = Number(match[1]);
    if (existingIndex > 19) throw new PostReviewError("invalid");
    slots.push({ kind: "existing", index: existingIndex });
  }
  return slots;
}

function slideCaptionsFrom(formData: FormData, index: number) {
  if (!formData.has(`slideCount${index}`)) return null;
  const count = Number(formData.get(`slideCount${index}`));
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new PostReviewError("invalid");
  return Array.from({ length: count }, (_, slide) => String(formData.get(`slideCaption${index}_${slide}`) ?? ""));
}

function agreementSlotFrom(value: FormDataEntryValue | null) {
  const slot = Number(value);
  return Number.isInteger(slot) && slot >= 1 && slot <= 20 ? slot : null;
}

function batchFrom(formData: FormData): BatchPostInput[] {
  const count = Number(formData.get("count"));
  if (!Number.isInteger(count) || count < 1 || count > POST_BATCH_LIMIT) throw new PostReviewError("invalid");
  return Array.from({ length: count }, (_, index) => {
    const file = formData.get(`file${index}`);
    return {
      id: String(formData.get(`id${index}`) ?? "").trim(),
      caption: formData.get(`caption${index}`),
      file: file instanceof File && file.size > 0 ? file : null,
      slots: slotsFrom(formData, index),
      slideCaptions: slideCaptionsFrom(formData, index),
      format: postFormat(String(formData.get(`format${index}`) ?? "")),
      campaign: formData.has("campaign") ? String(formData.get("campaign") ?? "") : null,
      offerId: String(formData.get("offerId") ?? "").trim(),
      proposedPublishOn: formData.has("proposedPublishOn") ? String(formData.get("proposedPublishOn") ?? "") : null,
      agreementSlot: agreementSlotFrom(formData.get("requirement")),
      agreementPlatform: String(formData.get("agreementPlatform") ?? "").trim(),
      agreementPostType: String(formData.get("agreementPostType") ?? "").trim(),
    };
  });
}

export async function savePostDraftsAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await saveContentDrafts({ code: affiliate.code, posts: batchFrom(formData) });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] post drafts failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=drafts`);
}

export async function submitPostsAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let count = 0;
  let sentId = "";
  try {
    const posts = batchFrom(formData);
    count = posts.length;
    const ids = await submitContentBatch({
      code: affiliate.code,
      posts,
      termsAccepted: String(formData.get("terms") ?? "") === "yes",
      agreementId: String(formData.get("agreement") ?? ""),
      postingMonth: String(formData.get("postingMonth") ?? ""),
    });
    sentId = ids[0] ?? "";
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code, formData);
    console.error("[affiliate] post batch failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable", formData);
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "content-submitted",
    code: affiliate.code,
    detail: count === 1 ? `${affiliate.name} sent a post for review.` : `${affiliate.name} sent ${count} posts for review.`,
  });
  refresh();
  const opened = sentId && String(formData.get("returnTo") ?? "") !== "campaigns" ? `&post=${encodeURIComponent(sentId)}` : "";
  redirect(donePath(formData, `notice=post${opened}`));
}

export async function assignPostCampaignAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await assignPostCampaign({
      id: String(formData.get("id") ?? ""),
      code: affiliate.code,
      campaign: String(formData.get("campaign") ?? ""),
    });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] post campaign failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=campaign`);
}

export async function submitLiveLinkAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let publicationStatus: "tracking_active" | "verification_failed" | "verification_pending";
  try {
    const result = await submitLiveInstagramUrl({
      id: String(formData.get("id") ?? ""),
      code: affiliate.code,
      url: formData.get("postUrl"),
    });
    publicationStatus = result.publicationStatus;
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code, formData);
    console.error("[affiliate] post link failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable", formData);
  }
  const verified = publicationStatus === "tracking_active";
  const waiting = publicationStatus === "verification_pending";
  await noteComplianceEvent({
    actor: affiliate.code,
    action: verified ? "post-verified" : waiting ? "post-link-added" : "post-verification-failed",
    code: affiliate.code,
    detail: verified ? `${affiliate.name} Instagram post verified.` : waiting ? `${affiliate.name} added a TikTok link.` : `${affiliate.name} Instagram post could not be verified.`,
  });
  refresh();
  redirect(donePath(formData, `notice=${verified ? "tracked" : waiting ? "pending" : "check"}`));
}

export async function saveManualMetricsAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await saveManualMetrics({
      id: String(formData.get("id") ?? ""),
      code: affiliate.code,
      views: String(formData.get("views") ?? ""),
      likes: String(formData.get("likes") ?? ""),
      comments: String(formData.get("comments") ?? ""),
      shares: String(formData.get("shares") ?? ""),
      saves: String(formData.get("saves") ?? ""),
    });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code === "invalid" ? "counts" : error.code);
    console.error("[affiliate] manual post numbers failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=counts`);
}

export async function confirmManualMetricsAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await confirmManualMetrics({ id: String(formData.get("id") ?? ""), code: affiliate.code });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code === "invalid" ? "counts" : error.code);
    console.error("[affiliate] manual post confirmation failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=counts`);
}

export async function requestMetricChangeAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await requestMetricChange({
      id: String(formData.get("id") ?? ""),
      code: affiliate.code,
      views: String(formData.get("views") ?? ""),
      likes: String(formData.get("likes") ?? ""),
      comments: String(formData.get("comments") ?? ""),
      shares: String(formData.get("shares") ?? ""),
      saves: String(formData.get("saves") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code === "invalid" ? "counts" : error.code);
    console.error("[affiliate] metric change request failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=change`);
}

export async function cancelMetricChangeAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await cancelMetricChange({ id: String(formData.get("id") ?? ""), code: affiliate.code });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] metric change cancel failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  refresh();
  redirect(`${LINK}?notice=change-cancelled`);
}

export async function withdrawPostAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await withdrawContentPost({ id: String(formData.get("id") ?? ""), code: affiliate.code });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] post withdraw failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "content-withdrawn",
    code: affiliate.code,
    detail: `${affiliate.name} withdrew a post.`,
  });
  refresh();
  redirect(`${LINK}?notice=withdrawn`);
}
