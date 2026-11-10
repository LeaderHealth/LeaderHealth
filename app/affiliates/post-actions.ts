"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { POST_BATCH_LIMIT, PostReviewError, saveContentDrafts, submitContentBatch, submitLiveInstagramUrl, withdrawContentPost, type BatchPostInput, type PostFileSlot } from "@/lib/affiliate/post-review";

const LINK = "/affiliates/posts";

function linkFail(error: string): never {
  redirect(`${LINK}?error=${encodeURIComponent(error)}`);
}

function refresh() {
  revalidatePath(LINK);
  revalidatePath("/affiliates/stats");
  revalidatePath("/admin/affiliates/accounts");
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
  try {
    const posts = batchFrom(formData);
    count = posts.length;
    await submitContentBatch({ code: affiliate.code, posts });
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] post batch failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "content-submitted",
    code: affiliate.code,
    detail: count === 1 ? `${affiliate.name} sent a post for review.` : `${affiliate.name} sent ${count} posts for review.`,
  });
  refresh();
  redirect(`${LINK}?notice=post`);
}

export async function submitLiveLinkAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let publicationStatus: "tracking_active" | "verification_failed";
  try {
    const result = await submitLiveInstagramUrl({
      id: String(formData.get("id") ?? ""),
      code: affiliate.code,
      url: formData.get("postUrl"),
    });
    publicationStatus = result.publicationStatus;
  } catch (error) {
    if (error instanceof PostReviewError) linkFail(error.code);
    console.error("[affiliate] post link failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  const verified = publicationStatus === "tracking_active";
  await noteComplianceEvent({
    actor: affiliate.code,
    action: verified ? "post-verified" : "post-verification-failed",
    code: affiliate.code,
    detail: verified ? `${affiliate.name} Instagram post verified.` : `${affiliate.name} Instagram post could not be verified.`,
  });
  refresh();
  redirect(`${LINK}?notice=${verified ? "tracked" : "check"}`);
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
