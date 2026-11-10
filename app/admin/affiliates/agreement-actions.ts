"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AgreementError, endAgreement, markAgreementAwaiting, parseAgreementTerms, replaceAgreement, saveAgreementDraft, signAgreement } from "@/lib/affiliate/agreements";
import { noteComplianceEvent } from "@/lib/affiliate/compliance-log";
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
    effectiveOn: formData.get("effectiveOn"),
    expiresOn: formData.get("expiresOn"),
    descriptions: formData.getAll("deliverableDescription"),
    dues: formData.getAll("deliverableDue"),
    amounts: formData.getAll("deliverableAmount"),
    compensationNote: formData.get("compensationNote"),
    licensing: formData.get("licensing"),
    paymentConditions: formData.get("paymentConditions"),
  });
  if (!terms) redirect(`${ACCOUNTS}?error=agreement-invalid&code=${encodeURIComponent(agreementCode(formData))}`);
  return terms;
}

function fail(code: string, error: unknown): never {
  const reason = error instanceof AgreementError ? error.code : "unavailable";
  const key = reason === "unavailable" ? "unavailable" : `agreement-${reason}`;
  redirect(`${ACCOUNTS}?error=${encodeURIComponent(key)}&code=${encodeURIComponent(code)}`);
}

function done(code: string, notice: string): never {
  revalidatePath(ACCOUNTS);
  revalidatePath("/admin/affiliates/records");
  revalidatePath("/affiliates/overview");
  redirect(`${ACCOUNTS}?notice=${encodeURIComponent(notice)}&code=${encodeURIComponent(code)}`);
}

async function affiliateName(code: string) {
  const affiliate = await getAffiliate(code);
  if (!affiliate) redirect(`${ACCOUNTS}?error=missing&code=${encodeURIComponent(code)}`);
  return affiliate.name.trim() || code;
}

export async function saveAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  const terms = termsFrom(formData);
  try {
    await saveAgreementDraft(code, terms);
  } catch (error) {
    fail(code, error);
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-saved", code, detail: `${name} agreement saved.` });
  done(code, "agreement-saved");
}

export async function markAgreementWaitingAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  const terms = termsFrom(formData);
  try {
    await markAgreementAwaiting(code, terms);
  } catch (error) {
    fail(code, error);
  }
  await noteComplianceEvent({
    actor: await actor(),
    action: "agreement-saved",
    code,
    detail: `${name} agreement is awaiting a signature.`,
  });
  done(code, "agreement-waiting");
}

export async function signAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  const file = formData.get("file");
  try {
    await signAgreement({ code, signerName: formData.get("signerName"), file: file instanceof File ? file : new File([], "") });
  } catch (error) {
    fail(code, error);
  }
  await noteComplianceEvent({ actor: await actor(), action: "agreement-signed", code, detail: `${name} signed agreement stored.` });
  done(code, "agreement-signed");
}

export async function endAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  try {
    await endAgreement(code, formData.get("note"));
  } catch (error) {
    fail(code, error);
  }
  const note = typeof formData.get("note") === "string" ? formData.get("note") : "";
  await noteComplianceEvent({
    actor: await actor(),
    action: "agreement-ended",
    code,
    detail: `${name} agreement ended. ${typeof note === "string" ? note : ""}`.trim(),
  });
  done(code, "agreement-ended");
}

export async function replaceAgreementAction(formData: FormData) {
  await requireAdmin();
  const code = agreementCode(formData);
  const name = await affiliateName(code);
  let endedCurrent = false;
  try {
    endedCurrent = await replaceAgreement(code, formData.get("note"));
  } catch (error) {
    fail(code, error);
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
  done(code, "agreement-replaced");
}
