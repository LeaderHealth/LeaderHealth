import { normalizeAffiliateCode } from "./code";

export const COMPLIANCE_ACTIONS = [
  "account-activated",
  "account-deactivated",
  "password-set",
  "invitation-resent",
  "promo-assigned",
  "promo-unassigned",
  "application-approved",
  "application-declined",
  "payout-approved",
  "payout-paid",
  "marketing-report-saved",
  "disclosure-acknowledged",
  "disclosure-proof-submitted",
  "disclosure-proof-accepted",
  "flag-opened",
  "correction-requested",
  "flag-replied",
  "flag-resolved",
  "agreement-saved",
  "agreement-signed",
  "agreement-ended",
  "content-submitted",
  "content-revised",
  "content-approved",
  "content-rejected",
  "content-revision-requested",
  "content-withdrawn",
  "post-verified",
  "post-verification-failed",
] as const;

export type ComplianceAction = (typeof COMPLIANCE_ACTIONS)[number];

export const FLAG_REASONS = ["missing_disclosure", "misleading_claim", "unauthorized_content"] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];
export type FlagStatus = "open" | "correction_requested" | "resolved";

export function complianceEventFields(input: {
  actor: unknown;
  action: unknown;
  code?: unknown;
  detail: unknown;
}) {
  const actor = cleanText(input.actor, 120);
  const detail = cleanText(input.detail, 500);
  const action = COMPLIANCE_ACTIONS.find((item) => item === input.action);
  if (!actor || !detail || !action) return null;
  const code = input.code == null || input.code === "" ? null : normalizeAffiliateCode(input.code);
  if (input.code != null && input.code !== "" && !code) return null;
  return { actor, action, code, detail };
}

export function complianceEventMutation() {
  return "create" as const;
}

export function flagReason(value: unknown): FlagReason | null {
  return FLAG_REASONS.find((item) => item === value) ?? null;
}

export function flagAfter(status: FlagStatus, step: "request" | "reply" | "resolve"): FlagStatus | null {
  if (step === "request" && status === "open") return "correction_requested";
  if (step === "reply" && status === "correction_requested") return "correction_requested";
  if (step === "resolve" && status !== "resolved") return "resolved";
  return null;
}

export function flagReasonLabel(reason: FlagReason) {
  if (reason === "missing_disclosure") return "Missing sponsorship disclosure";
  if (reason === "misleading_claim") return "Misleading medical claim";
  return "Unauthorized promotional content";
}

export function flagStatusLabel(status: FlagStatus) {
  if (status === "open") return "Open";
  if (status === "correction_requested") return "Correction requested";
  return "Resolved";
}

export function complianceActionLabel(action: ComplianceAction) {
  if (action === "account-activated") return "Account activated";
  if (action === "account-deactivated") return "Account deactivated";
  if (action === "password-set") return "Password set";
  if (action === "invitation-resent") return "Invitation resent";
  if (action === "promo-assigned") return "Promo code assigned";
  if (action === "promo-unassigned") return "Promo code removed";
  if (action === "application-approved") return "Application approved";
  if (action === "application-declined") return "Application declined";
  if (action === "payout-approved") return "Payout approved";
  if (action === "payout-paid") return "Payout marked paid";
  if (action === "marketing-report-saved") return "Marketing report saved";
  if (action === "disclosure-acknowledged") return "Disclosure acknowledged";
  if (action === "disclosure-proof-submitted") return "Disclosure proof submitted";
  if (action === "disclosure-proof-accepted") return "Disclosure proof accepted";
  if (action === "flag-opened") return "Flag opened";
  if (action === "correction-requested") return "Correction requested";
  if (action === "flag-replied") return "Correction reply";
  if (action === "flag-resolved") return "Flag resolved";
  if (action === "agreement-saved") return "Agreement saved";
  if (action === "agreement-signed") return "Agreement signed";
  if (action === "agreement-ended") return "Agreement ended";
  if (action === "content-submitted") return "Post submitted";
  if (action === "content-revised") return "Post updated";
  if (action === "content-approved") return "Post approved";
  if (action === "content-rejected") return "Post rejected";
  if (action === "content-revision-requested") return "Post change requested";
  if (action === "content-withdrawn") return "Post withdrawn";
  if (action === "post-verified") return "Post verified";
  return "Post check failed";
}

export function disclosurePostUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const href = url.toString();
  if (href.length > 500) return null;
  return href;
}

export function complianceNote(value: unknown) {
  return cleanText(value, 500);
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text) return null;
  return text.slice(0, max);
}
