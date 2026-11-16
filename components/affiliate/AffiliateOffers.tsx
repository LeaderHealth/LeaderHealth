"use client";

import Link from "next/link";
import { useState } from "react";
import { respondToOfferAction } from "@/app/affiliates/offer-actions";
import { formatCents, publishDateValue, viewPayTerms } from "@/lib/affiliate/format";
import type { OfferStatus } from "@/lib/affiliate/marketing-offers";

export type AffiliateOfferCard = {
  id: string;
  kindLabel: string;
  campaign: string;
  publishBy: string;
  publishLabel: string;
  amountCents: number;
  maxPayCents: number | null;
  trackingDays: number;
  brief: string;
  status: OfferStatus;
  expiresLabel: string;
  expiresSoon: boolean;
  counterAmountCents: number | null;
  counterPublishLabel: string;
  stageLabel: string;
  stageBg: string;
  stageFg: string;
  ctaLabel: string;
  ctaHref: string;
  ctaPrimary: boolean;
};

const PAST: Partial<Record<OfferStatus, { label: string; bg: string; fg: string }>> = {
  completed: { label: "Completed · payment coming", bg: "#DDF0E4", fg: "#1D6340" },
  paid: { label: "Paid", bg: "#DDF0E4", fg: "#1D6340" },
  declined: { label: "Declined", bg: "#EFEAE9", fg: "#4A3A37" },
  withdrawn: { label: "Withdrawn", bg: "#EFEAE9", fg: "#4A3A37" },
};

function dollars(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

function centsOf(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function AffiliateOffers({ offers, toast }: { offers: AffiliateOfferCard[]; toast: string }) {
  const [hiddenToast, setHiddenToast] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"" | "accept" | "counter" | "decline">("");
  const [agree, setAgree] = useState(false);
  const [fee, setFee] = useState("");
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [counterError, setCounterError] = useState("");

  const fresh = offers.filter((offer) => offer.status === "sent");
  const waiting = offers.filter((offer) => offer.status === "countered");
  const progress = offers.filter((offer) => offer.status === "accepted");
  const past = offers.filter((offer) => PAST[offer.status]);
  const count = (status: OfferStatus) => offers.filter((offer) => offer.status === status).length;

  function reset() {
    setActiveId("");
    setMode("");
    setAgree(false);
    setCounterError("");
  }

  function start(offer: AffiliateOfferCard, next: "accept" | "counter" | "decline") {
    setHiddenToast(true);
    setActiveId(offer.id);
    setMode(next);
    setAgree(false);
    setCounterError("");
    setFee(dollars(offer.amountCents));
    setDue(publishDateValue(offer.publishBy) ?? "");
    setNote("");
  }

  function sendCounter(event: React.FormEvent<HTMLFormElement>, offer: AffiliateOfferCard) {
    const amount = centsOf(fee);
    const date = publishDateValue(due);
    if (amount == null || !date || !note.trim()) {
      event.preventDefault();
      setCounterError("Enter a rate per 1,000 views, like 10, and choose a publish-by date.");
      return;
    }
    if (amount === offer.amountCents && date === (publishDateValue(offer.publishBy) ?? "")) {
      event.preventDefault();
      setCounterError("Change the rate or the date, or accept the offer as is.");
    }
  }

  return (
    <div className="flex flex-col gap-7 rounded-[24px] bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[30px] font-medium">My monthly plan</h2>
        <p className="text-sm leading-normal text-[#4A3A37]">Paid requests from Leader Health. Accept, counter, or decline before you create anything. Once you accept, the rate per 1,000 views is locked.</p>
      </div>

      {toast && !hiddenToast ? (
        <div role="status" className="flex items-center gap-2.5 rounded-[14px] bg-[#DDF0E4] px-4 py-3 text-[#1D6340]">
          <span className="flex-1 text-sm font-medium">{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setHiddenToast(true)} className="grid size-8 place-items-center text-lg text-[#1D6340]">×</button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "New offers", value: String(fresh.length), sub: "Waiting for your answer" },
          { label: "In progress", value: String(count("accepted")), sub: "Accepted, rate locked" },
          { label: "Earned", value: String(count("completed")), sub: "Completed, payment coming" },
          { label: "Paid", value: String(count("paid")), sub: "Offers paid" },
        ].map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 rounded-[18px] border border-[#E8DEDC] px-4 py-3.5">
            <span className="text-[13px] text-[#4A3A37]">{tile.label}</span>
            <span className="text-2xl">{tile.value}</span>
            <span className="text-xs text-[#6B5A57]">{tile.sub}</span>
          </div>
        ))}
      </div>

      <section aria-labelledby="new-offers" className="flex flex-col gap-3">
        <h3 id="new-offers" className="text-lg font-semibold">New offers</h3>
        {fresh.map((offer) => {
          const open = activeId === offer.id ? mode : "";
          const kindLower = offer.kindLabel.charAt(0).toLowerCase() + offer.kindLabel.slice(1);
          return (
            <article key={offer.id} className="flex flex-col gap-3.5 rounded-[20px] border p-5" style={{ borderColor: open ? "#33130F" : "#E8DEDC" }}>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{offer.kindLabel}</span>
                    {offer.campaign ? <span className="rounded-full bg-[#F3E6E3] px-2.5 py-0.5 text-xs font-semibold text-ink">{offer.campaign}</span> : null}
                  </div>
                  <span className="text-sm text-[#4A3A37]">
                    Publish by {offer.publishLabel} · <span style={{ color: offer.expiresSoon ? "#9B2C1F" : "#4A3A37" }}>{offer.expiresLabel}</span>
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[28px] font-medium">{formatCents(offer.amountCents)}</span>
                  <span className="text-xs text-[#6B5A57]">per 1,000 views</span>
                  <span className="text-xs text-[#6B5A57]">{offer.maxPayCents == null ? "No maximum" : `Maximum ${formatCents(offer.maxPayCents)}`} · {offer.trackingDays} days</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[14px] bg-[#F7F3F2] px-3.5 py-3">
                <span className="text-[13px] font-semibold">Brief</span>
                <span className="text-sm leading-normal text-[#4A3A37]">{offer.brief || "—"}</span>
                <span className="text-xs text-[#6B5A57]">Always required: “Paid partnership with Leader Health” and your tracking link in the caption. Pay is recorded views ÷ 1,000 × this rate, capped at the maximum, after {offer.trackingDays} days live. Lab commission stays separate.</span>
              </div>

              {open === "" ? (
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" onClick={() => start(offer, "accept")} className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">Accept {formatCents(offer.amountCents)} per 1,000 views</button>
                  <button type="button" onClick={() => start(offer, "counter")} className="inline-flex h-11 items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-sm font-medium">Counter</button>
                  <button type="button" onClick={() => start(offer, "decline")} className="inline-flex h-11 items-center px-3 text-sm text-[#6B5A57] underline">Decline</button>
                </div>
              ) : null}

              {open === "accept" ? (
                <form action={respondToOfferAction} className="flex flex-col gap-3 border-t border-[#F0E8E6] pt-3.5">
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="decision" value="accept" />
                  <span className="text-[15px] font-semibold">Accept 1 {kindLower} at {viewPayTerms(offer.amountCents, offer.maxPayCents, offer.trackingDays)}, published by {offer.publishLabel}?</span>
                  <label className="flex items-start gap-2.5 text-sm leading-normal text-[#4A3A37]">
                    <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5 size-[18px] accent-ink" />
                    I agree to the brief, the requirements, and the payment terms above.
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    <button type="submit" disabled={!agree} className={`inline-flex h-11 items-center rounded-full px-5 text-sm font-medium disabled:cursor-not-allowed ${agree ? "bg-ink text-white" : "bg-[#E8DEDC] text-[#5E4E4B]"}`}>Accept offer</button>
                    <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm">Back</button>
                  </div>
                </form>
              ) : null}

              {open === "counter" ? (
                <form action={respondToOfferAction} onSubmit={(event) => sendCounter(event, offer)} className="flex flex-col gap-3 border-t border-[#F0E8E6] pt-3.5">
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="decision" value="counter" />
                  <span className="text-[15px] font-semibold">Your counter</span>
                  <span className="text-sm text-[#4A3A37]">Maximum and tracking period stay as offered: {offer.maxPayCents == null ? "no maximum" : `maximum ${formatCents(offer.maxPayCents)}`}, {offer.trackingDays} days. A counter changes the rate or the publish-by date.</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`fee-${offer.id}`} className="text-[13px] font-medium">Your rate per 1,000 views</label>
                      <div className={`flex h-[46px] items-center rounded-xl border px-3 ${counterError ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`}>
                        <span aria-hidden="true" className="pr-1 text-[#6B5A57]">$</span>
                        <input id={`fee-${offer.id}`} name="amount" inputMode="decimal" value={fee} onChange={(event) => { setFee(event.target.value); setCounterError(""); }} className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`due-${offer.id}`} className="text-[13px] font-medium">Publish by</label>
                      <input id={`due-${offer.id}`} name="publishBy" type="date" required value={publishDateValue(due) ?? ""} onChange={(event) => { setDue(event.target.value); setCounterError(""); }} className="h-[46px] rounded-xl border border-[#CDBDBA] bg-white px-3.5 text-[15px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`note-${offer.id}`} className="text-[13px] font-medium">Note to Leader Health</label>
                    <textarea id={`note-${offer.id}`} name="note" rows={3} required maxLength={400} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why you're asking for this, e.g. extra shoot day" className="resize-y rounded-xl border border-[#CDBDBA] px-3.5 py-2.5 text-sm leading-normal" />
                  </div>
                  {counterError ? <p role="alert" className="text-[13px] text-[#9B2C1F]">{counterError}</p> : null}
                  <div className="flex flex-wrap gap-2.5">
                    <button type="submit" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">Send counter</button>
                    <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm">Back</button>
                  </div>
                </form>
              ) : null}

              {open === "decline" ? (
                <form action={respondToOfferAction} className="flex flex-col gap-3 border-t border-[#F0E8E6] pt-3.5">
                  <input type="hidden" name="offerId" value={offer.id} />
                  <input type="hidden" name="decision" value="decline" />
                  <span className="text-[15px] font-semibold">Decline this offer?</span>
                  <span className="text-sm text-[#4A3A37]">It closes for good. If you would do it for a different rate or date, counter instead.</span>
                  <div className="flex flex-wrap gap-2.5">
                    <button type="submit" className="inline-flex h-11 items-center rounded-full border border-[#F0CFC9] bg-white px-5 text-sm font-medium text-[#9B2C1F]">Decline offer</button>
                    <button type="button" onClick={() => start(offer, "counter")} className="inline-flex h-11 items-center rounded-full border border-[#CDBDBA] bg-white px-4 text-sm font-medium">Counter instead</button>
                    <button type="button" onClick={reset} className="inline-flex h-11 items-center px-3 text-sm text-[#6B5A57] underline">Back</button>
                  </div>
                </form>
              ) : null}
            </article>
          );
        })}
        {fresh.length === 0 ? <p className="rounded-[14px] bg-[#F7F3F2] px-4 py-4 text-sm text-[#6B5A57]">No new offers right now. We’ll email you when one arrives.</p> : null}
      </section>

      {waiting.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h3 className="text-lg font-semibold">Waiting on Leader Health</h3>
          {waiting.map((offer) => (
            <div key={offer.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FBEFD6] px-4 py-3.5">
              <span className="flex min-w-0 flex-1 basis-72 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{offer.kindLabel}</span>
                <span className="text-[13px] text-[#5C3B00]">You countered: {offer.counterAmountCents == null ? "—" : formatCents(offer.counterAmountCents)} per 1,000 views, by {offer.counterPublishLabel} · they offered {formatCents(offer.amountCents)}</span>
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#7A4E00]">Counter sent</span>
            </div>
          ))}
        </section>
      ) : null}

      {progress.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h3 className="text-lg font-semibold">In progress</h3>
          {progress.map((offer) => (
            <div key={offer.id} className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-[#E8DEDC] px-4 py-3.5">
              <span className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
                <span className="text-[15px] font-semibold">{offer.kindLabel} · {viewPayTerms(offer.amountCents, offer.maxPayCents, offer.trackingDays)}</span>
                <span className="text-[13px] text-[#6B5A57]">{[offer.campaign, `publish by ${offer.publishLabel}`].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: offer.stageBg, color: offer.stageFg }}>{offer.stageLabel}</span>
              <Link href={offer.ctaHref} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${offer.ctaPrimary ? "bg-ink text-white" : "border border-[#CDBDBA] bg-white text-ink"}`}>{offer.ctaLabel}</Link>
            </div>
          ))}
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="flex flex-col">
          <h3 className="mb-2 text-lg font-semibold">Completed and closed</h3>
          {past.map((offer) => {
            const mark = PAST[offer.status];
            if (!mark) return null;
            return (
              <div key={offer.id} className="flex items-center gap-3 border-t border-[#F0E8E6] py-3">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm">{offer.kindLabel}</span>
                  <span className="text-xs text-[#6B5A57]">Publish by {offer.publishLabel}</span>
                </span>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap" style={{ background: mark.bg, color: mark.fg }}>{mark.label}</span>
                <span className="text-right text-sm font-medium">{formatCents(offer.amountCents)} / 1k</span>
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
