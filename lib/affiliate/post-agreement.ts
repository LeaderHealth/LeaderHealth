export type AgreementForPost = {
  id: string;
  code: string;
  status: "draft" | "awaiting_signature" | "signed" | "ended";
  current: boolean;
  effectiveOn: string | null;
  expiresOn: string | null;
  deliverables: { description: string }[];
};

export type PostingAgreement = {
  id: string;
  label: string;
};

function dayLabel(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

function signedAndCurrent(agreement: AgreementForPost, today: string) {
  return agreement.current && agreement.status === "signed" && !(agreement.expiresOn != null && agreement.expiresOn < today);
}

export function postingAgreement(agreements: readonly AgreementForPost[], today: string): PostingAgreement | null {
  const current = agreements.find((agreement) => signedAndCurrent(agreement, today));
  if (!current) return null;
  const name = current.deliverables.find((item) => item.description.trim())?.description.trim() || "Your sponsorship agreement";
  const start = dayLabel(current.effectiveOn) || "No start date";
  const end = current.expiresOn ? dayLabel(current.expiresOn) : "No end date";
  return { id: current.id, label: `${name} · ${start} – ${end}` };
}

export function agreementMatchesPost(agreement: AgreementForPost | null, code: string, id: string, today: string) {
  if (!agreement || agreement.id !== id || agreement.code !== code) return false;
  return signedAndCurrent(agreement, today);
}
