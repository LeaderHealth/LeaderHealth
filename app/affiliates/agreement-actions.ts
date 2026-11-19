"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { AgreementError, acceptAgreement, askAgreementQuestion, declineAgreement } from "@/lib/affiliate/agreements";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";

const CONTRACTS = "/affiliates/contracts";

function fail(error: string): never {
  redirect(`${CONTRACTS}?error=${encodeURIComponent(error)}#agreements`);
}

export async function askAgreementQuestionAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) fail("question");
  let saved = "";
  try {
    saved = await askAgreementQuestion({ code: affiliate.code, agreementId: String(formData.get("agreementId") ?? ""), text });
  } catch (error) {
    if (error instanceof AgreementError && (error.code === "question" || error.code === "status" || error.code === "invalid")) {
      fail(error.code === "question" ? "question" : "status");
    }
    console.error("[affiliate] agreement question failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  await noteComplianceEvent({ actor: affiliate.code, action: "agreement-question", code: affiliate.code, detail: saved });
  clearAffiliateMemo();
  revalidatePath(CONTRACTS);
  revalidatePath("/affiliates/overview");
  revalidatePath("/admin/affiliates/accounts");
  redirect(`${CONTRACTS}?notice=asked#agreements`);
}

export async function acceptAffiliateAgreementAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  if (formData.get("accept") !== "yes") fail("accept");
  try {
    await acceptAgreement(affiliate.code, affiliate.name, formData.get("agreementId"));
  } catch (error) {
    if (error instanceof AgreementError && error.code === "question") fail("question-open");
    if (error instanceof AgreementError && (error.code === "status" || error.code === "signer")) fail("status");
    console.error("[affiliate] agreement accept failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "agreement-signed",
    code: affiliate.code,
    detail: `${affiliate.name} accepted the agreement.`,
  });
  clearAffiliateMemo();
  revalidatePath(CONTRACTS);
  revalidatePath("/affiliates/overview");
  revalidatePath("/admin/affiliates/accounts");
  redirect(`${CONTRACTS}?notice=accepted#agreements`);
}

export async function declineAffiliateAgreementAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let title = "the agreement";
  try {
    title = await declineAgreement(affiliate.code, formData.get("agreementId"));
  } catch (error) {
    if (error instanceof AgreementError && error.code === "status") fail("status");
    console.error("[affiliate] agreement decline failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable");
  }
  await noteComplianceEvent({
    actor: affiliate.code,
    action: "agreement-declined",
    code: affiliate.code,
    detail: `${affiliate.name} declined ${title}.`,
  });
  clearAffiliateMemo();
  revalidatePath(CONTRACTS);
  revalidatePath("/affiliates/overview");
  revalidatePath("/admin/affiliates/accounts");
  redirect(`${CONTRACTS}?notice=declined#agreements`);
}
