"use client";

import { useMemo, useState, type ReactNode } from "react";
import { approvePostAction, markPostCheckedAction, rejectPostAction, requestPostChangeAction } from "@/app/admin/affiliates/post-actions";
import { FilterDatePicker } from "@/components/affiliate/FilterDatePicker";
import { FilterDropdown } from "@/components/affiliate/FilterDropdown";
import { MediaExpand, MediaPreview } from "@/components/affiliate/MediaExpand";

export type ReviewSlide = {
  index: number;
  name: string;
  href: string;
  video: boolean;
  caption: string;
  cover: boolean;
  disclosure: boolean;
  tagged: boolean;
  tracking: boolean;
  claims: string[];
};

export type ReviewCheck = { tone: "pass" | "warn"; label: string };

export type ReviewQueue = "waiting" | "changes" | "approved" | "link" | "live" | "declined" | "withdrawn";

export type ReviewPost = {
  id: string;
  name: string;
  email: string;
  code: string;
  sent: string;
  waiting: string;
  version: number;
  batchLabel: string;
  kind: string;
  kindShort: string;
  source: string;
  excerpt: string;
  flagCount: number;
  checksPass: boolean;
  slides: ReviewSlide[];
  checks: ReviewCheck[];
  queue: ReviewQueue;
  canDecide: boolean;
  canMark: boolean;
  pastHref: string;
  suggestedNote: string;
  campaign: string;
  agreement: string;
  platform: string;
  submittedOn: string;
  dateLabel: string;
  dateValue: string;
  reviewedBy: string;
  postUrl: string | null;
  views: number | null;
  revisions: { version: number; note: string; when: string }[];
};

const STATUS_LABEL: Record<ReviewQueue, string> = {
  waiting: "In review",
  link: "Link needs a fix",
  changes: "Changes requested",
  approved: "Approved",
  live: "Published",
  declined: "Rejected",
  withdrawn: "Withdrawn",
};

const VIEW_TITLE = {
  all: "All submissions",
  pending: "Pending approvals",
  published: "Published content",
} as const;

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

const quietButton =
  "inline-flex h-10 items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function initials(name: string) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "A";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markedCaption(caption: string, phrases: string[]) {
  if (!phrases.length) return caption;
  const pattern = new RegExp(phrases.map(escapeRegExp).join("|"), "ig");
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of caption.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(caption.slice(last, start));
    nodes.push(
      <mark key={`${start}-${match[0]}`} className="rounded bg-[#FBE3C2] px-0.5 text-ink">
        {match[0]}
      </mark>,
    );
    last = start + match[0].length;
  }
  if (last < caption.length) nodes.push(caption.slice(last));
  return nodes;
}

function linkText(url: string) {
  return url.split(/([/?&])/).map((part, index) =>
    part === "?" || part === "&" || part === "/" ? (
      <span key={index}>
        {part}
        <wbr />
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

type CaptionPiece = { kind: "text" | "link"; value: string };

function captionPieces(caption: string): CaptionPiece[] {
  const pattern = /https?:\/\/[^\s<>]+/gi;
  const pieces: CaptionPiece[] = [];
  let last = 0;
  for (const match of caption.matchAll(pattern)) {
    const start = match.index ?? 0;
    const raw = match[0];
    const url = raw.replace(/[),.;]+$/, "");
    if (start > last) pieces.push({ kind: "text", value: caption.slice(last, start) });
    pieces.push({ kind: "link", value: url });
    if (url.length < raw.length) pieces.push({ kind: "text", value: raw.slice(url.length) });
    last = start + raw.length;
  }
  if (last < caption.length) pieces.push({ kind: "text", value: caption.slice(last) });
  return pieces.filter((piece) => piece.kind === "link" || piece.value.trim());
}

const filterFocus = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";

export function PostReviewQueue({ posts, initialId, notice, view }: { posts: ReviewPost[]; initialId: string; notice: string; view: "all" | "pending" | "published" }) {
  const [affiliate, setAffiliate] = useState("");
  const [platform, setPlatform] = useState("");
  const [campaign, setCampaign] = useState("");
  const [status, setStatus] = useState("");
  const [day, setDay] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialId);
  const [note, setNote] = useState("");
  const [notedFor, setNotedFor] = useState("");
  const [openNext, setOpenNext] = useState(true);
  const affiliates = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of posts) seen.set(post.code, post.name);
    return [...seen.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [posts]);
  const platforms = useMemo(() => unique(posts.map((post) => post.platform)), [posts]);
  const campaigns = useMemo(() => unique(posts.map((post) => post.campaign)), [posts]);
  const statuses = useMemo(() => unique(posts.map((post) => post.queue)) as ReviewQueue[], [posts]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (affiliate && post.code !== affiliate) return false;
      if (platform && post.platform !== platform) return false;
      if (campaign && post.campaign !== campaign) return false;
      if (status && post.queue !== status) return false;
      if (day && post.submittedOn !== day) return false;
      if (!needle) return true;
      const haystack = [post.name, post.email, post.code, post.excerpt, post.campaign, ...post.slides.map((slide) => slide.caption)].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [affiliate, campaign, day, platform, posts, query, status]);
  const selected = visible.find((post) => post.id === selectedId) ?? visible[0] ?? null;
  const activeNote = selected && notedFor === selected.id ? note : selected?.suggestedNote ?? "";
  const nextId = selected ? visible.find((post) => post.id !== selected.id && visible.indexOf(post) > visible.indexOf(selected))?.id ?? visible.find((post) => post.id !== selected.id)?.id ?? "" : "";
  const noteReady = activeNote.trim().length > 0;
  const livePanel = view === "published" && !!selected && (!!selected.postUrl || selected.queue === "live" || selected.queue === "link");
  const matchHeights = livePanel && selected.slides.length === 1 && selected.revisions.length === 0;

  function choose(id: string) {
    setSelectedId(id);
    setNotedFor("");
    setNote("");
  }

  function updateNote(value: string) {
    if (!selected) return;
    setNotedFor(selected.id);
    setNote(value);
  }

  function addReply(value: string) {
    const current = activeNote.trim();
    updateNote(current ? `${current}\n\n${value}` : value);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h2 className="text-[28px] font-medium tracking-tight">{VIEW_TITLE[view]}</h2>
        <div className="flex flex-wrap gap-2">
          <FilterDropdown
            label="Affiliate"
            value={affiliate}
            onChange={(value) => { setAffiliate(value); setSelectedId(""); }}
            options={[{ value: "", label: "All affiliates" }, ...affiliates.map(([code, name]) => ({ value: code, label: name }))]}
          />
          <FilterDropdown
            label="Platform"
            value={platform}
            onChange={(value) => { setPlatform(value); setSelectedId(""); }}
            options={[{ value: "", label: "All platforms" }, ...platforms.map((item) => ({ value: item, label: item }))]}
          />
          <FilterDropdown
            label="Campaign"
            value={campaign}
            onChange={(value) => { setCampaign(value); setSelectedId(""); }}
            options={[{ value: "", label: "All campaigns" }, ...campaigns.map((item) => ({ value: item, label: item }))]}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={(value) => { setStatus(value); setSelectedId(""); }}
            options={[{ value: "", label: "All statuses" }, ...statuses.map((item) => ({ value: item, label: STATUS_LABEL[item] }))]}
          />
          <FilterDatePicker label="Submitted date" placeholder="Any date" value={day} onChange={(value) => { setDay(value); setSelectedId(""); }} />
          {affiliate || platform || campaign || status || day ? (
            <button
              type="button"
              onClick={() => { setAffiliate(""); setPlatform(""); setCampaign(""); setStatus(""); setDay(""); setSelectedId(""); }}
              className={`h-11 rounded-full px-3 text-sm font-medium text-ink underline underline-offset-4 ${filterFocus}`}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
      {notice ? <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">{notice}</p> : null}
      <div className="grid min-h-[calc(100dvh-14rem)] items-stretch gap-4 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col gap-3 rounded-[24px] bg-white p-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search affiliate or caption" className="h-11 rounded-full border border-[#CDBDBA] px-4 text-sm" />
          <p className="px-2 text-xs text-brown">Oldest first</p>
          <ul className="flex flex-col gap-1">
            {visible.length ? visible.map((post) => {
              const current = selected?.id === post.id;
              return (
                <li key={post.id}>
                  <div className={`flex w-full items-start gap-3 rounded-2xl p-2 ${current ? "bg-background" : "hover:bg-background"}`}>
                    <Thumb post={post} />
                    <button type="button" onClick={() => choose(post.id)} className="min-w-0 flex-1 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{post.name}</span>
                        {post.queue === "waiting" ? <span className="shrink-0 text-[11px] text-brown">{post.waiting}</span> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-brown">{post.excerpt || "No caption yet"}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">{STATUS_LABEL[post.queue]}</span>
                        <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">{post.kindShort}</span>
                        <span className="rounded-full bg-[#F3E6E3] px-2 py-0.5 text-[11px] text-[#4A3A37]">{post.source}</span>
                        {post.campaign ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">{post.campaign}</span> : null}
                        {post.agreement ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">Agreement</span> : null}
                        {post.flagCount ? <span className="rounded-full bg-[#FBEFD6] px-2 py-0.5 text-[11px] font-medium text-[#7A4E00]">{post.flagCount} flag{post.flagCount === 1 ? "" : "s"}</span> : null}
                        {!post.flagCount && post.checksPass ? <span className="rounded-full bg-[#DDF0E4] px-2 py-0.5 text-[11px] font-medium text-[#1D6340]">Checks pass</span> : null}
                        {post.batchLabel ? <span className="text-[11px] text-brown">{post.batchLabel}</span> : null}
                        {post.version > 1 ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">Resubmitted · v{post.version}</span> : null}
                      </span>
                    </span>
                    </button>
                  </div>
                </li>
              );
            }) : <li className="px-2 py-6 text-sm text-brown">No posts in this list.</li>}
          </ul>
        </aside>
        {selected ? (
          <section className="flex h-full min-h-0 flex-col gap-4 rounded-[24px] bg-white p-4 sm:p-5">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F3E4E1] text-xs font-semibold text-ink">{initials(selected.name)}</span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{selected.name} · {selected.kind}</h3>
                  <p className="text-xs font-semibold text-brown">{selected.source}</p>
                  <p className="mt-1 text-[13px] text-brown">
                    {selected.email} · ref {selected.code} · sent {selected.sent} · version {selected.version}
                    {selected.batchLabel ? ` · post ${selected.batchLabel}` : ""}
                  </p>
                  {selected.campaign || selected.agreement || selected.dateValue ? (
                    <p className="mt-1 text-[13px] text-brown">{[selected.campaign, selected.agreement, selected.dateValue ? `${selected.dateLabel} ${selected.dateValue}` : ""].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  {selected.reviewedBy ? <p className="mt-1 text-[13px] text-brown">Reviewed by {selected.reviewedBy}</p> : null}
                </div>
              </div>
              <a href={selected.pastHref} className="text-sm underline underline-offset-4">Affiliate’s past posts</a>
            </header>
            <div className={`grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] ${matchHeights ? "xl:items-stretch" : "items-start"}`}>
              <div className="flex min-w-0 flex-col gap-3">
                <p className="text-[11px] font-semibold tracking-wide text-brown">SLIDES AND CAPTIONS · IN POSTING ORDER</p>
                <div className={`flex min-w-0 flex-col gap-3 ${matchHeights ? "xl:flex-1 xl:*:flex-1" : ""}`}>
                {selected.slides.map((slide) => (
                  <SlideCard key={`${selected.id}-${slide.index}`} slide={slide} canDecide={selected.canDecide} onAdd={addReply} />
                ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {livePanel ? <p className="text-[11px] font-semibold tracking-wide text-brown">PUBLISHED POST</p> : null}
                {view === "published" ? null : (
                  <div className="rounded-2xl bg-background p-4">
                    <h4 className="text-sm font-semibold">Automatic checks</h4>
                    <ul className="mt-3 flex flex-col gap-2">
                      {selected.checks.map((check) => (
                        <li key={check.label} className={`text-sm ${check.tone === "warn" ? "text-[#7A4E00]" : "text-[#1D6340]"}`}>
                          {check.tone === "warn" ? "!" : "✓"} {check.label}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[13px] leading-relaxed text-brown">Checks help, but every slide and caption still needs a look.</p>
                  </div>
                )}
                {selected.postUrl || selected.queue === "live" || selected.queue === "link" ? (
                  <div className={`flex flex-col rounded-[18px] border border-[#E8DEDC] bg-white p-4 text-sm shadow-[0_12px_32px_-20px_rgba(51,19,15,0.35)] ${matchHeights ? "xl:flex-1 xl:justify-between xl:gap-4" : "gap-3"}`}>
                    <div className="flex flex-col gap-3">
                      {livePanel ? null : <h4 className="font-semibold">Published post</h4>}
                      {selected.queue === "link" ? (
                        <span className="self-start rounded-full bg-[#FBEFD6] px-2.5 py-1 text-[11px] font-medium text-[#7A4E00]">Link needs a check</span>
                      ) : selected.queue === "live" ? (
                        <span className="self-start rounded-full bg-[#DDF0E4] px-2.5 py-1 text-[11px] font-medium text-[#1D6340]">Live</span>
                      ) : null}
                      {selected.postUrl ? (
                        <a href={selected.postUrl} target="_blank" rel="noopener noreferrer" className="block break-all text-[13px] leading-relaxed underline decoration-[#CDBDBA] underline-offset-4">{selected.postUrl}</a>
                      ) : (
                        <p className="text-[#7A4E00]">No live link on file.</p>
                      )}
                      {selected.queue === "link" ? <p className="text-[13px] leading-relaxed text-brown">The live link could not be confirmed.</p> : null}
                      {selected.queue === "live" && selected.views == null ? <p className="text-[13px] leading-relaxed text-brown">Views are not on file yet.</p> : null}
                      {selected.queue === "live" && selected.views != null ? <p className="text-[13px] leading-relaxed text-brown">{selected.views.toLocaleString("en-US")} views on file.</p> : null}
                    </div>
                    {selected.canMark ? (
                      <form action={markPostCheckedAction} className="flex flex-col gap-3 border-t border-[#E8DEDC] pt-3">
                        <input type="hidden" name="id" value={selected.id} />
                        <input type="hidden" name="return" value={view === "all" ? "" : view} />
                        <input type="hidden" name="next" value={openNext ? nextId : ""} />
                        <p className="text-[13px] leading-relaxed text-brown">Open the link and confirm the caption tags @myleaderhealth. The post does not track without that tag. The sponsorship line and tracking link are optional.</p>
                        <button type="submit" className="inline-flex h-10 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-white">Mark as checked</button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
                {selected.revisions.length ? (
                  <div className="rounded-2xl bg-background p-4 text-sm">
                    <h4 className="font-semibold">Revision history</h4>
                    <ul className="mt-2 flex flex-col gap-2">
                      {selected.revisions.map((revision) => (
                        <li key={`${revision.version}-${revision.when}`}>
                          <p className="text-brown">Version {revision.version}{revision.when ? ` · ${revision.when}` : ""}</p>
                          {revision.note ? <p className="mt-1 whitespace-pre-wrap">{revision.note}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selected.canDecide ? (
                  <div className="rounded-2xl bg-background p-4">
                    <label htmlFor="review-note" className="text-sm font-semibold">Note to affiliate</label>
                    <textarea id="review-note" rows={5} value={activeNote} onChange={(event) => updateNote(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[#DCCFCC] bg-white px-3 py-2 text-sm leading-relaxed" />
                    <p className="mt-2 text-[13px] text-brown">Required to request changes or decline. Saved replies:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => addReply(selected.suggestedNote || "Please remove the treatment claim. We can’t make treatment claims in affiliate posts.")}>Treatment claim</button>
                      <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => addReply("Please add “Paid partnership with Leader Health” in the caption. A link in your bio is not enough.")}>Missing disclosure</button>
                      <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => addReply("Please tag @myleaderhealth in the caption. The post will not track without that tag.")}>Missing @myleaderhealth</button>
                      <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => addReply("Please resend the video as an MP4, MOV, or WebM under 200 MB. A video saved from TikTok is fine when it is an MP4. Photos need to be under 8 MB.")}>Media quality</button>
                    </div>
                  </div>
                ) : null}
                {selected.postUrl ? null : (
                  <div className="rounded-2xl bg-background p-4 text-sm leading-relaxed text-brown">
                    <p className="font-semibold text-ink">The whole post is one decision</p>
                    <p className="mt-1">{selected.slides.length === 1 ? "Approving covers the slide and its caption." : `Approving covers all ${selected.slides.length} slides and their captions.`} To fix one slide, request changes and name it in the note.</p>
                  </div>
                )}
              </div>
            </div>
            {selected.canDecide ? (
              <footer className="flex flex-wrap items-center gap-3 border-t border-[#E8DEDC] pt-4">
                <label className="mr-auto inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={openNext} onChange={(event) => setOpenNext(event.target.checked)} />
                  Open next post after deciding
                </label>
                <form action={rejectPostAction}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="note" value={activeNote} />
                  <input type="hidden" name="return" value={view === "all" ? "" : view} />
                  <input type="hidden" name="next" value={openNext ? nextId : ""} />
                  <button type="submit" disabled={!noteReady} className={`${quietButton} text-[#9B2C1F] disabled:cursor-not-allowed disabled:opacity-50`}>Decline</button>
                </form>
                <form action={requestPostChangeAction}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="note" value={activeNote} />
                  <input type="hidden" name="return" value={view === "all" ? "" : view} />
                  <input type="hidden" name="next" value={openNext ? nextId : ""} />
                  <button type="submit" disabled={!noteReady} className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">Request changes</button>
                </form>
                <form action={approvePostAction}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="return" value={view === "all" ? "" : view} />
                  <input type="hidden" name="next" value={openNext ? nextId : ""} />
                  <button type="submit" className={quietButton}>{selected.slides.length > 1 ? `Approve all ${selected.slides.length} slides` : "Approve"}</button>
                </form>
              </footer>
            ) : null}
          </section>
        ) : (
          <section className="h-full min-h-0 rounded-[24px] bg-white p-8 text-sm text-brown">Choose a post from the list.</section>
        )}
      </div>
    </div>
  );
}

function linkRows(url: string) {
  try {
    const parsed = new URL(url);
    const rows = [{ label: "Page", value: `${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}` }];
    for (const [key, value] of parsed.searchParams) rows.push({ label: key, value });
    return rows.length > 1 ? rows : [];
  } catch {
    return [];
  }
}

function LinkCheck({ url }: { url: string }) {
  const rows = linkRows(url);
  if (!rows.length) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm leading-relaxed underline decoration-[#CDBDBA] underline-offset-2 [overflow-wrap:break-word]">
        {linkText(url)}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col divide-y divide-[#E8DEDC] overflow-hidden rounded-xl bg-background">
      {rows.map((row) => (
        <span key={`${row.label}-${row.value}`} className="grid grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-3 px-3 py-2">
          <span className="truncate text-[12px] text-brown" title={row.label}>{row.label}</span>
          <span className="min-w-0 text-sm [overflow-wrap:break-word]">{row.value}</span>
        </span>
      ))}
    </a>
  );
}

function SlideCard({ slide, canDecide, onAdd }: { slide: ReviewSlide; canDecide: boolean; onAdd: (value: string) => void }) {
  const [failed, setFailed] = useState(false);
  const [seenHref, setSeenHref] = useState(slide.href);
  if (slide.href !== seenHref) {
    setSeenHref(slide.href);
    setFailed(false);
  }
  const pieces = captionPieces(slide.caption);
  const links = pieces.filter((piece) => piece.kind === "link").map((piece) => piece.value);
  const text = pieces.filter((piece) => piece.kind === "text").map((piece) => piece.value).join("").trim();
  return (
    <article className={`grid items-start gap-3 rounded-2xl border p-3 ${failed ? "grid-cols-1" : "grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)]"} ${slide.claims.length ? "border-[#E2C48A] bg-[#FFF9F1]" : "border-[#E8DEDC]"}`}>
      {failed ? null : <SlideMedia slide={slide} onFail={() => setFailed(true)} />}
      <div className="flex min-h-0 min-w-0 flex-col gap-2">
        {failed ? (
          <p className="text-sm text-brown">This {slide.video ? "reel" : "photo"} was not saved with the post. Ask the affiliate to send it again.</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Slide {slide.index}</span>
          <span className="min-w-0 max-w-56 truncate text-[13px] text-brown" title={slide.name}>{slide.name}</span>
          {slide.cover ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">Cover</span> : null}
          {slide.video ? <span className="rounded-full bg-[#EFEAE9] px-2 py-0.5 text-[11px] text-[#4A3A37]">Video</span> : null}
          {slide.disclosure ? <span className="rounded-full bg-[#DDF0E4] px-2 py-0.5 text-[11px] font-medium text-[#1D6340]">Disclosure</span> : null}
          {slide.tagged ? <span className="rounded-full bg-[#DDF0E4] px-2 py-0.5 text-[11px] font-medium text-[#1D6340]">@myleaderhealth</span> : null}
          {slide.tracking ? <span className="rounded-full bg-[#DDF0E4] px-2 py-0.5 text-[11px] font-medium text-[#1D6340]">Tracking link</span> : null}
          {slide.claims.length ? <span className="rounded-full bg-[#FBEFD6] px-2 py-0.5 text-[11px] font-medium text-[#7A4E00]">{slide.claims.length} flag{slide.claims.length === 1 ? "" : "s"}</span> : null}
        </div>
        {text ? <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:break-word]">{markedCaption(text, slide.claims)}</p> : null}
        {links.length ? links.map((url) => <LinkCheck key={url} url={url} />) : text ? null : <p className="text-sm text-brown">No caption on this slide</p>}
        {slide.claims.length && canDecide ? (
          <button type="button" className="text-[13px] underline underline-offset-4" onClick={() => onAdd(`Slide ${slide.index}: please remove “${slide.claims[0]}.” We can’t make treatment claims in affiliate posts.`)}>
            Add to note: slide {slide.index}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SlideMedia({ slide, onFail }: { slide: ReviewSlide; onFail: () => void }) {
  return (
    <MediaExpand
      src={slide.href}
      media={slide.video ? "video" : "photo"}
      label={`Slide ${slide.index}`}
      className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-xl bg-[#E8DEDC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {slide.video ? (
        <video
          src={slide.href}
          muted
          playsInline
          preload="metadata"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          onError={onFail}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.href} alt="" className="absolute inset-0 h-full w-full object-contain" onError={onFail} />
      )}
      <span className="pointer-events-none absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">{slide.index}</span>
    </MediaExpand>
  );
}

function Thumb({ post }: { post: ReviewPost }) {
  const cover = post.slides[0];
  if (!cover) return <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#E8DEDC] text-[10px] text-brown">File</span>;
  return (
    <MediaExpand src={cover.href} media={cover.video ? "video" : "photo"} label={post.excerpt || "Post"}>
      <MediaPreview src={cover.href} media={cover.video ? "video" : "photo"} className="size-12 shrink-0 rounded-xl object-cover" />
    </MediaExpand>
  );
}
