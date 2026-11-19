import { agreementPostTotal } from "./agreement-partnership";
import { formatCents, formatWhen } from "./format";
import {
  agreementShowsExpired,
  agreementStatusLabel,
  formatAgreementDate,
  openAgreementQuestion,
  utcAgreementToday,
  type AffiliateAgreement,
} from "./agreements";
import type { AgreementDraftSeed, AgreementView } from "@/components/affiliate/agreement-types";

function amountInput(cents: number | null) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function agreementPhase(agreement: AffiliateAgreement, today: string): AgreementView["phase"] {
  if (agreement.status === "draft") return "draft";
  if (agreement.status === "awaiting_signature") return "waiting";
  if (agreement.status === "ended") return "ended";
  if (agreement.status === "declined") return "declined";
  return agreementShowsExpired(agreement.status, agreement.expiresOn, today) ? "expired" : "active";
}

export function affiliateAgreementPlace(phase: AgreementView["phase"]) {
  if (phase === "waiting" || phase === "declined") return "unaccepted" as const;
  if (phase === "active" || phase === "ended" || phase === "expired") return "accepted" as const;
  return "hidden" as const;
}

export function presentAgreement(agreement: AffiliateAgreement, today = utcAgreementToday()): AgreementView {
  return {
    id: agreement.id,
    phase: agreementPhase(agreement, today),
    statusLabel: agreementStatusLabel(agreement.status, agreement.expiresOn, today),
    title: agreement.title ?? "",
    effectiveOn: formatAgreementDate(agreement.effectiveOn),
    effectiveValue: agreement.effectiveOn ?? "",
    expiresOn: formatAgreementDate(agreement.expiresOn),
    expiresValue: agreement.expiresOn ?? "",
    monthly: agreement.monthlyCents == null ? "" : formatCents(agreement.monthlyCents),
    monthlyInput: amountInput(agreement.monthlyCents),
    platforms: agreement.platforms,
    posts: agreement.posts,
    postTotal: agreementPostTotal(agreement.posts),
    guidelines: agreement.guidelines ?? "",
    sentAt: agreement.sentAt ? formatWhen(agreement.sentAt) : "",
    endedAt: agreement.endedAt ? formatWhen(agreement.endedAt) : "",
    createdAt: agreement.createdAt ? formatWhen(agreement.createdAt) : "",
    deliverables: agreement.deliverables.map((item) => ({
      description: item.description,
      dueOn: item.dueOn ? formatAgreementDate(item.dueOn) : "No set publish-by date",
      amount: item.amountCents == null ? "Standing rate, locked when the post is sent" : `${formatCents(item.amountCents)} per 1,000 views`,
    })),
    compensationNote: agreement.compensationNote ?? "—",
    licensing: agreement.licensing ?? "—",
    paymentConditions: agreement.paymentConditions ?? "—",
    signerName: agreement.signerName ?? "",
    signedAt: agreement.signedAt ? formatWhen(agreement.signedAt) : "",
    endNote: agreement.endNote ?? "",
    file: Boolean(agreement.filePath),
    fileName: agreement.filePath ? (agreement.fileName ?? "agreement.pdf") : "",
    source: agreementSeed(agreement),
    questions: agreement.questions.map((question) => ({
      id: question.id,
      text: question.text,
      askedAt: formatWhen(question.askedAt),
      reply: question.reply ?? "",
      repliedAt: question.repliedAt ? formatWhen(question.repliedAt) : "",
    })),
    openQuestion: agreement.status === "awaiting_signature" && openAgreementQuestion(agreement) != null,
  };
}

export function agreementSeed(agreement: AffiliateAgreement | null): AgreementDraftSeed {
  return {
    title: agreement?.title ?? "",
    effectiveOn: agreement?.effectiveOn ?? "",
    expiresOn: agreement?.expiresOn ?? "",
    monthly: amountInput(agreement?.monthlyCents ?? null),
    platforms: agreement?.platforms ?? [],
    posts: agreement?.posts ?? [],
    guidelines: agreement?.guidelines ?? "",
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
  const questionOpen = Boolean(current && current.status === "awaiting_signature" && openAgreementQuestion(current));
  return {
    editable: !unavailable && (!current || current.status === "draft" || current.status === "awaiting_signature"),
    canSign: !unavailable && !questionOpen && Boolean(current && current.status === "awaiting_signature" && !current.filePath),
    canAccept: !unavailable && !questionOpen && Boolean(current && current.status === "awaiting_signature" && current.filePath),
    canEnd: !unavailable && Boolean(current && current.status === "signed" && !expired),
    canReplace: !unavailable && (current?.status === "draft" || current?.status === "awaiting_signature" || (current?.status === "signed" && expired) || (!current && history.length > 0)),
    replaceNeedsNote: Boolean(current && current.status === "signed" && expired),
    awaiting: current?.status === "awaiting_signature",
  };
}
