"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { submitLiveLinkAction, submitPostsAction, withdrawPostAction } from "@/app/affiliates/post-actions";
import { MediaExpand, MediaPreview } from "@/components/affiliate/MediaExpand";
import { POST_FILE_ACCEPT, postUploadIssue } from "@/lib/affiliate/post-files";

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
  history: HistoryEvent[];
  slides: { href: string; downloadHref: string; media: "photo" | "video"; caption: string }[];
  batchId: string;
  mediaKey: string;
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
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Action needed" },
  { id: "review", label: "In review" },
  { id: "live", label: "Live" },
  { id: "closed", label: "Closed" },
];

function hasDisclosure(caption: string, line: string) {
  return caption.toLowerCase().includes(line.toLowerCase());
}

function hasTracking(caption: string, url: string, code: string) {
  return caption.includes(url) || caption.toLowerCase().includes(`ref=${code.toLowerCase()}`);
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
  if (stage === "live") return { label: "Live", bg: "#DDF0E4", fg: "#1D6340" };
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
  return { hint: "Approved · publish it, then add the link", cta: "Add Instagram link", color: "#4A3A37" };
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
  return post.media === "video" ? "Approved video" : "Approved photo";
}

function fileIssue(file: File) {
  return postUploadIssue(file);
}

function blankCard(partial?: Partial<Card>): Card {
  return { key: `card-${Math.random().toString(36).slice(2, 10)}`, id: "", caption: "", slides: [], ...partial };
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
  const disclosed = hasDisclosure(text, disclosureLine);
  const linked = hasTracking(text, trackingUrl, code);
  if (disclosed && linked) return "Includes the disclosure line and your tracking link.";
  if (disclosed) return "Includes the disclosure line.";
  if (linked) return "Includes your tracking link.";
  return "";
}

function slideIsVideo(slide: Slide) {
  if (slide.file?.type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov)$/i.test(slide.fileName) || /video/i.test(slide.fileName);
}

function cardProblem(card: Card, disclosureLine: string, trackingUrl: string, code: string) {
  const issue = card.slides.find((slide) => slide.fileIssue)?.fileIssue ?? "";
  if (issue) return issue;
  const joined = joinedCaption(card);
  if (joined.length > CAPTION_LIMIT) return "These captions together need to stay under 2,200 characters.";
  const missing: string[] = [];
  if (!hasDisclosure(joined, disclosureLine)) missing.push("the disclosure line");
  if (!hasTracking(joined, trackingUrl, code)) missing.push("your tracking link");
  if (card.slides.length === 0) missing.push("at least one photo or video");
  return missing.length ? `needs ${joinList(missing)}` : "";
}

function cardReady(card: Card, disclosureLine: string, trackingUrl: string, code: string) {
  return cardProblem(card, disclosureLine, trackingUrl, code) === "";
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

function looksLikeInstagramPost(value: string) {
  return /instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+/i.test(value.trim());
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
}: {
  posts: HubPost[];
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  email: string;
  notice: string;
  noticeTone: "ok" | "warn";
}) {
  const motionEase = useSoftMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [screen, setScreen] = useState<"hub" | "compose" | "detail">("hub");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([blankCard()]);
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

  function openCompose(seed?: HubPost) {
    setCards((current) => {
      for (const card of current) releaseSlides(card.slides);
      return [
        blankCard(
          seed
            ? {
                caption: seed.caption,
                id: seed.status === "draft" ? seed.id : "",
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

  const screenKey = screen === "detail" ? `detail-${selectedId}` : screen;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {screen === "hub" || (screen === "detail" && !selected) ? (
        <motion.div key="hub" initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
              <h2 className="text-[28px] font-medium tracking-tight">Posts</h2>
              <p className="text-sm leading-normal text-brown">Send posts for review, publish the approved ones on Instagram, then add the link.</p>
            </div>
            <button type="button" onClick={() => openCompose()} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none">
              <PlusIcon />
              New posts
            </button>
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
                      <p className="mt-1 text-xs font-medium" style={{ color: action.color }}>{slides > 1 ? `Carousel · ${slides} · ${action.hint}` : action.hint}</p>
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
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const count = item.id === "all" ? groups.length : groups.filter((group) => stageOf(groupLead(group)) === item.id).length;
                const current = filter === item.id;
                return (
                  <button key={item.id} type="button" aria-pressed={current} onClick={() => setFilter(item.id)} className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${current ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink hover:bg-background"}`}>
                    {item.label}
                    <span className="opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {groups.filter((group) => filter === "all" || stageOf(groupLead(group)) === filter).map((group) => {
                  const post = asOnePost(group);
                  const mark = statusMark(post);
                  const slides = slideTotal(group);
                  const sent = post.status === "draft" ? "Not sent yet" : post.sent ? `Sent ${post.sent}` : "";
                  const meta = slides > 1 ? `Carousel · ${slides}${sent ? ` · ${sent}` : ""}` : sent;
                  return (
                    <motion.div key={post.batchId || post.id} layout initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade}>
                      <div className="flex min-h-11 w-full items-center gap-3.5 border-t border-[#F0E8E6] px-1 py-3 text-left text-ink">
                        <Thumb post={post} />
                        <button type="button" onClick={() => (post.status === "draft" ? openCompose(post) : openDetail(post.id))} className="flex min-w-0 flex-1 items-center gap-3.5 text-left transition-colors duration-200 hover:opacity-80 motion-reduce:transition-none">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{post.title}</span>
                            <span className="mt-0.5 block text-xs text-brown">{meta}</span>
                          </span>
                          <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
                          <Chevron direction="right" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {groups.filter((group) => filter === "all" || stageOf(groupLead(group)) === filter).length === 0 ? <p className="border-t border-[#F0E8E6] px-1 py-7 text-sm text-brown">Nothing here yet.</p> : null}
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
            onBack={() => setScreen("hub")}
          />
        </motion.div>
      ) : selected ? (
        <motion.div key={screenKey} initial={motionEase.reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionEase.fade}>
          <PostDetail
            post={selected}
            email={email}
            trackingUrl={trackingUrl}
            disclosureLine={disclosureLine}
            affiliateCode={affiliateCode}
            onBack={() => setScreen("hub")}
            onReuse={() => openCompose(selected)}
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
  onBack,
}: {
  cards: Card[];
  setCards: (cards: Card[]) => void;
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  onBack: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [limitNote, setLimitNote] = useState("");
  const readyCount = cards.filter((card) => cardReady(card, disclosureLine, trackingUrl, affiliateCode)).length;
  const blocked = cards
    .map((card, index) => ({ card, index, problem: cardProblem(card, disclosureLine, trackingUrl, affiliateCode) }))
    .find((item) => item.problem);
  const hint = blocked ? (blocked.problem.startsWith("needs ") ? `Post ${blocked.index + 1} ${blocked.problem}.` : `Post ${blocked.index + 1}: ${blocked.problem}`) : "Everything’s in place.";
  const canSend = cards.length > 0 && !blocked && !pending;

  function update(key: string, patch: Partial<Card>) {
    setCards(cards.map((card) => (card.key === key ? { ...card, ...patch } : card)));
  }

  function addFiles(key: string, list: File[]) {
    const incoming = list.filter((file) => file.size > 0);
    if (!incoming.length) return;
    const card = cards.find((item) => item.key === key);
    if (!card) return;
    const room = SLIDE_LIMIT - card.slides.length;
    const accepted = incoming.slice(0, Math.max(room, 0));
    if (!accepted.length) {
      setLimitNote("A post can hold 20 photos or videos.");
      return;
    }
    const added = accepted.map((file) => makeSlide(file));
    setCards(cards.map((item) => (item.key === key ? applySlides(item, [...item.slides, ...added]) : item)));
    setLimitNote(incoming.length > room ? "A post can hold 20 photos or videos. The extra files were left out." : "");
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
    cards.forEach((card, index) => {
      const slideCaptions = isCarousel(card) ? card.slides.map((slide) => slide.caption) : [card.caption];
      data.set(`caption${index}`, joinedCaption(card));
      data.set(`id${index}`, card.id);
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

  return (
    <div className="flex flex-col gap-[22px]">
      <BackButton onClick={onBack} />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[28px] font-medium tracking-tight">New posts</h2>
        <p className="text-sm leading-normal text-brown">Add one post or several. A post can be photos, a carousel, or a reel. Each post is reviewed on its own, so you can publish them as they’re approved. A link in your bio doesn’t count: both lines below go in every caption.</p>
      </div>
      <Progress current={0} />
      {cards.map((card, index) => {
        const carousel = isCarousel(card);
        const ready = cardReady(card, disclosureLine, trackingUrl, affiliateCode);
        return (
          <article key={card.key} className="flex flex-col gap-4 rounded-[18px] bg-background p-5">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-semibold">Post {index + 1}</span>
              {carousel ? <span className="text-[13px] text-brown">Carousel · {card.slides.length}</span> : null}
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
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">Photos or videos</span>
                <span className="text-[13px] text-brown">{card.slides.length ? `${card.slides.length} of ${SLIDE_LIMIT}` : `Up to ${SLIDE_LIMIT}`}</span>
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
                  <button type="button" aria-label="Remove photo or video" onClick={() => removeSlide(card.key, card.slides[0].key)} className="grid size-8 place-items-center rounded-full text-brown hover:bg-background">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12" />
                      <path d="M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ) : null}
              {card.slides.length < SLIDE_LIMIT ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#CDBDBA] bg-white px-4 py-4 text-center hover:bg-background">
                  <input
                    type="file"
                    multiple
                    accept={POST_FILE_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      addFiles(card.key, Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                    <UploadIcon />
                    {card.slides.length ? "Add more to this post" : "Add photos or a reel"}
                  </span>
                  <span className="text-[13px] text-brown">Select several photos for a carousel, or one video for a reel · up to 20 · the first one is the cover</span>
                </label>
              ) : null}
              <p className="text-[13px] leading-relaxed text-brown">Photos need to be under 8 MB. A reel can be an MP4, MOV, or WebM up to 100 MB, vertical, H.264, 30 fps, with AAC audio.</p>
              {!carousel && card.slides[0]?.fileIssue ? <p className="text-[13px] text-[#9B2C1F]">{card.slides[0].fileIssue}</p> : null}
              {carousel ? (
                <p className="text-[13px] leading-relaxed text-brown">Each slide has its own caption, and every slide caption is reviewed. The disclosure line and tracking link have to appear in your slide captions. Slide 1 is best, since the cover is seen first.</p>
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
          </article>
        );
      })}
      {cards.length < POST_BATCH_LIMIT ? (
        <button type="button" onClick={() => setCards(cards.concat(blankCard()))} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#CDBDBA] bg-white text-sm font-medium text-ink hover:bg-background">
          <PlusIcon />
          Add another post
        </button>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#E8DEDC] pt-5">
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-sm font-semibold">{cards.length === 1 ? "1 post" : `${cards.length} posts`} · {readyCount} ready</p>
          {limitNote ? <p className="text-[13px] text-[#9B2C1F]">{limitNote}</p> : null}
          <p className={`text-[13px] ${blocked ? "text-[#9B2C1F]" : "text-[#1D6340]"}`}>{hint}</p>
        </div>
        <button type="button" onClick={send} disabled={!canSend} className={`inline-flex h-11 items-center rounded-full px-[22px] text-sm font-medium ${canSend ? "bg-ink text-white hover:bg-brown" : "cursor-not-allowed bg-[#E8DEDC] text-[#5E4E4B]"}`}>
          {pending ? "Sending…" : cards.length === 1 ? "Send for review" : `Send ${cards.length} for review`}
        </button>
      </div>
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
  const disclosureAt = captions.findIndex((text) => hasDisclosure(text, disclosureLine));
  const trackingAt = captions.findIndex((text) => hasTracking(text, trackingUrl, code));
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-white px-4 py-3">
      <p className="text-sm font-medium">{carousel ? "Your slide captions need both of these." : "Your caption needs both of these"}</p>
      <RequirementRow
        ok={disclosureAt >= 0}
        label={disclosureLine}
        found={carousel && disclosureAt >= 0 ? `Found in slide ${disclosureAt + 1}’s caption.` : ""}
        caution={carousel && disclosureAt > 0 ? "Slide 1 is better, so it’s seen first." : ""}
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

function RequirementRow({ ok, label, mono, found, caution, action }: { ok: boolean; label: string; mono?: boolean; found: string; caution: string; action: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5">{ok ? <CheckMark /> : <EmptyMark />}</span>
      <div className="min-w-0 flex-1">
        <p className={mono ? "break-all font-mono text-sm" : "text-sm"}>{label}</p>
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
  onBack,
  onReuse,
}: {
  post: HubPost;
  email: string;
  trackingUrl: string;
  disclosureLine: string;
  affiliateCode: string;
  onBack: () => void;
  onReuse: () => void;
}) {
  const mark = statusMark(post);
  const stage = stageOf(post);
  const closed = stage === "closed";
  const carousel = post.slides.length > 1;
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editSlides, setEditSlides] = useState<EditSlide[]>(() => editSlidesFrom(post));
  const [pending, setPending] = useState(false);
  const [linkError, setLinkError] = useState("");
  const history = [...post.history].reverse();
  const joinedEdit = carousel ? editSlides.map((slide) => slide.caption.trim()).filter(Boolean).join("\n\n") : editCaption;
  const disclosed = hasDisclosure(joinedEdit, disclosureLine);
  const linked = hasTracking(joinedEdit, trackingUrl, affiliateCode);
  const fileProblem = carousel ? editSlides.find((slide) => slide.issue)?.issue ?? "" : "";
  const changed = carousel
    ? editSlides.some((slide, index) => slide.caption !== (post.slides[index]?.caption ?? "") || Boolean(slide.file))
    : editCaption !== post.caption || Boolean(editFile);
  const canResubmit = disclosed && linked && changed && !pending && !fileProblem && joinedEdit.length <= CAPTION_LIMIT;
  const editHint = fileProblem
    ? fileProblem
    : joinedEdit.length > CAPTION_LIMIT
      ? "These captions together need to stay under 2,200 characters."
      : !disclosed || !linked
        ? carousel
          ? "Keep the disclosure line and your tracking link in the slide captions."
          : "Keep the disclosure line and your tracking link in the caption."
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
        issue: fileIssue(file),
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
    if (!looksLikeInstagramPost(url)) {
      event.preventDefault();
      setLinkError("That doesn’t look like an Instagram post link. It should look like instagram.com/p/… or instagram.com/reel/…");
    }
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <BackButton onClick={onBack} />
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
          {post.sent ? <span className="text-[13px] text-brown">Sent {post.sent}</span> : null}
        </div>
        <h2 className="text-2xl font-medium tracking-tight">{post.title}</h2>
      </div>
      {closed ? null : <Progress current={stepIndex(post)} live={stage === "live"} />}

      {post.status === "submitted" ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">We’re reviewing this post</h3>
          <p className="text-sm leading-relaxed text-[#4A3A37]">Our team checks the caption and file. We’ll email {email} when it’s approved or needs changes. Don’t post it on Instagram yet.</p>
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
                          Replace photo or video on slide {index + 1}
                          <input id={`edit-file-${index}`} type="file" accept={POST_FILE_ACCEPT} className={fieldClass} onChange={(event) => replaceSlide(index, event.target.files?.[0] ?? null)} />
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
                  <label htmlFor="editfile" className="text-sm font-medium">Replace photo or video</label>
                  <input id="editfile" type="file" accept={POST_FILE_ACCEPT} className={fieldClass} onChange={(event) => setEditFile(event.target.files?.[0] ?? null)} />
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
            <span className="min-w-0 flex-1 text-[15px] font-semibold">Publish it on Instagram</span>
            <a href="https://www.instagram.com/" className={quietButtonClass}>Open Instagram</a>
          </div>
          <div className="flex gap-3.5 rounded-[14px] bg-white p-4 outline-2 outline-ink">
            <StepNumber n={4} />
            <form action={submitLiveLinkAction} onSubmit={onLinkSubmit} className="flex min-w-0 flex-1 flex-col gap-2.5">
              <input type="hidden" name="id" value={post.id} />
              <label htmlFor="iglink" className="text-[15px] font-semibold">Paste your post link</label>
              <span className="text-[13px] text-brown">On Instagram, tap ··· on your post, then Copy link.</span>
              <div className="flex flex-wrap gap-2.5">
                <input id="iglink" name="postUrl" type="url" inputMode="url" required placeholder="instagram.com/p/…" onChange={() => setLinkError("")} className={`h-11 min-w-0 flex-1 rounded-full border bg-white px-[18px] text-sm ${linkError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-[22px] text-sm font-medium text-white">Submit link</button>
              </div>
              {linkError ? <span role="alert" className="text-[13px] text-[#9B2C1F]">{linkError}</span> : null}
            </form>
          </div>
        </section>
      ) : null}

      {post.publication === "verification_pending" ? (
        <section className="rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">We’re checking the link you added</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#4A3A37]">This stays here until the caption on Instagram has the sponsorship line and your tracking link.</p>
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
              <label htmlFor="iglink-fix" className="text-sm font-medium">Paste the post link</label>
              <div className="flex flex-wrap gap-2.5">
                <input id="iglink-fix" name="postUrl" type="url" inputMode="url" required defaultValue={post.postUrl ?? ""} placeholder="instagram.com/p/…" onChange={() => setLinkError("")} className={`h-11 min-w-0 flex-1 rounded-full border bg-white px-[18px] text-sm ${linkError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
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
          <Link href="/affiliates/stats" className="inline-flex h-11 items-center self-start rounded-full bg-ink px-[22px] text-sm font-medium text-white">View stats</Link>
        </section>
      ) : null}

      {closed ? (
        <section className="flex flex-col gap-3 rounded-[18px] bg-background p-5">
          <h3 className="text-[17px] font-semibold">{post.status === "rejected" ? "This post wasn’t approved" : "You withdrew this post"}</h3>
          {post.reviewNote ? <blockquote className="rounded-xl bg-white px-3.5 py-3 text-sm leading-normal text-[#4A3A37]">{post.reviewNote}</blockquote> : null}
          <button type="button" onClick={onReuse} className={`${quietButtonClass} h-11 self-start px-5`}>Use as a starting point</button>
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
          {history.map((event, index) => (
            <li key={`${event.label}-${event.when}-${index}`} className="flex gap-3.5">
              <div className="flex w-3.5 shrink-0 flex-col items-center">
                <span className={`mt-[5px] size-2.5 rounded-full ${event.tone === "good" ? "bg-[#1D6340]" : event.tone === "bad" ? "bg-[#9B2C1F]" : "bg-ink"}`} />
                <span className={`w-0.5 flex-1 ${index === history.length - 1 ? "bg-transparent" : "bg-[#E8DEDC]"}`} />
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
