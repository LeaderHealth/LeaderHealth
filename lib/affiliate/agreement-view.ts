import { formatCents, formatWhen } from "./format";
import {
  agreementShowsExpired,
  agreementStatusLabel,
  formatAgreementDate,
  utcAgreementToday,
  type AffiliateAgreement,
} from "./agreements";
import type { AgreementDraftSeed, AgreementView } from "@/components/affiliate/agreement-types";

function amountInput(cents: number | null) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function presentAgreement(agreement: AffiliateAgreement, today = utcAgreementToday()): AgreementView {
  return {
    id: agreement.id,
    statusLabel: agreementStatusLabel(agreement.status, agreement.expiresOn, today),
    effectiveOn: formatAgreementDate(agreement.effectiveOn),
    expiresOn: formatAgreementDate(agreement.expiresOn),
    deliverables: agreement.deliverables.map((item) => ({
      description: item.description,
      dueOn: formatAgreementDate(item.dueOn),
      amount: item.amountCents == null ? "—" : formatCents(item.amountCents),
    })),
    compensationNote: agreement.compensationNote ?? "—",
    licensing: agreement.licensing ?? "—",
    paymentConditions: agreement.paymentConditions ?? "—",
    signerName: agreement.signerName ?? "",
    signedAt: agreement.signedAt ? formatWhen(agreement.signedAt) : "",
    endNote: agreement.endNote ?? "",
    file: Boolean(agreement.filePath),
  };
}

export function agreementSeed(agreement: AffiliateAgreement | null): AgreementDraftSeed {
  return {
    effectiveOn: agreement?.effectiveOn ?? "",
    expiresOn: agreement?.expiresOn ?? "",
    deliverables: agreement?.deliverables.length
      ? agreement.deliverables.map((item) => ({
          description: item.description,
          dueOn: item.dueOn ?? "",
          amount: amountInput(item.amountCents),
        }))
      : [{ description: "", dueOn: "", amount: "" }],
    compensationNote: agreement?.compensationNote ?? "",
    licensing: agreement?.licensing ?? "",
    paymentConditions: agreement?.paymentConditions ?? "",
  };
}

export function agreementEditorState(current: AffiliateAgreement | null, history: AffiliateAgreement[], unavailable: boolean, today = utcAgreementToday()) {
  const expired = Boolean(current && agreementShowsExpired(current.status, current.expiresOn, today));
  return {
    editable: !unavailable && (!current || current.status === "draft" || current.status === "awaiting_signature"),
    canSign: !unavailable && Boolean(current && (current.status === "draft" || current.status === "awaiting_signature") && !current.filePath),
    canEnd: !unavailable && Boolean(current && current.status === "signed" && !expired),
    canReplace: !unavailable && ((current?.status === "signed" && expired) || (!current && history.some((item) => item.status === "ended"))),
    replaceNeedsNote: Boolean(current && current.status === "signed" && expired),
    awaiting: current?.status === "awaiting_signature",
  };
}
