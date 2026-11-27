"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { affiliateEmailConfigured, sendPostApprovedEmail } from "@/lib/affiliate/email";
import { formatPlatform } from "@/lib/affiliate/post-format";
import { PostReviewError, applyMetricChange, approveContentPost, markContentChecked, rejectContentPost, requestContentChange } from "@/lib/affiliate/post-review";
import { adminAccountEmail, adminIsSignedIn, adminSessionActor } from "@/lib/affiliate/session";
import { getAffiliate } from "@/lib/affiliate/store";

const ACCOUNTS = "/admin/affiliates/accounts";
const REVIEW = "/admin/affiliates/posts";

async function requireAdmin() {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");
}

async function actor() {
  const session = await adminSessionActor();
  if (session && "id" in session) return session.id;
  return adminAccountEmail() ?? "owner";
}

function fail(error: string, formData?: FormData): never {
  const path = formData ? reviewPath(formData) : REVIEW;
  redirect(`${path}?error=${encodeURIComponent(error)}`);
}

function nextPost(formData: FormData) {
  const next = String(formData.get("next") ?? "").trim();
  return /^[A-Za-z0-9]{10,40}$/.test(next) ? next : "";
}

function reviewPath(formData: FormData) {
  const back = formData.get("return");
  if (back === "pending") return "/admin/affiliates/posts/pending";
  if (back === "published") return "/admin/affiliates/posts/published";
  return REVIEW;
}

function done(notice: string, formData: FormData): never {
  const params = new URLSearchParams({ notice });
  const next = nextPost(formData);
  if (next) params.set("post", next);
  redirect(`${reviewPath(formData)}?${params.toString()}`);
}

function decisionDetail(name: string, campaign: string, sentence: string) {
  const extra = campaign ? ` Campaign: ${campaign}.` : "";
  return `${name} ${sentence}${extra}`.slice(0, 500);
}

function refresh() {
  clearAffiliateMemo();
  revalidatePath(ACCOUNTS);
  revalidatePath(REVIEW);
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/admin/affiliates/overview");
  revalidatePath("/admin/affiliates/posts/pending");
  revalidatePath("/admin/affiliates/posts/published");
  revalidatePath("/affiliates/posts");
  revalidatePath("/affiliates/overview");
  revalidatePath("/affiliates/stats");
}

async function affiliateName(code: string) {
  try {
    const affiliate = await getAffiliate(code);
    return affiliate?.name || code;
  } catch {
    return code;
  }
}

function postError(error: unknown, formData: FormData): never {
  if (error instanceof PostReviewError) fail(`post-${error.code}`, formData);
  console.error("[affiliate] post review failed", error instanceof Error ? error.message : "unknown");
  fail("post-unavailable", formData);
}

export async function approvePostAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await approveContentPost(String(formData.get("id") ?? ""), await actor());
  } catch (error) {
    postError(error, formData);
  }
  const affiliate = await getAffiliate(post.code).catch(() => null);
  const name = affiliate?.name || post.code;
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-approved",
    code: post.code,
    detail: decisionDetail(name, post.campaign, "post approved."),
  });
  if (affiliate?.email && affiliateEmailConfigured()) {
    try {
      await sendPostApprovedEmail(affiliate.email, post.caption, post.format, post.agreementPlatform);
    } catch (error) {
      console.error("[affiliate] post approval email failed", error instanceof Error ? error.message : "unknown");
    }
  }
  refresh();
  done("post-approved", formData);
}

export async function requestPostChangeAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await requestContentChange(String(formData.get("id") ?? ""), formData.get("note"), await actor());
  } catch (error) {
    postError(error, formData);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-revision-requested",
    code: post.code,
    detail: decisionDetail(name, post.campaign, post.keptPublished ? "live post stays published and needs an updated link." : "post needs a change."),
  });
  refresh();
  done(post.keptPublished ? "post-live-note" : "post-change", formData);
}

export async function rejectPostAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await rejectContentPost(String(formData.get("id") ?? ""), formData.get("note"), await actor());
  } catch (error) {
    postError(error, formData);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-rejected",
    code: post.code,
    detail: decisionDetail(name, post.campaign, "post rejected."),
  });
  refresh();
  done("post-declined", formData);
}

export async function markPostCheckedAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await markContentChecked(String(formData.get("id") ?? ""));
  } catch (error) {
    postError(error, formData);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "post-verified",
    code: post.code,
    detail: `${name} ${formatPlatform(post.format) || "post"} checked by an admin.`,
  });
  refresh();
  done("post-checked", formData);
}

export async function applyMetricChangeAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  try {
    await applyMetricChange({
      id: String(formData.get("id") ?? ""),
      views: String(formData.get("views") ?? ""),
      likes: String(formData.get("likes") ?? ""),
      comments: String(formData.get("comments") ?? ""),
      shares: String(formData.get("shares") ?? ""),
      saves: String(formData.get("saves") ?? ""),
    });
  } catch (error) {
    const reason = error instanceof PostReviewError ? (error.code === "invalid" ? "post-counts" : `post-${error.code}`) : "post-unavailable";
    if (!(error instanceof PostReviewError)) console.error("[affiliate] metric change apply failed", error instanceof Error ? error.message : "unknown");
    const params = new URLSearchParams({ error: reason });
    if (code) params.set("code", code);
    redirect(`/admin/affiliates/accounts?${params.toString()}`);
  }
  refresh();
  const params = new URLSearchParams({ notice: "counts-updated" });
  if (code) params.set("code", code);
  redirect(`/admin/affiliates/accounts?${params.toString()}`);
}
