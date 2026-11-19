import { agreementMonthPeriods, agreementPostMonth } from "./agreement-earnings";
import { agreementPostTotal, type AgreementPostCount } from "./agreement-partnership";

export type AgreementForPost = {
  id: string;
  code: string;
  status: "draft" | "awaiting_signature" | "signed" | "ended" | "declined";
  current: boolean;
  effectiveOn: string | null;
  expiresOn: string | null;
  deliverables: { description: string }[];
  posts?: AgreementPostCount[];
};

export type PostingMonthSlot = {
  period: string;
  label: string;
  used: number;
  limit: number | null;
};

export type PostingAgreement = {
  id: string;
  label: string;
  postTotal: number;
  startsOn: string | null;
  endsOn: string | null;
  months: PostingMonthSlot[];
};

export type MonthFillPost = {
  id: string;
  agreementId: string;
  contentStatus: string;
  offerId: string;
  publishedAt: string | null;
  submittedAt: string | null;
  postingMonth: string;
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

function monthName(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function reservedPostMonth(post: Pick<MonthFillPost, "contentStatus" | "offerId" | "publishedAt" | "submittedAt" | "postingMonth">) {
  if (post.offerId || post.contentStatus === "draft" || post.contentStatus === "rejected" || post.contentStatus === "withdrawn") return "";
  return agreementPostMonth(post);
}

export type AgreementBoardPost = MonthFillPost & {
  publicationStatus: string | null;
  reviewNote: string;
  title: string;
};

export type AgreementBoardSlot = {
  id: string;
  number: number;
  title: string;
  note: string;
  label: string;
  bg: string;
  fg: string;
  actionLabel: string;
  href: string;
  adminNote: string;
  pip: string;
};

export function agreementBoardPeriod(periods: readonly string[], today: string) {
  const month = today.slice(0, 7);
  if (periods.includes(month)) return month;
  return periods.find((period) => period > month) ?? periods.at(-1) ?? "";
}

function boardState(post: AgreementBoardPost): "review" | "changes" | "approved" | "published" | "verified" | "fix" {
  if (post.contentStatus === "revision_requested") return "changes";
  if (post.contentStatus === "submitted") return "review";
  if (post.publicationStatus === "tracking_active") return "verified";
  if (post.publicationStatus === "verification_failed") return "fix";
  if (post.publicationStatus === "verification_pending") return "published";
  if (post.contentStatus === "approved") return "approved";
  return "review";
}

const BOARD_COPY = {
  review: ["In review", "#FBEFD6", "#7A4E00", "Leader Health is checking it. Don’t publish yet.", "", "#E9C98A"],
  changes: ["Changes requested", "#FBE3DF", "#9B2C1F", "Update it and send it again.", "Edit and resend", "#E9C98A"],
  approved: ["Approved", "#33130F", "#FFFFFF", "Publish it now, then add the live link.", "Add live link", "#E9C98A"],
  published: ["Checking your post", "#F3E6E3", "#5A2A24", "We’re confirming the post, disclosure and tracking link.", "", "#E9C98A"],
  verified: ["Verified", "#DDF0E4", "#1D6340", "Done. This post counts toward this month.", "", "#1D6340"],
  fix: ["Needs a fix", "#FBE3DF", "#9B2C1F", "The live post check needs a fix.", "Fix and check again", "#E9C98A"],
} as const;

export function agreementMonthBoard(input: { agreementId: string; postTotal: number; period: string; monthLabel: string; posts: readonly AgreementBoardPost[] }): AgreementBoardSlot[] {
  const filled = input.posts
    .filter((post) => post.agreementId === input.agreementId && reservedPostMonth(post) === input.period)
    .sort((left, right) => (left.submittedAt ?? "").localeCompare(right.submittedAt ?? ""));
  const rows: AgreementBoardSlot[] = filled.map((post, index) => {
    const state = boardState(post);
    const [label, bg, fg, note, actionLabel, pip] = BOARD_COPY[state];
    return {
      id: post.id,
      number: index + 1,
      title: post.title || `Post ${index + 1}`,
      note: state === "verified" && input.monthLabel ? `Done. This post counts toward ${input.monthLabel}.` : note,
      label,
      bg,
      fg,
      actionLabel,
      href: actionLabel ? `/affiliates/posts?post=${encodeURIComponent(post.id)}` : "",
      adminNote: state === "changes" ? post.reviewNote : "",
      pip,
    };
  });
  const total = Math.max(input.postTotal, rows.length);
  while (rows.length < total) {
    const number = rows.length + 1;
    rows.push({
      id: `empty-${number}`,
      number,
      title: `Post ${number}`,
      note: "Create it and send it for approval.",
      label: "Not started",
      bg: "#EFEAE9",
      fg: "#4A3A37",
      actionLabel: "Create post",
      href: "/affiliates/posts?compose=1",
      adminNote: "",
      pip: "#E8DEDC",
    });
  }
  return rows;
}

export function postsFillingMonth(posts: readonly MonthFillPost[], agreementId: string, period: string, excludeIds: ReadonlySet<string> = new Set()) {
  return posts.filter((post) => post.agreementId === agreementId && !excludeIds.has(post.id) && reservedPostMonth(post) === period).length;
}

export function monthCanTake(slot: { limit: number | null; used: number } | undefined, adding: number, batchLimit = 10) {
  if (!slot || adding < 1 || adding > batchLimit) return false;
  if (slot.limit == null) return true;
  return slot.used + adding <= slot.limit;
}

export function openPostingMonth(months: readonly PostingMonthSlot[], today: string) {
  const current = today.slice(0, 7);
  const open = (month: PostingMonthSlot) => month.limit == null || month.used < month.limit;
  return months.find((month) => month.period === current && open(month))?.period
    ?? months.find(open)?.period
    ?? months.find((month) => month.period === current)?.period
    ?? months[0]?.period
    ?? "";
}

export function postingMonthOption(month: PostingMonthSlot) {
  if (month.limit == null) return month.label;
  const left = Math.max(0, month.limit - month.used);
  return left === 0 ? `${month.label} · ${month.limit} of ${month.limit} sent` : `${month.label} · ${left} of ${month.limit} left`;
}

export function postingMonthDateBounds(period: string, startsOn: string | null, endsOn: string | null) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return null;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let min = `${period}-01`;
  let max = `${period}-${String(last).padStart(2, "0")}`;
  if (startsOn && startsOn.slice(0, 7) === period && startsOn > min) min = startsOn;
  if (endsOn && endsOn.slice(0, 7) === period && endsOn < max) max = endsOn;
  if (min > max) return null;
  return { min, max };
}

function monthSlots(agreement: AgreementForPost, posts: readonly MonthFillPost[]): PostingMonthSlot[] {
  const periods = agreementMonthPeriods(agreement.effectiveOn, agreement.expiresOn);
  const total = agreementPostTotal(agreement.posts ?? []);
  return periods.map((period) => ({
    period,
    label: monthName(period),
    used: postsFillingMonth(posts, agreement.id, period),
    limit: total > 0 ? total : null,
  }));
}

export function postingAgreement(agreements: readonly AgreementForPost[], today: string, posts: readonly MonthFillPost[] = []): PostingAgreement | null {
  const current = agreements.find((agreement) => signedAndCurrent(agreement, today));
  if (!current) return null;
  const name = current.deliverables.find((item) => item.description.trim())?.description.trim() || "Your sponsorship agreement";
  const start = dayLabel(current.effectiveOn) || "No start date";
  const end = current.expiresOn ? dayLabel(current.expiresOn) : "No end date";
  return {
    id: current.id,
    label: `${name} · ${start} – ${end}`,
    postTotal: agreementPostTotal(current.posts ?? []),
    startsOn: current.effectiveOn,
    endsOn: current.expiresOn,
    months: monthSlots(current, posts),
  };
}

export function agreementMatchesPost(agreement: AgreementForPost | null, code: string, id: string, today: string) {
  if (!agreement || agreement.id !== id || agreement.code !== code) return false;
  return signedAndCurrent(agreement, today);
}
