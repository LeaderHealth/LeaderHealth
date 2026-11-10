export type AgreementDeliverableView = {
  description: string;
  dueOn: string;
  amount: string;
};

export type AgreementView = {
  id: string;
  statusLabel: string;
  effectiveOn: string;
  expiresOn: string;
  deliverables: AgreementDeliverableView[];
  compensationNote: string;
  licensing: string;
  paymentConditions: string;
  signerName: string;
  signedAt: string;
  endNote: string;
  file: boolean;
};

export type AgreementDraftSeed = {
  effectiveOn: string;
  expiresOn: string;
  deliverables: { description: string; dueOn: string; amount: string }[];
  compensationNote: string;
  licensing: string;
  paymentConditions: string;
};
