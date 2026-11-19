export type AgreementDeliverableView = {
  description: string;
  dueOn: string;
  amount: string;
};

export type AgreementPhase = "draft" | "waiting" | "active" | "expired" | "ended" | "declined" | "replaced";

export type AgreementView = {
  id: string;
  phase: AgreementPhase;
  statusLabel: string;
  title: string;
  effectiveOn: string;
  effectiveValue: string;
  expiresOn: string;
  expiresValue: string;
  monthly: string;
  monthlyInput: string;
  platforms: string[];
  posts: { platform: string; type: string; count: number }[];
  postTotal: number;
  guidelines: string;
  sentAt: string;
  endedAt: string;
  createdAt: string;
  deliverables: AgreementDeliverableView[];
  compensationNote: string;
  licensing: string;
  paymentConditions: string;
  signerName: string;
  signedAt: string;
  endNote: string;
  file: boolean;
  fileName: string;
  source: AgreementDraftSeed;
  questions: AgreementQuestionView[];
  openQuestion: boolean;
};

export type AgreementQuestionView = {
  id: string;
  text: string;
  askedAt: string;
  reply: string;
  repliedAt: string;
};

export type AgreementDraftSeed = {
  title: string;
  effectiveOn: string;
  expiresOn: string;
  monthly: string;
  platforms: string[];
  posts: { platform: string; type: string; count: number }[];
  guidelines: string;
  deliverables: { description: string; dueOn: string; amount: string }[];
  compensationNote: string;
  licensing: string;
  paymentConditions: string;
};
