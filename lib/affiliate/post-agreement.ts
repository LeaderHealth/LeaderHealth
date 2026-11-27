import { agreementMonthPeriods, agreementPostMonth } from "./agreement-earnings";
import { agreementPostTotal, type AgreementPostCount } from "./agreement-partnership";
import type { PostFormat } from "./post-format";

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
  mix: AgreementPostCount[];
};

export type AgreementKindUse = MonthFillPost & {
  format: string | null;
  fileCount: number;
  agreementPlatform: string;
  agreementPostType: string;
};

export function agreementKindFormat(platform: string, type: string): PostFormat | null {
  if (platform === "TikTok" && type === "Video") return "tiktok";
  if (platform === "Instagram" && type === "Reel") return "instagram_reel";
  if (platform === "Instagram" && (type === "Image post" || type === "Carousel")) return "instagram_post";
  if (platform === "Facebook" && type === "Post") return "facebook_post";
  if (platform === "Facebook" && type === "Reel") return "facebook_reel";
  if (platform === "Facebook" && type === "Video") return "facebook_video";
  if (platform === "YouTube" && type === "Short") return "youtube_short";
  if (platform === "YouTube" && type === "Video") return "youtube_video";
  return null;
}

export function postMatchesKind(post: Pick<AgreementKindUse, "format" | "fileCount" | "agreementPlatform" | "agreementPostType">, platform: string, type: string) {
  if (post.agreementPlatform && post.agreementPostType) return post.agreementPlatform === platform && post.agreementPostType === type;
  if (platform === "TikTok" && type === "Video") return post.format === "tiktok";
  if (platform === "Instagram" && type === "Reel") return post.format === "instagram_reel";
  if (platform === "Instagram" && type === "Carousel") return post.format === "instagram_post" && post.fileCount >= 2;
  if (platform === "Instagram" && type === "Image post") return post.format === "instagram_post" && post.fileCount <= 1;
  if (platform === "Facebook" && type === "Post") return post.format === "facebook_post";
  if (platform === "Facebook" && type === "Reel") return post.format === "facebook_reel";
  if (platform === "Facebook" && type === "Video") return post.format === "facebook_video";
  if (platform === "YouTube" && type === "Short") return post.format === "youtube_short";
  if (platform === "YouTube" && type === "Video") return post.format === "youtube_video";
  return false;
}

export function kindUsedCount(posts: readonly AgreementKindUse[], agreementId: string, period: string, platform: string, type: string, excludeIds: ReadonlySet<string> = new Set()) {
  return posts.filter((post) => post.agreementId === agreementId && !excludeIds.has(post.id) && reservedPostMonth(post) === period && postMatchesKind(post, platform, type)).length;
}

export function postKindTitle(platform: string, type: string) {
  if (platform === "TikTok" && type === "Video") return "TikTok video";
  if (platform === "Instagram" && type === "Reel") return "Instagram reel";
  if (platform === "Instagram" && type === "Carousel") return "Instagram carousel";
  if (platform === "Instagram" && type === "Image post") return "Instagram image";
  return `${platform} ${type.toLowerCase()}`;
}

export function postTypeLabel(post: { agreementPlatform: string; agreementPostType: string; format: string | null; fileCount: number }) {
  if (post.agreementPlatform && post.agreementPostType) return postKindTitle(post.agreementPlatform, post.agreementPostType);
  if (post.format === "tiktok") return "TikTok video";
  if (post.format === "instagram_reel") return "Instagram reel";
  if (post.format === "instagram_post") return post.fileCount > 1 ? "Instagram carousel" : "Instagram image";
  if (post.format === "facebook_post") return "Facebook post";
  if (post.format === "facebook_reel") return "Facebook reel";
  if (post.format === "facebook_video") return "Facebook video";
  if (post.format === "youtube_short") return "YouTube Short";
  if (post.format === "youtube_video") return "YouTube video";
  return post.fileCount > 1 ? `Carousel · ${post.fileCount}` : "";
}

export function postPlaceLabel(post: { offerId: string; agreementId: string; agreementSlot: number | null }, slotNumber: number | null, source = "") {
  if (post.offerId) return source || "Marketing offer";
  const number = slotNumber ?? post.agreementSlot;
  if (number) return `Post ${number}`;
  if (post.agreementId) return "Agreement post";
  return source;
}

export function postIdentity(place: string, type: string) {
  return [place, type].filter(Boolean).join(" · ");
}

export function placedSlotNumber(posts: readonly AgreementBoardPost[], agreementId: string, period: string, total: number, postId: string, kinds: readonly { platform: string; type: string; count: number }[] = []) {
  if (!agreementId || !period) return null;
  return agreementSlotRows(posts, agreementId, period, total, kinds).find((row) => row.post?.id === postId)?.number ?? null;
}

export function agreementSlotState(post: Pick<AgreementBoardPost, "contentStatus" | "publicationStatus" | "liveFixNote"> | null) {
  if (!post) return "Not posted";
  if (post.publicationStatus === "tracking_active" && post.liveFixNote) return "Live but changes requested";
  if (post.publicationStatus === "tracking_active") return "Verified";
  if (post.publicationStatus === "verification_failed") return "Needs a fix";
  if (post.publicationStatus === "verification_pending" && post.liveFixNote) return "Checking the update";
  if (post.publicationStatus === "verification_pending") return "Checking the link";
  if (post.contentStatus === "revision_requested") return "Changes requested";
  if (post.contentStatus === "approved" && (post.publicationStatus === "awaiting_publication" || post.publicationStatus == null)) return "Ready to publish";
  return "In review";
}

export function mixSentence(mix: readonly AgreementPostCount[]) {
  const parts = mix.filter((item) => agreementKindFormat(item.platform, item.type)).map((item) => {
    const name = item.type.toLowerCase();
    const word = item.count === 1 ? name : name.endsWith("y") && !/[aeiou]y$/.test(name) ? `${name.slice(0, -1)}ies` : `${name}s`;
    return `${item.count} ${item.platform} ${word}`;
  });
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

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
  agreementSlot?: number | null;
  format?: string | null;
  fileCount?: number;
  agreementPlatform?: string;
  agreementPostType?: string;
  liveFixNote?: string;
};

function fillingPosts(posts: readonly AgreementBoardPost[], agreementId: string, period: string) {
  return posts
    .filter((post) => post.agreementId === agreementId && reservedPostMonth(post) === period)
    .sort((left, right) => (left.submittedAt ?? "").localeCompare(right.submittedAt ?? ""));
}

function looseSlotRows(filling: readonly AgreementBoardPost[], total: number) {
  const placed = new Map<number, AgreementBoardPost>();
  const loose: AgreementBoardPost[] = [];
  const room = Math.max(total, filling.length);
  for (const post of filling) {
    const slot = post.agreementSlot ?? 0;
    if (slot >= 1 && slot <= room && !placed.has(slot)) placed.set(slot, post);
    else loose.push(post);
  }
  let looseAt = 0;
  const rows: { number: number; post: AgreementBoardPost | null }[] = [];
  for (let number = 1; number <= room; number += 1) {
    const claimed = placed.get(number);
    if (claimed) rows.push({ number, post: claimed });
    else if (looseAt < loose.length) rows.push({ number, post: loose[looseAt++] });
    else rows.push({ number, post: null });
  }
  return rows;
}

function kindFields(post: AgreementBoardPost) {
  return {
    format: post.format ?? null,
    fileCount: post.fileCount ?? 0,
    agreementPlatform: post.agreementPlatform ?? "",
    agreementPostType: post.agreementPostType ?? "",
  };
}

function kindSlotRows(filling: readonly AgreementBoardPost[], kinds: readonly { platform: string; type: string; count: number }[]) {
  const slots: { number: number; platform: string; type: string }[] = [];
  for (const kind of kinds) {
    for (let index = 0; index < kind.count; index += 1) slots.push({ number: slots.length + 1, platform: kind.platform, type: kind.type });
  }
  const placed = new Map<number, AgreementBoardPost>();
  const taken = new Set<string>();
  const verified = filling.filter((post) => post.publicationStatus === "tracking_active");
  const rest = filling.filter((post) => post.publicationStatus !== "tracking_active");
  for (const post of [...verified, ...rest]) {
    if (taken.has(post.id)) continue;
    const preferred = post.agreementSlot ?? 0;
    const preferredSlot = slots.find((slot) => slot.number === preferred && !placed.has(slot.number) && postMatchesKind(kindFields(post), slot.platform, slot.type));
    const slot = preferredSlot ?? slots.find((item) => !placed.has(item.number) && postMatchesKind(kindFields(post), item.platform, item.type));
    if (!slot) continue;
    placed.set(slot.number, post);
    taken.add(post.id);
  }
  return slots.map((slot) => ({ number: slot.number, post: placed.get(slot.number) ?? null }));
}

export function agreementSlotRows(posts: readonly AgreementBoardPost[], agreementId: string, period: string, total: number, kinds: readonly { platform: string; type: string; count: number }[] = []) {
  const filling = fillingPosts(posts, agreementId, period);
  const typed = kinds.filter((kind) => kind.count > 0);
  if (!typed.length) return looseSlotRows(filling, total);
  return kindSlotRows(filling, typed);
}

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

function boardState(post: AgreementBoardPost): "review" | "changes" | "approved" | "published" | "verified" | "liveChanges" | "checkingFix" | "fix" {
  if (post.contentStatus === "revision_requested") return "changes";
  if (post.contentStatus === "submitted") return "review";
  if (post.publicationStatus === "tracking_active" && post.liveFixNote) return "liveChanges";
  if (post.publicationStatus === "tracking_active") return "verified";
  if (post.publicationStatus === "verification_failed") return "fix";
  if (post.publicationStatus === "verification_pending" && post.liveFixNote) return "checkingFix";
  if (post.publicationStatus === "verification_pending") return "published";
  if (post.contentStatus === "approved") return "approved";
  return "review";
}

const BOARD_COPY = {
  review: ["In review", "#FBEFD6", "#7A4E00", "Leader Health is checking it. Don’t publish yet.", "", "#E9C98A"],
  changes: ["Changes requested", "#FBE3DF", "#9B2C1F", "Update it and send it again.", "Edit and resend", "#E9C98A"],
  approved: ["Ready to publish", "#33130F", "#FFFFFF", "Publish it now, then add the live link.", "Add live link", "#E9C98A"],
  published: ["Checking the link", "#F3E6E3", "#5A2A24", "We’re confirming the post, disclosure and tracking link.", "", "#E9C98A"],
  checkingFix: ["Checking the update", "#F3E6E3", "#5A2A24", "An admin is confirming the change. It counts toward this month after that check. If more changes are needed, you’ll paste the link again.", "", "#E9C98A"],
  verified: ["Verified", "#DDF0E4", "#1D6340", "Done. This post counts toward this month.", "", "#1D6340"],
  liveChanges: ["Live but changes requested", "#FBE3DF", "#9B2C1F", "Update the live post, then paste the link. It counts toward this month after an admin verifies that link.", "", "#9B2C1F"],
  fix: ["Needs a fix", "#FBE3DF", "#9B2C1F", "The live post check needs a fix.", "Fix and check again", "#E9C98A"],
} as const;

export function agreementMonthBoard(input: { agreementId: string; postTotal: number; period: string; monthLabel: string; posts: readonly AgreementBoardPost[]; kinds?: readonly { platform: string; type: string; count: number }[] }): AgreementBoardSlot[] {
  return agreementSlotRows(input.posts, input.agreementId, input.period, input.postTotal, input.kinds ?? []).map((row) => {
    if (!row.post) {
      return {
        id: `empty-${row.number}`,
        number: row.number,
        title: `Post ${row.number}`,
        note: "Fill it in and send it for approval.",
        label: "Not started",
        bg: "#EFEAE9",
        fg: "#4A3A37",
        actionLabel: "Fill in",
        href: "/affiliates/posts?compose=1",
        adminNote: "",
        pip: "#E8DEDC",
      };
    }
    const state = boardState(row.post);
    const [label, bg, fg, note, actionLabel, pip] = BOARD_COPY[state];
    return {
      id: row.post.id,
      number: row.number,
      title: row.post.title || `Post ${row.number}`,
      note: state === "verified" && input.monthLabel
        ? `Done. This post counts toward ${input.monthLabel}.`
        : state === "liveChanges" && input.monthLabel
          ? `Update the live post, then paste the link. It counts toward ${input.monthLabel} after an admin verifies that link.`
          : state === "checkingFix" && input.monthLabel
            ? `An admin is confirming the change. It counts toward ${input.monthLabel} after that check. If more changes are needed, you’ll paste the link again.`
            : note,
      label,
      bg,
      fg,
      actionLabel,
      href: actionLabel ? `/affiliates/posts?post=${encodeURIComponent(row.post.id)}` : "",
      adminNote: state === "changes" ? row.post.reviewNote : "",
      pip,
    };
  });
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
    mix: (current.posts ?? []).filter((post) => post.count > 0),
  };
}

export function agreementMatchesPost(agreement: AgreementForPost | null, code: string, id: string, today: string) {
  if (!agreement || agreement.id !== id || agreement.code !== code) return false;
  return signedAndCurrent(agreement, today);
}
