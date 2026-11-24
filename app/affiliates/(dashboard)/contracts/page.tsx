import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AgreementQuestions } from "@/components/affiliate/AgreementQuestions";
import { AgreementSummary } from "@/components/affiliate/AgreementSummary";
import { MyAgreement, type MyAgreementCard } from "@/components/affiliate/MyAgreement";
import type { AgreementView } from "@/components/affiliate/agreement-types";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { agreementMonthPeriods } from "@/lib/affiliate/agreement-earnings";
import { affiliateAgreementPlace, presentAgreement } from "@/lib/affiliate/agreement-view";
import { loadAffiliateAgreements, utcAgreementToday } from "@/lib/affiliate/agreements";
import { agreementBoardPeriod, agreementMonthBoard, type AgreementBoardPost } from "@/lib/affiliate/post-agreement";
import { DISCLOSURE_LINE, loadContentSubmissions, type ContentSubmission } from "@/lib/affiliate/post-review";
import { loadDisclosureAcknowledgement } from "@/lib/affiliate/disclosures";
import { formatCents, formatWhen } from "@/lib/affiliate/format";
import { standingViewRateCents } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { memo } from "@/lib/affiliate/memo";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "My agreement",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  question: "Write your question first.",
  accept: "Read the agreement and check the box before accepting.",
  "question-open": "This agreement can’t be accepted until Leader Health replies to your question.",
  status: "That agreement isn’t waiting for your review anymore. Reload to see the latest version.",
  unavailable: "That couldn’t be saved right now. Try again.",
};

export default async function AffiliateContractsPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const error = query.error ? errors[query.error] ?? "" : "";
  const notices: Record<string, string> = {
    asked: "Question sent. Leader Health will reply here.",
    accepted: "You accepted the agreement. You can start creating posts now.",
    declined: "You declined the agreement. Leader Health has been told.",
  };
  const notice = notices[query.notice ?? ""] ?? "";

  const rates = await memo("payment-rates", () => loadPaymentRates()).catch(() => null);
  const viewRate = rates ? standingViewRateCents(rates) : null;
  const fee = viewRate == null ? "Not set" : `${formatCents(viewRate)} per 1,000 views`;
  const payLabel = LAB_COMMISSIONS_ENABLED ? `${fee}. Lab commission applies to lab orders.` : `${fee}. Lab commission is not active.`;
  let unavailable = false;
  let agreements: ReturnType<typeof presentAgreement>[] = [];
  let posts: ContentSubmission[] = [];
  let disclosure: { acknowledgedAt: string | null } | null = null;
  let disclosureUnavailable = false;
  try {
    const [rows, loadedPosts] = await Promise.all([
      memo(`agreements:${affiliate.code}`, () => loadAffiliateAgreements(affiliate.code)),
      memo(`submissions:${affiliate.code}`, () => loadContentSubmissions(affiliate.code)),
    ]);
    agreements = rows.map((agreement) => presentAgreement(agreement));
    posts = loadedPosts;
  } catch {
    unavailable = true;
  }
  try {
    disclosure = await memo(`disclosure:${affiliate.code}`, () => loadDisclosureAcknowledgement(affiliate.code));
  } catch {
    disclosureUnavailable = true;
  }
  const waiting = agreements.filter((agreement) => agreement.phase === "waiting");
  const active = agreements.filter((agreement) => agreement.phase === "active");
  const declined = agreements.filter((agreement) => agreement.phase === "declined");
  const past = agreements.filter((agreement) => agreement.phase === "ended" || agreement.phase === "expired");
  const unaccepted = agreements.filter((agreement) => affiliateAgreementPlace(agreement.phase) === "unaccepted");
  const accepted = agreements.filter((agreement) => affiliateAgreementPlace(agreement.phase) === "accepted");
  const today = utcAgreementToday();

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-disclosure-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="portal-disclosure-title" className="text-2xl">Sponsorship disclosure agreement</h2>
          {!disclosureUnavailable && disclosure ? (
            <p className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Accepted</p>
          ) : null}
          {!disclosureUnavailable && !disclosure ? (
            <p className="inline-flex items-center rounded-full border border-ink/20 px-3 py-1 text-xs font-medium text-ink">Not accepted</p>
          ) : null}
        </div>
        {disclosureUnavailable ? <p className="mt-4 text-sm text-ink">This agreement is unavailable right now.</p> : null}
        {!disclosureUnavailable && disclosure ? (
          <p role="status" className="mt-4 rounded-[20px] bg-background px-4 py-3 text-sm text-ink">
            You accepted this sponsorship disclosure agreement{disclosure.acknowledgedAt ? ` on ${formatWhen(disclosure.acknowledgedAt)}` : ""}.
          </p>
        ) : null}
        {!disclosureUnavailable && !disclosure ? (
          <p className="mt-4 rounded-[20px] bg-background px-4 py-3 text-sm text-ink">
            You have not accepted this yet.{" "}
            <Link href="/affiliates/tracking-link" className="font-medium underline underline-offset-4">
              Accept it on Referral link
            </Link>
          </p>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed">
          I will tag @myleaderhealth in the caption so the post can track, and I will send each new post for review before I publish it. The sponsorship line and my tracking link are optional in the caption.
        </p>
        <p className="mt-3 text-sm text-brown">The optional sponsorship line is “{DISCLOSURE_LINE}.”</p>
      </section>
      <section id="agreements" className="scroll-mt-6 flex flex-col gap-5" aria-labelledby="portal-contracts-title">
        <div className="flex flex-col gap-1.5">
          <h2 id="portal-contracts-title" className="text-[32px] font-medium">My agreement</h2>
          <p className="text-[15px] text-[#4A3A37]">Your monthly content agreement with Leader Health.</p>
        </div>
        {error ? <p role="alert" className="rounded-[14px] bg-[#FBF1EF] px-4 py-3 text-[15px] font-medium text-[#9B2C1F]">{error}</p> : null}
        {notice ? <p role="status" className="rounded-[14px] bg-[#DDF0E4] px-4 py-3 text-[15px] font-medium text-[#1D6340]">{notice}</p> : null}
        {unavailable ? <p className="text-sm text-ink">Agreements are unavailable right now.</p> : null}
        {!unavailable ? (
          <>
            <AgreementGroup
              id="unaccepted-agreements"
              title="Unaccepted"
              description="Sent agreements stay here until they are accepted."
              empty="No agreements waiting for you."
              filled={unaccepted.length > 0}
            >
              {waiting.map((agreement) => <MyAgreement key={agreement.id} card={reviewCard(agreement)} />)}
              {declined.map((agreement) => <MyAgreement key={agreement.id} card={reviewCard(agreement)} />)}
            </AgreementGroup>
            <AgreementGroup
              id="accepted-agreements"
              title="Accepted"
              description="Accepted agreements, including one Leader Health recorded after you accepted outside the portal."
              empty="You haven’t accepted an agreement yet."
              filled={accepted.length > 0}
            >
              {active.map((agreement) => <MyAgreement key={agreement.id} card={activeCard(agreement, posts, today)} />)}
              {past.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h4 className="text-base font-medium">Earlier agreements</h4>
                  {past.map((agreement) => (
                    <details key={agreement.id} className="group rounded-[22px] border border-[#E8DEDC] bg-white p-4 sm:p-5">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                        <span className="font-medium">
                          {agreement.title || "Agreement"} <span className="font-normal text-brown">· {agreement.effectiveOn} – {agreement.expiresOn}</span>
                        </span>
                        <span className="rounded-full bg-[#EFEAE9] px-3 py-1 text-xs font-medium text-[#4A3A37]">{agreement.phase === "ended" ? "Ended early" : "Expired"}</span>
                      </summary>
                      <div className="mt-4">
                        <AgreementSummary agreement={agreement} commission={payLabel} pdfHref={pdfHref(agreement)} />
                      </div>
                      <PastQuestions agreement={agreement} />
                    </details>
                  ))}
                </div>
              ) : null}
            </AgreementGroup>
          </>
        ) : null}
      </section>
    </div>
  );
}

function AgreementGroup({
  id,
  title,
  description,
  empty,
  filled,
  children,
}: {
  id: string;
  title: string;
  description: string;
  empty: string;
  filled: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-[#4A3A37]">{description}</p>
      </div>
      {filled ? children : <p className="rounded-[24px] bg-white p-5 text-[15px] text-[#4A3A37]">{empty}</p>}
    </section>
  );
}

function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function kindWord(type: string, count: number) {
  const lower = type.toLowerCase();
  if (count === 1) return `1 ${lower}`;
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) return `${count} ${lower.slice(0, -1)}ies`;
  return `${count} ${lower}s`;
}

function kindLine(agreement: AgreementView) {
  return joinAnd(agreement.posts.filter((post) => post.count > 0).map((post) => kindWord(post.type, post.count)));
}

function monthName(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return "This month";
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function postTitle(caption: string) {
  const line = caption.split("\n").map((part) => part.trim()).find((part) => part && part.toLowerCase() !== "paid partnership with leader health" && !/^https?:\/\//i.test(part));
  if (!line) return "";
  return line.length > 80 ? `${line.slice(0, 77)}...` : line;
}

function boardPosts(posts: ContentSubmission[]): AgreementBoardPost[] {
  return posts.map((post) => ({
    id: post.id,
    agreementId: post.agreementId,
    contentStatus: post.contentStatus,
    offerId: post.offerId,
    publicationStatus: post.publicationStatus,
    publishedAt: post.publishedAt,
    submittedAt: post.submittedAt,
    postingMonth: post.postingMonth,
    reviewNote: post.reviewNote,
    title: postTitle(post.caption),
  }));
}

function blankCard(agreement: AgreementView, mode: MyAgreementCard["mode"]): MyAgreementCard {
  return {
    mode,
    id: agreement.id,
    title: agreement.title || "Agreement",
    sentAt: agreement.sentAt,
    monthly: agreement.monthly,
    postTotal: agreement.postTotal,
    kindLine: kindLine(agreement),
    where: joinAnd(agreement.platforms),
    runs: agreement.effectiveOn !== "—" && agreement.expiresOn !== "—" ? `${agreement.effectiveOn} – ${agreement.expiresOn}` : "",
    guidelines: agreement.guidelines,
    fileName: agreement.fileName,
    pdfHref: pdfHref(agreement),
    openQuestion: agreement.openQuestion,
    questions: agreement.questions,
    summary: "",
    monthName: "",
    verified: 0,
    payText: "",
    slots: [],
    noMonth: false,
  };
}

function reviewCard(agreement: AgreementView) {
  return blankCard(agreement, agreement.phase === "declined" ? "declined" : "waiting");
}

function activeCard(agreement: AgreementView, posts: ContentSubmission[], today: string): MyAgreementCard {
  const periods = agreementMonthPeriods(agreement.effectiveValue || null, agreement.expiresValue || null);
  const period = agreementBoardPeriod(periods, today);
  const name = monthName(period);
  const slots = period
    ? agreementMonthBoard({ agreementId: agreement.id, postTotal: agreement.postTotal, period, monthLabel: name, posts: boardPosts(posts) })
    : [];
  const verified = slots.filter((slot) => slot.pip === "#1D6340").length;
  const monthly = agreement.monthly || "The monthly amount";
  const card = blankCard(agreement, "active");
  card.summary = [agreement.monthly ? `${agreement.monthly} a month` : "", agreement.postTotal ? `${agreement.postTotal} posts` : "", card.runs, agreement.signedAt ? `accepted ${agreement.signedAt}` : ""].filter(Boolean).join(" · ");
  card.monthName = name;
  card.verified = verified;
  card.slots = slots;
  card.noMonth = !period;
  card.payText = !period
    ? "This agreement has no full month, so the monthly amount is not earned."
    : agreement.postTotal > 0 && verified === agreement.postTotal
      ? `${monthly} for ${name} is approved and will be sent to you manually.`
      : `${name}’s ${monthly} is paid once all ${agreement.postTotal} are verified.`;
  return card;
}

function pdfHref(agreement: AgreementView) {
  return agreement.file ? `/affiliates/agreement-file?agreement=${encodeURIComponent(agreement.id)}` : null;
}

function PastQuestions({ agreement }: { agreement: AgreementView }) {
  if (agreement.questions.length === 0) return null;
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-rose/60 pt-5">
      <h4 className="font-medium">Questions</h4>
      <AgreementQuestions questions={agreement.questions} asker="You" waitingText="Not answered." />
    </div>
  );
}
