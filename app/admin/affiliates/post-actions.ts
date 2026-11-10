"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { affiliateEmailConfigured, sendPostApprovedEmail } from "@/lib/affiliate/email";
import { PostReviewError, approveContentPost, markContentChecked, rejectContentPost, requestContentChange } from "@/lib/affiliate/post-review";
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

function fail(error: string): never {
  redirect(`${REVIEW}?error=${encodeURIComponent(error)}`);
}

function nextPost(formData: FormData) {
  const next = String(formData.get("next") ?? "").trim();
  return /^[A-Za-z0-9]{10,40}$/.test(next) ? next : "";
}

function done(notice: string, formData: FormData): never {
  const params = new URLSearchParams({ notice });
  const next = nextPost(formData);
  if (next) params.set("post", next);
  redirect(`${REVIEW}?${params.toString()}`);
}

function refresh() {
  revalidatePath(ACCOUNTS);
  revalidatePath(REVIEW);
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/admin/affiliates/overview");
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

function postError(error: unknown): never {
  if (error instanceof PostReviewError) fail(`post-${error.code}`);
  console.error("[affiliate] post review failed", error instanceof Error ? error.message : "unknown");
  fail("post-unavailable");
}

export async function approvePostAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await approveContentPost(String(formData.get("id") ?? ""));
  } catch (error) {
    postError(error);
  }
  const affiliate = await getAffiliate(post.code).catch(() => null);
  const name = affiliate?.name || post.code;
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-approved",
    code: post.code,
    detail: `${name} post approved.`,
  });
  if (affiliate?.email && affiliateEmailConfigured()) {
    try {
      await sendPostApprovedEmail(affiliate.email, post.caption);
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
    post = await requestContentChange(String(formData.get("id") ?? ""), formData.get("note"));
  } catch (error) {
    postError(error);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-revision-requested",
    code: post.code,
    detail: `${name} post needs a change.`,
  });
  refresh();
  done("post-change", formData);
}

export async function rejectPostAction(formData: FormData) {
  await requireAdmin();
  let post;
  try {
    post = await rejectContentPost(String(formData.get("id") ?? ""), formData.get("note"));
  } catch (error) {
    postError(error);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "content-rejected",
    code: post.code,
    detail: `${name} post rejected.`,
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
    postError(error);
  }
  const name = await affiliateName(post.code);
  await noteComplianceEvent({
    actor: await actor(),
    action: "post-verified",
    code: post.code,
    detail: `${name} Instagram post checked by an admin.`,
  });
  refresh();
  done("post-checked", formData);
}
