"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import {
  acceptAgreement,
  AgreementError,
  deleteAgreementDraft,
  endAgreement,
  markAgreementAwaiting,
  parseAgreementTerms,
  replaceAgreement,
  replyAgreementQuestion,
  saveAgreementDraft,
  signAgreement,
  withdrawAgreement,
} from "@/lib/affiliate/agreements";
import { agreementSendError } from "@/lib/affiliate/agreement-partnership";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
import { acknowledgeAgreementDisclosure } from "@/lib/affiliate/disclosures";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { adminAccountEmail, adminIsSignedIn, adminSessionActor } from "@/lib/affiliate/session";
import { getAffiliate } from "@/lib/affiliate/store";

const ACCOUNTS = "/admin/affiliates/accounts";

async function requireAdmin() {
  if (!(await adminIsSignedIn())) redirect("/admin/affiliates");
}

async function actor() {
  const session = await adminSessionActor();
  if (session && "id" in session) return session.id;
  return adminAccountEmail() ?? "owner";
}

function agreementCode(formData: FormData) {
  const code = normalizeAffiliateCode(formData.get("code"));
  if (!code) redirect(`${ACCOUNTS}?error=agreement-invalid`);
  return code;
}

function termsFrom(formData: FormData) {
  const terms = parseAgreementTerms({
    title: formData.get("title"),
    effectiveOn: formData.get("effectiveOn"),
    expiresOn: formData.get("expiresOn"),
    monthlyAmount: formData.get("monthlyAmount"),
    platforms: formData.getAll("platform"),
    postMix: formData.getAll("postMix"),
    guidelines: formData.get("guidelines"),
    descriptions: formData.getAll("deliverableDescription"),
    dues: formData.getAll("deliverableDue"),
    amounts: formData.getAll("deliverableAmount"),
    compensationNote: formData.get("compensationNote"),
    licensing: formData.get("licensing"),
    paymentConditions: formData.get("paymentConditions"),
  });
  if (!terms) redirect(agreementsPage(agreementCode(formData), "error", "agreement-invalid", wizardStep(formData)));
  return terms;
}

function pdfFrom(formData: FormData) {
  const file = formData.get("pdf");
  return { file: file instanceof File && file.size > 0 ? file : null, remove: formData.get("removePdf") === "1" };
}

function wizardStep(formData: FormData) {
  const step = formData.get("returnStep");
  return step === "1" || step === "2" || step === "3" ? step : "";
}

function agreementsPage(code: string, kind: "error" | "notice", value: string, step = "") {
  const extra = step ? `&step=${step}` : "";
  return `${ACCOUNTS}?${kind}=${encodeURIComponent(value)}&code=${encodeURIComponent(code)}&view=agreements${extra}`;
}

function fail(code: string, error: unknown, step = ""): never {
  const reason = error instanceof AgreementError ? error.code : "unavailable";
  const key = reason === "unavailable" ? "unavailable" : `agreement-${reason}`;
  redirect(agreementsPage(code, "error", key, step));
}

function done(code: string, notice: string, step = ""): never {
  clearAffiliateMemo();
  revalidatePath(ACCOUNTS);
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/affiliates/overview");
  revalidatePath("/affiliates/contracts");
  revalidatePath("/affiliates", "layout");
  redirect(agreementsPage(code, "notice", notice, step));
}

async function affiliateName(code: string) {
  const affiliate = await getAffiliate(code);
  if (!affiliate) redirect(agreementsPage(code, "error", "missing"));
  return affiliate.name.trim() || code;
}

export async function saveAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const step = wizardStep(formData);
  const name = await affiliateName(code);
  const terms = termsFrom(formData);
  try {
    await saveAgreementDraft(code, terms, pdfFrom(formData));
  } catch (error) {
    fail(code, error, step);
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-saved", code, detail: `${name} agreement saved.` });
  done(code, "agreement-saved", step);
}

export async function markAgreementWaitingAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const step = wizardStep(formData);
  const name = await affiliateName(code);
  const terms = termsFrom(formData);
  if (agreementSendError(terms)) redirect(agreementsPage(code, "error", "agreement-invalid", step));
  try {
    await markAgreementAwaiting(code, terms, pdfFrom(formData));
  } catch (error) {
    if (error instanceof AgreementError && error.code === "pdf") {
      try {
        await saveAgreementDraft(code, terms);
      } catch (saveError) {
        fail(code, saveError, step);
      }
    }
    fail(code, error, step);
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "agreement-saved",
    code,
    detail: `${name} agreement was sent and is waiting to be accepted.`,
  });
  done(code, "agreement-waiting", step);
}

export async function acceptAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  try {
    await acceptAgreement(code, name, formData.get("agreementId"));
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  const by = await actor();
  await noteComplianceEvent({ actor: by, action: "agreement-signed", code, detail: `${name} acceptance recorded by an admin.` });
  await acknowledgeAgreementDisclosure({ code, name, actor: by });
  done(code, "agreement-accepted", wizardStep(formData));
}

export async function signAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  const file = formData.get("file");
  try {
    await signAgreement({ code, signerName: formData.get("signerName"), agreementId: formData.get("agreementId"), file: file instanceof File ? file : new File([], "") });
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  const by = await actor();
  await noteComplianceEvent({ actor: by, action: "agreement-signed", code, detail: `${name} signed agreement stored.` });
  await acknowledgeAgreementDisclosure({ code, name, actor: by });
  done(code, "agreement-signed", wizardStep(formData));
}

export async function deleteAgreementDraftAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  try {
    await deleteAgreementDraft(code, formData.get("agreementId"));
  } catch (error) {
    fail(code, error);
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-deleted", code, detail: `${name} unsent draft deleted.` });
  done(code, "agreement-deleted");
}

export async function withdrawAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  try {
    await withdrawAgreement(code, formData.get("agreementId"));
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-saved", code, detail: `${name} agreement was withdrawn to a draft.` });
  done(code, "agreement-withdrawn", wizardStep(formData));
}

export async function replyAgreementQuestionAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  const reply = formData.get("reply");
  if (typeof reply !== "string" || !reply.trim()) redirect(agreementsPage(code, "error", "agreement-reply", wizardStep(formData)));
  let saved = "";
  try {
    saved = await replyAgreementQuestion({ code, questionId: String(formData.get("questionId") ?? ""), reply });
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-answered", code, detail: `Replied to ${name}: ${saved}` });
  done(code, "agreement-replied", wizardStep(formData));
}

export async function endAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  try {
    await endAgreement(code, formData.get("note"));
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  const note = typeof formData.get("note") === "string" ? formData.get("note") : "";
  await noteComplianceEvent({
    actor: await actor(),
    action: "agreement-ended",
    code,
    detail: `${name} agreement ended. ${typeof note === "string" ? note : ""}`.trim(),
  });
  done(code, "agreement-ended", wizardStep(formData));
}

export async function replaceAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  let endedCurrent = false;
  try {
    const seed = formData.get("copy") === "1" ? termsFrom(formData) : null;
    endedCurrent = await replaceAgreement(code, formData.get("note"), seed);
  } catch (error) {
    fail(code, error, wizardStep(formData));
  }
  const who = await actor();
  if (endedCurrent) {
    await noteComplianceEvent({
      actor: who,
      action: "agreement-ended",
      code,
      detail: `${name} agreement ended. ${formData.get("note")}`.trim(),
    });
  }
  await noteComplianceEvent({ actor: who, action: "agreement-saved", code, detail: `${name} agreement draft started.` });
  done(code, "agreement-replaced", wizardStep(formData));
}
