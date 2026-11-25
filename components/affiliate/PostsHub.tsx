"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cancelMetricChangeAction, confirmManualMetricsAction, requestMetricChangeAction, saveManualMetricsAction, submitLiveLinkAction, submitPostsAction, withdrawPostAction } from "@/app/affiliates/post-actions";
import { MediaExpand, MediaPreview } from "@/components/affiliate/MediaExpand";
import { SocialConnectLink } from "@/components/affiliate/SocialConnectPrompt";
import { SlidingTabs } from "@/components/affiliate/SlidingTabs";
import { viewPayFormula } from "@/lib/affiliate/format";
import { POST_FILE_ACCEPT, VIDEO_FILE_ACCEPT, postUploadIssue } from "@/lib/affiliate/post-files";
import { awaitsManualLinkCheck, formatTitle, formatUploadIssue, liveLinkFor, type PostFormat } from "@/lib/affiliate/post-format";
import { AgreementMonthPosts } from "@/components/affiliate/MyAgreement";
import { agreementKindFormat, kindUsedCount, mixSentence, openPostingMonth, postKindTitle, postPlaceLabel, postTypeLabel, postingMonthDateBounds, postingMonthOption, type AgreementBoardSlot, type PostingAgreement } from "@/lib/affiliate/post-agreement";

const POST_BATCH_LIMIT = 10;
const SLIDE_LIMIT = 20;
const CAPTION_LIMIT = 2200;
const ease = [0.22, 1, 0.36, 1] as const;
const STEPS = ["1 Write", "2 Review", "3 Publish", "4 Live"];

function useSoftMotion() {
  const reduced = useReducedMotion();
  if (reduced) return { reduced: true, fade: { duration: 0 } };
  return { reduced: false, fade: { duration: 0.22, ease } };
}

const quietButtonClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium text-ink transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none";
const fieldClass =
  "w-full rounded-xl border border-[#DCCFCC] bg-white px-3.5 py-3 text-sm leading-relaxed text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function CountField({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input name={name} inputMode="numeric" autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} mt-1`} />
    </label>
  );
}

function countText(value: string) {
  return value.trim() ? value.trim() : "Blank";
}

type ChangeDraft = { views: string; likes: string; comments: string; shares: string; saves: string; note: string };

function countFieldValue(value: number | null) {
  return value == null ? "" : String(value);
}

function MetricChangeForm({ post }: { post: HubPost }) {
  const [values, setValues] = useState<ChangeDraft>(() => ({
    views: countFieldValue(post.changeRequest?.views ?? post.counts.views),
    likes: countFieldValue(post.changeRequest?.likes ?? post.counts.likes),
    comments: countFieldValue(post.changeRequest?.comments ?? post.counts.comments),
    shares: countFieldValue(post.changeRequest?.shares ?? post.counts.shares),
    saves: countFieldValue(post.changeRequest?.saves ?? post.counts.saves),
    note: post.changeRequest?.note ?? "",
  }));
  const [draft, setDraft] = useState<ChangeDraft | null>(null);
  if (draft) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4" role="dialog" aria-labelledby="confirm-change-title">
        <h4 id="confirm-change-title" className="text-base font-semibold">Are you sure?</h4>
        <p className="text-sm leading-relaxed text-[#4A3A37]">This sends a change request. The numbers stay as entered until a sub-admin or admin updates them.</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-[#7A5C58]">Views</dt><dd className="mt-1">{countText(draft.views)}</dd></div>
          <div><dt className="text-[#7A5C58]">Likes</dt><dd className="mt-1">{countText(draft.likes)}</dd></div>
          <div><dt className="text-[#7A5C58]">Comments</dt><dd className="mt-1">{countText(draft.comments)}</dd></div>
          <div><dt className="text-[#7A5C58]">Shares</dt><dd className="mt-1">{countText(draft.shares)}</dd></div>
          <div><dt className="text-[#7A5C58]">Saves</dt><dd className="mt-1">{countText(draft.saves)}</dd></div>
        </dl>
        {draft.note.trim() ? <p className="text-sm text-[#4A3A37]">{draft.note.trim()}</p> : null}
        <form action={requestMetricChangeAction} className="flex flex-col gap-2.5 sm:flex-row">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="views" value={draft.views} />
          <input type="hidden" name="likes" value={draft.likes} />
          <input type="hidden" name="comments" value={draft.comments} />
          <input type="hidden" name="shares" value={draft.shares} />
          <input type="hidden" name="note" value={draft.note} />
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Confirm</button>
          <input type="hidden" name="saves" value={draft.saves} />
          <button type="button" onClick={() => setDraft(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink">Cancel</button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {post.changeRequest ? <p className="text-sm leading-relaxed text-[#4A3A37]">A change is waiting for a sub-admin or admin. The numbers on this post stay as entered until then.</p> : null}
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setDraft(values);
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <CountField name="views" label="Views" value={values.views} onChange={(value) => setValues((current) => ({ ...current, views: value }))} />
          <CountField name="likes" label="Likes" value={values.likes} onChange={(value) => setValues((current) => ({ ...current, likes: value }))} />
          <CountField name="comments" label="Comments" value={values.comments} onChange={(value) => setValues((current) => ({ ...current, comments: value }))} />
          <CountField name="shares" label="Shares" value={values.shares} onChange={(value) => setValues((current) => ({ ...current, shares: value }))} />
          <CountField name="saves" label="Saves" value={values.saves} onChange={(value) => setValues((current) => ({ ...current, saves: value }))} />
        </div>
        <label className="block text-sm font-medium text-ink">
          Note
          <textarea name="note" value={values.note} onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))} rows={3} className={`${fieldClass} mt-1`} />
        </label>
        <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink sm:w-auto sm:self-start">Request a change</button>
      </form>
      {post.changeRequest ? (
        <form action={cancelMetricChangeAction}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink sm:w-auto">Cancel request</button>
        </form>
      ) : null}
    </div>
  );
}

type LinkCheck = { label: string; state: "pass" | "fail" | "unknown" };
type HistoryEvent = { label: string; when: string; note: string; tone: "good" | "bad" | "neutral" };
type Filter = "all" | "action" | "review" | "live" | "closed";
type Stage = Filter | "draft" | "checking";

export type HubPost = {
  id: string;
  title: string;
  excerpt: string;
  caption: string;
  status: "draft" | "submitted" | "revision_requested" | "rejected" | "approved" | "withdrawn";
  publication: "awaiting_publication" | "verification_pending" | "tracking_active" | "verification_failed" | null;
  sent: string;
  reviewNote: string;
  postUrl: string | null;
  fileHref: string;
  downloadHref: string;
  hasFile: boolean;
  media: "photo" | "video";
  checks: LinkCheck[];
  headline: string;
  detail: string;
  metrics: { label: string; value: string }[];
  metricsNote: string;
  counts: { views: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null };
  hasManual: boolean;
  changeRequest: { views: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; note: string } | null;
  askManual: boolean;
  connectHref: string | null;
  history: HistoryEvent[];
  slides: { href: string; downloadHref: string; media: "photo" | "video"; caption: string }[];
  batchId: string;
  campaign: string;
  mediaKey: string;
  format: PostFormat | null;
  payLabel: string;
  payDetail: string;
  payAmount: string;
  trackingDays: number;
  source: string;
  agreement: string;
  offerId: string;
  offerBrief: string;
  publishBy: string;
  proposedOn: string;
  postingMonth: string;
  agreementSlot: number | null;
  agreementId: string;
  agreementPlatform: string;
  agreementPostType: string;
};

type Slide = {
  key: string;
  file: File | null;
  fileName: string;
  fileIssue: string;
  caption: string;
  previewUrl: string;
  storedIndex: number | null;
};

type Card = {
  key: string;
  id: string;
  caption: string;
  slides: Slide[];
  format: PostFormat | null;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Action needed" },
  { id: "review", label: "In review" },
  { id: "live", label: "Published" },
  { id: "closed", label: "Closed" },
];

function hasDisclosure(caption: string, line: string) {
  return caption.toLowerCase().includes(line.toLowerCase());
}

function hasTracking(caption: string, url: string, code: string) {
  return caption.includes(url) || caption.toLowerCase().includes(`ref=${code.toLowerCase()}`);
}

function hasBrandTag(caption: string) {
  return caption.toLowerCase().includes("@myleaderhealth");
}

function insertLine(caption: string, line: string, gap: "\n" | "\n\n") {
  if (caption.toLowerCase().includes(line.toLowerCase())) return caption;
  const trimmed = caption.replace(/\s+$/, "");
  return trimmed ? `${trimmed}${gap}${line}` : line;
}

function stageOf(post: HubPost): Stage {
  if (post.status === "draft") return "draft";
  if (post.status === "withdrawn" || post.status === "rejected") return "closed";
  if (post.publication === "tracking_active") return "live";
  if (post.publication === "verification_failed") return "action";
  if (post.publication === "verification_pending") return "checking";
  if (post.status === "submitted") return "review";
  if (post.status === "revision_requested" || post.status === "approved") return "action";
  return "closed";
}

function stageRank(stage: Stage) {
  if (stage === "action") return 0;
  if (stage === "review") return 1;
  if (stage === "checking") return 2;
  if (stage === "live") return 3;
  if (stage === "draft") return 5;
  return 4;
}

function carouselKey(post: HubPost) {
  if (post.status !== "submitted" && post.status !== "revision_requested") return "";
  if (post.slides.length < 2 || !post.mediaKey) return "";
  return `${post.mediaKey}\n${post.caption}`;
}

function submissionGroups(posts: HubPost[]) {
  const groups: HubPost[][] = [];
  const seen = new Map<string, number>();
  for (const post of posts) {
    const key = carouselKey(post);
    if (!key) {
      groups.push([post]);
      continue;
    }
    const index = seen.get(key);
    if (index == null) {
      seen.set(key, groups.length);
      groups.push([post]);
    } else {
      groups[index].push(post);
    }
  }
  return groups;
}

function groupLead(group: HubPost[]) {
  return [...group].sort((left, right) => stageRank(stageOf(left)) - stageRank(stageOf(right)))[0];
}

function slideTotal(group: HubPost[]) {
  return Math.max(...group.map((post) => Math.max(post.slides.length, post.hasFile ? 1 : 0)));
}

function asOnePost(group: HubPost[]): HubPost {
  return groupLead(group);
}

function statusMark(post: HubPost) {
  const stage = stageOf(post);
  if (stage === "live") return { label: "Published", bg: "#DDF0E4", fg: "#1D6340" };
  if (post.publication === "verification_failed") return { label: "Needs a fix", bg: "#FBE3DF", fg: "#9B2C1F" };
  if (post.status === "revision_requested") return { label: "Changes requested", bg: "#FBE3DF", fg: "#9B2C1F" };
  if (post.status === "approved") return { label: "Approved · add link", bg: "#33130F", fg: "#FFFFFF" };
  if (post.publication === "verification_pending") return { label: "Checking the link", bg: "#FBEFD6", fg: "#7A4E00" };
  if (post.status === "submitted") return { label: "In review", bg: "#FBEFD6", fg: "#7A4E00" };
  if (post.status === "draft") return { label: "Draft", bg: "#EFEAE9", fg: "#4A3A37" };
  if (post.status === "withdrawn") return { label: "Withdrawn", bg: "#EFEAE9", fg: "#4A3A37" };
  return { label: "Not approved", bg: "#EFEAE9", fg: "#4A3A37" };
}

function actionCopy(post: HubPost) {
  if (post.status === "revision_requested") return { hint: "Changes requested · see the note", cta: "Edit and resubmit", color: "#9B2C1F" };
  if (post.publication === "verification_failed") {
    const hint = post.headline.toLowerCase().includes("tracking link")
      ? "Link check failed · tracking link missing"
      : post.headline.toLowerCase().includes("sponsorship")
        ? "Link check failed · sponsorship line missing"
        : "Link check failed · see what to fix";
    return { hint, cta: "Fix and check again", color: "#9B2C1F" };
  }
  return { hint: "Approved · publish it, then add the link", cta: publishGuide(post.format).cta, color: "#4A3A37" };
}

function stepIndex(post: HubPost) {
  const stage = stageOf(post);
  if (stage === "live") return 3;
  if (post.status === "revision_requested" || post.status === "draft") return 0;
  if (stage === "review") return 1;
  return 2;
}

function fileLabel(post: HubPost) {
  if (!post.hasFile) return "No file yet";
  if (post.format === "tiktok") return "TikTok video";
  if (post.format === "instagram_reel") return "Instagram reel";
  if (post.format === "instagram_post") return post.slides.length > 1 ? "Carousel" : post.media === "video" ? "Instagram video" : "Instagram photo";
  if (post.format) return formatTitle(post.format);
  return post.media === "video" ? "Approved video" : "Approved photo";
}

function fileIssue(file: File) {
  return postUploadIssue(file);
}

function blankCard(partial?: Partial<Card>): Card {
  return { key: `card-${Math.random().toString(36).slice(2, 10)}`, id: "", caption: "", slides: [], format: null, ...partial };
}

function isCarousel(card: Card) {
  return card.slides.length >= 2;
}

function joinedCaption(card: Card) {
  const parts = (isCarousel(card) ? card.slides.map((slide) => slide.caption) : [card.caption]).map((text) => text.trim()).filter(Boolean);
  return parts.join("\n\n");
}

function makeSlide(file: File): Slide {
  return {
    key: `slide-${Math.random().toString(36).slice(2, 10)}`,
    file,
    fileName: file.name,
    fileIssue: fileIssue(file),
    caption: "",
    previewUrl: URL.createObjectURL(file),
    storedIndex: null,
  };
}

function releaseSlides(slides: Slide[]) {
  for (const slide of slides) {
    if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
  }
}

function applySlides(card: Card, slides: Slide[]): Card {
  const wasCarousel = isCarousel(card);
  const carousel = slides.length >= 2;
  if (!wasCarousel && carousel) {
    const next = slides.map((slide, index) => (index === 0 && !slide.caption.trim() ? { ...slide, caption: card.caption } : slide));
    return { ...card, slides: next, caption: "" };
  }
  if (wasCarousel && !carousel) {
    const caption = card.slides.map((slide) => slide.caption.trim()).filter(Boolean).join("\n\n");
    return { ...card, slides: slides.map((slide) => ({ ...slide, caption: "" })), caption };
  }
  return { ...card, slides };
}

function includesLabel(text: string, disclosureLine: string, trackingUrl: string, code: string) {
  const parts: string[] = [];
  if (hasBrandTag(text)) parts.push("@myleaderhealth");
  if (hasDisclosure(text, disclosureLine)) parts.push("the sponsorship line");
  if (hasTracking(text, trackingUrl, code)) parts.push("your tracking link");
  if (parts.length === 0) return "";
  if (parts.length === 1) return `Includes ${parts[0]}.`;
  return `Includes ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
}

function slideIsVideo(slide: Slide) {
  if (slide.file?.type.startsWith("video/")) return true;
  return /\.(mp4|m4v|webm|mov)$/i.test(slide.fileName) || /video/i.test(slide.fileName);
}

function cardProblem(card: Card, kind: string | null = null) {
  if (!card.format) return "needs a type";
  const issue = card.slides.find((slide) => slide.fileIssue)?.fileIssue ?? "";
  if (issue) return issue;
  if (card.format !== "instagram_post" && card.slides.length > 1) return "needs to be one video";
  if (kind === "Image post" && card.slides.length > 1) return "needs to be one photo";
  const joined = joinedCaption(card);
  if (joined.length > CAPTION_LIMIT) return "These captions together need to stay under 2,200 characters.";
  const missing: string[] = [];
  if (!hasBrandTag(joined)) missing.push("@myleaderhealth");
  if (card.slides.length === 0) missing.push(kind === "Carousel" ? "at least two photos or videos" : kind === "Image post" ? "a photo" : card.format === "instagram_post" ? "at least one photo or video" : "a video");
  else if (kind === "Carousel" && card.slides.length < 2) missing.push("at least two photos or videos");
  return missing.length ? `needs ${joinList(missing)}` : "";
}

function cardReady(card: Card, kind: string | null = null) {
  return cardProblem(card, kind) === "";
}

function joinList(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function looksLikePublishedLink(format: PostFormat | null, value: string) {
  return Boolean(liveLinkFor(format, value));
}

function kindTitle(platform: string, type: string) {
  return postKindTitle(platform, type);
}

function kindDetail(platform: string, type: string) {
  if (type === "Carousel") return "Several photos or videos posted together. The first one is the cover.";
  if (type === "Image post") return "One photo you’ll post on Instagram.";
  if (platform === "Facebook" && type === "Post") return "One photo or video you’ll post on Facebook.";
  return `One video you’ll post on ${platform}.`;
}

function agreementKinds(posting: PostingAgreement | null, sent: HubPost[], period: string) {
  if (!posting) return [];
  const uses = sent.map((post) => ({
    id: post.id,
    agreementId: post.agreementId,
    contentStatus: post.status,
    offerId: post.offerId,
    publishedAt: null,
    submittedAt: null,
    postingMonth: post.postingMonth,
    format: post.format,
    fileCount: post.slides.length || (post.hasFile ? 1 : 0),
    agreementPlatform: post.agreementPlatform,
    agreementPostType: post.agreementPostType,
  }));
  return posting.mix.flatMap((item) => {
    const format = agreementKindFormat(item.platform, item.type);
    if (!format) return [];
    const left = Math.max(0, item.count - kindUsedCount(uses, posting.id, period, item.platform, item.type));
    if (left < 1) return [];
    return [{ platform: item.platform, type: item.type, count: item.count, left, title: kindTitle(item.platform, item.type), detail: kindDetail(item.platform, item.type) }];
  });
}

function standingPayLine(rate: number | null, max: number | null, days: number, engagement: number) {
  if (rate == null) return "A full admin sets your rate per 1,000 views before you can send a post.";
  return `Pay is ${viewPayFormula(rate, max, days, engagement)}. It locks when you send the post.`;
}

const FORMAT_CHOICES: { id: PostFormat; title: string; detail: string }[] = [
  { id: "tiktok", title: "TikTok", detail: "One video you’ll post on TikTok." },
  { id: "instagram_post", title: "Instagram post or carousel", detail: "One photo or video, or several together in a carousel." },
  { id: "instagram_reel", title: "Instagram reel", detail: "One video you’ll post as a reel." },
];

function publishGuide(format: PostFormat | null) {
  if (format === "tiktok") {
    return {
      step: "Publish it on TikTok",
      href: "https://www.tiktok.com/upload",
      open: "Open TikTok",
      label: "Paste your TikTok link",
      hint: "Open the video, tap Share, then Copy link.",
      placeholder: "tiktok.com/@you/video/…",
      error: "That doesn’t look like a TikTok link. It should look like tiktok.com/@you/video/… or vm.tiktok.com/…",
      hold: "Don’t post it on TikTok yet.",
      pending: "An admin confirms the TikTok link. This stays here until that check is done.",
      cta: "Add TikTok link",
    };
  }
  if (format === "facebook_post" || format === "facebook_reel" || format === "facebook_video") {
    const kind = format === "facebook_reel" ? "reel" : format === "facebook_video" ? "video" : "post";
    return {
      step: "Publish it on Facebook",
      href: "https://www.facebook.com/",
      open: "Open Facebook",
      label: `Paste your Facebook ${kind} link`,
      hint: "Open the post, then copy its link.",
      placeholder: "facebook.com/… or fb.watch/…",
      error: "That doesn’t look like a Facebook post, reel, or video link.",
      hold: "Don’t post it on Facebook yet.",
      pending: "An admin confirms the Facebook link. This stays here until that check is done.",
      cta: "Add Facebook link",
    };
  }
  if (format === "youtube_short" || format === "youtube_video") {
    const short = format === "youtube_short";
    return {
      step: short ? "Publish the Short on YouTube" : "Publish it on YouTube",
      href: "https://studio.youtube.com/",
      open: "Open YouTube",
      label: short ? "Paste your YouTube Short link" : "Paste your YouTube link",
      hint: short ? "Open the Short, tap Share, then Copy link." : "Open the video, tap Share, then Copy link.",
      placeholder: short ? "youtube.com/shorts/…" : "youtube.com/watch?v=…",
      error: short ? "That doesn’t look like a YouTube Short link. It should look like youtube.com/shorts/…" : "That doesn’t look like a YouTube link. It should look like youtube.com/watch?v=… or youtu.be/…",
      hold: "Don’t post it on YouTube yet.",
      pending: "An admin confirms the YouTube link. This stays here until that check is done.",
      cta: short ? "Add YouTube Short link" : "Add YouTube link",
    };
  }
  if (format === "instagram_reel") {
    return {
      step: "Publish the reel on Instagram",
      href: "https://www.instagram.com/",
      open: "Open Instagram",
      label: "Paste your reel link",
      hint: "Open the reel, tap ···, then Copy link.",
      placeholder: "instagram.com/reel/…",
      error: "That doesn’t look like an Instagram reel link. It should look like instagram.com/reel/…",
      hold: "Don’t post it on Instagram yet.",
      pending: "This stays here until the caption on Instagram tags @myleaderhealth.",
      cta: "Add reel link",
    };
  }
  return {
    step: "Publish it on Instagram",
    href: "https://www.instagram.com/",
    open: "Open Instagram",
    label: "Paste your post link",
    hint: "On Instagram, tap ··· on your post, then Copy link.",
    placeholder: format === "instagram_post" ? "instagram.com/p/…" : "instagram.com/p/… or instagram.com/reel/…",
    error: format === "instagram_post"
      ? "That doesn’t look like an Instagram post link. It should look like instagram.com/p/…"
      : "That doesn’t look like an Instagram post link. It should look like instagram.com/p/… or instagram.com/reel/…",
    hold: "Don’t post it on Instagram yet.",
    pending: "This stays here until the caption on Instagram tags @myleaderhealth.",
    cta: "Add Instagram link",
  };
}

function submissionLabel(post: HubPost, slides: number) {
  return postTypeLabel({
    agreementPlatform: post.agreementPlatform,
    agreementPostType: post.agreementPostType,
    format: post.format,
    fileCount: slides,
  });
}

function submissionPlace(post: HubPost, slots: AgreementBoardSlot[] | undefined, matchIds: string[]) {
  const slotNumber = slots?.find((slot) => matchIds.includes(slot.id))?.number ?? null;
  return postPlaceLabel(post, slotNumber, post.source);
}

function monthWord(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return "";
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function externalHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function CheckMark() {
  return (
    <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#DDF0E4] text-[#1D6340]">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5L20 7" />
      </svg>
    </span>
  );
}

function EmptyMark() {
  return <span className="size-[22px] shrink-0 rounded-full border-2 border-dashed border-[#B9A8A5]" />;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1.5 self-start text-[13px] text-ink">
      <Chevron direction="left" />
      All posts
    </button>
  );
}

function Progress({ current, live }: { current: number; live?: boolean }) {
  return (
    <ol aria-label="Post progress" className="grid grid-cols-4 gap-2">
      {STEPS.map((label, index) => {
        const active = index === current;
        const filled = index <= current;
        return (
          <li key={label} className="flex flex-col gap-2">
            <div className={`h-1 rounded-full transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${filled ? (active && live ? "bg-[#1D6340]" : "bg-ink") : "bg-[#E8DEDC]"}`} />
            <span className={`text-[13px] ${active ? "font-semibold text-ink" : "text-brown"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Thumb({ post }: { post: HubPost }) {
  const slide = post.slides[0];
  const src = slide?.href || (post.hasFile ? post.fileHref : "");
  const media = slide?.media ?? post.media;
  if (!src) return <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-[#E8DEDC] text-[10px] text-brown">File</span>;
  return (
    <MediaExpand src={src} media={media} label={post.title || "Post"}>
      <MediaPreview src={src} media={media} className="size-11 shrink-0 rounded-[10px] object-cover" />
    </MediaExpand>
  );
}

function CopyControl({ value, label, copiedLabel = "Copied" }: { value: string; label: string; copiedLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={quietButtonClass}
      onClick={async () => {
        if (!(await copyText(value))) return;
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export function PostsHub({
  posts,
  trackingUrl,
  disclosureLine,
  affiliateCode,
  email,
  notice,
  noticeTone,
  agreedFeeCents,
  standingMaxPayCents,
  standingTrackingDays,
  standingEngagementRateCents,
  campaigns,
  focusPostId,
  startCompose = false,
  startCampaign = "",
  posting = null,
  agreementsUnavailable = false,
  agreementPosts = null,
}: {
  posts: HubPost[];
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  email: string;
  notice: string;
  noticeTone: "ok" | "warn";
  agreedFeeCents: number | null;
  standingMaxPayCents: number | null;
  standingTrackingDays: number;
  standingEngagementRateCents: number;
  campaigns: string[];
  focusPostId: string;
  startCompose?: boolean;
  startCampaign?: string;
  posting?: PostingAgreement | null;
  agreementsUnavailable?: boolean;
  agreementPosts?: { id: string; monthName: string; period: string; noMonth: boolean; slots: AgreementBoardSlot[] } | null;
}) {
  const router = useRouter();
  const motionEase = useSoftMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [screen, setScreen] = useState<"hub" | "compose" | "detail">(startCompose ? "compose" : focusPostId ? "detail" : "hub");
  const [selectedId, setSelectedId] = useState<string | null>(focusPostId || null);
  const [cards, setCards] = useState<Card[]>([blankCard()]);
  const [composeCampaign, setComposeCampaign] = useState(campaigns.includes(startCampaign) ? startCampaign : "");
  const [composeMonth, setComposeMonth] = useState(() => openPostingMonth(posting?.months ?? [], new Date().toISOString().slice(0, 10)));
  const [requirement, setRequirement] = useState<number | null>(null);
  const [postKind, setPostKind] = useState<{ platform: string; type: string } | null>(null);
  const [shownNotice, setShownNotice] = useState(notice);
  const [toastHidden, setToastHidden] = useState(false);
  if (notice !== shownNotice) {
    setShownNotice(notice);
    setToastHidden(false);
  }
  const toast = toastHidden ? "" : notice;
  const groups = submissionGroups(posts);
  const selected = (() => {
    const group = groups.find((item) => item.some((post) => post.id === selectedId));
    return group ? asOnePost(group) : null;
  })();
  const actionPosts = groups.filter((group) => stageOf(groupLead(group)) === "action").map(asOnePost);

  function openNumbers(period: string) {
    if (agreementPosts && !agreementPosts.noMonth && period === agreementPosts.period) {
      return agreementPosts.slots.filter((slot) => slot.id.startsWith("empty-")).map((slot) => slot.number);
    }
    const month = posting?.months.find((item) => item.period === period);
    if (!month || month.limit == null) return [];
    return Array.from({ length: Math.max(0, month.limit - month.used) }, (_, index) => month.used + 1 + index);
  }

  if (screen === "compose" && requirement == null) {
    const open = openNumbers(composeMonth);
    if (open[0]) setRequirement(open[0]);
  }

  function openCompose(seed?: HubPost, campaign = seed?.campaign ?? "", slotNumber?: number) {
    const months = posting?.months ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const replacement = seed?.status === "rejected" && months.some((month) => month.period === seed.postingMonth) ? seed.postingMonth : "";
    const period = replacement || (slotNumber && agreementPosts?.period) || openPostingMonth(months, today);
    const open = openNumbers(period);
    setComposeMonth(period);
    const kept = seed?.agreementSlot && seed.agreementSlot >= 1 ? seed.agreementSlot : null;
    setRequirement(slotNumber && open.includes(slotNumber) ? slotNumber : kept && (open.includes(kept) || seed?.status === "revision_requested" || seed?.status === "draft") ? kept : open[0] ?? null);
    const keptKind = seed?.agreementPlatform && seed.agreementPostType ? { platform: seed.agreementPlatform, type: seed.agreementPostType } : null;
    setPostKind(keptKind);
    setComposeCampaign(campaigns.includes(campaign) ? campaign : "");
    setCards((current) => {
      for (const card of current) releaseSlides(card.slides);
      return [
        blankCard(
          seed
            ? {
                caption: seed.caption,
                id: seed.status === "draft" ? seed.id : "",
                format: keptKind ? agreementKindFormat(keptKind.platform, keptKind.type) : posting?.mix.length ? null : seed.format ?? (seed.media === "photo" || seed.slides.length > 1 ? "instagram_post" : null),
                slides:
                  seed.status === "draft" && seed.hasFile
                    ? [
                        {
                          key: `slide-${Math.random().toString(36).slice(2, 10)}`,
                          file: null,
                          fileName: fileLabel(seed),
                          fileIssue: "",
                          caption: "",
                          previewUrl: "",
                          storedIndex: 0,
                        },
                      ]
                    : [],
              }
            : undefined,
        ),
      ];
    });
    setScreen("compose");
  }

  function openDetail(id: string) {
    setSelectedId(id);
    setScreen("detail");
  }

  function openAgreementSlot(slot: AgreementBoardSlot) {
    if (slot.id.startsWith("empty-") || slot.href.includes("compose=1")) openCompose(undefined, "", slot.number);
    else openDetail(slot.id);
  }

  const screenKey = screen === "detail" ? `detail-${selectedId}` : screen;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {screen === "hub" || (screen === "detail" && !selected) ? (
        <motion.div key="hub" initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
              <h2 className="text-[28px] font-medium tracking-tight">Posts</h2>
              <p className="text-sm leading-normal text-brown">
                {posting && mixSentence(posting.mix) ? `Each month: ${mixSentence(posting.mix)}. ` : ""}
                Publish a post after it’s approved, then add the link. {standingPayLine(agreedFeeCents, standingMaxPayCents, standingTrackingDays, standingEngagementRateCents)}
              </p>
            </div>
            <div className="flex flex-wrap items-end justify-end gap-3">
              <button type="button" onClick={() => openCompose()} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none">
                <PlusIcon />
                New post
              </button>
            </div>
          </div>

          {toast ? (
            <div role="status" className={`flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium ${noticeTone === "warn" ? "bg-rose text-ink" : "bg-[#DDF0E4] text-[#1D6340]"}`}>
              <span className="flex-1">{toast}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setToastHidden(true)} className="grid size-8 place-items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
          ) : null}

          {agreementPosts ? (
            <AgreementMonthPosts
              id={agreementPosts.id}
              monthName={agreementPosts.monthName}
              noMonth={agreementPosts.noMonth}
              slots={agreementPosts.slots}
              guidelines=""
              pdfHref={null}
              showFooter={false}
              embedded
              onSlot={openAgreementSlot}
            />
          ) : null}

          {actionPosts.length > 0 ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-base font-semibold">Needs your action</h3>
              {actionPosts.map((post) => {
                const action = actionCopy(post);
                const slides = post.slides.length;
                return (
                  <div key={post.id} className="flex flex-wrap items-center gap-3.5 rounded-2xl bg-background px-4 py-3.5">
                    <Thumb post={post} />
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="truncate text-sm">{post.title}</p>
                      <p className="mt-1 text-xs font-medium" style={{ color: action.color }}>{submissionLabel(post, slides) ? `${submissionLabel(post, slides)} · ${action.hint}` : action.hint}</p>
                    </div>
                    <button type="button" onClick={() => openDetail(post.id)} className="inline-flex h-10 items-center rounded-full bg-ink px-[18px] text-sm font-medium text-white transition-colors duration-200 hover:bg-brown motion-reduce:transition-none">
                      {action.cta}
                    </button>
                  </div>
                );
              })}
            </section>
          ) : null}

          <section className="flex flex-col gap-3.5">
            <h3 className="text-base font-semibold">All submissions</h3>
            <SlidingTabs
              variant="track"
              label="Filter by status"
              items={FILTERS.map((item) => ({
                id: item.id,
                label: item.label,
                note: String(item.id === "all" ? groups.length : groups.filter((group) => stageOf(groupLead(group)) === item.id).length),
                current: filter === item.id,
                onSelect: () => setFilter(item.id),
              }))}
            />
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {groups.filter((group) => filter === "all" || stageOf(groupLead(group)) === filter).map((group) => {
                  const post = asOnePost(group);
                  const mark = statusMark(post);
                  const slides = slideTotal(group);
                  const label = submissionLabel(post, slides);
                  const sent = post.status === "draft" ? "Not sent yet" : post.sent ? `Sent ${post.sent}` : "";
                  const place = submissionPlace(post, agreementPosts?.slots, group.map((item) => item.id));
                  const meta = [place, label, post.postingMonth ? monthWord(post.postingMonth) : "", post.campaign, sent].filter(Boolean).join(" · ");
                  return (
                    <motion.div key={post.batchId || post.id} layout initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade}>
                      <div className="flex min-h-11 w-full items-center gap-3.5 border-t border-[#F0E8E6] px-1 py-3 text-left text-ink">
                        <Thumb post={post} />
                        <button type="button" onClick={() => (post.status === "draft" ? openCompose(post) : openDetail(post.id))} className="flex min-w-0 flex-1 items-center gap-3.5 text-left transition-colors duration-200 hover:opacity-80 motion-reduce:transition-none">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{post.title}</span>
                            <span className="mt-0.5 block text-xs text-brown">{meta}</span>
                            {post.payLabel ? <span className="mt-0.5 block text-xs text-brown">{post.payLabel}{post.payAmount ? ` · ${post.payAmount}` : ""}</span> : null}
                          </span>
                          <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
                          <Chevron direction="right" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {groups.filter((group) => filter === "all" || stageOf(groupLead(group)) === filter).length === 0 ? (
                <p className="border-t border-[#F0E8E6] px-1 py-7 text-sm text-brown">
                  {filter === "all" && agreementPosts && !agreementPosts.noMonth && agreementPosts.slots.some((slot) => slot.id.startsWith("empty-"))
                    ? `Nothing sent yet. Create the ${agreementPosts.monthName} posts above and send each one for approval.`
                    : "Nothing here yet."}
                </p>
              ) : null}
            </div>
          </section>
        </motion.div>
      ) : screen === "compose" ? (
        <motion.div key={screenKey} initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade}>
          <Composer
            cards={cards}
            setCards={setCards}
            trackingUrl={trackingUrl}
            disclosureLine={disclosureLine}
            affiliateCode={affiliateCode}
            agreedFeeCents={agreedFeeCents}
            standingMaxPayCents={standingMaxPayCents}
            standingTrackingDays={standingTrackingDays}
            standingEngagementRateCents={standingEngagementRateCents}
            campaign={composeCampaign}
            initialMonth={composeMonth}
            posting={posting}
            agreementsUnavailable={agreementsUnavailable}
            requirement={requirement}
            onRequirement={setRequirement}
            openNumbers={openNumbers}
            monthName={agreementPosts?.period === composeMonth ? agreementPosts.monthName : ""}
            postKind={postKind}
            onPostKind={setPostKind}
            posts={posts}
            onBack={() => (startCompose ? router.push("/affiliates/posts") : setScreen("hub"))}
          />
        </motion.div>
      ) : selected ? (
        <motion.div key={screenKey} initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade}>
          <PostDetail
            key={selected.id}
            post={selected}
            email={email}
            trackingUrl={trackingUrl}
            disclosureLine={disclosureLine}
            affiliateCode={affiliateCode}
            onBack={() => setScreen("hub")}
            onReuse={() => openCompose(selected)}
            campaigns={campaigns}
            posting={posting}
            agreementsUnavailable={agreementsUnavailable}
            slots={agreementPosts?.slots}
            onComposeCampaign={(name) => openCompose(undefined, name)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Composer({
  cards,
  setCards,
  trackingUrl,
  disclosureLine,
  affiliateCode,
  agreedFeeCents,
  standingMaxPayCents,
  standingTrackingDays,
  standingEngagementRateCents,
  campaign,
  initialMonth,
  posting,
  agreementsUnavailable,
  requirement,
  onRequirement,
  openNumbers,
  monthName,
  postKind,
  onPostKind,
  posts,
  onBack,
}: {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  agreedFeeCents: number | null;
  standingMaxPayCents: number | null;
  standingTrackingDays: number;
  standingEngagementRateCents: number;
  campaign: string;
  initialMonth: string;
  posting: PostingAgreement | null;
  agreementsUnavailable: boolean;
  requirement: number | null;
  onRequirement: (value: number | null) => void;
  openNumbers: (period: string) => number[];
  monthName: string;
  postKind: { platform: string; type: string } | null;
  onPostKind: (value: { platform: string; type: string } | null) => void;
  posts: HubPost[];
  onBack: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [postingMonth, setPostingMonth] = useState(() => {
    const months = posting?.months ?? [];
    return months.some((month) => month.period === initialMonth) ? initialMonth : openPostingMonth(months, new Date().toISOString().slice(0, 10));
  });
  const [proposedOn, setProposedOn] = useState("");
  const [limitNote, setLimitNote] = useState("");
  const monthSlot = posting?.months.find((month) => month.period === postingMonth) ?? null;
  const monthRoom = monthSlot == null || monthSlot.limit == null ? POST_BATCH_LIMIT : Math.max(0, monthSlot.limit - monthSlot.used);
  const monthBlocked = monthSlot != null && monthSlot.limit != null && cards.length > monthRoom;
  const noFullMonth = posting != null && posting.months.length === 0;
  const dateBounds = monthSlot ? postingMonthDateBounds(monthSlot.period, posting?.startsOn ?? null, posting?.endsOn ?? null) : null;
  const readyCount = cards.filter((card) => cardReady(card, postKind?.type ?? null)).length;
  const blocked = cards
    .map((card, index) => ({ card, index, problem: cardProblem(card, postKind?.type ?? null) }))
    .find((item) => item.problem);
  const hint = noFullMonth
    ? "These dates don't include a full month, so posts can't be sent under this agreement."
    : monthBlocked
    ? monthRoom === 0
      ? `${monthSlot.label} already has its ${monthSlot.limit} posts. Choose another month.`
      : `This send is ${cards.length} ${cards.length === 1 ? "post" : "posts"}. ${monthSlot.label} can take ${monthRoom} more.`
    : blocked
      ? blocked.problem.startsWith("needs ")
        ? `Post ${blocked.index + 1} ${blocked.problem}.`
        : `Post ${blocked.index + 1}: ${blocked.problem}`
      : agreementsUnavailable
        ? "Your agreement could not be loaded. Try again before sending."
        : !posting
          ? "A signed agreement has to be on your account before you can send a post."
          : agreedFeeCents == null
          ? "A full admin needs to set your rate per 1,000 views before you can send a post."
          : !requirement
            ? "Choose the agreement post you are filling in."
          : (posting?.mix.length ?? 0) > 0 && !postKind
            ? "Choose the type of post this agreement asks for."
          : !proposedOn
            ? "Choose a proposed publishing date."
            : standingPayLine(agreedFeeCents, standingMaxPayCents, standingTrackingDays, standingEngagementRateCents);
  const needsKind = Boolean(posting?.mix.some((item) => agreementKindFormat(item.platform, item.type)));
  const canSend = cards.length > 0 && !blocked && !monthBlocked && !noFullMonth && !pending && posting != null && agreedFeeCents != null && requirement != null && proposedOn !== "" && (!needsKind || postKind != null);

  function update(key: string, patch: Partial<Card>) {
    setCards(cards.map((card) => (card.key === key ? { ...card, ...patch } : card)));
  }

  function clearFormat(key: string) {
    const card = cards.find((item) => item.key === key);
    if (card) releaseSlides(card.slides);
    setCards(cards.map((item) => (item.key === key ? { ...item, format: null, slides: [] } : item)));
    onPostKind(null);
    setLimitNote("");
  }

  function chooseKind(key: string, platform: string, type: string) {
    const format = agreementKindFormat(platform, type);
    if (!format) return;
    onPostKind({ platform, type });
    chooseFormat(key, format);
  }

  function chooseFormat(key: string, format: PostFormat) {
    setCards(cards.map((item) => {
      if (item.key !== key) return item;
      const keep = item.slides.length > 0
        && (format === "instagram_post" || item.slides.length === 1)
        && item.slides.every((slide) => (format === "instagram_post" || slideIsVideo(slide)) && !slide.fileIssue);
      if (!keep) releaseSlides(item.slides);
      return { ...item, format, slides: keep ? item.slides : [] };
    }));
    setLimitNote("");
  }

  function addFiles(key: string, list: File[]) {
    const incoming = list.filter((file) => file.size > 0);
    if (!incoming.length) return;
    const card = cards.find((item) => item.key === key);
    if (!card?.format) return;
    if (card.format !== "instagram_post" || postKind?.type === "Image post") {
      const file = incoming[0];
      const slide = makeSlide(file);
      slide.fileIssue = postKind?.type === "Image post" && slideIsVideo(slide) ? "An image post needs a PNG, JPEG, or WebP photo under 8 MB." : formatUploadIssue(card.format, file);
      releaseSlides(card.slides);
      setCards(cards.map((item) => (item.key === key ? { ...item, slides: [slide] } : item)));
      setLimitNote(incoming.length > 1 ? `${postKind?.type === "Image post" ? "An image post is one photo" : formatTitle(card.format) + " is one video"}. The first file was kept.` : "");
      return;
    }
    const room = SLIDE_LIMIT - card.slides.length;
    const accepted = incoming.slice(0, Math.max(room, 0));
    if (!accepted.length) {
      setLimitNote("A carousel can hold 20 photos or videos.");
      return;
    }
    const added = accepted.map((file) => {
      const slide = makeSlide(file);
      slide.fileIssue = formatUploadIssue("instagram_post", file);
      return slide;
    });
    setCards(cards.map((item) => (item.key === key ? applySlides(item, [...item.slides, ...added]) : item)));
    setLimitNote(incoming.length > room ? "A carousel can hold 20 photos or videos. The extra files were left out." : "");
  }

  function removeSlide(key: string, slideKey: string) {
    const card = cards.find((item) => item.key === key);
    const removed = card?.slides.find((slide) => slide.key === slideKey);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    setCards(cards.map((item) => (item.key === key ? applySlides(item, item.slides.filter((slide) => slide.key !== slideKey)) : item)));
  }

  function moveSlide(key: string, index: number, direction: -1 | 1) {
    setCards(
      cards.map((card) => {
        if (card.key !== key) return card;
        const target = index + direction;
        if (target < 0 || target >= card.slides.length) return card;
        const slides = card.slides.slice();
        const [item] = slides.splice(index, 1);
        slides.splice(target, 0, item);
        return { ...card, slides };
      }),
    );
  }

  function updateSlide(key: string, slideKey: string, caption: string) {
    setCards(
      cards.map((card) =>
        card.key === key ? { ...card, slides: card.slides.map((slide) => (slide.key === slideKey ? { ...slide, caption } : slide)) } : card,
      ),
    );
  }

  function insertRequirement(key: string, line: string, gap: "\n" | "\n\n") {
    setCards(
      cards.map((card) => {
        if (card.key !== key) return card;
        if (!isCarousel(card)) return { ...card, caption: insertLine(card.caption, line, gap) };
        return {
          ...card,
          slides: card.slides.map((slide, index) => (index === 0 ? { ...slide, caption: insertLine(slide.caption, line, gap) } : slide)),
        };
      }),
    );
  }

  async function send() {
    if (!canSend) return;
    const data = new FormData();
    data.set("count", String(cards.length));
    if (posting) data.set("agreement", posting.id);
    if (postingMonth) data.set("postingMonth", postingMonth);
    if (requirement) data.set("requirement", String(requirement));
    if (postKind) {
      data.set("agreementPlatform", postKind.platform);
      data.set("agreementPostType", postKind.type);
    }
    if (agreedFeeCents != null) data.set("terms", "yes");
    data.set("proposedPublishOn", proposedOn);
    cards.forEach((card, index) => {
      const slideCaptions = isCarousel(card) ? card.slides.map((slide) => slide.caption) : [card.caption];
      data.set(`caption${index}`, joinedCaption(card));
      data.set(`id${index}`, card.id);
      data.set(`format${index}`, card.format ?? "");
      data.set("campaign", campaign);
      data.set(`slots${index}`, String(card.slides.length));
      data.set(`slideCount${index}`, String(slideCaptions.length));
      slideCaptions.forEach((caption, slideIndex) => data.set(`slideCaption${index}_${slideIndex}`, caption));
      card.slides.forEach((slide, slideIndex) => {
        if (slide.file && slide.file.size > 0) data.set(`file${index}_${slideIndex}`, slide.file);
        else if (slide.storedIndex != null) data.set(`slot${index}_${slideIndex}`, `existing:${slide.storedIndex}`);
      });
    });
    setPending(true);
    try {
      await submitPostsAction(data);
    } finally {
      setPending(false);
    }
  }
  const showAnother = false;

  if (!posting) {
    return (
      <div className="flex flex-col gap-[22px]">
        <BackButton onClick={onBack} />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[28px] font-medium tracking-tight">New posts</h2>
          <p className="text-sm leading-normal text-brown">Sign an agreement before you can send a post.</p>
        </div>
        <AgreementLine posting={posting} unavailable={agreementsUnavailable} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <BackButton onClick={onBack} />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] font-medium tracking-tight">{requirement ? `Post ${requirement}` : "Choose a post"}</h2>
        <p className="text-sm leading-normal text-brown">{`Fill in this ${monthName || "agreement"} post and send it for approval.`}</p>
      </div>
      <AgreementLine posting={posting} unavailable={agreementsUnavailable} />
      {!posting?.months.length ? null : (
        <label className="flex max-w-md flex-col gap-2 text-sm font-medium" htmlFor="posting-month">
          Month this post counts toward
          <select
            id="posting-month"
            value={postingMonth}
            onChange={(event) => {
              const next = event.target.value;
              setPostingMonth(next);
              setProposedOn((current) => (current && current.slice(0, 7) !== next ? "" : current));
              const open = openNumbers(next);
              onRequirement(open.includes(requirement ?? -1) ? requirement : open[0] ?? null);
              if (postKind && !agreementKinds(posting, posts, next).some((item) => item.platform === postKind.platform && item.type === postKind.type) && cards[0]) clearFormat(cards[0].key);
            }}
            className={fieldClass}
          >
            {posting.months.map((month) => <option key={month.period} value={month.period}>{postingMonthOption(month)}</option>)}
          </select>
        </label>
      )}
      {!posting?.months.length ? null : (
        <label className="flex max-w-md flex-col gap-2 text-sm font-medium" htmlFor="post-requirement">
          Which post are you filling in?
          <select
            id="post-requirement"
            value={requirement ?? ""}
            onChange={(event) => onRequirement(Number(event.target.value) || null)}
            className={fieldClass}
          >
            {(() => {
              const open = openNumbers(postingMonth);
              const choices = requirement && !open.includes(requirement) ? [...open, requirement].sort((left, right) => left - right) : open;
              return choices.length === 0 ? <option value="">No open posts this month</option> : choices.map((number) => <option key={number} value={number}>Post {number}</option>);
            })()}
          </select>
          <span className="text-sm font-normal leading-normal text-brown">This is the agreement post the file and caption will count toward.</span>
        </label>
      )}
      {posting?.months.length ? (
        <label className="flex max-w-xs flex-col gap-2 text-sm font-medium" htmlFor="proposed-publish-on">
          Proposed publishing date
          <input id="proposed-publish-on" type="date" required min={dateBounds?.min} max={dateBounds?.max} value={proposedOn} onChange={(event) => setProposedOn(event.target.value)} className={fieldClass} />
          <span className="text-sm font-normal leading-normal text-brown">Required. The date has to fall in the month above.</span>
        </label>
      ) : null}
      {cards.length === 1 && !cards[0]?.format ? (
        needsKind ? <KindChoices kinds={agreementKinds(posting, posts, postingMonth)} onChoose={(kind) => chooseKind(cards[0].key, kind.platform, kind.type)} /> : <FormatPicker onChoose={(format) => chooseFormat(cards[0].key, format)} />
      ) : (
      <>
      <Progress current={0} />
      {cards.map((card, index) => {
        const carousel = isCarousel(card);
        const ready = cardReady(card, postKind?.type ?? null);
        const videoPost = card.format != null && card.format !== "instagram_post" && card.format !== "facebook_post";
        const fileTitle = postKind ? kindTitle(postKind.platform, postKind.type) : card.format === "tiktok" ? "TikTok video" : card.format === "instagram_reel" ? "Reel" : "Photos or videos";
        const addLabel = !card.slides.length
          ? postKind?.type === "Carousel"
            ? "Add the carousel"
            : postKind?.type === "Image post"
              ? "Add the photo"
              : card.format === "facebook_post"
                ? "Add the photo or video"
                : videoPost && card.format
                  ? `Add the ${formatTitle(card.format).toLowerCase()}`
                  : "Add photos or videos"
          : postKind?.type === "Image post"
            ? "Replace the photo"
            : "Add another photo or video";
        const addHint = postKind?.type === "Carousel"
          ? "At least two. The first one is the cover."
          : postKind?.type === "Image post"
            ? "One PNG, JPEG, or WebP under 8 MB."
          : videoPost
          ? "One MP4, MOV, or WebM, up to 200 MB."
          : "Select one photo or video, or several for a carousel. The first one is the cover.";
        const limitCopy = videoPost && card.format
          ? `${formatTitle(card.format)} is one MP4, MOV, or WebM, and it can be up to 200 MB.`
          : "Photos need to be PNG, JPEG, or WebP under 8 MB. A video can be an MP4, MOV, or WebM up to 200 MB.";
        return (
          <article key={card.key} className="flex flex-col gap-4 rounded-[18px] bg-background p-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-semibold">{requirement ? `Post ${requirement}` : `Post ${index + 1}`}</span>
              {card.format ? <span className="text-[13px] text-brown">{postKind ? kindTitle(postKind.platform, postKind.type) : carousel ? `Carousel · ${card.slides.length}` : formatTitle(card.format)}</span> : null}
              {card.format ? (
                <button type="button" onClick={() => clearFormat(card.key)} className="text-[13px] text-brown underline underline-offset-4">Change</button>
              ) : null}
              {ready ? <span className="rounded-full bg-[#DDF0E4] px-2 py-0.5 text-xs font-semibold text-[#1D6340]">Ready</span> : null}
              <span className="flex-1" />
              {cards.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove post ${index + 1}`}
                  onClick={() => {
                    releaseSlides(card.slides);
                    setCards(cards.filter((item) => item.key !== card.key));
                  }}
                  className="grid size-9 place-items-center rounded-full text-brown hover:bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 13h10l1-13" />
                    <path d="M9 7V4h6v3" />
                  </svg>
                </button>
              ) : null}
            </div>
            {card.format ? (
            <>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{fileTitle}</span>
                <span className="text-[13px] text-brown">{videoPost ? (card.slides.length ? "1 video" : "One video") : card.slides.length ? `${card.slides.length} of ${SLIDE_LIMIT}` : `Up to ${SLIDE_LIMIT}`}</span>
              </div>
              {carousel ? (
                <div className="flex flex-col gap-3">
                  {card.slides.map((slide, slideIndex) => {
                    const label = includesLabel(slide.caption, disclosureLine, trackingUrl, affiliateCode);
                    return (
                      <div key={slide.key} className="flex flex-col gap-3 rounded-2xl border border-[#E8DEDC] bg-white p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{slideIndex + 1}</span>
                          {slide.previewUrl ? (
                            <MediaExpand src={slide.previewUrl} media={slideIsVideo(slide) ? "video" : "photo"} label={`Slide ${slideIndex + 1}`}>
                              {slideIsVideo(slide) ? (
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8DEDC] text-[10px] text-brown">Video</span>
                              ) : (
                                <Image src={slide.previewUrl} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg object-cover" />
                              )}
                            </MediaExpand>
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8DEDC] text-[10px] text-brown">{slideIsVideo(slide) ? "Video" : "File"}</span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-sm">{slide.fileName}</span>
                          {slideIndex === 0 ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] font-medium text-[#4A3A37]">Cover</span> : null}
                          <button type="button" aria-label={`Move slide ${slideIndex + 1} earlier`} disabled={slideIndex === 0} onClick={() => moveSlide(card.key, slideIndex, -1)} className="grid size-8 place-items-center rounded-full text-brown enabled:hover:bg-background disabled:opacity-30">
                            <Chevron direction="left" />
                          </button>
                          <button type="button" aria-label={`Move slide ${slideIndex + 1} later`} disabled={slideIndex === card.slides.length - 1} onClick={() => moveSlide(card.key, slideIndex, 1)} className="grid size-8 place-items-center rounded-full text-brown enabled:hover:bg-background disabled:opacity-30">
                            <Chevron direction="right" />
                          </button>
                          <button type="button" aria-label={`Remove slide ${slideIndex + 1}`} onClick={() => removeSlide(card.key, slide.key)} className="grid size-8 place-items-center rounded-full text-brown hover:bg-background">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                              <path d="M6 6l12 12" />
                              <path d="M18 6L6 18" />
                            </svg>
                          </button>
                        </div>
                        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={`slide-${slide.key}`}>
                          Caption for slide {slideIndex + 1}
                          <textarea id={`slide-${slide.key}`} rows={3} value={slide.caption} placeholder="Write the caption for this slide…" onChange={(event) => updateSlide(card.key, slide.key, event.target.value)} className={`${fieldClass} resize-y`} />
                        </label>
                        {label ? <p className="text-[13px] text-brown">{label}</p> : null}
                        {slide.fileIssue ? <p className="text-[13px] text-[#9B2C1F]">{slide.fileIssue}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : card.slides[0] ? (
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#E8DEDC] bg-white p-3">
                  {card.slides[0].previewUrl ? (
                    <MediaExpand src={card.slides[0].previewUrl} media={slideIsVideo(card.slides[0]) ? "video" : "photo"} label="Photo or video">
                      {slideIsVideo(card.slides[0]) ? (
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8DEDC] text-[10px] text-brown">Video</span>
                      ) : (
                        <Image src={card.slides[0].previewUrl} alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg object-cover" />
                      )}
                    </MediaExpand>
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8DEDC] text-[10px] text-brown">{slideIsVideo(card.slides[0]) ? "Video" : "File"}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm">{card.slides[0].fileName}</span>
                  <button type="button" aria-label={videoPost ? "Remove video" : "Remove photo or video"} onClick={() => removeSlide(card.key, card.slides[0].key)} className="grid size-8 place-items-center rounded-full text-brown hover:bg-background">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ) : null}
              {(videoPost ? card.slides.length === 0 : card.slides.length < SLIDE_LIMIT) ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#CDBDBA] bg-white px-4 py-4 text-center hover:bg-background">
                  <input
                    type="file"
                    multiple={!videoPost}
                    accept={videoPost ? VIDEO_FILE_ACCEPT : POST_FILE_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      addFiles(card.key, Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                    <UploadIcon />
                    {addLabel}
                  </span>
                  <span className="text-[13px] text-brown">{addHint}</span>
                </label>
              ) : null}
              <p className="text-[13px] leading-relaxed text-brown">{limitCopy}</p>
              {!carousel && card.slides[0]?.fileIssue ? <p className="text-[13px] text-[#9B2C1F]">{card.slides[0].fileIssue}</p> : null}
              {carousel ? (
                <p className="text-[13px] leading-relaxed text-brown">Each slide has its own caption, and every slide caption is reviewed. Tag @myleaderhealth so the post can track. The sponsorship line and tracking link are optional. Slide 1 is best, since the cover is seen first.</p>
              ) : null}
            </div>
            {carousel ? null : (
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={`caption-${card.key}`}>
                Caption
                <textarea id={`caption-${card.key}`} rows={5} value={card.caption} placeholder="Write your caption…" onChange={(event) => update(card.key, { caption: event.target.value })} className={`${fieldClass} resize-y`} />
              </label>
            )}
            <CaptionChecker
              carousel={carousel}
              captions={carousel ? card.slides.map((slide) => slide.caption) : [card.caption]}
              disclosureLine={disclosureLine}
              trackingUrl={trackingUrl}
              code={affiliateCode}
              onInsert={(line, gap) => insertRequirement(card.key, line, gap)}
            />
            </>
            ) : (
              needsKind ? <KindChoices kinds={agreementKinds(posting, posts, postingMonth)} onChoose={(kind) => chooseKind(card.key, kind.platform, kind.type)} /> : <FormatPicker onChoose={(format) => chooseFormat(card.key, format)} />
            )}
          </article>
        );
      })}
      {showAnother ? (
        <button type="button" onClick={() => setCards(cards.concat(blankCard()))} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#CDBDBA] bg-white text-sm font-medium text-ink hover:bg-background">
          <PlusIcon />
          Add another post
        </button>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#E8DEDC] pt-5">
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-sm font-semibold">{cards.length === 1 ? "1 post" : `${cards.length} posts`} · {readyCount} ready</p>
          {limitNote ? <p className="text-[13px] text-[#9B2C1F]">{limitNote}</p> : null}
          <p className={`text-[13px] ${blocked || !requirement || !proposedOn ? "text-[#9B2C1F]" : "text-[#1D6340]"}`}>{hint}</p>
        </div>
        <button type="button" onClick={send} disabled={!canSend} className={`inline-flex h-11 items-center rounded-full px-[22px] text-sm font-medium ${canSend ? "bg-ink text-white hover:bg-brown" : "cursor-not-allowed bg-[#E8DEDC] text-[#5E4E4B]"}`}>
          {pending ? "Sending…" : cards.length === 1 ? "Send for review" : `Send ${cards.length} for review`}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

function AgreementLine({ posting, unavailable }: { posting: PostingAgreement | null; unavailable: boolean }) {
  if (unavailable) {
    return <p className="rounded-[18px] bg-background px-4 py-3.5 text-sm text-ink">Your agreement could not be loaded. Try again before sending.</p>;
  }
  if (!posting) {
    return (
      <p className="rounded-[18px] bg-background px-4 py-3.5 text-sm leading-normal text-ink">
        A signed agreement has to be on your account before you can send a post.{" "}
        <Link href="/affiliates/contracts" className="font-medium underline underline-offset-4">Open agreements</Link>
      </p>
    );
  }
  return (
    <section className="rounded-[18px] bg-background px-4 py-3.5">
      <p className="text-[13px] font-semibold text-brown">Posting under your agreement</p>
      <p className="mt-1 text-sm font-medium">{posting.label}</p>
      {posting.postTotal > 0 ? (
        <p className="mt-1 text-sm leading-normal text-brown">
          {mixSentence(posting.mix)
            ? `Each month: ${mixSentence(posting.mix)}.`
            : posting.months.length > 1
              ? `Each month of this agreement has its own ${posting.postTotal} posts.`
              : `${posting.postTotal} posts this month.`}
        </p>
      ) : null}
    </section>
  );
}

function KindChoices({
  kinds,
  onChoose,
}: {
  kinds: { platform: string; type: string; title: string; detail: string; left: number; count: number }[];
  onChoose: (kind: { platform: string; type: string }) => void;
}) {
  if (!kinds.length) return <p className="rounded-[18px] bg-background px-4 py-3.5 text-sm text-ink">This month already has every post type in the agreement.</p>;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">What are you posting?</p>
        <p className="text-sm leading-normal text-brown">Choose a type from this agreement. The file you add has to match it.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {kinds.map((kind) => (
          <button key={`${kind.platform}-${kind.type}`} type="button" onClick={() => onChoose(kind)} className="flex min-h-28 flex-col gap-1.5 rounded-[18px] border border-[#E8DEDC] bg-white p-4 text-left transition-colors duration-200 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <span className="text-[15px] font-semibold">{kind.title}</span>
            <span className="text-sm leading-normal text-brown">{kind.detail}</span>
            <span className="text-[13px] font-medium">{kind.left} of {kind.count} left this month</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FormatPicker({ onChoose }: { onChoose: (format: PostFormat) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FORMAT_CHOICES.map((choice) => (
        <button key={choice.id} type="button" onClick={() => onChoose(choice.id)} className="flex min-h-28 flex-col gap-1.5 rounded-[18px] border border-[#E8DEDC] bg-white p-4 text-left transition-colors duration-200 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <span className="text-[15px] font-semibold">{choice.title}</span>
          <span className="text-sm leading-normal text-brown">{choice.detail}</span>
        </button>
      ))}
    </div>
  );
}

function CaptionChecker({
  carousel,
  captions,
  disclosureLine,
  trackingUrl,
  code,
  onInsert,
}: {
  carousel: boolean;
  captions: string[];
  disclosureLine: string;
  trackingUrl: string;
  code: string;
  onInsert: (line: string, gap: "\n" | "\n\n") => void;
}) {
  const tagAt = captions.findIndex((text) => hasBrandTag(text));
  const disclosureAt = captions.findIndex((text) => hasDisclosure(text, disclosureLine));
  const trackingAt = captions.findIndex((text) => hasTracking(text, trackingUrl, code));
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-white px-4 py-3">
      <p className="text-sm font-medium">{carousel ? "Tag @myleaderhealth in a slide caption so the post can track." : "Tag @myleaderhealth in the caption so the post can track."}</p>
      <RequirementRow
        ok={tagAt >= 0}
        label="@myleaderhealth"
        found={carousel && tagAt >= 0 ? `Found in slide ${tagAt + 1}’s caption.` : ""}
        caution={carousel && tagAt > 0 ? "Slide 1 is better, so it’s seen first." : ""}
        action={
          tagAt >= 0 ? null : (
            <button type="button" className={`${quietButtonClass} h-9 px-3.5 text-[13px]`} onClick={() => onInsert("@myleaderhealth", "\n")}>
              {carousel ? "Add to slide 1" : "Insert"}
            </button>
          )
        }
      />
      <div className="h-px bg-[#F0E8E6]" />
      <RequirementRow
        ok={disclosureAt >= 0}
        optional
        label={disclosureLine}
        found={carousel && disclosureAt >= 0 ? `Found in slide ${disclosureAt + 1}’s caption.` : ""}
        caution=""
        action={
          disclosureAt >= 0 ? null : (
            <button type="button" className={`${quietButtonClass} h-9 px-3.5 text-[13px]`} onClick={() => onInsert(disclosureLine, "\n\n")}>
              {carousel ? "Add to slide 1" : "Insert"}
            </button>
          )
        }
      />
      <div className="h-px bg-[#F0E8E6]" />
      <RequirementRow
        ok={trackingAt >= 0}
        optional
        label={trackingUrl}
        mono
        found={carousel && trackingAt >= 0 ? `Found in slide ${trackingAt + 1}’s caption.` : ""}
        caution=""
        action={
          trackingAt >= 0 ? null : (
            <button type="button" className={`${quietButtonClass} h-9 px-3.5 text-[13px]`} onClick={() => onInsert(trackingUrl, "\n")}>
              {carousel ? "Add to slide 1" : "Insert"}
            </button>
          )
        }
      />
    </div>
  );
}

function RequirementRow({ ok, label, mono, optional = false, found, caution, action }: { ok: boolean; label: string; mono?: boolean; optional?: boolean; found: string; caution: string; action: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5">{ok ? <CheckMark /> : optional ? <span className="grid size-5 place-items-center text-sm text-[#B3A5A2]">–</span> : <EmptyMark />}</span>
      <div className="min-w-0 flex-1">
        <p className={mono ? "break-all font-mono text-sm" : "text-sm"}>{label}{optional ? " · optional" : ""}</p>
        {found ? <p className="mt-0.5 text-[13px] text-brown">{found}</p> : null}
        {caution ? <p className="mt-0.5 text-[13px] text-[#7A4E00]">{caution}</p> : null}
      </div>
      {action}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V5" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

type EditSlide = { caption: string; file: File | null; previewUrl: string; issue: string };

function editSlidesFrom(post: HubPost): EditSlide[] {
  return post.slides.map((slide) => ({ caption: slide.caption, file: null, previewUrl: "", issue: "" }));
}

function releaseEditSlides(slides: EditSlide[]) {
  for (const slide of slides) {
    if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
  }
}

function PostDetail({
  post,
  email,
  trackingUrl,
  disclosureLine,
  affiliateCode,
  campaigns,
  posting,
  agreementsUnavailable,
  slots,
  onBack,
  onReuse,
  onComposeCampaign,
}: {
  post: HubPost;
  email: string;
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  campaigns: string[];
  posting: PostingAgreement | null;
  agreementsUnavailable: boolean;
  slots?: AgreementBoardSlot[];
  onBack: () => void;
  onReuse: () => void;
  onComposeCampaign: (campaign: string) => void;
}) {
  const mark = statusMark(post);
  const identity = [submissionPlace(post, slots, [post.id]), submissionLabel(post, post.slides.length)].filter(Boolean).join(" · ");
  const stage = stageOf(post);
  const closed = stage === "closed";
  const carousel = post.slides.length > 1;
  const guide = publishGuide(post.format);
  const fileAccept = post.format === "instagram_post" || post.format === "facebook_post" || !post.format ? POST_FILE_ACCEPT : VIDEO_FILE_ACCEPT;
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSlides, setEditSlides] = useState<EditSlide[]>(() => editSlidesFrom(post));
  const [pending, setPending] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [counts, setCounts] = useState(() => ({
    views: post.counts.views == null ? "" : String(post.counts.views),
    likes: post.counts.likes == null ? "" : String(post.counts.likes),
    comments: post.counts.comments == null ? "" : String(post.counts.comments),
    shares: post.counts.shares == null ? "" : String(post.counts.shares),
    saves: post.counts.saves == null ? "" : String(post.counts.saves),
  }));
  const [countDraft, setCountDraft] = useState<{ views: string; likes: string; comments: string; shares: string; saves: string } | null>(null);
  const joinedEdit = carousel
    ? editSlides.map((slide) => slide.caption.trim()).filter(Boolean).join("\n\n")
    : editCaption;
  const tagged = hasBrandTag(joinedEdit);
  const singleIssue = !carousel && editFile ? (post.format ? formatUploadIssue(post.format, editFile) : fileIssue(editFile)) : "";
  const fileProblem = carousel ? editSlides.find((slide) => slide.issue)?.issue ?? "" : singleIssue;
  const changed = carousel
    ? editSlides.some((slide, index) => slide.caption !== (post.slides[index]?.caption ?? "") || Boolean(slide.file))
    : editCaption !== post.caption || Boolean(editFile);
  const canResubmit = tagged && changed && !pending && !fileProblem && joinedEdit.length <= CAPTION_LIMIT && posting != null;
  const editHint = agreementsUnavailable
    ? "Your agreement could not be loaded. Try again before resubmitting."
    : !posting
      ? "A signed agreement has to be on your account before you can resubmit."
      : fileProblem
    ? fileProblem
    : joinedEdit.length > CAPTION_LIMIT
      ? "These captions together need to stay under 2,200 characters."
      : !tagged
        ? carousel
          ? "Tag @myleaderhealth in a slide caption so the post can track."
          : "Tag @myleaderhealth in the caption so the post can track."
        : changed
          ? "Ready to resubmit."
          : "Make the requested change before resubmitting.";
  const waitingToPublish = post.status === "approved" && (post.publication === "awaiting_publication" || post.publication === null);
  const contentVisible = !waitingToPublish && !(post.status === "revision_requested" && editing);

  function replaceSlide(index: number, file: File | null) {
    setEditSlides((current) => current.map((slide, place) => {
      if (place !== index) return slide;
      if (slide.previewUrl) URL.revokeObjectURL(slide.previewUrl);
      if (!file) return { ...slide, file: null, previewUrl: "", issue: "" };
      return {
        ...slide,
        file,
        issue: post.format ? formatUploadIssue(post.format, file) : fileIssue(file),
        previewUrl: URL.createObjectURL(file),
      };
    }));
  }

  function cancelEdit() {
    setEditSlides((current) => {
      releaseEditSlides(current);
      return editSlidesFrom(post);
    });
    setEditCaption(post.caption);
    setEditFile(null);
    setEditing(false);
  }

  async function resubmit() {
    if (!canResubmit) return;
    const data = new FormData();
    data.set("count", "1");
    data.set("id0", post.id);
    if (posting) data.set("agreement", posting.id);
    if (!post.offerId) {
      const month = posting?.months.some((item) => item.period === post.postingMonth)
        ? post.postingMonth
        : openPostingMonth(posting?.months ?? [], new Date().toISOString().slice(0, 10));
      if (month) data.set("postingMonth", month);
    }
    if (post.format) data.set("format0", post.format);
    if (carousel) {
      data.set("caption0", joinedEdit);
      data.set("slots0", String(editSlides.length));
      data.set("slideCount0", String(editSlides.length));
      editSlides.forEach((slide, index) => {
        data.set(`slideCaption0_${index}`, slide.caption);
        if (slide.file) data.set(`file0_${index}`, slide.file);
        else data.set(`slot0_${index}`, `existing:${index}`);
      });
    } else {
      data.set("caption0", editCaption);
      if (editFile) data.set("file0", editFile);
    }
    setPending(true);
    try {
      await submitPostsAction(data);
    } finally {
      setPending(false);
    }
  }

  function onLinkSubmit(event: FormEvent<HTMLFormElement>) {
    const url = String(new FormData(event.currentTarget).get("postUrl") ?? "");
    if (!looksLikePublishedLink(post.format, url)) {
      event.preventDefault();
      setLinkError(guide.error);
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <BackButton onClick={onBack} />
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
          {identity ? <span className="rounded-full bg-[#F3E6E3] px-2.5 py-1 text-xs font-semibold text-ink">{identity}</span> : null}
          {post.sent ? <span className="text-[13px] text-brown">Sent {post.sent}</span> : null}
        </div>
        <h2 className="text-2xl font-medium tracking-tight">{post.title}</h2>
        {post.agreement ? (
          <section className="rounded-[18px] bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brown">Agreement</p>
            <p className="mt-1 text-sm font-medium">{post.agreement}</p>
          </section>
        ) : null}
        {post.payLabel ? (
          <section className="rounded-[18px] bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brown">Marketing pay</p>
            <p className="mt-1 text-sm font-medium">{post.payLabel}{post.payAmount ? ` · ${post.payAmount}` : ""}</p>
            <p className="mt-1 text-sm text-brown">{post.payDetail}</p>
          </section>
        ) : null}
        {post.offerId ? (
          <>
            <p className="text-sm text-brown">{[post.campaign, post.publishBy ? `Publish by ${post.publishBy}` : ""].filter(Boolean).join(" · ") || "Marketing offer"}</p>
            {post.offerBrief ? <p className="text-sm leading-normal text-[#4A3A37]">{post.offerBrief}</p> : null}
          </>
        ) : null}
        {post.proposedOn ? <p className="text-sm text-brown">Proposed publishing date {post.proposedOn}</p> : null}
        {post.campaign && campaigns.includes(post.campaign) ? (
          <button type="button" onClick={() => onComposeCampaign(post.campaign)} className="inline-flex h-11 w-fit items-center rounded-full bg-ink px-5 text-sm font-medium text-white">New posts in this campaign</button>
        ) : null}
      </div>
      {closed ? null : <Progress current={stepIndex(post)} live={stage === "live"} />}

      {post.status === "submitted" ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">We’re reviewing this post</h3>
          <p className="text-sm leading-relaxed text-[#4A3A37]">Our team checks the caption and file. We’ll email {email} when it’s approved or needs changes. {guide.hold}</p>
          <form action={withdrawPostAction}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="h-9 text-sm text-brown underline">Withdraw this post</button>
          </form>
        </section>
      ) : null}

      {post.status === "revision_requested" ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-[#FBF1EF] p-5">
          <h3 className="text-[17px] font-semibold">A few changes needed</h3>
          {post.reviewNote ? <blockquote className="rounded-xl bg-white px-3.5 py-3 text-sm leading-normal text-[#4A3A37]">{post.reviewNote}</blockquote> : null}
          {editing ? (
            <div className="flex flex-col gap-2.5">
              {carousel ? (
                <div className="flex flex-col gap-3">
                  {editSlides.map((slide, index) => {
                    const source = post.slides[index];
                    const media = slide.file ? (slide.file.type.startsWith("video/") ? "video" : "photo") : (source?.media ?? "photo");
                    const preview = slide.file ? slide.previewUrl : (source?.href ?? "");
                    const label = includesLabel(slide.caption, disclosureLine, trackingUrl, affiliateCode);
                    return (
                      <div key={source?.href ?? index} className="flex flex-col gap-3 rounded-2xl border border-[#E8DEDC] bg-white p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{index + 1}</span>
                          {preview ? (
                            <MediaExpand src={preview} media={media} label={`Slide ${index + 1}`}>
                              <MediaPreview src={preview} media={media} className="size-10 shrink-0 rounded-lg object-cover" />
                            </MediaExpand>
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8DEDC] text-[10px] text-brown">File</span>
                          )}
                          <span className="min-w-0 flex-1 text-sm">Slide {index + 1}{index === 0 ? " · cover" : ""}{slide.file ? ` · ${slide.file.name}` : ""}</span>
                        </div>
                        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={`edit-slide-${index}`}>
                          Caption for slide {index + 1}
                          <textarea id={`edit-slide-${index}`} rows={4} value={slide.caption} onChange={(event) => setEditSlides((current) => current.map((item, place) => place === index ? { ...item, caption: event.target.value } : item))} className={`${fieldClass} resize-y`} />
                        </label>
                        {label ? <p className="text-[13px] text-brown">{label}</p> : null}
                        <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={`edit-file-${index}`}>
                          {post.format === "instagram_post" ? `Replace the photo or video on slide ${index + 1}` : `Replace the file on slide ${index + 1}`}
                          <input id={`edit-file-${index}`} type="file" accept={fileAccept} className={fieldClass} onChange={(event) => replaceSlide(index, event.target.files?.[0] ?? null)} />
                        </label>
                        {slide.issue ? <p className="text-[13px] text-[#9B2C1F]">{slide.issue}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <label htmlFor="editcap" className="text-sm font-medium">Caption</label>
                  <textarea id="editcap" rows={6} value={editCaption} onChange={(event) => setEditCaption(event.target.value)} className={`${fieldClass} resize-y`} />
                  <label htmlFor="editfile" className="text-sm font-medium">{post.format === "tiktok" ? "Replace the TikTok video" : post.format === "instagram_reel" ? "Replace the reel" : "Replace the photo or video"}</label>
                  <input id="editfile" type="file" accept={fileAccept} className={fieldClass} onChange={(event) => setEditFile(event.target.files?.[0] ?? null)} />
                </>
              )}
              <span className={`text-[13px] ${canResubmit ? "text-[#1D6340]" : "text-brown"}`}>{editHint}</span>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" onClick={resubmit} disabled={!canResubmit} className={`inline-flex h-11 items-center rounded-full px-[22px] text-sm font-medium ${canResubmit ? "bg-ink text-white" : "cursor-not-allowed bg-[#E8DEDC] text-[#5E4E4B]"}`}>
                  {pending ? "Sending…" : "Resubmit for review"}
                </button>
                <button type="button" onClick={cancelEdit} className={`${quietButtonClass} h-11 px-5`}>Cancel</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="inline-flex h-11 items-center self-start rounded-full bg-ink px-[22px] text-sm font-medium text-white">Edit and resubmit</button>
          )}
        </section>
      ) : null}

      {waitingToPublish ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <div>
            <h3 className="text-lg font-semibold">You’re cleared to post</h3>
            <p className="mt-1 text-sm text-[#4A3A37]">Post it exactly as approved. Changing the caption or file means a new review.</p>
          </div>
          <div className="flex gap-3.5 rounded-[14px] bg-white p-4">
            <StepNumber n={1} />
            {carousel ? (
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <span className="text-[15px] font-semibold">Copy the caption for each slide</span>
                {post.slides.map((slide, index) => (
                  <div key={slide.href} className="flex items-start gap-3">
                    <MediaExpand src={slide.href} media={slide.media} label={`Slide ${index + 1}`}>
                      <MediaPreview src={slide.href} media={slide.media} className="size-10 shrink-0 rounded-lg object-cover" />
                    </MediaExpand>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="text-sm font-medium">Caption for slide {index + 1}{index === 0 ? " · cover" : ""}</span>
                      <p className="rounded-[10px] bg-background px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line">{slide.caption || "No caption on this slide."}</p>
                      {slide.caption ? <CopyControl value={slide.caption} label={`Copy slide ${index + 1} caption`} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <span className="text-[15px] font-semibold">Copy the approved caption</span>
                <p className="rounded-[10px] bg-background px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line">{post.caption}</p>
                <CopyControl value={post.caption} label="Copy caption" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] bg-white p-4">
            <StepNumber n={2} />
            {post.slides.length > 1 ? (
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-[15px] font-semibold">Save your files · <span className="font-normal text-[#4A3A37]">Carousel · {post.slides.length}</span></span>
                {post.slides.map((slide, index) => (
                  <div key={slide.downloadHref} className="flex flex-wrap items-center gap-3">
                    <span className="min-w-0 flex-1 text-sm text-[#4A3A37]">Slide {index + 1}{index === 0 ? " · cover" : ""}</span>
                    <a href={slide.downloadHref} className={quietButtonClass}>Download</a>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-[15px] font-semibold">Save your file · <span className="font-normal text-[#4A3A37]">{fileLabel(post)}</span></span>
                {post.hasFile ? <a href={post.downloadHref} className={quietButtonClass}>Download</a> : null}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] bg-white p-4">
            <StepNumber n={3} />
            <span className="min-w-0 flex-1 text-[15px] font-semibold">{guide.step}</span>
            <a href={guide.href} className={quietButtonClass}>{guide.open}</a>
          </div>
          <div className="flex gap-3.5 rounded-[14px] bg-white p-4 outline-2 outline-ink">
            <StepNumber n={4} />
            <form action={submitLiveLinkAction} onSubmit={onLinkSubmit} className="flex min-w-0 flex-1 flex-col gap-2.5">
              <input type="hidden" name="id" value={post.id} />
              <label htmlFor="iglink" className="text-[15px] font-semibold">{guide.label}</label>
              <span className="text-[13px] text-brown">{guide.hint}</span>
              <div className="flex flex-wrap gap-2.5">
                <input id="iglink" name="postUrl" type="url" inputMode="url" required placeholder={guide.placeholder} onChange={() => setLinkError("")} className={`h-11 min-w-0 flex-1 rounded-full border bg-white px-[18px] text-sm ${linkError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Submit link</button>
              </div>
              {linkError ? <span role="alert" className="text-[13px] text-[#9B2C1F]">{linkError}</span> : null}
            </form>
          </div>
        </section>
      ) : null}

      {post.publication === "verification_pending" ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">We’re checking the link you added</h3>
          <p className="text-sm leading-relaxed text-[#4A3A37]">{guide.pending}</p>
          {awaitsManualLinkCheck(post.format) ? (
            <form action={submitLiveLinkAction} onSubmit={onLinkSubmit} className="flex flex-col gap-2.5">
              <input type="hidden" name="id" value={post.id} />
              <label htmlFor="tiktok-link" className="text-sm font-medium">Paste a different link</label>
              <div className="flex flex-wrap gap-2.5">
                <input id="tiktok-link" name="postUrl" type="url" inputMode="url" required defaultValue={post.postUrl ?? ""} placeholder={guide.placeholder} onChange={() => setLinkError("")} className={`h-11 min-w-0 flex-1 rounded-full border bg-white px-[18px] text-sm ${linkError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Update link</button>
              </div>
              {linkError ? <span role="alert" className="text-[13px] text-[#9B2C1F]">{linkError}</span> : null}
            </form>
          ) : null}
        </section>
      ) : null}

      {post.publication === "verification_failed" ? (
        <section className="flex flex-col gap-3 rounded-[18px] border border-[#F0CFC9] bg-white p-5">
          <h3 className="text-[17px] font-semibold">{post.headline}</h3>
          <p className="text-sm leading-relaxed text-[#4A3A37]">{post.detail}</p>
          <div className="flex flex-wrap gap-2.5">
            <CopyControl value={post.headline.toLowerCase().includes("sponsorship") ? disclosureLine : trackingUrl} label={post.headline.toLowerCase().includes("sponsorship") ? "Copy sponsorship line" : "Copy tracking link"} />
            {post.postUrl && !post.headline.toLowerCase().includes("not found") ? (
              <form action={submitLiveLinkAction}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="postUrl" value={post.postUrl} />
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Check again</button>
              </form>
            ) : null}
          </div>
          {!post.postUrl || post.headline.toLowerCase().includes("not found") ? (
            <form action={submitLiveLinkAction} onSubmit={onLinkSubmit} className="flex flex-col gap-2.5">
              <input type="hidden" name="id" value={post.id} />
              <label htmlFor="iglink-fix" className="text-sm font-medium">{guide.label}</label>
              <div className="flex flex-wrap gap-2.5">
                <input id="iglink-fix" name="postUrl" type="url" inputMode="url" required defaultValue={post.postUrl ?? ""} placeholder={guide.placeholder} onChange={() => setLinkError("")} className={`h-11 min-w-0 flex-1 rounded-full border bg-white px-[18px] text-sm ${linkError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Check again</button>
              </div>
              {linkError ? <span role="alert" className="text-[13px] text-[#9B2C1F]">{linkError}</span> : null}
            </form>
          ) : null}
        </section>
      ) : null}

      {stage === "live" ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">{post.headline}</h3>
          {post.postUrl ? <a href={externalHref(post.postUrl)} className="text-sm underline underline-offset-4">{post.postUrl}</a> : null}
          <p className="text-sm text-[#4A3A37]">{post.detail}</p>
          {post.metrics.length > 0 && !post.askManual ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {post.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-[#7A5C58]">{metric.label}</dt>
                  <dd className="mt-1 text-ink">{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {post.askManual ? (
            post.hasManual ? (
              <div className="flex flex-col gap-3">
                {post.metricsNote ? <p className="text-sm text-[#4A3A37]">{post.metricsNote}</p> : null}
                <p className="text-sm leading-relaxed text-[#4A3A37]">An update is due. These numbers are the marketing performance record for this post because the account is not connected. Updates run weekly until {post.trackingDays} days after the link was saved. These numbers stay as entered. Request a change if they need to be updated. A sub-admin or admin makes that change.</p>
                {post.metrics.length > 0 ? (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {post.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt className="text-[#7A5C58]">{metric.label}</dt>
                        <dd className="mt-1 text-ink">{metric.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {post.changeRequest ? null : (
                  <form action={confirmManualMetricsAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ink px-[22px] text-sm font-medium text-white sm:w-auto">These numbers are unchanged</button>
                  </form>
                )}
                <MetricChangeForm post={post} />
                {post.connectHref ? (
                  <SocialConnectLink href={post.connectHref} className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink sm:w-auto sm:self-start">Connect account</SocialConnectLink>
                ) : (
                  <p className="text-sm text-[#4A3A37]">Connect is not available for this network yet.</p>
                )}
              </div>
            ) : (
            <>
              {countDraft ? (
                <div className="flex flex-col gap-3 rounded-2xl bg-white p-4" role="dialog" aria-labelledby="confirm-counts-title">
                  <h4 id="confirm-counts-title" className="text-base font-semibold">Are you sure?</h4>
                  <p className="text-sm leading-relaxed text-[#4A3A37]">These counts will be saved on this post. A later change has to be requested.</p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-[#7A5C58]">Views</dt><dd className="mt-1">{countText(countDraft.views)}</dd></div>
                    <div><dt className="text-[#7A5C58]">Likes</dt><dd className="mt-1">{countText(countDraft.likes)}</dd></div>
                    <div><dt className="text-[#7A5C58]">Comments</dt><dd className="mt-1">{countText(countDraft.comments)}</dd></div>
                    <div><dt className="text-[#7A5C58]">Shares</dt><dd className="mt-1">{countText(countDraft.shares)}</dd></div>
                    <div><dt className="text-[#7A5C58]">Saves</dt><dd className="mt-1">{countText(countDraft.saves)}</dd></div>
                  </dl>
                  <form action={saveManualMetricsAction} className="flex flex-col gap-2.5 sm:flex-row">
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="views" value={countDraft.views} />
                    <input type="hidden" name="likes" value={countDraft.likes} />
                    <input type="hidden" name="comments" value={countDraft.comments} />
                    <input type="hidden" name="shares" value={countDraft.shares} />
                    <input type="hidden" name="saves" value={countDraft.saves} />
                    <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Confirm</button>
                    <button type="button" onClick={() => setCountDraft(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink">Cancel</button>
                  </form>
                </div>
              ) : null}
              <div className={countDraft ? "hidden" : "flex flex-col gap-3"}>
                <p className="text-sm leading-relaxed text-[#4A3A37]">An update is due. These numbers are the marketing performance record for this post because the account is not connected. Updates run weekly until {post.trackingDays} days after the link was saved.</p>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCountDraft(counts);
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <CountField name="views" label="Views" value={counts.views} onChange={(value) => setCounts((current) => ({ ...current, views: value }))} />
                    <CountField name="likes" label="Likes" value={counts.likes} onChange={(value) => setCounts((current) => ({ ...current, likes: value }))} />
                    <CountField name="comments" label="Comments" value={counts.comments} onChange={(value) => setCounts((current) => ({ ...current, comments: value }))} />
                    <CountField name="shares" label="Shares" value={counts.shares} onChange={(value) => setCounts((current) => ({ ...current, shares: value }))} />
                    <CountField name="saves" label="Saves" value={counts.saves} onChange={(value) => setCounts((current) => ({ ...current, saves: value }))} />
                  </div>
                  <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ink px-[22px] text-sm font-medium text-white sm:w-auto sm:self-start">Save numbers</button>
                </form>
                {post.connectHref ? (
                  <SocialConnectLink href={post.connectHref} className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-[22px] text-sm font-medium text-ink sm:w-auto sm:self-start">Connect account</SocialConnectLink>
                ) : (
                  <p className="text-sm text-[#4A3A37]">Connect is not available for this network yet.</p>
                )}
              </div>
            </>
            )
          ) : (
            <>
              {post.metricsNote ? <p className="text-sm text-[#4A3A37]">{post.metricsNote}</p> : null}
              <Link href="/affiliates/stats" className="inline-flex h-11 items-center self-start rounded-full bg-ink px-[22px] text-sm font-medium text-white">View stats</Link>
              {post.hasManual ? <MetricChangeForm post={post} /> : null}
            </>
          )}
        </section>
      ) : null}

      {closed ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">{post.status === "rejected" ? "This post wasn’t approved" : "You withdrew this post"}</h3>
          {post.reviewNote ? <blockquote className="rounded-xl bg-white px-3.5 py-3 text-sm leading-normal text-[#4A3A37]">{post.reviewNote}</blockquote> : null}
          <button type="button" onClick={onReuse} className={`${quietButtonClass} h-11 self-start px-5`}>{post.status === "rejected" ? "Create Replacement Post" : "Use as a starting point"}</button>
        </section>
      ) : null}

      {contentVisible ? (
        carousel ? (
          <section className="flex flex-col gap-3">
            {post.slides.map((slide, index) => (
              <div key={slide.href} className="flex items-start gap-3 rounded-[14px] bg-background p-3">
                <MediaExpand src={slide.href} media={slide.media} label={`Slide ${index + 1}`}>
                  <MediaPreview src={slide.href} media={slide.media} className="size-[72px] shrink-0 rounded-lg object-cover" />
                </MediaExpand>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-brown">Slide {index + 1}{index === 0 ? " · cover" : ""}</p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{slide.caption || "No caption on this slide."}</p>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="flex flex-wrap items-start gap-4">
            {post.hasFile ? (
              <MediaExpand src={post.fileHref} media={post.media} label={post.title || "Post"}>
                <MediaPreview src={post.fileHref} media={post.media} className="size-[120px] rounded-[14px] object-cover" />
              </MediaExpand>
            ) : (
              <div className="grid size-[120px] place-items-center rounded-[14px] bg-[#E8DEDC] px-2 text-center text-[11px] text-[#5E4E4B]">{fileLabel(post)}</div>
            )}
            <div className="min-w-0 flex-1 basis-[260px]">
              <p className="text-sm leading-relaxed whitespace-pre-line">{post.caption || "No caption yet."}</p>
            </div>
          </section>
        )
      ) : null}

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">History</h3>
        <ol className="flex flex-col">
          {post.history.map((event, index) => (
            <li key={`${event.label}-${event.when}-${index}`} className="flex gap-3.5">
              <div className="flex w-3.5 shrink-0 flex-col items-center">
                <span className={`mt-[5px] size-2.5 rounded-full ${event.tone === "good" ? "bg-[#1D6340]" : event.tone === "bad" ? "bg-[#9B2C1F]" : "bg-ink"}`} />
                <span className={`w-0.5 flex-1 ${index === post.history.length - 1 ? "bg-transparent" : "bg-[#E8DEDC]"}`} />
              </div>
              <div className="flex flex-col gap-0.5 pb-4">
                <span className="text-sm font-medium">{event.label}</span>
                {event.when ? <span className="text-xs text-brown">{event.when}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{n}</span>;
}
