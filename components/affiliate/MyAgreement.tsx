"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptAffiliateAgreementAction, askAgreementQuestionAction, declineAffiliateAgreementAction } from "@/app/affiliates/agreement-actions";
import type { AgreementBoardSlot } from "@/lib/affiliate/post-agreement";
import { AgreementQuestions } from "./AgreementQuestions";
import type { AgreementQuestionView } from "./agreement-types";

export type MyAgreementCard = {
  mode: "waiting" | "active" | "declined";
  id: string;
  title: string;
  sentAt: string;
  monthly: string;
  postTotal: number;
  kindLine: string;
  where: string;
  runs: string;
  guidelines: string;
  fileName: string;
  pdfHref: string | null;
  openQuestion: boolean;
  questions: AgreementQuestionView[];
  summary: string;
  monthName: string;
  verified: number;
  payText: string;
  slots: AgreementBoardSlot[];
  noMonth: boolean;
};

const inkButton = "inline-flex h-[50px] items-center justify-center rounded-full px-[26px] text-base font-medium";
const quietButton = "inline-flex h-[50px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink";

export function MyAgreement({ card }: { card: MyAgreementCard }) {
  const [agreed, setAgreed] = useState(false);
  const [asking, setAsking] = useState(card.questions.length > 0);
  const [declining, setDeclining] = useState(false);
  if (card.mode === "declined") {
    return (
      <section className="rounded-[24px] bg-white p-6 text-base text-[#4A3A37]">
        You declined {card.title || "the agreement"}. If you change your mind, contact Leader Health. You can still send independent posts in{" "}
        <Link href="/affiliates/posts" className="font-medium text-ink underline underline-offset-4">My posts</Link>.
      </section>
    );
  }
  if (card.mode === "waiting") return <Review card={card} agreed={agreed} setAgreed={setAgreed} asking={asking} setAsking={setAsking} declining={declining} setDeclining={setDeclining} />;
  return <Active card={card} />;
}

function Review({
  card,
  agreed,
  setAgreed,
  asking,
  setAsking,
  declining,
  setDeclining,
}: {
  card: MyAgreementCard;
  agreed: boolean;
  setAgreed: (value: boolean) => void;
  asking: boolean;
  setAsking: (value: boolean) => void;
  declining: boolean;
  setDeclining: (value: boolean) => void;
}) {
  const canAccept = agreed && !card.openQuestion && Boolean(card.pdfHref);
  const terms = [
    ["Posts each month", card.postTotal > 0 ? String(card.postTotal) : "—"],
    ["What kind", card.kindLine || "—"],
    ["Where", card.where || "—"],
    ["Runs", card.runs || "—"],
  ];
  const posts = card.postTotal === 1 ? "1 post" : `${card.postTotal || "the"} posts`;
  return (
    <section aria-labelledby={`inv-${card.id}`} className="flex flex-col gap-[18px] rounded-[26px] border-2 border-ink bg-white px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <span className="self-start rounded-full bg-[#FBEFD6] px-3 py-1 text-[13px] font-semibold text-[#7A4E00]">
            {card.questions.length > 0 ? "Still negotiating" : "New agreement to review"}
          </span>
          <h2 id={`inv-${card.id}`} className="text-[26px] font-medium">{card.title || "Agreement"}</h2>
          <span className="text-[15px] text-[#4A3A37]">Sent by Leader Health{card.sentAt ? ` on ${card.sentAt}` : ""}</span>
        </div>
        {card.monthly ? (
          <div className="flex flex-col items-end">
            <span className="text-4xl font-medium">{card.monthly}</span>
            <span className="text-sm text-[#4A3A37]">each month</span>
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {terms.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <span className="text-sm text-[#4A3A37]">{label}</span>
            <span className="text-[17px] font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-base font-semibold">How it works</span>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-normal">
          <li>Make {posts} each month{card.kindLine ? `: ${card.kindLine}` : ""}{card.where ? ` on ${card.where}` : ""}.</li>
          <li>Send each one here for approval before you publish it.</li>
          <li>Publish the approved post with @myleaderhealth in the caption, then add the live link. The sponsorship line and tracking link are optional.</li>
          <li>Once all {card.postTotal || "the required posts"} are verified, that month’s {card.monthly || "monthly amount"} is approved and sent to you manually.</li>
        </ol>
      </div>
      {card.guidelines ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-base font-semibold">Guidelines</span>
          <p className="whitespace-pre-wrap text-[15px] leading-normal text-[#4A3A37]">{card.guidelines}</p>
        </div>
      ) : null}
      {card.pdfHref ? (
        <a id="pdf" href={card.pdfHref} className="flex items-center gap-3 rounded-2xl bg-[#F7F3F2] px-4 py-3 text-ink">
          <span className="grid h-11 w-9 flex-none place-items-center rounded-md bg-[#F3CFCB] text-[11px] font-bold text-[#9B2C1F]">PDF</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-semibold">{card.fileName || "Agreement.pdf"}</span>
            <span className="text-[13px] text-[#6B5A57]">Read the full agreement before accepting</span>
          </span>
          <span className="text-sm font-medium underline">Open</span>
        </a>
      ) : (
        <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3 text-[15px] text-[#4A3A37]">The agreement PDF isn’t ready yet, so it can’t be accepted.</p>
      )}
      {card.questions.length > 0 ? <AgreementQuestions questions={card.questions} asker="You" waitingText="Waiting for Leader Health to reply." /> : null}
      {card.openQuestion ? <p className="text-[15px] text-[#4A3A37]">You asked a question. This agreement can’t be accepted until Leader Health replies.</p> : null}
      {!card.openQuestion && card.pdfHref ? (
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-normal">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 size-5 flex-none accent-ink" />
          I’ve read the agreement and accept its terms.
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-2.5">
        {!card.openQuestion ? (
          <form action={acceptAffiliateAgreementAction}>
            <input type="hidden" name="agreementId" value={card.id} />
            <input type="hidden" name="accept" value={agreed ? "yes" : ""} />
            <button type="submit" disabled={!canAccept} className={`${inkButton} ${canAccept ? "bg-ink text-white" : "cursor-not-allowed bg-[#E8DEDC] text-[#5E4E4B]"}`}>
              Accept agreement
            </button>
          </form>
        ) : null}
        <button type="button" onClick={() => setAsking(!asking)} className={quietButton}>Ask a question</button>
        <span className="flex-1" />
        <button type="button" onClick={() => setDeclining(true)} className="h-11 text-[15px] text-[#6B5A57] underline">Decline</button>
      </div>
      {asking ? (
        <form action={askAgreementQuestionAction} className="flex flex-col gap-2">
          <input type="hidden" name="agreementId" value={card.id} />
          <label htmlFor={`question-${card.id}`} className="text-sm font-medium">Your question</label>
          <textarea id={`question-${card.id}`} name="text" required maxLength={1000} rows={3} className="w-full resize-y rounded-xl border border-[#CDBDBA] bg-white px-3.5 py-2.5 text-[15px]" />
          <button type="submit" className={`${quietButton} self-start`}>Send question</button>
        </form>
      ) : null}
      {declining ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FBF1EF] px-4 py-3.5">
          <span className="min-w-[240px] flex-1 text-[15px]">Decline this agreement? Leader Health will be told. You can still send independent posts.</span>
          <form action={declineAffiliateAgreementAction}>
            <input type="hidden" name="agreementId" value={card.id} />
            <button type="submit" className="inline-flex h-[46px] items-center rounded-full border border-[#F0CFC9] bg-white px-5 text-[15px] font-medium text-[#9B2C1F]">Decline agreement</button>
          </form>
          <button type="button" onClick={() => setDeclining(false)} className="h-11 text-sm underline">Keep it</button>
        </div>
      ) : null}
    </section>
  );
}

export function AgreementMonthPosts({
  id,
  monthName,
  noMonth,
  slots,
  guidelines,
  pdfHref,
  showFooter = true,
  embedded = false,
  onSlot,
}: {
  id: string;
  monthName: string;
  noMonth: boolean;
  slots: AgreementBoardSlot[];
  guidelines: string;
  pdfHref: string | null;
  showFooter?: boolean;
  embedded?: boolean;
  onSlot?: (slot: AgreementBoardSlot) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby={`posts-${id}`} className={embedded ? "flex flex-col" : "flex flex-col rounded-[26px] bg-white px-5 py-[22px] sm:px-6"}>
        <h2 id={`posts-${id}`} className={embedded ? "mb-1 text-base font-semibold" : "mb-2.5 text-xl font-semibold"}>{monthName} posts</h2>
        {noMonth ? <p className="text-[15px] text-[#4A3A37]">These dates don’t include a full month, so there is no monthly post set.</p> : null}
        {slots.map((slot) => (
          <div key={slot.id} className="flex flex-col gap-3 border-t border-[#F0E8E6] py-3.5">
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#F7F3F2] text-sm font-semibold">#{slot.number}</span>
              <span className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                <span className="text-base font-semibold">{slot.title}</span>
                <span className="text-sm text-[#4A3A37]">{slot.note}</span>
              </span>
              <span className="rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap" style={{ background: slot.bg, color: slot.fg }}>{slot.label}</span>
              {slot.actionLabel && (onSlot || slot.href) ? (
                onSlot ? (
                  <button type="button" onClick={() => onSlot(slot)} className="inline-flex h-[42px] items-center rounded-full bg-ink px-[18px] text-sm font-medium text-white">{slot.actionLabel}</button>
                ) : (
                  <Link href={slot.href} className="inline-flex h-[42px] items-center rounded-full bg-ink px-[18px] text-sm font-medium text-white">{slot.actionLabel}</Link>
                )
              ) : null}
            </div>
            {slot.adminNote ? <div className="ml-0 rounded-[14px] bg-[#FBF1EF] px-3.5 py-3 text-[15px] text-[#5C1F17] sm:ml-[58px]"><b>Leader Health:</b> {slot.adminNote}</div> : null}
          </div>
        ))}
      </section>
      {showFooter ? (
        <section className="flex flex-wrap items-center gap-3.5 rounded-[24px] bg-white px-6 py-[18px]">
          <span className="min-w-[240px] flex-1 text-[15px] text-[#4A3A37]">{guidelines ? `Guidelines: ${guidelines}` : "The guidelines are in the agreement PDF."}</span>
          {pdfHref ? <a href={pdfHref} className="text-sm underline">Open agreement PDF</a> : null}
        </section>
      ) : null}
    </div>
  );
}

function Active({ card }: { card: MyAgreementCard }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center gap-5 rounded-[26px] bg-white px-5 py-[22px] sm:px-6">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[22px] font-medium">{card.title || "Agreement"}</span>
            <span className="rounded-full bg-[#DDF0E4] px-3 py-1 text-[13px] font-semibold text-[#1D6340]">Accepted</span>
          </div>
          <span className="text-sm text-[#4A3A37]">{card.summary}</span>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-1.5">
          <span className="text-[15px] font-semibold">{card.verified} of {card.postTotal} posts verified</span>
          <div role="img" aria-label={`${card.verified} of ${card.postTotal} posts verified`} className="grid w-[220px] gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(card.slots.length, 1)}, minmax(0, 1fr))` }}>
            {card.slots.map((slot) => <span key={slot.id} className="h-2.5 rounded-full" style={{ background: slot.pip }} />)}
          </div>
          <span className="text-right text-[13px] text-[#4A3A37]">{card.payText}</span>
        </div>
      </section>
      <section className="flex flex-wrap items-center gap-3.5 rounded-[24px] bg-white px-6 py-[18px]">
        <span className="min-w-[240px] flex-1 text-[15px] text-[#4A3A37]">{card.guidelines ? `Guidelines: ${card.guidelines}` : "The guidelines are in the agreement PDF."}</span>
        {card.pdfHref ? <a href={card.pdfHref} className="text-sm underline">Open agreement PDF</a> : null}
      </section>
    </div>
  );
}
