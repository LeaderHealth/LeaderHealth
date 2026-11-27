import { campaignAnswer, type MarketingCampaignRecord } from "./campaign-record";
import { campaignPostState, type CampaignPostState } from "./campaign-list";
import { awaitsManualLinkCheck, type PostFormat } from "./post-format";

export type AffiliateCampaignPost = {
  id: string;
  campaign: string;
  caption: string;
  contentStatus: string;
  publicationStatus: string | null;
  format: PostFormat | null;
  reviewNote: string;
  liveFixNote: string;
  hasFile: boolean;
  createdAt: string | null;
};

export type AffiliateCampaignSlot = {
  key: string;
  postId: string;
  number: string;
  title: string;
  note: string;
  label: string;
  tone: CampaignPostState;
  action: "submit" | "link" | "";
  actionLabel: string;
  hasFile: boolean;
  format: PostFormat | null;
};

export type AffiliateCampaignInvite = {
  name: string;
  description: string;
  content: string;
  due: string;
  guidelines: string;
  terms: string;
  total: string;
  performance: string;
};

export type AffiliateActiveCampaign = {
  name: string;
  content: string;
  due: string;
  terms: string;
  performance: string;
  status: string;
  progressText: string;
  progressPct: number;
  earned: string;
  formats: { value: PostFormat; label: string }[];
  posts: AffiliateCampaignSlot[];
};

export type AffiliatePastCampaign = {
  name: string;
  meta: string;
  label: string;
  tone: "completed" | "declined";
};

const FORMAT_LABEL: Record<PostFormat, string> = {
  tiktok: "TikTok",
  instagram_reel: "Instagram reel",
  instagram_post: "Instagram post",
  facebook_post: "Facebook post",
  facebook_reel: "Facebook reel",
  facebook_video: "Facebook video",
  youtube_short: "YouTube Short",
  youtube_video: "YouTube video",
};

function money(cents: number) {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function dueLabel(value: string) {
  if (!value) return "No deadline";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function sameCampaign(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function rateCents(record: MarketingCampaignRecord, code: string) {
  return record.affiliatePay.find((row) => row.code === code)?.amountCents ?? record.baseAmountCents;
}

function contentLabel(record: MarketingCampaignRecord) {
  const count = record.postsRequired;
  const type = (record.contentTypes[0] ?? "post").toLowerCase();
  const platform = record.platforms.length === 1 ? `${record.platforms[0]} ` : "";
  const word = count === 1 ? type : type === "story" ? "stories" : type.endsWith("s") ? type : `${type}s`;
  if (count < 1) return `${platform}${word}`.trim() || "Posts";
  return `${count} ${platform}${word}`.replace(/\s+/g, " ");
}

export function campaignUploadFormats(record: MarketingCampaignRecord): PostFormat[] {
  const formats: PostFormat[] = [];
  const add = (format: PostFormat) => {
    if (!formats.includes(format)) formats.push(format);
  };
  const types = record.contentTypes;
  const platforms = record.platforms;
  if (types.includes("Reel")) {
    if (platforms.includes("Facebook")) add("facebook_reel");
    if (platforms.includes("Instagram") || platforms.length === 0 || !platforms.includes("Facebook")) add("instagram_reel");
  }
  if (types.includes("Video")) {
    if (platforms.includes("TikTok") || platforms.length === 0) add("tiktok");
    if (platforms.includes("Instagram") || platforms.length === 0) add("instagram_reel");
    if (platforms.includes("Facebook")) add("facebook_video");
    if (platforms.includes("YouTube")) add("youtube_video");
  }
  if (types.includes("Short") && (platforms.includes("YouTube") || platforms.length === 0)) add("youtube_short");
  if (types.includes("Post") && (platforms.includes("Facebook") || platforms.length === 0)) add("facebook_post");
  if (types.includes("Image post") || types.includes("Carousel") || types.includes("Story")) add("instagram_post");
  if (formats.length === 0) {
    if (platforms.length === 1 && platforms[0] === "TikTok") add("tiktok");
    else if (platforms.length === 1 && platforms[0] === "Facebook") add("facebook_post");
    else if (platforms.length === 1 && platforms[0] === "YouTube") add("youtube_video");
    else add("instagram_reel");
  }
  return formats;
}

function slotFor(post: AffiliateCampaignPost | null, index: number, campaign: string): AffiliateCampaignSlot {
  const state = post ? campaignPostState(post) : "todo";
  const fixing = Boolean(post?.liveFixNote) && (state === "verified" || state === "published" || state === "failed");
  const waitingOnCheck = fixing && state === "published";
  const note = fixing
    ? waitingOnCheck
      ? "An admin is confirming the change. If more changes are needed, you’ll paste the link again."
      : post?.liveFixNote || "Update the live post, then paste the link."
    :
    state === "pending"
      ? "Leader Health is reviewing it"
      : state === "changes"
        ? post?.reviewNote || "See the note, then resubmit"
        : state === "ready"
          ? "Publish it with the disclosure and link, then add the URL"
          : state === "published"
            ? "We’re checking the live post"
            : state === "verified"
              ? "Counts toward payment"
              : state === "rejected"
                ? post?.reviewNote || "This post was not approved"
                : state === "failed"
                  ? post?.reviewNote || "Needs a fix"
                  : "Create and submit this post";
  const action: AffiliateCampaignSlot["action"] = fixing
    ? waitingOnCheck ? "" : "link"
    : state === "todo" || state === "changes" ? "submit" : state === "ready" || state === "failed" || (state === "published" && awaitsManualLinkCheck(post?.format ?? null)) ? "link" : "";
  const actionLabel = fixing ? (waitingOnCheck ? "" : "Paste the updated link") : state === "changes" ? "Resubmit" : state === "ready" || state === "failed" || action === "link" ? "Add live link" : "Submit content";
  return {
    key: post?.id || `${campaign}-${index}`,
    postId: post?.id ?? "",
    number: `#${index + 1}`,
    title: `Post ${index + 1}`,
    note,
    label: fixing
      ? state === "published" ? "Waiting for a check" : state === "verified" ? "Live but changes requested" : "Paste the updated link"
      : state === "todo"
        ? "Not started"
        : state === "pending"
          ? "In review"
          : state === "changes"
            ? "Changes requested"
            : state === "ready"
              ? "Ready to publish"
              : state === "published"
                ? "Checking the link"
                : state === "verified"
                  ? "Verified"
                  : state === "rejected"
                    ? "Rejected"
                    : "Needs a fix",
    tone: fixing ? "failed" : state,
    action,
    actionLabel,
    hasFile: Boolean(post?.hasFile),
    format: post?.format ?? null,
  };
}

export function newCampaignInvitations(records: MarketingCampaignRecord[], code: string, posts: { campaign: string; contentStatus: string }[]) {
  return records.filter((record) => {
    if (record.status === "draft" || !record.assignedCodes.includes(code)) return false;
    if (campaignAnswer(record, code)) return false;
    return !posts.some((post) => post.contentStatus !== "withdrawn" && sameCampaign(post.campaign, record.name));
  }).length;
}

export function affiliateCampaignBoard(input: { records: MarketingCampaignRecord[]; posts: AffiliateCampaignPost[]; code: string; today?: string }) {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const invites: AffiliateCampaignInvite[] = [];
  const active: AffiliateActiveCampaign[] = [];
  const past: AffiliatePastCampaign[] = [];
  for (const record of [...input.records].sort((left, right) => left.name.localeCompare(right.name))) {
    if (record.status === "draft" || !record.assignedCodes.includes(input.code)) continue;
    const own = input.posts
      .filter((post) => post.contentStatus !== "withdrawn" && sameCampaign(post.campaign, record.name))
      .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "") || left.id.localeCompare(right.id));
    const answer = campaignAnswer(record, input.code);
    const rate = rateCents(record, input.code);
    const required = record.postsRequired;
    const totalCents = rate;
    const terms = `${money(rate)} for the campaign`;
    const performance = record.performancePay
      ? "Also paid from recorded views, engagements, verified link clicks, and eligible page views."
      : "";
    const content = contentLabel(record);
    const due = dueLabel(record.endsOn);
    if (answer === "declined" && own.length === 0) {
      past.push({ name: record.name, meta: `${content} · ${due}`, label: "Declined", tone: "declined" });
      continue;
    }
    const joined = answer === "accepted" || own.length > 0;
    if (!joined) {
      invites.push({
        name: record.name,
        description: record.description,
        content,
        due,
        guidelines: record.guidelines,
        terms: `${terms} · total`,
        total: money(totalCents),
        performance,
      });
      continue;
    }
    const verified = own.filter((post) => campaignPostState(post) === "verified").length;
    const goal = required > 0 ? required : Math.max(own.length, 1);
    const ended = Boolean(record.endsOn && record.endsOn < today);
    const finished = required > 0 ? verified >= required : own.length > 0 && verified >= own.length;
    if ((ended && (required === 0 || finished)) || (!record.endsOn && required > 0 && finished)) {
      past.push({ name: record.name, meta: `${content} · ${due} · ${money(totalCents)} earned`, label: "Completed", tone: "completed" });
      continue;
    }
    const slots = own.map((post, index) => slotFor(post, index, record.name));
    const slotsNeeded = required > 0 ? required : slots.length === 0 ? 1 : slots.length;
    for (let index = slots.length; index < slotsNeeded; index += 1) slots.push(slotFor(null, index, record.name));
    const earned = required > 0 && verified >= required ? rate : 0;
    active.push({
      name: record.name,
      content,
      due,
      terms,
      performance,
      status: goal > 0 && verified >= goal ? "Completed" : "In progress",
      progressText: `${verified} of ${goal} posts verified`,
      progressPct: goal > 0 ? Math.min(100, Math.round((verified / goal) * 100)) : 0,
      earned: `${money(earned)} of ${money(totalCents)} earned`,
      formats: campaignUploadFormats(record).map((value) => ({ value, label: FORMAT_LABEL[value] })),
      posts: slots,
    });
  }
  return { invites, active, past, newCount: invites.length };
}
