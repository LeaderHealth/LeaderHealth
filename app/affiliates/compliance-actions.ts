"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { ComplianceFlagError, replyToComplianceFlag } from "@/lib/affiliate/compliance-flags";
import { DisclosureError, acknowledgeDisclosure, submitDisclosureProof } from "@/lib/affiliate/disclosures";

const LINK = "/affiliates/tracking-link";
const NOTICES = "/affiliates/compliance";

function linkFail(error: string): never {
  redirect(`${LINK}?error=${encodeURIComponent(error)}`);
}

function noticeFail(error: string): never {
  redirect(`${NOTICES}?error=${encodeURIComponent(error)}`);
}

export async function acknowledgeDisclosureAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  if (formData.get("acknowledge") !== "on") linkFail("acknowledge");
  try {
    const created = await acknowledgeDisclosure(affiliate.code);
    if (created) {
      await noteComplianceEvent({
        actor: affiliate.code,
        action: "disclosure-acknowledged",
        code: affiliate.code,
        detail: `${affiliate.name} acknowledged the sponsorship disclosure requirement.`,
      });
    }
  } catch (error) {
    console.error("[affiliate] disclosure acknowledgement failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  revalidatePath(LINK);
  revalidatePath("/affiliates/posts");
  revalidatePath("/affiliates/overview");
  const next = formData.get("next") === "posts" ? "/affiliates/posts" : LINK;
  redirect(`${next}?notice=acknowledged`);
}

export async function submitDisclosureProofAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const file = formData.get("screenshot");
  const upload = file instanceof File && file.size > 0 ? file : null;
  try {
    await submitDisclosureProof({
      code: affiliate.code,
      postUrl: formData.get("postUrl"),
      file: upload,
    });
  } catch (error) {
    if (error instanceof DisclosureError) linkFail(error.code === "acknowledged" ? "acknowledge" : error.code);
    console.error("[affiliate] disclosure proof failed", error instanceof Error ? error.message : "unknown");
    linkFail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "disclosure-proof-submitted",
    code: affiliate.code,
    detail: upload ? "Submitted disclosure proof with a screenshot." : "Submitted a disclosure proof URL.",
  });
  revalidatePath(LINK);
  revalidatePath("/admin/affiliates/compliance");
  redirect(`${LINK}?notice=proof`);
}

export async function replyToComplianceFlagAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const id = String(formData.get("id") ?? "");
  let flag;
  try {
    flag = await replyToComplianceFlag({ id, code: affiliate.code, reply: formData.get("reply") });
  } catch (error) {
    if (error instanceof ComplianceFlagError && (error.code === "invalid" || error.code === "status" || error.code === "missing")) {
      noticeFail("reply");
    }
    console.error("[affiliate] compliance reply failed", error instanceof Error ? error.message : "unknown");
    noticeFail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "flag-replied",
    code: flag.code,
    detail: String(formData.get("reply") ?? ""),
  });
  revalidatePath(NOTICES);
  revalidatePath("/admin/affiliates/compliance");
  redirect(`${NOTICES}?notice=replied`);
}
