"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCents, formatPublishDate, publishDateValue } from "@/lib/affiliate/format";
import type { OfferKind, OfferStatus } from "@/lib/affiliate/marketing-offers";
import {
  acceptMarketingCounterAction,
  declineMarketingOfferAction,
  saveMarketingOfferAction,
  withdrawMarketingOfferAction,
} from "@/app/admin/affiliates/actions";

export type OfferCard = {
  id: string;
  code: string;
  name: string;
  kind: OfferKind;
  kindLabel: string;
  campaign: string;
  publishBy: string;
  amountCents: number;
  maxPayCents: number | null;
  trackingDays: number;
  brief: string;
  status: OfferStatus;
  counterAmountCents: number | null;
  counterPublishBy: string;
  counterNote: string;
  expiresLabel: string;
  history: { text: string; at: string | null }[];
};

export type OfferAffiliate = { code: string; name: string; feeCents: number | null; maxPayCents: number | null; trackingDays: number };

const KIND_LABEL: Record<OfferKind, string> = {
  instagram_post: "Instagram post",
  instagram_carousel: "Instagram carousel",
  instagram_reel: "Instagram reel",
  instagram_story: "Instagram story",
  tiktok: "TikTok video",
};

const FILTERS: { id: string; label: string; hint: string; statuses: OfferStatus[] | null }[] = [
  { id: "all", label: "All", hint: "All offers", statuses: null },
  { id: "needs", label: "Respond", hint: "Needs your response", statuses: ["countered"] },
  { id: "waiting", label: "Waiting", hint: "Waiting on affiliate", statuses: ["sent"] },
  { id: "progress", label: "Active", hint: "Accepted, in progress", statuses: ["accepted"] },
  { id: "done", label: "Done", hint: "Completed or paid", statuses: ["completed", "paid"] },
  { id: "closed", label: "Closed", hint: "Declined or withdrawn", statuses: ["declined", "withdrawn"] },
];

const STATUS: Record<OfferStatus, { label: string; bg: string; fg: string }> = {
  sent: { label: "Waiting on affiliate", bg: "#FBEFD6", fg: "#7A4E00" },
  countered: { label: "Countered · respond", bg: "#33130F", fg: "#FFFFFF" },
  accepted: { label: "Accepted · in progress", bg: "#F3E6E3", fg: "#5A2A24" },
  completed: { label: "Completed · eligible", bg: "#DDF0E4", fg: "#1D6340" },
  paid: { label: "Paid", bg: "#DDF0E4", fg: "#1D6340" },
  declined: { label: "Declined", bg: "#EFEAE9", fg: "#4A3A37" },
  withdrawn: { label: "Withdrawn", bg: "#EFEAE9", fg: "#4A3A37" },
};

function shortWhen(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function AdminOffersBoard({
  offers,
  affiliates,
  campaigns,
  canSave,
  toast,
  selectedId,
  affiliateCode = "",
  socialViewRateCents = null,
}: {
  offers: OfferCard[];
  affiliates: OfferAffiliate[];
  campaigns: string[];
  canSave: boolean;
  toast: string;
  selectedId: string;
  affiliateCode?: string;
  socialViewRateCents?: number | null;
}) {
  const scoped = affiliateCode ? offers.filter((offer) => offer.code === affiliateCode) : offers;
  const focused = affiliates.find((affiliate) => affiliate.code === affiliateCode) ?? null;
  const first = focused ?? affiliates[0];
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(selectedId || scoped[0]?.id || "");
  const [mode, setMode] = useState<"detail" | "new" | "revise">("detail");
  const [hiddenToast, setHiddenToast] = useState(false);
  const [code, setCode] = useState(first?.code ?? "");
  const [kind, setKind] = useState<OfferKind>("instagram_reel");
  const [fee, setFee] = useState(socialViewRateCents == null ? "" : String(socialViewRateCents / 100));
  const [maximum, setMaximum] = useState(first?.maxPayCents == null ? "" : String(first.maxPayCents / 100));
  const [trackingDays, setTrackingDays] = useState(String(first?.trackingDays ?? 30));
  const [due, setDue] = useState("");
  const [campaign, setCampaign] = useState("");
  const [brief, setBrief] = useState("");
  const [formError, setFormError] = useState("");

  const current = scoped.find((offer) => offer.id === selected) ?? null;
  const feeOk = /^\d+(\.\d{1,2})?$/.test(fee.trim()) && Number(fee) <= 100000;
  const maxOk = maximum.trim() === "" || (/^\d+(\.\d{1,2})?$/.test(maximum.trim()) && Number(maximum) <= 100000);
  const daysOk = /^\d+$/.test(trackingDays.trim()) && Number(trackingDays) >= 1 && Number(trackingDays) <= 365;
  const revising = mode === "revise";
  const counts = useMemo(() => {
    return Object.fromEntries(FILTERS.map((filter) => [filter.id, scoped.filter((offer) => !filter.statuses || filter.statuses.includes(offer.status)).length]));
  }, [scoped]);
  const rows = scoped.filter((offer) => {
    const filter = FILTERS.find((item) => item.id === tab);
    if (filter?.statuses && !filter.statuses.includes(offer.status)) return false;
    const haystack = `${offer.name} ${offer.kindLabel} ${offer.campaign}`.toLowerCase();
    return !query || haystack.includes(query.toLowerCase());
  });
  const tiles = [
    { id: "needs", label: "Needs your response", value: String(scoped.filter((offer) => offer.status === "countered").length), sub: "Countered offers", tone: "#9B2C1F" },
    { id: "waiting", label: "Waiting on affiliate", value: String(scoped.filter((offer) => offer.status === "sent").length), sub: "Sent, not answered", tone: "#4A3A37" },
    { id: "progress", label: "Committed", value: String(scoped.filter((offer) => offer.status === "accepted" || offer.status === "completed").length), sub: "Accepted, rate locked", tone: "#4A3A37" },
    { id: "done", label: "Paid", value: String(scoped.filter((offer) => offer.status === "paid").length), sub: "Offers paid", tone: "#4A3A37" },
  ];
  const campaignOptions = [...campaigns];
  if (campaign && !campaignOptions.some((name) => name.toLowerCase() === campaign.toLowerCase())) campaignOptions.push(campaign);

  function openNew() {
    const affiliate = affiliates.find((item) => item.code === code) ?? focused ?? affiliates[0];
    setMode("new");
    setCode(affiliate?.code ?? "");
    setKind("instagram_reel");
    setFee(socialViewRateCents == null ? "" : String(socialViewRateCents / 100));
    setMaximum(affiliate?.maxPayCents == null ? "" : String(affiliate.maxPayCents / 100));
    setTrackingDays(String(affiliate?.trackingDays ?? 30));
    setDue("");
    setCampaign(campaigns[0] ?? "");
    setBrief("");
    setFormError("");
    setHiddenToast(true);
  }

  function openRevise() {
    if (!current) return;
    const midpoint = current.counterAmountCents == null ? current.amountCents : Math.round((current.amountCents + current.counterAmountCents) / 2);
    setMode("revise");
    setCode(current.code);
    setKind(current.kind);
    setFee(String(midpoint / 100));
    setMaximum(current.maxPayCents == null ? "" : String(current.maxPayCents / 100));
    setTrackingDays(String(current.trackingDays));
    setDue(publishDateValue(current.counterPublishBy || current.publishBy) ?? "");
    setCampaign(current.campaign || campaigns[0] || "");
    setBrief(current.brief === "—" ? "" : current.brief);
    setFormError("");
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    if (!feeOk) {
      event.preventDefault();
      setFormError("Enter a rate from $0 to $100,000 per 1,000 views.");
      return;
    }
    if (!maxOk) {
      event.preventDefault();
      setFormError("Enter a maximum from $0 to $100,000, or leave it blank.");
      return;
    }
    if (!daysOk) {
      event.preventDefault();
      setFormError("Enter a tracking period from 1 to 365 days.");
      return;
    }
    if (!publishDateValue(due)) {
      event.preventDefault();
      setFormError("Choose a publish-by date.");
      return;
    }
    if (!campaign) {
      event.preventDefault();
      setFormError("Choose a campaign.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[18rem] flex-1">
          <h2 className="text-[28px] font-normal">Monthly plans</h2>
          <p className="mt-1.5 text-sm text-[#4A3A37]">
            {focused ? `Plans for ${focused.name}. ` : null}
            Ask affiliates for specific content at a rate per 1,000 views. They accept, decline, or counter before creating anything.
          </p>
          {focused ? (
            <Link href="/admin/affiliates/offers" className="mt-2 inline-flex text-sm font-medium text-ink underline underline-offset-4">
              All monthly plans
            </Link>
          ) : null}
        </div>
        {canSave ? (
          <button type="button" onClick={openNew} className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white">
            + New offer
          </button>
        ) : null}
      </div>

      {toast && !hiddenToast ? (
        <p role="status" className="flex items-center gap-2.5 rounded-[14px] bg-[#DDF0E4] px-4 py-3 text-sm font-medium text-[#1D6340]">
          <span className="flex-1">{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setHiddenToast(true)} className="grid size-8 place-items-center text-lg">
            ×
          </button>
        </p>
      ) : null}

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <button key={tile.id} type="button" onClick={() => setTab(tile.id)} className={`rounded-[20px] border-2 bg-white px-4 py-4 text-left ${tab === tile.id ? "border-ink" : "border-transparent"}`}>
            <span className="block text-[13px]" style={{ color: tile.tone }}>{tile.label}</span>
            <span className="mt-1 block text-[26px]">{tile.value}</span>
            <span className="mt-1 block text-xs text-[#6B5A57]">{tile.sub}</span>
          </button>
        ))}
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <section aria-label="Offers" className="flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-white px-5 py-5 xl:h-0 xl:min-h-full">
          <div className="flex shrink-0 flex-col gap-3">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
              {FILTERS.map((filter) => {
                const on = tab === filter.id;
                const count = counts[filter.id] ?? 0;
                return (
                  <button key={filter.id} type="button" title={filter.hint} aria-pressed={on} aria-label={`${filter.hint}, ${count}`} onClick={() => setTab(filter.id)} className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium ${on ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink"}`}>
                    {filter.label}
                    <span className="opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
            <label htmlFor="offer-search" className="sr-only">Search offers</label>
            <input id="offer-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Affiliate or deliverable" className="h-10 w-full rounded-full border border-[#CDBDBA] px-4 text-sm" />
          </div>
          <div className="mt-4 hidden shrink-0 grid-cols-[1.1fr_1.7fr_0.9fr_0.7fr_1.3fr] gap-3 px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-[#6B5A57] lg:grid">
            <span>Affiliate</span><span>Deliverable</span><span>Publish by</span><span>Rate</span><span>Status</span>
          </div>
          <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto">
            {rows.map((offer) => {
              const mark = STATUS[offer.status];
              const open = mode === "detail" && selected === offer.id;
              return (
                <button key={offer.id} type="button" aria-current={open ? "true" : undefined} onClick={() => { setSelected(offer.id); setMode("detail"); setFormError(""); }} className={`grid shrink-0 gap-2 border-t border-[#F0E8E6] px-2.5 py-3 text-left lg:grid-cols-[1.1fr_1.7fr_0.9fr_0.7fr_1.3fr] lg:items-center lg:gap-3 ${open ? "rounded-xl bg-[#F7F3F2]" : ""}`}>
                  <span className="text-sm font-semibold">{offer.name}</span>
                  <span className="min-w-0">
                    <span className="block text-sm">{offer.kindLabel}</span>
                    <span className="block truncate text-xs text-[#6B5A57]">{offer.campaign || "No campaign"}</span>
                  </span>
                  <span className="text-sm">{formatPublishDate(offer.publishBy)}</span>
                  <span className="text-sm font-semibold">{formatCents(offer.amountCents)}<span className="block text-xs font-normal text-[#6B5A57]">/ 1,000 views</span></span>
                  <span className="w-fit rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
                </button>
              );
            })}
            {rows.length === 0 ? <p className="shrink-0 border-t border-[#F0E8E6] px-2.5 py-6 text-sm text-[#6B5A57]">No offers match.</p> : null}
          </div>
        </section>

        <aside aria-label="Offer details" className="w-full rounded-[24px] bg-white p-5 xl:min-h-[796px]">
          {mode === "detail" && !current ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="text-base font-semibold">Select an offer</span>
              <span className="text-sm text-[#6B5A57]">Or create a new one for an affiliate.</span>
            </div>
          ) : null}
          {mode === "detail" && current ? <OfferDetail offer={current} canSave={canSave} onRevise={openRevise} /> : null}
          {mode !== "detail" && canSave ? (
            <form action={saveMarketingOfferAction} onSubmit={submitForm} className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold">{revising && current ? `Counter back · ${current.name}` : "New offer"}</h3>
              {revising && current ? <input type="hidden" name="offerId" value={current.id} /> : null}
              <input type="hidden" name="code" value={code} />
              <input type="hidden" name="kind" value={kind} />
              <fieldset>
                <legend className="text-[13px] font-medium">Affiliate</legend>
                <div role="radiogroup" aria-label="Affiliate" className="mt-2 flex flex-wrap gap-2">
                  {affiliates.map((affiliate) => {
                    const on = affiliate.code === code;
                    const locked = revising && !on;
                    return (
                      <button key={affiliate.code} type="button" role="radio" aria-checked={on} disabled={locked} onClick={() => { setCode(affiliate.code); if (!revising) { setFee(socialViewRateCents == null ? "" : String(socialViewRateCents / 100)); setMaximum(affiliate.maxPayCents == null ? "" : String(affiliate.maxPayCents / 100)); setTrackingDays(String(affiliate.trackingDays)); } setFormError(""); }} className={`inline-flex h-[38px] items-center rounded-full border px-3.5 text-sm font-medium disabled:opacity-40 ${on ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink"}`}>
                        {affiliate.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[13px] font-medium">Deliverable</legend>
                <div role="radiogroup" aria-label="Deliverable" className="mt-2 flex flex-wrap gap-2">
                  {(["instagram_post", "instagram_carousel", "instagram_reel", "instagram_story", "tiktok"] as OfferKind[]).map((item) => {
                    const on = kind === item;
                    return (
                      <button key={item} type="button" role="radio" aria-checked={on} onClick={() => setKind(item)} className={`inline-flex h-9 items-center rounded-full border px-3 text-[13px] font-medium ${on ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink"}`}>
                        {KIND_LABEL[item]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="offer-fee" className="text-[13px] font-medium">Rate per 1,000 views</label>
                  <div className={`mt-1.5 flex h-[46px] items-center rounded-xl border px-3 ${feeOk ? "border-[#CDBDBA]" : "border-[#9B2C1F]"}`}>
                    <span aria-hidden="true" className="pr-1 text-[#6B5A57]">$</span>
                    <input id="offer-fee" name="amount" inputMode="decimal" value={fee} onChange={(event) => { setFee(event.target.value); setFormError(""); }} className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#6B5A57]">
                    {revising && current?.counterAmountCents != null
                      ? `You offered ${formatCents(current.amountCents)} per 1,000 views, they asked ${formatCents(current.counterAmountCents)}`
                      : `Social rate for every affiliate: ${socialViewRateCents == null ? "not set" : `${formatCents(socialViewRateCents)} per 1,000 views`}.`}
                  </p>
                </div>
                <div>
                  <label htmlFor="offer-max" className="text-[13px] font-medium">Maximum payout</label>
                  <div className={`mt-1.5 flex h-[46px] items-center rounded-xl border px-3 ${maxOk ? "border-[#CDBDBA]" : "border-[#9B2C1F]"}`}>
                    <span aria-hidden="true" className="pr-1 text-[#6B5A57]">$</span>
                    <input id="offer-max" name="maxPay" inputMode="decimal" value={maximum} onChange={(event) => { setMaximum(event.target.value); setFormError(""); }} placeholder="No maximum" className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="offer-days" className="text-[13px] font-medium">Tracking period</label>
                  <div className={`mt-1.5 flex h-[46px] items-center rounded-xl border px-3 ${daysOk ? "border-[#CDBDBA]" : "border-[#9B2C1F]"}`}>
                    <input id="offer-days" name="trackingDays" inputMode="numeric" required value={trackingDays} onChange={(event) => { setTrackingDays(event.target.value); setFormError(""); }} className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
                    <span className="text-sm text-[#6B5A57]">days</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="offer-due" className="text-[13px] font-medium">Publish by</label>
                  <input id="offer-due" name="publishBy" type="date" required value={publishDateValue(due) ?? ""} onChange={(event) => { setDue(event.target.value); setFormError(""); }} className="mt-1.5 h-[46px] w-full rounded-xl border border-[#CDBDBA] bg-white px-3.5 text-[15px] text-ink" />
                </div>
              </div>
              <div>
                <label htmlFor="offer-campaign" className="text-[13px] font-medium">Campaign</label>
                {campaignOptions.length === 0 ? (
                  <p className="mt-1.5 text-sm text-[#9B2C1F]">Create a campaign on the ROI page before sending an offer.</p>
                ) : (
                  <select id="offer-campaign" name="campaign" required value={campaign} onChange={(event) => setCampaign(event.target.value)} className="mt-1.5 h-[46px] w-full rounded-xl border border-[#CDBDBA] bg-white px-3.5 text-[15px]">
                    {campaignOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label htmlFor="offer-brief" className="text-[13px] font-medium">Brief and requirements</label>
                <textarea id="offer-brief" name="brief" rows={3} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="What to show, key points, anything to avoid" className="mt-1.5 w-full resize-y rounded-xl border border-[#CDBDBA] px-3.5 py-2.5 text-sm leading-normal" />
                <p className="mt-1.5 text-xs text-[#6B5A57]">Disclosure line and tracking link are always required.</p>
              </div>
              <p className="rounded-xl bg-[#F7F3F2] px-3.5 py-3 text-[13px] leading-normal text-[#4A3A37]">The rate, maximum, and tracking period lock when the offer is accepted. Pay is recorded views ÷ 1,000 × that rate, capped at the maximum, after the tracking period. Lab commission stays separate. Expires in 7 days without a response.</p>
              {formError ? <p role="alert" className="text-[13px] text-[#9B2C1F]">{formError}</p> : null}
              <div className="flex justify-end gap-2.5">
                <button type="button" onClick={() => { setMode("detail"); setFormError(""); }} className="inline-flex h-11 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={campaignOptions.length === 0} className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white disabled:opacity-40">{revising ? "Send revised offer" : "Send offer"}</button>
              </div>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function OfferDetail({ offer, canSave, onRevise }: { offer: OfferCard; canSave: boolean; onRevise: () => void }) {
  const mark = STATUS[offer.status];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#6B5A57]">{offer.name}</p>
          <p className="text-xl font-semibold">{offer.kindLabel}</p>
          <p className="text-[13px] text-[#6B5A57]">{offer.campaign || "No campaign"}</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
          <p className="text-xs text-[#6B5A57]">Rate</p>
          <p className="text-xl font-semibold">{formatCents(offer.amountCents)}</p>
          <p className="text-xs text-[#6B5A57]">{offer.maxPayCents == null ? "No maximum" : `Maximum ${formatCents(offer.maxPayCents)}`} · {offer.trackingDays} days</p>
        </div>
        <div className="rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
          <p className="text-xs text-[#6B5A57]">Publish by</p>
          <p className="text-xl font-semibold">{formatPublishDate(offer.publishBy)}</p>
        </div>
      </div>
      <div>
        <p className="text-[13px] font-semibold">Brief</p>
        <p className="mt-1 text-sm leading-normal text-[#4A3A37]">{offer.brief || "—"}</p>
      </div>
      {canSave && offer.status === "countered" && offer.counterAmountCents != null ? (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#FBEFD6] px-4 py-3.5">
          <p className="text-sm text-[#5C3B00]"><b>{offer.name} countered: {formatCents(offer.counterAmountCents)}, publish by {formatPublishDate(offer.counterPublishBy || offer.publishBy)}</b></p>
          {offer.counterNote ? <p className="text-[13px] leading-normal text-[#5C3B00]">“{offer.counterNote}”</p> : null}
          <div className="flex flex-wrap gap-2">
            <form action={acceptMarketingCounterAction}><input type="hidden" name="offerId" value={offer.id} /><button type="submit" className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-medium text-white">Accept {formatCents(offer.counterAmountCents)}</button></form>
            <button type="button" onClick={onRevise} className="inline-flex h-10 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium">Counter back</button>
            <form action={declineMarketingOfferAction}><input type="hidden" name="offerId" value={offer.id} /><button type="submit" className="inline-flex h-10 items-center rounded-full border border-[#F0CFC9] bg-white px-4 text-sm font-medium text-[#9B2C1F]">Decline</button></form>
          </div>
        </div>
      ) : null}
      {canSave && offer.status === "sent" ? (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
          <p className="text-sm text-[#4A3A37]">Waiting for {offer.name} to respond · {offer.expiresLabel}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onRevise} className="inline-flex h-10 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium">Edit offer</button>
            <form action={withdrawMarketingOfferAction}><input type="hidden" name="offerId" value={offer.id} /><button type="submit" className="inline-flex h-10 items-center rounded-full border border-[#F0CFC9] bg-white px-4 text-sm font-medium text-[#9B2C1F]">Withdraw</button></form>
          </div>
        </div>
      ) : null}
      <div>
        <p className="text-[13px] font-semibold">History</p>
        <div className="mt-2 flex flex-col gap-2">
          {offer.history.length === 0 ? <p className="text-sm text-[#6B5A57]">No history yet.</p> : null}
          {offer.history.map((item, index) => (
            <div key={`${item.text}-${index}`} className="flex items-baseline gap-2.5">
              <span className="size-2 shrink-0 rounded-full bg-ink" />
              <span className="flex-1 text-[13px]">{item.text}</span>
              <span className="text-xs text-[#6B5A57]">{shortWhen(item.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
