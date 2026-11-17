"use client";

import { useState } from "react";
import { respondToCampaignAction } from "@/app/affiliates/campaign-actions";
import { submitLiveLinkAction, submitPostsAction } from "@/app/affiliates/post-actions";
import type { AffiliateActiveCampaign, AffiliateCampaignInvite, AffiliateCampaignSlot, AffiliatePastCampaign } from "@/lib/affiliate/affiliate-campaigns";
import type { CampaignPostState } from "@/lib/affiliate/campaign-list";
import type { PostFormat } from "@/lib/affiliate/post-format";

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

export function AffiliateCampaigns({
  invites,
  active,
  past,
  disclosure,
  trackingUrl,
  terms,
  canSend,
  toast,
  error,
}: {
  invites: AffiliateCampaignInvite[];
  active: AffiliateActiveCampaign[];
  past: AffiliatePastCampaign[];
  disclosure: string;
  trackingUrl: string;
  terms: string;
  canSend: boolean;
  toast: string;
  error: string;
}) {
  const [declining, setDeclining] = useState("");
  const [open, setOpen] = useState("");
  const [caption, setCaption] = useState("");
  const [format, setFormat] = useState<PostFormat | "">("");
  const [problem, setProblem] = useState("");

  function openSlot(slot: AffiliateCampaignSlot, formats: { value: PostFormat }[]) {
    setOpen(slot.key);
    setCaption("");
    setFormat(formats[0]?.value ?? "");
    setProblem("");
  }

  const hasDisclosure = caption.toLowerCase().includes(disclosure.toLowerCase());
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
              <p className="text-[13px] text-[#6B5A57]">Every caption needs “{disclosure}” and your tracking link.</p>
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
                      <button type="button" onClick={() => openSlot(slot, campaign.formats)} className="inline-flex h-10 items-center rounded-full bg-ink px-[18px] text-sm font-medium text-white">{slot.actionLabel}</button>
                    ) : null}
                  </div>
                  {submitting ? (
                    <form
                      action={submitPostsAction}
                      className="flex flex-col gap-3.5 rounded-2xl bg-[#F7F3F2] p-4"
                      onSubmit={(event) => {
                        const file = (event.currentTarget.elements.namedItem("file0") as HTMLInputElement | null)?.files?.[0];
                        if (!slot.hasFile && !file) {
                          event.preventDefault();
                          setProblem("Upload your file first.");
                          return;
                        }
                        if (!hasDisclosure || !hasLink) {
                          event.preventDefault();
                          setProblem("Add both required lines to the caption.");
                          return;
                        }
                        if (!canSend || !(event.currentTarget.elements.namedItem("terms") as HTMLInputElement | null)?.checked) {
                          event.preventDefault();
                          setProblem(canSend ? "Accept the rate and payment terms before sending the post." : "The social rate is not set yet.");
                        }
                      }}
                    >
                      <input type="hidden" name="returnTo" value="campaigns" />
                      <input type="hidden" name="count" value="1" />
                      <input type="hidden" name="campaign" value={campaign.name} />
                      <input type="hidden" name="id0" value={slot.postId} />
                      <input type="hidden" name="format0" value={format} />
                      <input type="hidden" name="caption0" value={caption} />
                      {campaign.formats.length > 1 ? (
                        <label className="flex flex-col gap-1.5 text-sm font-semibold">
                          Format
                          <select value={format} onChange={(event) => setFormat(event.target.value as PostFormat)} className="h-11 rounded-xl border border-[#CDBDBA] bg-white px-3 text-[15px] font-normal">
                            {campaign.formats.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </label>
                      ) : null}
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`up-${slot.key}`}>
                        1. Upload your {campaign.formats.length === 1 ? campaign.formats[0]?.label.toLowerCase() : "file"}
                        <input id={`up-${slot.key}`} name="file0" type="file" accept="image/*,video/*" onChange={() => setProblem("")} className="rounded-xl border border-[#CDBDBA] bg-white px-2.5 py-2.5 text-sm font-normal" />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-semibold" htmlFor={`cap-${slot.key}`}>
                        2. Caption
                        <textarea id={`cap-${slot.key}`} rows={4} value={caption} onChange={(event) => { setCaption(event.target.value); setProblem(""); }} className="resize-y rounded-xl border border-[#CDBDBA] bg-white px-3.5 py-2.5 text-[15px] font-normal leading-normal" />
                      </label>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">3. Check the required lines</span>
                        <CheckLine ok={hasDisclosure} label={disclosure} onInsert={hasDisclosure ? undefined : () => setCaption((current) => `${current.trim() ? `${current.replace(/\s+$/, "")}\n\n` : ""}${disclosure}`)} />
                        <CheckLine ok={hasLink} label={trackingUrl} mono onInsert={hasLink ? undefined : () => setCaption((current) => `${current.trim() ? `${current.replace(/\s+$/, "")}\n` : ""}${trackingUrl}`)} />
                      </div>
                      {canSend ? (
                        <label className="flex items-start gap-2 text-sm">
                          <input name="terms" type="checkbox" value="yes" className="mt-1 size-4 accent-ink" />
                          <span>{terms}</span>
                        </label>
                      ) : <p className="text-sm text-[#9B2C1F]">The social rate is not set yet.</p>}
                      {problem ? <p role="alert" className="text-sm text-[#9B2C1F]">{problem}</p> : null}
                      <div className="flex flex-wrap gap-2.5">
                        <button type="submit" className="inline-flex h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white">Submit for approval</button>
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
                        if (!/(instagram\.com|tiktok\.com)\//.test(url)) {
                          event.preventDefault();
                          setProblem("Paste the link to the live post.");
                        }
                      }}
                    >
                      <input type="hidden" name="returnTo" value="campaigns" />
                      <input type="hidden" name="id" value={slot.postId} />
                      <label className="text-sm font-semibold" htmlFor={`url-${slot.key}`}>Paste the live post link</label>
                      <div className="flex flex-wrap gap-2.5">
                        <input id={`url-${slot.key}`} name="postUrl" type="url" placeholder="instagram.com/reel/…" onChange={() => setProblem("")} className="h-[46px] min-w-[16rem] flex-1 rounded-xl border border-[#CDBDBA] bg-white px-3.5 text-[15px]" />
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

function CheckLine({ ok, label, mono = false, onInsert }: { ok: boolean; label: string; mono?: boolean; onInsert?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px]">
      <span className={`grid size-[22px] place-items-center rounded-full text-[13px] font-bold ${ok ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]"}`}>{ok ? "✓" : "!"}</span>
      <span className={`min-w-0 flex-1 break-all ${mono ? "font-mono text-sm" : ""}`}>{label}</span>
      {onInsert ? <button type="button" onClick={onInsert} className="inline-flex h-[34px] items-center rounded-full border border-[#CDBDBA] bg-white px-3 text-[13px] text-ink">Insert</button> : null}
    </div>
  );
}
