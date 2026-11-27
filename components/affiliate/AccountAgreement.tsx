"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  acceptAgreementAction,
  endAgreementAction,
  markAgreementWaitingAction,
  deleteAgreementDraftAction,
  replaceAgreementAction,
  replyAgreementQuestionAction,
  saveAgreementAction,
  signAgreementAction,
  withdrawAgreementAction,
} from "@/app/admin/affiliates/agreement-actions";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import { agreementCutMonths, agreementMonthPeriods } from "@/lib/affiliate/agreement-earnings";
import { SPONSORSHIP_DISCLOSURE_TERMS } from "@/lib/affiliate/agreement-disclosure";
import { AGREEMENT_PLATFORMS, AGREEMENT_POST_TYPES, agreementDateRule, type AgreementPlatform } from "@/lib/affiliate/agreement-partnership";
import { AgreementQuestions } from "./AgreementQuestions";
import type { AgreementDraftSeed, AgreementPhase, AgreementView } from "./agreement-types";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inkButton = `inline-flex h-[46px] items-center justify-center rounded-full bg-ink px-[22px] text-[15px] font-medium text-white hover:bg-brown ${focusRing}`;
const quietButton = `inline-flex h-[46px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink hover:bg-background ${focusRing}`;
const fieldClass = `h-[54px] w-full rounded-[14px] border bg-white px-4 text-[17px] text-ink ${focusRing}`;

const RULES = ["@myleaderhealth in the caption, so the post can track", "“Paid partnership with Leader Health” in the caption, optional", "Their own tracking link in the caption, optional", "Approval from an admin before it goes live"];
const STEPS = ["1 Basics", "2 Pay and posts", "3 Content", "4 Review and send"];

type Draft = {
  title: string;
  effectiveOn: string;
  expiresOn: string;
  monthly: string;
  platforms: AgreementPlatform[];
  counts: Record<string, number>;
  guidelines: string;
};

function countKey(platform: string, type: string) {
  return `${platform}::${type}`;
}

function draftFrom(seed: AgreementDraftSeed): Draft {
  const counts: Record<string, number> = {};
  for (const post of seed.posts) counts[countKey(post.platform, post.type)] = post.count;
  return {
    title: seed.title,
    effectiveOn: seed.effectiveOn,
    expiresOn: seed.expiresOn,
    monthly: seed.monthly,
    platforms: seed.platforms.filter((platform): platform is AgreementPlatform => AGREEMENT_PLATFORMS.includes(platform as AgreementPlatform)),
    counts,
    guidelines: seed.guidelines,
  };
}

function moneyLabel(value: string) {
  const raw = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) <= 0) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(raw));
}

function joinAnd(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function joinOr(items: string[]) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

function dayLabel(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function monthTitle(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function cutNotes(start: string, end: string) {
  return agreementCutMonths(start || null, end || null).map((cut) =>
    cut.edge === "start"
      ? `Starts ${dayLabel(cut.date)}, so ${monthTitle(cut.period)} is not a posting month.`
      : `Ends ${dayLabel(cut.date)}, so ${monthTitle(cut.period)} is not a posting month.`,
  );
}

function coveredMonths(start: string, end: string) {
  const periods = agreementMonthPeriods(start || null, end || null);
  const years = new Set(periods.map((period) => period.slice(0, 4)));
  return periods.map((period, index) => {
    const [year, month] = period.split("-").map(Number);
    const name = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: years.size > 1 ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
    return years.size === 1 && index === periods.length - 1 ? `${name} ${period.slice(0, 4)}` : name;
  });
}

function postTotal(draft: Draft) {
  return draft.platforms.reduce((sum, platform) => sum + AGREEMENT_POST_TYPES[platform].reduce((inner, type) => inner + (draft.counts[countKey(platform, type)] || 0), 0), 0);
}

function breakdown(draft: Draft) {
  return draft.platforms
    .map((platform) => {
      const parts = AGREEMENT_POST_TYPES[platform]
        .filter((type) => (draft.counts[countKey(platform, type)] || 0) > 0)
        .map((type) => {
          const count = draft.counts[countKey(platform, type)] || 0;
          return `${count} ${type.toLowerCase()}${count === 1 ? "" : "s"}`;
        });
      if (parts.length === 0) return "";
      return draft.platforms.length > 1 ? `${platform}: ${parts.join(", ")}` : parts.join(", ");
    })
    .filter(Boolean);
}

function sentenceFor(first: string, total: number, platforms: string[], paid: string, months: string[]) {
  if (platforms.length === 0) return `Turn on a platform to see what ${first} agrees to.`;
  const where = months.length > 1 ? `in each of ${joinAnd(months)}` : "a month";
  const posts = `${first} makes ${total} ${total === 1 ? "post" : "posts"} ${where} on ${joinAnd(platforms)}.`;
  return paid ? `${posts} ${first} is paid ${paid} for each of those months once all ${total} for that month are approved, published and verified.` : `${posts} Add the monthly amount to finish.`;
}

function phaseStyle(phase: AgreementPhase, first: string, question = false) {
  if (phase === "waiting" && question) return { label: "Still negotiating", pill: "bg-[#FBEFD6] text-[#7A4E00]", banner: "bg-[#FBEFD6] text-[#5C3B00]" };
  if (phase === "waiting") return { label: `Waiting for ${first}`, pill: "bg-[#FBEFD6] text-[#7A4E00]", banner: "bg-[#FBEFD6] text-[#5C3B00]" };
  if (phase === "active") return { label: "Active", pill: "bg-[#DDF0E4] text-[#1D6340]", banner: "bg-[#DDF0E4] text-[#1D6340]" };
  if (phase === "expired") return { label: "Expired", pill: "bg-[#EFEAE9] text-[#4A3A37]", banner: "bg-[#F7F3F2] text-[#4A3A37]" };
  if (phase === "ended") return { label: "Ended early", pill: "bg-[#FBE3DF] text-[#9B2C1F]", banner: "bg-[#FBF1EF] text-[#9B2C1F]" };
  if (phase === "declined") return { label: "Declined", pill: "bg-[#EFEAE9] text-[#4A3A37]", banner: "bg-[#F7F3F2] text-[#4A3A37]" };
  if (phase === "replaced") return { label: "Replaced", pill: "bg-[#EFEAE9] text-[#4A3A37]", banner: "bg-[#F7F3F2] text-[#4A3A37]" };
  return { label: "Draft", pill: "bg-[#EFEAE9] text-[#4A3A37]", banner: "bg-[#F7F3F2] text-[#4A3A37]" };
}

function HiddenTerms({ code, draft, seed, copy = false }: { code: string; draft: Draft; seed: AgreementDraftSeed; copy?: boolean }) {
  const mixes = draft.platforms.flatMap((platform) =>
    AGREEMENT_POST_TYPES[platform]
      .filter((type) => (draft.counts[countKey(platform, type)] || 0) > 0)
      .map((type) => `${platform}::${type}::${draft.counts[countKey(platform, type)]}`),
  );
  return (
    <>
      <input type="hidden" name="code" value={code} />
      {copy ? <input type="hidden" name="copy" value="1" /> : null}
      <input type="hidden" name="title" value={draft.title} />
      <input type="hidden" name="effectiveOn" value={draft.effectiveOn} />
      <input type="hidden" name="expiresOn" value={draft.expiresOn} />
      <input type="hidden" name="monthlyAmount" value={draft.monthly} />
      <input type="hidden" name="guidelines" value={draft.guidelines} />
      {draft.platforms.map((platform) => (
        <input key={platform} type="hidden" name="platform" value={platform} />
      ))}
      {mixes.map((mix) => (
        <input key={mix} type="hidden" name="postMix" value={mix} />
      ))}
      {seed.deliverables.map((item, index) => (
        <span key={`${item.description}-${index}`}>
          <input type="hidden" name="deliverableDescription" value={item.description} />
          <input type="hidden" name="deliverableDue" value={item.dueOn} />
          <input type="hidden" name="deliverableAmount" value={item.amount} />
        </span>
      ))}
      <input type="hidden" name="compensationNote" value={seed.compensationNote} />
      <input type="hidden" name="licensing" value={seed.licensing} />
      <input type="hidden" name="paymentConditions" value={seed.paymentConditions} />
    </>
  );
}

function PdfBadge() {
  return (
    <span aria-hidden="true" className="flex h-11 w-9 flex-none items-center justify-center rounded-md bg-[#F3CFCB] text-[11px] font-bold text-[#9B2C1F]">
      PDF
    </span>
  );
}

export function AccountAgreement({
  name,
  code,
  labRate,
  standingRate,
  unavailable,
  agreements,
  editableId,
  seed,
  canEnd,
  canReplace,
  replaceNeedsNote,
  progress,
  toast,
  replyNotice = "",
  error: serverError,
  initialStep = 0,
  startNew = false,
}: {
  name: string;
  code: string;
  labRate: string;
  standingRate: string;
  unavailable: boolean;
  agreements: AgreementView[];
  editableId: string | null;
  seed: AgreementDraftSeed;
  canSign: boolean;
  canAccept: boolean;
  canEnd: boolean;
  canReplace: boolean;
  replaceNeedsNote: boolean;
  progress: { labels: string[] } | null;
  toast: string;
  replyNotice?: string;
  error: string;
  initialStep?: number;
  startNew?: boolean;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(initialStep);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(seed));
  const [error, setError] = useState("");
  const [showServer, setShowServer] = useState(true);
  const keepList = toast === "Draft deleted.";
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickedPdf, setPickedPdf] = useState("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [removedPdf, setRemovedPdf] = useState(false);
  const [submitReady, setSubmitReady] = useState(true);
  const [openId, setOpenId] = useState<string | null>(() => {
    if (keepList) return null;
    if (startNew && agreements.length === 0) return "new";
    if (initialStep > 0 || serverError || toast) return editableId ?? (agreements.length === 0 ? "new" : null);
    return null;
  });
  const [holdNew, setHoldNew] = useState(false);
  const first = name.trim().split(/\s+/)[0] || name;
  const selected = agreements.find((agreement) => agreement.id === openId) ?? null;
  const current = agreements.filter((agreement) => agreement.phase === "active");
  const sent = agreements.filter((agreement) => agreement.phase === "waiting");
  const drafts = agreements.filter((agreement) => agreement.phase === "draft");
  const past = agreements.filter((agreement) => agreement.phase === "expired" || agreement.phase === "ended" || agreement.phase === "declined" || agreement.phase === "replaced");
  const editing = !unavailable && ((openId === editableId && selected?.phase === "draft") || (openId === "new" && agreements.length === 0));
  const paid = moneyLabel(draft.monthly);
  const total = postTotal(draft);
  const kinds = breakdown(draft);
  const draftMonths = coveredMonths(draft.effectiveOn, draft.expiresOn);
  const draftCuts = cutNotes(draft.effectiveOn, draft.expiresOn);
  const selectedMonths = selected ? coveredMonths(selected.effectiveValue, selected.expiresValue) : [];
  const datesSet = Boolean(draft.effectiveOn && draft.expiresOn && draft.effectiveOn <= draft.expiresOn);
  const storedPdf = editing && selected?.file && !removedPdf ? selected.fileName : "";
  const attachedPdf = pickedPdf || storedPdf;

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
    setError("");
  }

  function togglePlatform(platform: AgreementPlatform) {
    setDraft((current) => {
      const on = current.platforms.includes(platform);
      const platforms = on ? current.platforms.filter((item) => item !== platform) : [...current.platforms, platform];
      const counts = { ...current.counts };
      if (!on && AGREEMENT_POST_TYPES[platform].every((type) => !counts[countKey(platform, type)])) {
        counts[countKey(platform, AGREEMENT_POST_TYPES[platform][0])] = 1;
      }
      return { ...current, platforms, counts };
    });
    setError("");
  }

  function changeCount(platform: AgreementPlatform, type: string, delta: number) {
    setDraft((current) => {
      const key = countKey(platform, type);
      return { ...current, counts: { ...current.counts, [key]: Math.max(0, (current.counts[key] || 0) + delta) } };
    });
    setError("");
  }

  function stepError(index: number) {
    if (index === 0) {
      if (!draft.title.trim()) return "Give it a name.";
      if (!draft.effectiveOn || !draft.expiresOn) return "Add start and end dates.";
      const dates = agreementDateRule(draft.effectiveOn, draft.expiresOn);
      if (dates) return dates;
    }
    if (index === 1) {
      if (!paid) return "Enter the monthly amount.";
      if (draft.platforms.length === 0) return "Turn on at least one platform.";
      const empty = draft.platforms.filter((platform) => !AGREEMENT_POST_TYPES[platform].some((type) => (draft.counts[countKey(platform, type)] || 0) > 0));
      if (empty.length > 0) return `Add posts for ${joinAnd(empty)}, or turn it off.`;
    }
    if (index === 2 && !draft.guidelines.trim()) return "Add a few lines of guidelines.";
    if (index === 3 && !attachedPdf) return "Attach the PDF before sending.";
    return "";
  }

  function goTo(index: number) {
    setStep(index);
    setError("");
  }

  function continueStep() {
    const issue = stepError(step);
    if (issue) {
      setError(issue);
      return;
    }
    goTo(Math.min(3, step + 1));
  }

  function clearPicked() {
    if (fileRef.current) fileRef.current.value = "";
    setPickedPdf("");
    setPickedFile(null);
  }

  function holdSubmit() {
    setSubmitReady(false);
    let blurred = false;
    const enableLater = () => window.setTimeout(() => setSubmitReady(true), 500);
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      enableLater();
    };
    const onBlur = () => {
      blurred = true;
      window.removeEventListener("blur", onBlur);
      window.addEventListener("focus", onFocus);
    };
    window.addEventListener("blur", onBlur);
    window.setTimeout(() => {
      if (blurred) return;
      window.removeEventListener("blur", onBlur);
      setSubmitReady(true);
    }, 800);
  }

  function releaseSubmit() {
    window.setTimeout(() => setSubmitReady(true), 500);
  }

  function rememberFile(file: File | null) {
    setPickedFile(file);
    setPickedPdf(file?.name ?? "");
    setError("");
    releaseSubmit();
  }

  function restoreFile() {
    const input = fileRef.current;
    if (!input || !pickedFile || (input.files && input.files.length > 0)) return;
    const transfer = new DataTransfer();
    transfer.items.add(pickedFile);
    input.files = transfer.files;
  }

  function clearNotice() {
    setShowServer(false);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("notice")) return;
    url.searchParams.delete("notice");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    if (serverError || (!toast && !replyNotice)) return;
    const timer = window.setTimeout(clearNotice, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, replyNotice, serverError]);

  useEffect(() => {
    if (!startNew) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [startNew]);

  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const onCancel = () => window.setTimeout(() => setSubmitReady(true), 500);
    input.addEventListener("cancel", onCancel);
    return () => input.removeEventListener("cancel", onCancel);
  }, [editing]);

  function openAgreement(agreementId: string) {
    setOpenId(agreementId);
    setStep(0);
    setError("");
    setConfirmEnd(false);
    setConfirmDelete(false);
    setShowServer(false);
    setHoldNew(false);
    const agreement = agreements.find((item) => item.id === agreementId);
    if (agreement?.phase === "draft" && agreement.id === editableId) {
      setDraft(draftFrom(agreement.source));
      clearPicked();
      setRemovedPdf(false);
    }
  }

  function closeAgreement() {
    setOpenId(null);
    setError("");
    setConfirmEnd(false);
    setConfirmDelete(false);
    setShowServer(false);
  }

  const offPlatforms = AGREEMENT_PLATFORMS.filter((platform) => !draft.platforms.includes(platform));
  const platformSummary = draft.platforms.length
    ? `${first} will post on ${joinAnd([...draft.platforms])}${draft.platforms.length === 1 ? " only." : "."}${offPlatforms.length ? ` ${first} won’t post on ${joinOr([...offPlatforms])}.` : ""}`
    : "No platform selected yet. Turn on at least one.";

  const headline = editing ? (paid ? `${paid}/month` : "—") : selected?.monthly ? `${selected.monthly}/month` : "—";
  const sentence = editing
    ? datesSet && draftMonths.length === 0
      ? `${first}'s dates don't include a full month, so there is no monthly post set.`
      : sentenceFor(first, total, draft.platforms, paid, draftMonths)
    : selected
      ? selectedMonths.length === 0 && selected.effectiveValue && selected.expiresValue
        ? `${first}'s dates don't include a full month, so there is no monthly post set.`
        : sentenceFor(first, selected.postTotal, selected.platforms, selected.monthly, selectedMonths)
      : "";
  const style = phaseStyle(editing ? "draft" : (selected?.phase ?? "draft"), first, !editing && Boolean(selected && selected.questions.length > 0));
  const title = editing ? draft.title || "New agreement" : selected?.title || "Agreement";
  const message = error || (showServer ? serverError : "");

  return (
    <div className="flex flex-col gap-[18px]">
      {unavailable ? <p className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">Agreements are unavailable right now.</p> : null}
      {openId == null ? (
        <AgreementList
          first={first}
          code={code}
          canReplace={canReplace}
          replaceNeedsNote={replaceNeedsNote}
          editableId={editableId}
          current={current}
          sent={sent}
          drafts={drafts}
          past={past}
          toast={toast && showServer ? toast : ""}
          onCloseNotice={clearNotice}
          holdNew={holdNew}
          onHoldNew={() => setHoldNew(true)}
          onOpen={openAgreement}
          onStartBlank={() => {
            setOpenId("new");
            setStep(0);
            setError("");
            setHoldNew(false);
          }}
        />
      ) : null}

      {openId != null ? (
        <button type="button" onClick={closeAgreement} className={`flex h-9 items-center gap-1.5 self-start text-[15px] text-ink ${focusRing}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All agreements
        </button>
      ) : null}

      {!unavailable && openId != null && (editing || selected) ? (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <section aria-labelledby={`${id}-title`} className="flex min-w-0 flex-1 flex-col gap-5 rounded-[30px] bg-white px-5 py-6 sm:px-[30px] sm:py-7">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 id={`${id}-title`} className="text-[28px] leading-tight">
                {title}
              </h2>
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${style.pill}`}>{style.label}</span>
            </div>
            {toast && showServer ? <FlashNotice message={toast} onClose={clearNotice} /> : null}

            {editing ? (
              <>
              <form id={`${id}-wizard`} action={saveAgreementAction} className="flex flex-col gap-[22px]">
                <HiddenTerms code={code} draft={draft} seed={seed} />
                <input type="hidden" name="returnStep" value={String(step)} />
                {removedPdf && !pickedPdf ? <input type="hidden" name="removePdf" value="1" /> : null}
                <ol aria-label="Steps" className="grid grid-cols-4 gap-2">
                  {STEPS.map((label, index) => (
                    <li key={label}>
                      <button type="button" aria-current={step === index ? "step" : undefined} onClick={() => goTo(index)} className={`flex w-full flex-col gap-2 text-left ${focusRing}`}>
                        <span className={`h-[5px] rounded-full ${index <= step ? "bg-ink" : "bg-[#E8DEDC]"}`} />
                        <span className={`text-[15px] ${index === step ? "font-semibold text-ink" : index < step ? "text-ink" : "text-[#6B5A57]"}`}>{label}</span>
      </button>
                    </li>
                  ))}
                </ol>

                {step === 0 ? (
                  <div className="flex flex-col gap-5">
                    <h3 className="text-xl font-semibold">Name it and set the dates</h3>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`${id}-name`} className="text-base font-semibold">
                        Agreement name
                      </label>
                      <input
                        id={`${id}-name`}
                        value={draft.title}
                        onChange={(event) => patch({ title: event.target.value })}
                        placeholder="e.g. December content partnership"
                        className={`${fieldClass} ${error && !draft.title.trim() ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`}
                      />
                      <span className="text-sm text-[#4A3A37]">Something you’ll recognize later.</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-[1_1_220px] flex-col gap-2">
                        <label htmlFor={`${id}-start`} className="text-base font-semibold">
                          Starts
                        </label>
                        <input id={`${id}-start`} type="date" value={draft.effectiveOn} onChange={(event) => patch({ effectiveOn: event.target.value })} className={`${fieldClass} ${error && agreementDateRule(draft.effectiveOn, draft.expiresOn)?.includes("start") ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                      </div>
                      <div className="flex flex-[1_1_220px] flex-col gap-2">
                        <label htmlFor={`${id}-end`} className="text-base font-semibold">
                          Ends
                        </label>
                        <input id={`${id}-end`} type="date" value={draft.expiresOn} onChange={(event) => patch({ expiresOn: event.target.value })} className={`${fieldClass} ${error && agreementDateRule(draft.effectiveOn, draft.expiresOn)?.includes("end") ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`} />
                      </div>
                    </div>
                    <p className="text-sm text-[#4A3A37]">Start on the 1st. End on the last day of the month. The post count applies to each of those months.</p>
                    {datesSet ? (
                      <div className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
                        {draftMonths.length > 0 ? (
                          <>
                            <p className="text-[15px] font-semibold">{draftMonths.length === 1 ? "1 posting month" : `${draftMonths.length} posting months`}</p>
                            <ul className="mt-2 flex flex-wrap gap-2">
                              {draftMonths.map((month) => (
                                <li key={month} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-ink">{month}</li>
                              ))}
                            </ul>
                            <p className="mt-2 text-sm leading-normal text-[#4A3A37]">Each of these months gets its own full set of posts.</p>
                          </>
                        ) : (
                          <p className="text-[15px] font-semibold">No full month, so there is no monthly post set.</p>
                        )}
                        {draftCuts.map((note) => (
                          <p key={note} className="mt-2 text-sm leading-normal text-[#4A3A37]">{note}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="flex flex-col gap-[22px]">
                    <h3 className="text-xl font-semibold">How much, for how many posts?</h3>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`${id}-amount`} className="text-base font-semibold">
                        Paid each month
                            </label>
                      <span className={`flex h-[60px] w-[220px] items-center rounded-[14px] border bg-white px-4 ${paid || !draft.monthly ? "border-[#CDBDBA]" : "border-[#9B2C1F]"}`}>
                        <span aria-hidden="true" className="pr-1.5 text-[22px] text-[#6B5A57]">
                          $
                        </span>
                        <input
                          id={`${id}-amount`}
                          inputMode="decimal"
                          value={draft.monthly}
                          onChange={(event) => patch({ monthly: event.target.value })}
                          className="min-w-0 flex-1 border-0 bg-transparent text-2xl font-semibold text-ink outline-none"
                        />
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <span className="text-base font-semibold">Which platforms will {first} post on?</span>
                      <span className="text-sm text-[#4A3A37]">Tap to turn each one on or off. {first} only posts on the ones turned on.</span>
                      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
                        {AGREEMENT_PLATFORMS.map((platform) => {
                          const on = draft.platforms.includes(platform);
                          return (
                            <button
                              key={platform}
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() => togglePlatform(platform)}
                              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-ink ${on ? "border-ink bg-white" : "border-[#E8DEDC] bg-[#FBF9F8]"} ${focusRing}`}
                            >
                              <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center rounded-[7px] border-2 text-sm font-bold text-white ${on ? "border-ink bg-ink" : "border-[#B9A8A5] bg-white"}`}>
                                {on ? "✓" : ""}
                              </span>
                              <span className="flex flex-col gap-0.5">
                                <span className="text-base font-semibold">{platform}</span>
                                <span className={`text-[13px] font-semibold ${on ? "text-[#1D6340]" : "text-[#6B5A57]"}`}>{on ? "Will post here" : "Won’t post here"}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className={`rounded-[14px] px-3.5 py-3 text-[15px] leading-normal ${draft.platforms.length ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBE3DF] text-[#9B2C1F]"}`}>{platformSummary}</p>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <span className="text-base font-semibold">How many posts on each platform, each month?</span>
                      {draft.platforms.length ? (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                          {draft.platforms.map((platform) => {
                            const subtotal = AGREEMENT_POST_TYPES[platform].reduce((sum, type) => sum + (draft.counts[countKey(platform, type)] || 0), 0);
                            return (
                              <div key={platform} className="flex flex-col gap-1 rounded-[18px] border border-[#E8DEDC] px-4 py-3.5">
                                <div className="flex items-baseline justify-between pb-1.5">
                                  <span className="text-base font-semibold">{platform}</span>
                                  <span className={`text-sm font-semibold ${subtotal ? "text-ink" : "text-[#9B2C1F]"}`}>{subtotal === 1 ? "1 post" : `${subtotal} posts`}</span>
                          </div>
                                {AGREEMENT_POST_TYPES[platform].map((type) => {
                                  const count = draft.counts[countKey(platform, type)] || 0;
                                  return (
                                    <div key={type} className="flex items-center gap-2.5 border-t border-[#F0E8E6] py-1.5">
                                      <span className="flex-1 text-[15px]">{type}</span>
                                      <button
                                        type="button"
                                        aria-label={`One less ${type} on ${platform}`}
                                        onClick={() => changeCount(platform, type, -1)}
                                        className={`size-9 rounded-full border border-[#CDBDBA] bg-white text-lg text-ink ${focusRing}`}
                                        style={{ opacity: count ? 1 : 0.4 }}
                                      >
                                        −
                                      </button>
                                      <span aria-live="polite" className="w-7 text-center text-[17px] font-semibold">
                                        {count}
                                      </span>
                          <button
                            type="button"
                                        aria-label={`One more ${type} on ${platform}`}
                                        onClick={() => changeCount(platform, type, 1)}
                                        className={`size-9 rounded-full border border-[#CDBDBA] bg-white text-lg text-ink ${focusRing}`}
                                      >
                                        +
                          </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-[#4A3A37]">Turn on a platform above to add posts there.</span>
                      )}
                    </div>
                    <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px]">
                      {datesSet && draftMonths.length === 0 ? (
                        "These dates don't include a full month, so the monthly amount is not earned."
                      ) : (
                        <>
                          <b>{total === 1 ? "1 post" : `${total} posts`} each posting month{draftMonths.length > 1 ? `, in ${joinAnd(draftMonths)}` : ""}.</b> {first} can upload that set for every posting month, and gets paid for a month once all {total} for that month are approved, published and verified.
                        </>
                      )}
                    </p>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="flex flex-col gap-[18px]">
                    <h3 className="text-xl font-semibold">What should the posts be about?</h3>
                    <div className="flex flex-col gap-2">
                      <label htmlFor={`${id}-guide`} className="text-base font-semibold">
                        Guidelines
                      </label>
                      <textarea
                        id={`${id}-guide`}
                        rows={5}
                        value={draft.guidelines}
                        onChange={(event) => patch({ guidelines: event.target.value })}
                        placeholder="Topics to cover, tone, and anything to avoid"
                        className={`resize-y rounded-[14px] border bg-white px-4 py-3 text-base leading-normal text-ink ${error && !draft.guidelines.trim() ? "border-[#9B2C1F]" : "border-[#CDBDBA]"} ${focusRing}`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-semibold">Every post also needs</span>
                      {RULES.map((rule) => (
                        <div key={rule} className="flex items-center gap-3 rounded-[14px] bg-[#F7F3F2] px-4 py-3">
                          <span aria-hidden="true" className="flex size-6 flex-none items-center justify-center rounded-full bg-[#DDF0E4] text-[13px] font-bold text-[#1D6340]">
                            ✓
                          </span>
                          <span className="text-[15px]">{rule}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 rounded-[14px] border border-[#E8DEDC] bg-white px-4 py-3.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">Sponsorship disclosure</span>
                        <span className="rounded-full bg-[#DDF0E4] px-2.5 py-0.5 text-[13px] font-semibold text-[#1D6340]">Included</span>
                      </span>
                      <p className="text-[15px] leading-normal text-[#4A3A37]">“{SPONSORSHIP_DISCLOSURE_TERMS}”</p>
                      <p className="text-sm text-[#6B5A57]">{first} accepts this together with the agreement.</p>
                    </div>
                  </div>
                ) : null}

                <div className={step === 3 ? "flex flex-col gap-[18px]" : "hidden"}>
                  <h3 className="text-xl font-semibold">Check it, attach the PDF, and send</h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {(
                      [
                        ["Name", draft.title || "—", 0],
                        ["Dates", draft.effectiveOn && draft.expiresOn ? `${dayLabel(draft.effectiveOn)} – ${dayLabel(draft.expiresOn)}` : "—", 0],
                        ["Months", draftMonths.length ? `${draftMonths.length} · ${joinAnd(draftMonths)}` : datesSet ? "No full month" : "—", 0],
                        ["Paid each month", paid || "—", 1],
                        ["Posts each month", `${total} · ${kinds.join(" · ") || "—"}`, 1],
                        ["Where", draft.platforms.join(", ") || "—", 1],
                        ["Sponsorship disclosure", "Included", 2],
                      ] as const
                    ).map(([label, value, target]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => goTo(target)}
                        className={`flex justify-between gap-2.5 rounded-2xl border border-[#E8DEDC] bg-white px-4 py-3.5 text-left text-ink ${focusRing}`}
                      >
                        <span className="flex flex-col gap-1">
                          <span className="text-[13px] text-[#6B5A57]">{label}</span>
                          <span className="text-base font-semibold">{value}</span>
                        </span>
                        <span className="text-[13px] text-ink underline">Edit</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold">Legal agreement (PDF)</span>
                    <div className={`flex items-center gap-3 rounded-[14px] border-[1.5px] border-dashed bg-white p-[18px] ${error && !attachedPdf && step === 3 ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`}>
                      {attachedPdf ? (
                        <PdfBadge />
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 16V4" />
                          <path d="M7 9l5-5 5 5" />
                          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                        </svg>
                      )}
                      <label htmlFor={`${id}-pdf`} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block truncate text-base font-medium underline">{attachedPdf || "Attach PDF"}</span>
                        <span className="block text-sm text-[#4A3A37]">{attachedPdf ? "Choose a different PDF" : `${first} will read and accept this file.`}</span>
                      </label>
                      {attachedPdf ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (pickedPdf) clearPicked();
                            else setRemovedPdf(true);
                          }}
                          className={`h-9 text-sm text-ink underline ${focusRing}`}
                        >
                          Remove
                        </button>
                      ) : null}
                      <input
                        ref={fileRef}
                        id={`${id}-pdf`}
                        name="pdf"
                        type="file"
                        accept="application/pdf"
                        onClick={holdSubmit}
                        onChange={(event) => rememberFile(event.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>

                {message ? (
                  <span role="alert" className="text-[15px] text-[#9B2C1F]">
                    {message}
                  </span>
                ) : null}
              </form>
              <div className="flex flex-wrap items-center gap-2.5 rounded-[22px] bg-[#F7F3F2] px-3 py-3 sm:px-4">
                {step > 0 ? (
                  <button type="button" onClick={() => goTo(step - 1)} className={`${quietButton} bg-white`}>
                    Back
                  </button>
                ) : null}
                {selected && confirmDelete && draftDeletable(selected) ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-[16px] border border-[#F3D2CB] bg-[#FBF1EF] px-3.5 py-2.5">
                    <p className="min-w-[180px] text-[15px] leading-snug text-[#5C241C]">
                      <span className="block font-semibold">Delete this draft?</span>
                      <span className="mt-0.5 block text-sm text-[#7A3B32]">It was never sent, so {first} won’t notice.</span>
                    </p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button type="button" onClick={() => setConfirmDelete(false)} className={`${quietButton} bg-white`}>
                        Keep
                      </button>
                      <form action={deleteAgreementDraftAction}>
                        <input type="hidden" name="code" value={code} />
                        <input type="hidden" name="agreementId" value={selected.id} />
                        <button type="submit" className={`inline-flex h-[46px] items-center justify-center rounded-full bg-[#9B2C1F] px-[18px] text-[15px] font-medium text-white hover:bg-[#7E2419] ${focusRing}`}>
                          Delete draft
                        </button>
                      </form>
                    </div>
                  </div>
                ) : selected && draftDeletable(selected) ? (
                  <button type="button" onClick={() => setConfirmDelete(true)} className={`inline-flex h-[46px] items-center justify-center rounded-full border border-[#F0CFC9] bg-white px-4 text-[15px] font-medium text-[#9B2C1F] hover:bg-[#FBF1EF] ${focusRing}`}>
                    Delete
                  </button>
                ) : null}
                <span className="flex-1" />
                <button
                  type="submit"
                  form={`${id}-wizard`}
                  disabled={!submitReady}
                  onClick={(event) => {
                    restoreFile();
                    const dates = agreementDateRule(draft.effectiveOn || null, draft.expiresOn || null);
                    if (!dates) return;
                    event.preventDefault();
                    setError(dates);
                  }}
                  className={`${quietButton} bg-white disabled:opacity-50`}
                >
                  Save draft
                </button>
                {step < 3 ? (
                  <button type="button" onClick={continueStep} className={inkButton}>
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    form={`${id}-wizard`}
                    formAction={markAgreementWaitingAction}
                    disabled={!submitReady}
                    onClick={(event) => {
                      restoreFile();
                      const failing = [0, 1, 2, 3].find((index) => stepError(index));
                      if (failing === undefined) return;
                      event.preventDefault();
                      if (failing < 3) setStep(failing);
                      setError(stepError(failing));
                    }}
                    className={`${inkButton} disabled:opacity-50`}
                  >
                    Send to {first}
                          </button>
                        )}
                      </div>
              </>
            ) : selected ? (
              <ReadAgreement
                agreement={selected}
                first={first}
                code={code}
                name={name}
                canEnd={canEnd && selected.id === editableId}
                canReplace={canReplace}
                replaceNeedsNote={replaceNeedsNote}
                canSign={selected.phase === "waiting" && !selected.openQuestion && !selected.file}
                canAccept={selected.phase === "waiting" && !selected.openQuestion && selected.file}
                confirmEnd={confirmEnd}
                onAskEnd={() => setConfirmEnd(true)}
                onCancelEnd={() => setConfirmEnd(false)}
                progress={selected.phase === "active" ? progress : null}
                replyNotice={showServer ? replyNotice : ""}
                error={showServer ? serverError : ""}
              />
            ) : null}
          </section>

          <aside className="flex w-full flex-none flex-col gap-3.5 lg:w-[330px]">
            <div className="flex flex-col gap-2.5 rounded-[24px] bg-ink p-[22px] text-white">
              <span className="text-[13px] font-semibold tracking-[0.06em] text-[#F3CFCB] uppercase">In one sentence</span>
              <span className="text-[34px] font-medium leading-tight">{headline}</span>
              <span className="text-base leading-normal text-[#F7EDEB]">{sentence}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-[22px] bg-white px-5 py-[18px]">
              <span className="text-[15px] font-semibold">Also earns, set elsewhere</span>
              <div className="flex justify-between gap-3 text-sm">
                <span>Lab commission</span>
                <span className="text-right font-semibold">{labRate}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span>Social and website</span>
                <span className="text-right font-semibold">{standingRate}</span>
              </div>
              <span className="text-[13px] text-[#6B5A57]">This agreement doesn’t change these.</span>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function agreementMeta(agreement: AgreementView) {
  const posts = `${agreement.postTotal} ${agreement.postTotal === 1 ? "post" : "posts"}`;
  return agreement.monthly ? `${agreement.monthly}/month · ${posts}` : posts;
}

function agreementDates(agreement: AgreementView) {
  if (agreement.effectiveValue && agreement.expiresValue) return `${dayLabel(agreement.effectiveValue)} – ${dayLabel(agreement.expiresValue)}`;
  return "Dates not set";
}

function agreementNote(agreement: AgreementView, first: string) {
  if (agreement.phase === "active") return `Accepted ${agreement.signedAt || "—"}. Ends ${agreement.expiresOn}.`;
  if (agreement.phase === "waiting") return `Sent ${agreement.sentAt || "—"}. Waiting for ${first} to accept.`;
  if (agreement.phase === "expired") return `Ended ${agreement.expiresOn}.`;
  if (agreement.phase === "ended") return `Ended early ${agreement.endedAt || "—"}.`;
  if (agreement.phase === "declined") return `${first} declined this agreement.`;
  if (agreement.phase === "replaced") return agreement.sentAt ? `Sent ${agreement.sentAt}. A newer agreement replaced it.` : "A newer agreement replaced it.";
  if (agreement.phase === "draft" && agreement.sentAt) return `Withdrawn after it was sent ${agreement.sentAt}. Edit it, then send it again.`;
  return agreement.title.trim() ? "Not sent yet. Saved as a draft." : "Not sent yet. Needs a name.";
}

function openAsk(agreement: AgreementView) {
  return agreement.questions.find((question) => !question.reply)?.text ?? "";
}

function AgreementList({
  first,
  code,
  canReplace,
  replaceNeedsNote,
  editableId,
  current,
  sent,
  drafts,
  past,
  toast,
  onCloseNotice,
  holdNew,
  onHoldNew,
  onOpen,
  onStartBlank,
}: {
  first: string;
  code: string;
  canReplace: boolean;
  replaceNeedsNote: boolean;
  editableId: string | null;
  current: AgreementView[];
  sent: AgreementView[];
  drafts: AgreementView[];
  past: AgreementView[];
  toast: string;
  onCloseNotice: () => void;
  holdNew: boolean;
  onHoldNew: () => void;
  onOpen: (id: string) => void;
  onStartBlank: () => void;
}) {
  const fresh = current.length + sent.length + drafts.length + past.length === 0;
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end gap-3.5">
        <div className="flex min-w-[240px] flex-1 flex-col gap-1">
          <h2 className="text-[28px] font-normal leading-tight">Agreements</h2>
          <p className="text-[15px] text-[#4A3A37]">{first}’s current agreement, drafts you’re working on, and agreements already sent.</p>
        </div>
        {fresh ? (
          <button type="button" onClick={onStartBlank} className={inkButton}>+ New agreement</button>
        ) : canReplace ? (
          <form action={replaceAgreementAction}>
            <input type="hidden" name="code" value={code} />
            {replaceNeedsNote ? <input type="hidden" name="note" value="Replaced with a new agreement." /> : null}
            <button type="submit" className={inkButton}>+ New agreement</button>
          </form>
        ) : (
          <button type="button" onClick={onHoldNew} className={inkButton}>+ New agreement</button>
        )}
      </div>
      {toast ? <FlashNotice message={toast} onClose={onCloseNotice} /> : null}
      {holdNew ? <p className="text-sm text-[#4A3A37]">{sent.length ? `The sent agreement is still waiting on ${first}. A reply does not replace it. Withdraw it to send it back to Drafts.` : "End the active agreement before starting another. It is under Current."}</p> : null}

      <section aria-labelledby="current-agreements" className="flex flex-col gap-2.5">
        <h3 id="current-agreements" className="text-lg font-semibold">Current</h3>
        {current.map((agreement) => (
          <AgreementCard key={agreement.id} agreement={agreement} first={first} emphasized onOpen={onOpen} action="View" />
        ))}
        {current.length === 0 ? <p className="rounded-[22px] bg-white px-[22px] py-[18px] text-[15px] text-[#4A3A37]">No current agreement. {first} can still send independent posts.</p> : null}
      </section>

      <section aria-labelledby="sent-agreements" className="flex flex-col gap-2.5">
        <h3 id="sent-agreements" className="text-lg font-semibold">
          Sent <span className="text-sm font-normal text-[#6B5A57]">Stays here through questions and replies. Withdraw sends it back to Drafts.</span>
        </h3>
        {sent.map((agreement) => {
          const ask = openAsk(agreement);
          return (
            <div key={agreement.id} className={`flex flex-col gap-3 rounded-[22px] border-2 bg-white px-[22px] py-[18px] ${agreement.openQuestion ? "border-[#E9C98A]" : "border-[#E8DEDC]"}`}>
              <AgreementCard agreement={agreement} first={first} bare onOpen={onOpen} action={agreement.openQuestion ? "Reply" : "View"} trailing={<WithdrawSent code={code} agreementId={agreement.id} />} />
              {ask ? (
                <div className="flex flex-col gap-1 rounded-[14px] bg-[#FBF6EC] px-3.5 py-3">
                  <span className="text-sm font-semibold text-[#5C3B00]">Asked a question</span>
                  <span className="text-sm text-[#5C3B00]">“{ask}”</span>
                </div>
              ) : null}
            </div>
          );
        })}
        {sent.length === 0 ? <p className="rounded-[22px] bg-white px-[22px] py-[18px] text-[15px] text-[#4A3A37]">Nothing waiting on {first}.</p> : null}
      </section>

      <section aria-labelledby="draft-agreements" className="flex flex-col gap-2.5">
        <h3 id="draft-agreements" className="text-lg font-semibold">
          Drafts <span className="text-sm font-normal text-[#6B5A57]">Only admins can see these</span>
        </h3>
        {drafts.map((agreement) => (
          <div key={agreement.id} className="flex flex-col gap-3 rounded-[22px] border-[1.5px] border-dashed border-[#CDBDBA] bg-white px-[22px] py-[18px]">
            <AgreementCard agreement={agreement} first={first} bare onOpen={onOpen} action={agreement.id === editableId ? "Continue editing" : "View"} />
            <DraftDelete code={code} agreement={agreement} first={first} />
          </div>
        ))}
        {drafts.length === 0 ? <p className="rounded-[22px] bg-white px-[22px] py-[18px] text-[15px] text-[#4A3A37]">No drafts. Use + New agreement to start one.</p> : null}
      </section>

      <section aria-labelledby="past-agreements" className="flex flex-col rounded-[22px] bg-white px-[22px] py-[18px]">
        <h3 id="past-agreements" className="pb-2 text-lg font-semibold">Past</h3>
        {past.map((agreement) => {
          const style = phaseStyle(agreement.phase, first, agreement.questions.length > 0);
          return (
            <div key={agreement.id} className="flex flex-wrap items-center gap-3.5 border-t border-[#F0E8E6] py-3">
              <span className="flex min-w-[220px] flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{agreement.title || "Agreement"}</span>
                <span className="text-[13px] text-[#4A3A37]">{agreementMeta(agreement)} · {agreementDates(agreement)}</span>
                <span className="text-[13px] text-[#6B5A57]">{agreementNote(agreement, first)}</span>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>{style.label}</span>
              <button type="button" onClick={() => onOpen(agreement.id)} className={`${quietButton} h-10 px-4 text-sm`}>View</button>
              {canReplace && !editableId ? (
                <form action={replaceAgreementAction}>
                  <HiddenTerms code={code} draft={draftFrom(agreement.source)} seed={agreement.source} copy />
                  {replaceNeedsNote ? <input type="hidden" name="note" value="Replaced with a new agreement." /> : null}
                  <button type="submit" className={`h-10 text-sm text-ink underline ${focusRing}`}>Reuse as new draft</button>
                    </form>
                  ) : null}
            </div>
          );
        })}
        {past.length === 0 ? <p className="py-2 text-[15px] text-[#4A3A37]">No past agreements yet.</p> : null}
      </section>
    </div>
  );
}

function draftDeletable(agreement: AgreementView) {
  return agreement.phase === "draft" && !agreement.sentAt && agreement.questions.length === 0;
}

function DraftDelete({ code, agreement, first }: { code: string; agreement: AgreementView; first: string }) {
  const [confirm, setConfirm] = useState(false);
  if (!draftDeletable(agreement)) return null;
  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className={`h-10 self-start text-sm text-[#9B2C1F] underline ${focusRing}`}>
        Delete
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] bg-[#FBF1EF] px-3.5 py-3">
      <span className="min-w-[220px] flex-1 text-sm">Delete this draft? It was never sent, so {first} won’t notice.</span>
      <form action={deleteAgreementDraftAction}>
                      <input type="hidden" name="code" value={code} />
        <input type="hidden" name="agreementId" value={agreement.id} />
        <button type="submit" className={`${quietButton} h-10 border-[#F0CFC9] bg-white px-4 text-sm text-[#9B2C1F]`}>Delete draft</button>
      </form>
      <button type="button" onClick={() => setConfirm(false)} className={`${quietButton} h-10 bg-white px-4 text-sm`}>Keep</button>
    </div>
  );
}

function FlashNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return <TimedNotice message={message} onDismiss={onClose} />;
}

function WithdrawSent({ code, agreementId }: { code: string; agreementId: string }) {
  return (
    <form action={withdrawAgreementAction}>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="agreementId" value={agreementId} />
      <button type="submit" className={`h-11 px-1 text-sm text-[#6B5A57] underline ${focusRing}`}>
        Withdraw
      </button>
                    </form>
  );
}

function AgreementCard({
  agreement,
  first,
  emphasized = false,
  bare = false,
  action,
  onOpen,
  trailing = null,
}: {
  agreement: AgreementView;
  first: string;
  emphasized?: boolean;
  bare?: boolean;
  action: string;
  onOpen: (id: string) => void;
  trailing?: ReactNode;
}) {
  const style = phaseStyle(agreement.phase, first, agreement.questions.length > 0);
  const body = (
    <>
      <div className="flex min-w-[240px] flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={emphasized ? "text-xl font-semibold" : "text-[17px] font-semibold"}>{agreement.title || "Untitled draft"}</span>
          {agreement.phase === "draft" ? null : <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>{style.label}</span>}
        </div>
        <span className="text-[15px] text-[#4A3A37]">{agreementMeta(agreement)} · {agreementDates(agreement)}</span>
        <span className="text-sm text-[#6B5A57]">{agreementNote(agreement, first)}</span>
      </div>
      {trailing}
      <button type="button" onClick={() => onOpen(agreement.id)} className={action === "View" || action === "Reply" ? inkButton : `${inkButton} h-[42px]`}>
        {action}
      </button>
    </>
  );
  if (bare) return <div className="flex flex-wrap items-center gap-4">{body}</div>;
  return <div className={`flex flex-wrap items-center gap-4 rounded-[22px] border-2 border-ink bg-white px-[22px] py-5 ${emphasized ? "" : ""}`}>{body}</div>;
}

function ReadAgreement({
  agreement,
  first,
  code,
  name,
  canEnd,
  canReplace,
  replaceNeedsNote,
  canSign,
  canAccept,
  confirmEnd,
  onAskEnd,
  onCancelEnd,
  progress,
  replyNotice = "",
  error,
}: {
  agreement: AgreementView;
  first: string;
  code: string;
  name: string;
  canEnd: boolean;
  canReplace: boolean;
  replaceNeedsNote: boolean;
  canSign: boolean;
  canAccept: boolean;
  confirmEnd: boolean;
  onAskEnd: () => void;
  onCancelEnd: () => void;
  progress: { labels: string[] } | null;
  replyNotice?: string;
  error: string;
}) {
  const total = agreement.postTotal;
  const kinds = joinAnd(agreement.posts.map((post) => `${post.count} ${post.type.toLowerCase()}${post.count === 1 ? "" : "s"}`)) || "—";
  const banner =
    agreement.phase === "waiting" && agreement.openQuestion
      ? `${first} asked a question. Reply below.`
      : agreement.phase === "waiting"
      ? `Sent ${agreement.sentAt || "—"}. ${first} hasn’t accepted yet. Nothing changes until that happens.`
      : agreement.phase === "active"
        ? `${first} accepted${agreement.signedAt ? ` on ${agreement.signedAt}` : ""}. It runs ${agreement.effectiveOn} to ${agreement.expiresOn}.`
        : agreement.phase === "expired"
          ? `This ended on ${agreement.expiresOn} as planned.`
          : agreement.phase === "declined"
            ? `${first} declined this agreement.`
              : agreement.phase === "replaced"
              ? `Sent ${agreement.sentAt || "earlier"}. A newer agreement replaced it.`
              : agreement.phase === "draft"
                ? agreement.sentAt
                  ? `Withdrawn after it was sent ${agreement.sentAt}. Edit it, then send it again.`
                  : "This draft is saved. The agreement in progress is the one you can edit."
                : `This was ended early${agreement.endedAt ? ` on ${agreement.endedAt}` : ""}.`;
  const covered = coveredMonths(agreement.effectiveValue, agreement.expiresValue);
  const cuts = cutNotes(agreement.effectiveValue, agreement.expiresValue);
  const postingThisMonth = agreementMonthPeriods(agreement.effectiveValue, agreement.expiresValue).includes(new Date().toISOString().slice(0, 7));
  const labels = progress?.labels ?? [];
  const verified = labels.filter((label) => label === "Verified").length;
  const ready = labels.filter((label) => label === "Ready to publish").length;
  const review = labels.filter((label) => label === "In review").length;
  const checking = labels.filter((label) => label === "Checking the link" || label === "Checking the update").length;
  const changes = labels.filter((label) => label === "Changes requested").length;
  const liveChanges = labels.filter((label) => label === "Live but changes requested").length;
  const fix = labels.filter((label) => label === "Needs a fix").length;
  const stripNote = [
    ready ? `${ready} ready to publish` : "",
    review ? `${review} in review` : "",
    checking ? `${checking} checking the link` : "",
    changes ? `${changes} ${changes === 1 ? "change requested" : "changes requested"}` : "",
    liveChanges ? `${liveChanges} live with changes requested` : "",
    fix ? `${fix} ${fix === 1 ? "needs a fix" : "need a fix"}` : "",
  ].filter(Boolean).join(", ");
  const glance = [
    ["Paid each month", agreement.monthly || "—"],
    ["Posts each month", String(total)],
    ["Where", agreement.platforms.join(", ") || "—"],
    ["What kind", kinds],
    ["Runs", `${agreement.effectiveOn} – ${agreement.expiresOn}`],
    ["Full months", covered.length ? joinAnd(covered) : cuts.length ? "No full month" : "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <span role="alert" className="text-[15px] text-[#9B2C1F]">
          {error}
        </span>
                  ) : null}

      {agreement.questions.length > 0 || replyNotice ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[#6B5A57]">Questions from {first}</span>
          <AgreementQuestions
            questions={agreement.questions}
            asker={first}
            waitingText="No reply yet."
            renderReply={
              agreement.phase === "waiting"
                ? (question) => (
                    <form action={replyAgreementQuestionAction} className="flex flex-col gap-2">
                      <input type="hidden" name="code" value={code} />
                      <input type="hidden" name="questionId" value={question.id} />
                      <label htmlFor={`reply-${question.id}`} className="text-sm font-medium">
                        Your reply
                      </label>
                      <textarea
                        id={`reply-${question.id}`}
                        name="reply"
                        required
                        maxLength={1000}
                        rows={3}
                        className={`w-full rounded-[14px] border border-[#CDBDBA] bg-white px-4 py-3 text-[15px] text-ink ${focusRing}`}
                      />
                      <button type="submit" className={`${inkButton} self-start`}>
                        Send reply
                        </button>
                    </form>
                  )
                : undefined
            }
          />
          {replyNotice ? <TimedNotice message={replyNotice} /> : null}
        </div>
      ) : null}

      <dl>
        {glance.map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 gap-0.5 border-t border-[#F0E8E6] py-2.5 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-4">
            <dt className="text-sm text-[#6B5A57]">{label}</dt>
            <dd className="text-[15px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {cuts.length ? (
        <div className="flex flex-col gap-1">
          {cuts.map((note) => (
            <p key={note} className="text-sm leading-normal text-[#4A3A37]">{note}</p>
          ))}
        </div>
      ) : null}

      {agreement.phase === "active" && total > 0 && postingThisMonth ? (
        <div className="flex flex-col gap-2 border-t border-[#F0E8E6] pt-3">
          <span className="text-sm text-[#6B5A57]">This month</span>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
            {Array.from({ length: total }, (_, index) => {
              const label = labels[index] ?? "Not posted";
              const color = label === "Verified" ? "bg-[#1D6340]" : label === "Ready to publish" ? "bg-[#33130F]" : label === "In review" || label === "Checking the link" || label === "Checking the update" ? "bg-[#E9C98A]" : label === "Needs a fix" || label === "Changes requested" || label === "Live but changes requested" ? "bg-[#9B2C1F]" : "bg-[#E8DEDC]";
              return <span key={index} title={label} className={`h-2 rounded-full ${color}`} />;
            })}
          </div>
          <span className="text-sm text-[#4A3A37]">
            {verified} of {total} posts verified this month{stripNote ? `, ${stripNote}` : ""}. Paid once all {total} for the month are verified.
            {covered.length > 1 ? ` ${joinAnd(covered)} each get their own ${total} posts.` : ""}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-1 border-t border-[#F0E8E6] pt-3">
        <span className="text-sm text-[#6B5A57]">Guidelines</span>
        <span className="whitespace-pre-line text-[15px] leading-relaxed">{agreement.guidelines || "—"}</span>
        <span className="text-sm text-[#6B5A57]">Plus @myleaderhealth in the caption so the post can track, and admin approval on every post. The sponsorship line and tracking link are optional.</span>
      </div>

      <div className="flex flex-col gap-1 border-t border-[#F0E8E6] pt-3">
        <span className="text-sm text-[#6B5A57]">Sponsorship disclosure</span>
        <span className="text-[15px] leading-relaxed">Included in this agreement{agreement.signedAt ? ` and accepted ${agreement.signedAt}` : ""}.</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#F0E8E6] pt-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="rounded bg-[#F3CFCB] px-1.5 py-0.5 text-[11px] font-bold text-[#9B2C1F]">PDF</span>
          <span className="min-w-0 truncate font-medium">{agreement.file ? agreement.fileName : "No PDF stored"}</span>
          {agreement.file ? (
            <a href={`/admin/affiliates/agreement-file?agreement=${encodeURIComponent(agreement.id)}`} target="_blank" rel="noreferrer" className={`text-ink underline ${focusRing}`}>
              Open
            </a>
          ) : null}
        </span>
        <span className="text-[#6B5A57]">Sent {agreement.sentAt || "—"}</span>
        <span className="text-[#6B5A57]">Accepted {agreement.signedAt || "not yet"}</span>
        {agreement.phase === "ended" || agreement.phase === "expired" ? (
          <span className="text-[#6B5A57]">{agreement.phase === "ended" ? "Ended early" : "Ended"} {agreement.phase === "ended" ? agreement.endedAt || "—" : agreement.expiresOn}</span>
                  ) : null}
      </div>

      {canSign ? (
        <form action={signAgreementAction} className="flex flex-col gap-2 border-t border-[#F0E8E6] pt-3">
          <span className="text-sm font-medium">Signed agreement (PDF)</span>
                      <input type="hidden" name="code" value={code} />
          <input type="hidden" name="agreementId" value={agreement.id} />
          <input type="hidden" name="signerName" value={name} />
          <span className="text-sm text-[#4A3A37]">This agreement was sent without a PDF. Attach the signed copy to make it active.</span>
          <input name="file" type="file" accept="application/pdf" required className="text-sm" />
          <button type="submit" className={`${quietButton} self-start`}>
            Store signed PDF
          </button>
        </form>
                      ) : null}

      {draftDeletable(agreement) ? <DraftDelete code={code} agreement={agreement} first={first} /> : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-[#F0E8E6] pt-4">
        <p className="min-w-[240px] flex-1 text-sm leading-normal text-[#4A3A37]">
          {banner}
          {canAccept ? ` If ${first} accepted outside the portal, record it here.` : ""}
        </p>
        {canAccept ? (
          <form action={acceptAgreementAction}>
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="agreementId" value={agreement.id} />
            <button type="submit" className={quietButton}>
              Mark as accepted
                        </button>
                    </form>
                  ) : null}
        {agreement.phase === "waiting" ? <WithdrawSent code={code} agreementId={agreement.id} /> : null}
        {canEnd && !confirmEnd ? (
          <button type="button" onClick={onAskEnd} className="h-11 text-sm text-[#9B2C1F] underline">
            End early
          </button>
        ) : null}
        {canReplace && (agreement.phase === "ended" || agreement.phase === "expired") ? (
          <form action={replaceAgreementAction}>
            <HiddenTerms code={code} draft={draftFrom(agreement.source)} seed={agreement.source} copy />
            {replaceNeedsNote ? <input type="hidden" name="note" value="Replaced with a new agreement." /> : null}
            <button type="submit" className={inkButton}>
              Start a new one like this
            </button>
          </form>
                  ) : null}
                </div>

      {confirmEnd && canEnd ? (
        <form action={endAgreementAction} role="alertdialog" aria-label="End this agreement" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#F0CFC9] bg-[#FBF1EF] px-4 py-3.5">
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="note" value="Ended early by an admin." />
          <span className="flex-[1_1_300px] text-[15px]">End this agreement today? It stops now and can’t be restarted.</span>
          <button type="submit" className={`${inkButton} bg-[#9B2C1F] hover:bg-[#7F2318]`}>
            End agreement
          </button>
          <button type="button" onClick={onCancelEnd} className={quietButton}>
            Keep it
                  </button>
        </form>
      ) : null}
              </div>
  );
}
