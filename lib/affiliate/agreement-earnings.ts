import { agreementPostTotal, type AgreementPostCount } from "./agreement-partnership";
import { eventPeriod } from "./payment-rates";
import { postMatchesKind } from "./post-agreement";

export type AgreementForEarning = {
  id: string;
  code: string;
  status: "draft" | "awaiting_signature" | "signed" | "ended" | "declined";
  current: boolean;
  effectiveOn: string | null;
  expiresOn: string | null;
  monthlyCents: number | null;
  posts: AgreementPostCount[];
  signedAt: string | null;
  endedAt: string | null;
};

export type PostForEarning = {
  code: string;
  agreementId: string;
  publicationStatus: string | null;
  publishedAt: string | null;
  submittedAt: string | null;
  postingMonth?: string | null;
  format?: string | null;
  fileCount?: number;
  agreementPlatform?: string;
  agreementPostType?: string;
  liveFixNote?: string;
};

export type AgreementPayoutSnapshot = {
  agreementId: string;
  rateCents: number;
  requiredPosts: number;
  verifiedPosts: number;
  amountCents: number;
  status: "approved" | "paid";
};

export type AgreementMonthEarning = {
  agreementId: string;
  requiredPosts: number;
  verifiedPosts: number;
  rateCents: number;
  earnedCents: number;
  status: "earned" | "short" | "none" | "approved" | "paid";
};

const NONE: AgreementMonthEarning = { agreementId: "", requiredPosts: 0, verifiedPosts: 0, rateCents: 0, earnedCents: 0, status: "none" };

type MonthSpan = {
  id: string;
  status: AgreementForEarning["status"];
  effectiveOn: string | null;
  expiresOn: string | null;
  signedAt: string | null;
  endedAt: string | null;
};

export type AgreementCutMonth = {
  period: string;
  edge: "start" | "end";
  date: string;
};

function isDate(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function monthLastDay(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return "";
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${period}-${String(last).padStart(2, "0")}`;
}

function coversFullMonth(start: string | null, end: string | null, period: string) {
  const monthEnd = monthLastDay(period);
  if (!isDate(start) || !isDate(end) || !monthEnd) return false;
  return start <= `${period}-01` && end >= monthEnd;
}

function termEnd(agreement: MonthSpan) {
  const endedOn = agreement.status === "ended" ? agreement.endedAt?.slice(0, 10) ?? null : null;
  if (agreement.status === "ended" && !isDate(endedOn)) return null;
  if (isDate(endedOn) && isDate(agreement.expiresOn)) return endedOn < agreement.expiresOn ? endedOn : agreement.expiresOn;
  return isDate(endedOn) ? endedOn : agreement.expiresOn;
}

function inForce(agreement: MonthSpan, period: string) {
  if (agreement.status !== "signed" && agreement.status !== "ended") return false;
  const start = agreement.effectiveOn ?? agreement.signedAt?.slice(0, 10) ?? null;
  return coversFullMonth(start, termEnd(agreement), period);
}

export function agreementForMonth<T extends AgreementForEarning>(agreements: readonly T[], code: string, period: string): T | null {
  const matches = agreements.filter((agreement) => agreement.code === code && inForce(agreement, period));
  if (!matches.length) return null;
  return matches.find((agreement) => agreement.current) ?? [...matches].sort((left, right) => (right.effectiveOn ?? "").localeCompare(left.effectiveOn ?? ""))[0];
}

export function agreementPostMonth(post: { publishedAt: string | null; submittedAt: string | null; postingMonth?: string | null }) {
  const published = post.publishedAt ? eventPeriod(post.publishedAt) : "";
  if (published) return published;
  if (post.postingMonth && /^\d{4}-\d{2}$/.test(post.postingMonth)) return post.postingMonth;
  return eventPeriod(post.submittedAt || "");
}

function datedSpan(effectiveOn: string | null, expiresOn: string | null) {
  if (!isDate(effectiveOn) || !isDate(expiresOn) || effectiveOn > expiresOn) return [];
  return monthsSpanned(effectiveOn, expiresOn);
}

export function agreementMonthPeriods(effectiveOn: string | null, expiresOn: string | null) {
  if (!isDate(effectiveOn) || !isDate(expiresOn)) return [];
  return datedSpan(effectiveOn, expiresOn).filter((period) => coversFullMonth(effectiveOn, expiresOn, period));
}

export function agreementCutMonths(effectiveOn: string | null, expiresOn: string | null): AgreementCutMonth[] {
  if (!isDate(effectiveOn) || !isDate(expiresOn)) return [];
  return datedSpan(effectiveOn, expiresOn).flatMap((period) => {
    if (coversFullMonth(effectiveOn, expiresOn, period)) return [];
    const cuts: AgreementCutMonth[] = [];
    const monthEnd = monthLastDay(period);
    if (effectiveOn > `${period}-01` && effectiveOn.slice(0, 7) === period) cuts.push({ period, edge: "start", date: effectiveOn });
    if (monthEnd && expiresOn < monthEnd && expiresOn.slice(0, 7) === period) cuts.push({ period, edge: "end", date: expiresOn });
    return cuts;
  });
}

function monthsSpanned(start: string, end: string) {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth || start > end) return [];
  const months: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (months.length < 240) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    if (year === endYear && month === endMonth) break;
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function postingMonthsOverlap(existing: readonly MonthSpan[], next: { id?: string | null; effectiveOn: string | null; expiresOn: string | null }) {
  if (!next.effectiveOn || !next.expiresOn) return false;
  const candidate: MonthSpan = { id: next.id ?? "", status: "signed", effectiveOn: next.effectiveOn, expiresOn: next.expiresOn, signedAt: null, endedAt: null };
  return monthsSpanned(next.effectiveOn, next.expiresOn).some((period) => existing.some((agreement) => agreement.id !== candidate.id && inForce(agreement, period) && inForce(candidate, period)));
}

function kindPost(post: PostForEarning) {
  return {
    format: post.format ?? null,
    fileCount: post.fileCount ?? 0,
    agreementPlatform: post.agreementPlatform ?? "",
    agreementPostType: post.agreementPostType ?? "",
  };
}

function liveAgreementPosts(posts: readonly PostForEarning[], code: string, agreementId: string, period: string) {
  return posts.filter((post) => post.code === code && post.agreementId === agreementId && post.publicationStatus === "tracking_active" && !post.liveFixNote && agreementPostMonth(post) === period);
}

export function verifiedAgreementPosts(posts: readonly PostForEarning[], code: string, agreementId: string, period: string) {
  return liveAgreementPosts(posts, code, agreementId, period).length;
}

function filledSlots(posts: readonly PostForEarning[], kinds: readonly AgreementPostCount[]) {
  return kinds.reduce((sum, kind) => {
    if (kind.count <= 0) return sum;
    const matched = posts.filter((post) => postMatchesKind(kindPost(post), kind.platform, kind.type)).length;
    return sum + Math.min(matched, kind.count);
  }, 0);
}

function everyKindFilled(posts: readonly PostForEarning[], kinds: readonly AgreementPostCount[]) {
  return kinds.every((kind) => kind.count <= 0 || posts.filter((post) => postMatchesKind(kindPost(post), kind.platform, kind.type)).length >= kind.count);
}

export function agreementMonthEarning(input: {
  agreements: readonly AgreementForEarning[];
  posts: readonly PostForEarning[];
  code: string;
  period: string;
  snapshot?: AgreementPayoutSnapshot | null;
}): AgreementMonthEarning {
  if (input.snapshot) {
    const { snapshot } = input;
    return {
      agreementId: snapshot.agreementId,
      requiredPosts: snapshot.requiredPosts,
      verifiedPosts: snapshot.verifiedPosts,
      rateCents: snapshot.rateCents,
      earnedCents: snapshot.amountCents,
      status: snapshot.status,
    };
  }
  const agreement = agreementForMonth(input.agreements, input.code, input.period);
  const rateCents = agreement?.monthlyCents ?? 0;
  if (!agreement || rateCents <= 0) return NONE;
  const requiredPosts = agreementPostTotal(agreement.posts);
  const live = liveAgreementPosts(input.posts, input.code, agreement.id, input.period);
  const verifiedPosts = filledSlots(live, agreement.posts);
  const earned = requiredPosts > 0 && everyKindFilled(live, agreement.posts);
  return {
    agreementId: agreement.id,
    requiredPosts,
    verifiedPosts,
    rateCents,
    earnedCents: earned ? rateCents : 0,
    status: earned ? "earned" : "short",
  };
}

export function agreementEarningNote(earning: AgreementMonthEarning) {
  if (earning.status === "none") return "";
  const live = `${earning.verifiedPosts} of ${earning.requiredPosts} posts verified`;
  if (earning.status === "short") return live;
  return `${live} · monthly rate`;
}
