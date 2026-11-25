"use client";

import { useState } from "react";
import { respondToCampaignAction } from "@/app/affiliates/campaign-actions";
import { submitLiveLinkAction, submitPostsAction } from "@/app/affiliates/post-actions";
import type { AffiliateActiveCampaign, AffiliateCampaignInvite, AffiliateCampaignSlot, AffiliatePastCampaign } from "@/lib/affiliate/affiliate-campaigns";
import type { CampaignPostState } from "@/lib/affiliate/campaign-list";
import type { PostFormat } from "@/lib/affiliate/post-format";
import { liveLinkFor } from "@/lib/affiliate/post-format";
import { agreementKindFormat, agreementSlotRows, kindUsedCount, openPostingMonth, postingMonthDateBounds, postingMonthOption, type PostingAgreement } from "@/lib/affiliate/post-agreement";

const TONE: Record<CampaignPostState, string> = {
  todo: "bg-[#EFEAE9] text-[#4A3A37]",
  pending: "bg-[#FBEFD6] text-[#7A4E00]",
  changes: "bg-[#FBE3DF] text-[#9B2C1F]",
  ready: "bg-ink text-white",
  published: "bg-[#F3E6E3] text-[#5A2A24]",
  verified: "bg-[#DDF0E4] text-[#1D6340]",
  rejected: "bg-[#FBE3DF] text-[#9B2C1F]",
  failed: "bg-[#FBE3DF] text-[#9B2C1F]",
};

const PAST: Record<AffiliatePastCampaign["tone"], string> = {
  completed: "bg-[#DDF0E4] text-[#1D6340]",
  declined: "bg-[#EFEAE9] text-[#4A3A37]",
};

export type CampaignFill = {
  id: string;
  agreementId: string;
  contentStatus: string;
  offerId: string;
  publishedAt: string | null;
  submittedAt: string | null;
  postingMonth: string;
  format: string | null;
  fileCount: number;
  agreementPlatform: string;
  agreementPostType: string;
  agreementSlot: number | null;
};

function kindTitle(platform: string, type: string) {
  if (platform === "TikTok" && type === "Video") return "TikTok video";
  if (platform === "Instagram" && type === "Reel") return "Instagram reel";
  if (platform === "Instagram" && type === "Carousel") return "Instagram carousel";
  if (platform === "Instagram" && type === "Image post") return "Instagram image";
  return `${platform} ${type.toLowerCase()}`;
}

function openRequirements(posting: PostingAgreement | null, fills: CampaignFill[], period: string, editingId = "") {
  if (!posting || !period) return [];
  return agreementSlotRows(
    fills.map((post) => ({ ...post, publicationStatus: null, reviewNote: "", title: "" })),
    posting.id,
    period,
    posting.postTotal,
  ).filter((row) => !row.post || row.post.id === editingId).map((row) => row.number);
}

function openKinds(posting: PostingAgreement | null, fills: CampaignFill[], period: string, editingId = "") {
  if (!posting || !period) return [];
  const skip = new Set(editingId ? [editingId] : []);
  return posting.mix.flatMap((item) => {
    const format = agreementKindFormat(item.platform, item.type);
    if (!format) return [];
    const left = Math.max(0, item.count - kindUsedCount(fills, posting.id, period, item.platform, item.type, skip));
    if (left < 1) return [];
    return [{ platform: item.platform, type: item.type, format, count: item.count, left, title: kindTitle(item.platform, item.type) }];
  });
}

function linkPlaceholder(format: PostFormat | null) {
  if (format === "tiktok") return "tiktok.com/@you/video/…";
  if (format === "instagram_post") return "instagram.com/p/…";
  if (format === "facebook_post" || format === "facebook_reel" || format === "facebook_video") return "facebook.com/… or fb.watch/…";
  if (format === "youtube_short") return "youtube.com/shorts/…";
  if (format === "youtube_video") return "youtube.com/watch?v=…";
  return "instagram.com/reel/…";
}

function httpsLink(value: string) {
  const trimmed = value.trim();
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:/i, "https:");
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

export function AffiliateCampaigns({
  invites,
  active,
  past,
  disclosure,
  trackingUrl,
  canSend,
  posting,
  fills,
  toast,
  error,
}: {
  invites: AffiliateCampaignInvite[];
  active: AffiliateActiveCampaign[];
  past: AffiliatePastCampaign[];
  disclosure: string;
  trackingUrl: string;
  canSend: boolean;
  posting: PostingAgreement | null;
  fills: CampaignFill[];
  toast: string;
  error: string;
}) {
  const [declining, setDeclining] = useState("");
  const [open, setOpen] = useState("");
  const [caption, setCaption] = useState("");
  const [month, setMonth] = useState("");
  const [requirement, setRequirement] = useState<number | null>(null);
  const [kind, setKind] = useState("");
  const [editingId, setEditingId] = useState("");
  const [problem, setProblem] = useState("");

  function chooseMonth(period: string, editing = editingId) {
    const numbers = openRequirements(posting, fills, period, editing);
    const kinds = openKinds(posting, fills, period, editing);
    setMonth(period);
    setRequirement((current) => current != null && numbers.includes(current) ? current : numbers[0] ?? null);
    setKind((current) => kinds.some((item) => `${item.platform}::${item.type}` === current) ? current : kinds[0] ? `${kinds[0].platform}::${kinds[0].type}` : "");
  }

  function openSlot(slot: AffiliateCampaignSlot) {
    const period = openPostingMonth(posting?.months ?? [], new Date().toISOString().slice(0, 10));
    setOpen(slot.key);
    setCaption("");
    setEditingId(slot.postId);
    chooseMonth(period, slot.postId);
    setProblem("");
  }

  const hasDisclosure = caption.toLowerCase().includes(disclosure.toLowerCase());
  const hasTag = caption.toLowerCase().includes("@myleaderhealth");
  const hasLink = trackingUrl !== "" && caption.includes(trackingUrl);

  return (
    <div className="flex flex-col gap-7 rounded-[28px] bg-white p-4 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[30px] font-medium tracking-tight">My campaigns</h2>
        <p className="text-[15px] leading-normal text-[#4A3A37]">Campaigns Leader Health invited you to. You can still send posts outside a campaign in My posts.</p>
      </div>
      {toast ? <p role="status" className="rounded-[14px] bg-[#DDF0E4] px-4 py-3 text-[15px] font-medium text-[#1D6340]">{toast}</p> : null}
      {error ? <p role="alert" className="rounded-[14px] bg-[#FBE3DF] px-4 py-3 text-sm text-[#9B2C1F]">{error}</p> : null}

      <section className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">New invitations</h3>
        {invites.length === 0 ? <p className="rounded-[14px] bg-[#F7F3F2] px-4 py-4 text-[15px] text-[#6B5A57]">No new invitations.</p> : null}
        {invites.map((invite) => (
          <article key={invite.name} className="flex flex-col gap-4 rounded-[22px] border-2 border-ink p-[22px]">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex min-w-0 flex-1 basis-[22rem] flex-col gap-1.5">
                <span className="w-fit rounded-full bg-[#FBEFD6] px-2.5 py-0.5 text-[13px] font-semibold text-[#7A4E00]">New invitation</span>
                <h4 className="text-[22px] font-semibold">{invite.name}</h4>
                {invite.description ? <p className="text-[15px] leading-normal text-[#4A3A37]">{invite.description}</p> : null}
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[30px] font-medium">{invite.total}</span>
                <span className="text-[13px] text-[#6B5A57]">{invite.terms}</span>
                {invite.performance ? <span className="max-w-64 text-right text-[13px] text-[#6B5A57]">{invite.performance}</span> : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Fact label="Content" value={invite.content} />
              <Fact label="Deadline" value={invite.due} />
              <Fact label="Paid" value="After each post is verified" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Guidelines</span>
              <p className="text-[15px] leading-normal text-[#4A3A37]">{invite.guidelines || "No extra guidelines."}</p>
              <p className="text-[13px] text-[#6B5A57]">Every caption needs @myleaderhealth so the post can track. “{disclosure}” and your tracking link are optional.</p>
            </div>
            {declining === invite.name ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-[#FBF1EF] px-4 py-3.5">
                <span className="min-w-[16rem] flex-1 text-[15px]">Decline this campaign? It can’t be undone.</span>
                <form action={respondToCampaignAction}>
                  <input type="hidden" name="name" value={invite.name} />
                  <input type="hidden" name="decision" value="decline" />
                  <button type="submit" className="inline-flex h-[46px] items-center rounded-full border border-[#F0CFC9] bg-white px-5 text-[15px] font-medium text-[#9B2C1F]">Decline campaign</button>
                </form>
                <button type="button" onClick={() => setDeclining("")} className="inline-flex h-11 items-center text-sm text-ink underline">Keep it</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                <form action={respondToCampaignAction}>
                  <input type="hidden" name="name" value={invite.name} />
                  <input type="hidden" name="decision" value="accept" />
                  <button type="submit" className="inline-flex h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white">Accept campaign</button>
                </form>
                <button type="button" onClick={() => setDeclining(invite.name)} className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink">Decline</button>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">Active campaigns</h3>
        {active.length === 0 ? <p className="rounded-[14px] bg-[#F7F3F2] px-4 py-4 text-[15px] text-[#6B5A57]">No active campaigns.</p> : null}
        {active.map((campaign) => (
          <article key={campaign.name} className="flex flex-col gap-4 rounded-[22px] border border-[#E8DEDC] p-[22px]">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex min-w-0 flex-1 basis-[18rem] flex-col gap-1">
                <h4 className="text-xl font-semibold">{campaign.name}</h4>
                <p className="text-sm text-[#4A3A37]">{campaign.content} · due {campaign.due} · {campaign.terms}</p>
                {campaign.performance ? <p className="text-[13px] text-[#6B5A57]">{campaign.performance}</p> : null}
              </div>
              <span className="rounded-full bg-[#F3E6E3] px-3 py-1 text-[13px] font-semibold text-[#5A2A24]">{campaign.status}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span>{campaign.progressText}</span>
                <span className="text-[#6B5A57]">{campaign.earned}</span>
              </div>
              <div role="img" aria-label={campaign.progressText} className="h-2 overflow-hidden rounded bg-[#E8DEDC]">
                <div className="h-2 bg-[#1D6340]" style={{ width: `${campaign.progressPct}%` }} />
              </div>
            </div>
            {campaign.posts.map((slot) => {
              const submitting = open === slot.key && slot.action === "submit";
              const linking = open === slot.key && slot.action === "link";
              const numbers = openRequirements(posting, fills, month, editingId);
              const kinds = openKinds(posting, fills, month, editingId);
              const chosen = kinds.find((item) => `${item.platform}::${item.type}` === kind) ?? kinds[0] ?? null;
              const dateBounds = posting && month ? postingMonthDateBounds(month, posting.startsOn, posting.endsOn) : null;
              const carousel = chosen?.type === "Carousel";
              return (
                <div key={slot.key} className="flex flex-col gap-2.5 border-t border-[#F0E8E6] pt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-[10px] bg-[#F7F3F2] text-[13px] font-semibold text-[#5A2A24]">{slot.number}</span>
                    <span className="flex min-w-0 flex-1 basis-[14rem] flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{slot.title}</span>
                      <span className="text-[13px] text-[#6B5A57]">{slot.note}</span>
                    </span>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-semibold ${TONE[slot.tone]}`}>{slot.label}</span>
                    {slot.action && !submitting && !linking ? (
                      <button type="button" onClick={() => openSlot(slot)} className="inline-flex h-10 items-center rounded-full bg-ink px-[18px] text-sm font-medium text-white">{slot.actionLabel}</button>
                    ) : null}
                  </div>
                  {submitting ? (
                    <form
                      action={submitPostsAction}
                      className="flex flex-col gap-3.5 rounded-2xl bg-[#F7F3F2] p-4"
                      onSubmit={(event) => {
                        const input = event.currentTarget.elements.namedItem("file0") as HTMLInputElement | null;
                        const uploaded = [...(input?.files ?? [])];
                        if (!slot.hasFile && uploaded.length === 0) {
                          event.preventDefault();
                          setProblem("Upload your file first.");
                          return;
                        }
                        if (carousel && uploaded.length < 2) {
                          event.preventDefault();
                          setProblem("A carousel needs at least two photos or videos.");
                          return;
                        }
                        if (!hasTag) {
                          event.preventDefault();
                          setProblem("Tag @myleaderhealth in the caption so the post can track.");
                          return;
                        }
                        if (!posting) {
                          event.preventDefault();
                          setProblem("A signed agreement has to be on your account before you can send a post.");
                          return;
                        }
                        if (!requirement || !chosen) {
                          event.preventDefault();
                          setProblem(!requirement ? "Choose the agreement post you are filling in." : "Choose the type of post this agreement asks for.");
                          return;
                        }
                        const date = String(new FormData(event.currentTarget).get("proposedPublishOn") ?? "");
                        if (!date || (dateBounds && (date < dateBounds.min || date > dateBounds.max))) {
                          event.preventDefault();
                          setProblem("Choose a proposed publishing date in that month.");
                          return;
                        }
                        if (!canSend) {
                          event.preventDefault();
                          setProblem("The social rate is not set yet.");
                          return;
                        }
                        if (!carousel) return;
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        data.delete("file0");
                        data.set("slots0", String(uploaded.length));
                        data.set("slideCount0", String(uploaded.length));
                        uploaded.forEach((file, index) => {
                          data.set(`file0_${index}`, file);
                          data.set(`slideCaption0_${index}`, caption);
                        });
                        void submitPostsAction(data);
                      }}
                    >
                      <input type="hidden" name="returnTo" value="campaigns" />
                      <input type="hidden" name="count" value="1" />
                      <input type="hidden" name="campaign" value={campaign.name} />
                      {posting ? <input type="hidden" name="agreement" value={posting.id} /> : null}
                      {canSend ? <input type="hidden" name="terms" value="yes" /> : null}
                      <input type="hidden" name="id0" value={slot.postId} />
                      <input type="hidden" name="format0" value={chosen?.format ?? ""} />
                      <input type="hidden" name="requirement" value={requirement ?? ""} />
                      <input type="hidden" name="agreementPlatform" value={chosen?.platform ?? ""} />
                      <input type="hidden" name="agreementPostType" value={chosen?.type ?? ""} />
                      <input type="hidden" name="caption0" value={caption} />
                      {posting?.months.length ? (
                        <label className="flex flex-col gap-1.5 text-sm font-semibold">
                          Month this post counts toward
                          <select name="postingMonth" value={month} onChange={(event) => chooseMonth(event.target.value)} className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal">
                            {posting.months.map((item) => <option key={item.period} value={item.period}>{postingMonthOption(item)}</option>)}
                          </select>
                        </label>
                      ) : null}
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`req-${slot.key}`}>
                        Which post are you filling in?
                        <select id={`req-${slot.key}`} value={requirement ?? ""} onChange={(event) => setRequirement(Number(event.target.value) || null)} className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal">
                          {numbers.length === 0 ? <option value="">No open posts this month</option> : numbers.map((number) => <option key={number} value={number}>Post {number}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`kind-${slot.key}`}>
                        What are you posting?
                        <select id={`kind-${slot.key}`} value={chosen ? `${chosen.platform}::${chosen.type}` : ""} onChange={(event) => setKind(event.target.value)} className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal">
                          {kinds.length === 0 ? <option value="">No open types this month</option> : kinds.map((item) => <option key={`${item.platform}::${item.type}`} value={`${item.platform}::${item.type}`}>{item.title} · {item.left} of {item.count} left</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`date-${slot.key}`}>
                        Proposed publishing date
                        <input id={`date-${slot.key}`} name="proposedPublishOn" type="date" required min={dateBounds?.min} max={dateBounds?.max} className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal" />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`up-${slot.key}`}>
                        1. Upload your {chosen ? chosen.title.toLowerCase() : "file"}
                        <input id={`up-${slot.key}`} name="file0" type="file" multiple={carousel} accept={chosen?.type === "Image post" ? "image/png,image/jpeg,image/webp" : chosen?.format === "instagram_post" || chosen?.format === "facebook_post" ? "image/*,video/*" : "video/*"} onChange={() => setProblem("")} className="rounded-xl border border-[#CDBDBA] bg-white px-2.5 py-2.5 text-sm font-normal" />
                        {carousel ? <span className="text-sm font-normal text-[#6B5A57]">At least two. The first one is the cover.</span> : null}
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`cap-${slot.key}`}>
                        2. Caption
                        <textarea id={`cap-${slot.key}`} rows={4} value={caption} onChange={(event) => { setCaption(event.target.value); setProblem(""); }} className="resize-y rounded-xl border border-[#CDBDBA] bg-white px-3.5 py-2.5 text-[15px] font-normal leading-normal" />
                      </label>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">3. Tag @myleaderhealth so the post can track</span>
                        <CheckLine ok={hasTag} label="@myleaderhealth" onInsert={hasTag ? undefined : () => setCaption((current) => `${current.trim() ? `${current.replace(/\s+$/, "")}\n` : ""}@myleaderhealth`)} />
                        <CheckLine ok={hasDisclosure} optional label={disclosure} onInsert={hasDisclosure ? undefined : () => setCaption((current) => `${current.trim() ? `${current.replace(/\s+$/, "")}\n\n` : ""}${disclosure}`)} />
                        <CheckLine ok={hasLink} optional label={trackingUrl || "Your tracking link"} mono onInsert={!trackingUrl || hasLink ? undefined : () => setCaption((current) => `${current.trim() ? `${current.replace(/\s+$/, "")}\n` : ""}${trackingUrl}`)} />
                      </div>
                      {posting ? <p className="text-sm text-[#4A3A37]">Posting under your agreement: {posting.label}</p> : <p className="text-sm text-[#9B2C1F]">A signed agreement has to be on your account before you can send a post.</p>}
                      {posting && posting.months.length === 0 ? <p className="text-sm text-[#9B2C1F]">These dates don&apos;t include a full month, so posts can&apos;t be sent under this agreement.</p> : null}
                      {canSend ? null : <p className="text-sm text-[#9B2C1F]">The social rate is not set yet.</p>}
                      {problem ? <p role="alert" className="text-sm text-[#9B2C1F]">{problem}</p> : null}
                      <div className="flex flex-wrap gap-2.5">
                        <button type="submit" disabled={!canSend || !posting || posting.months.length === 0} className="inline-flex h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white disabled:opacity-50">Submit for approval</button>
                        <button type="button" onClick={() => { setOpen(""); setProblem(""); }} className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink">Cancel</button>
                      </div>
                    </form>
                  ) : null}
                  {linking ? (
                    <form
                      action={submitLiveLinkAction}
                      className="flex flex-col gap-2.5 rounded-2xl bg-[#F7F3F2] p-4"
                      onSubmit={(event) => {
                        const url = String(new FormData(event.currentTarget).get("postUrl") ?? "").trim();
                        if (!liveLinkFor(slot.format, httpsLink(url))) {
                          event.preventDefault();
                          setProblem("Paste the link to the live post.");
                        }
                      }}
                    >
                      <input type="hidden" name="returnTo" value="campaigns" />
                      <input type="hidden" name="id" value={slot.postId} />
                      <label className="text-sm font-semibold" htmlFor={`url-${slot.key}`}>Paste the live post link</label>
                      <div className="flex flex-wrap gap-2.5">
                        <input id={`url-${slot.key}`} name="postUrl" type="url" placeholder={linkPlaceholder(slot.format)} onChange={() => setProblem("")} className="h-[46px] min-w-[16rem] flex-1 rounded-xl border border-[#CDBDBA] bg-white px-3.5 text-[15px]" />
                        <button type="submit" className="inline-flex h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white">Submit link</button>
                      </div>
                      {problem ? <p role="alert" className="text-sm text-[#9B2C1F]">{problem}</p> : null}
                      <button type="button" onClick={() => { setOpen(""); setProblem(""); }} className="w-fit text-sm text-ink underline">Cancel</button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 text-xl font-semibold">Past</h3>
        {past.length === 0 ? <p className="text-[15px] text-[#6B5A57]">No past campaigns.</p> : null}
        {past.map((item) => (
          <div key={item.name} className="flex items-center gap-3 border-t border-[#F0E8E6] py-3.5">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-medium">{item.name}</span>
              <span className="text-[13px] text-[#6B5A57]">{item.meta}</span>
            </span>
            <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${PAST[item.tone]}`}>{item.label}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
      <span className="text-[13px] text-[#6B5A57]">{label}</span>
      <span className="text-[15px] font-semibold">{value}</span>
    </div>
  );
}

function CheckLine({ ok, label, mono = false, optional = false, onInsert }: { ok: boolean; label: string; mono?: boolean; optional?: boolean; onInsert?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px]">
      <span className={`grid size-[22px] place-items-center rounded-full text-[13px] font-bold ${ok ? "bg-[#DDF0E4] text-[#1D6340]" : optional ? "bg-[#F7F3F2] text-[#6B5A57]" : "bg-[#FBE3DF] text-[#9B2C1F]"}`}>{ok ? "✓" : optional ? "–" : "!"}</span>
      <span className={`min-w-0 flex-1 break-all ${mono ? "font-mono text-sm" : ""}`}>{label}{optional ? " · optional" : ""}</span>
      {onInsert ? <button type="button" onClick={onInsert} className="inline-flex h-[34px] items-center rounded-full border border-[#CDBDBA] bg-white px-3 text-[13px] text-ink">Insert</button> : null}
    </div>
  );
}
