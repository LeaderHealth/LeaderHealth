import type { Metadata } from "next";
import {
  acceptDisclosureProofAction,
  openComplianceFlagAction,
  requestFlagCorrectionAction,
  requestProofCorrectionAction,
  resolveComplianceFlagAction,
} from "../../compliance-actions";
import { loadComplianceFlags, type ComplianceFlag } from "@/lib/affiliate/compliance-flags";
import { FLAG_REASONS, flagReasonLabel, flagStatusLabel } from "@/lib/affiliate/compliance-rules";
import { loadDisclosureProofs, type DisclosureProof } from "@/lib/affiliate/disclosures";
import { formatWhen } from "@/lib/affiliate/format";
import { listAffiliateChoices, type AffiliateChoice } from "@/lib/affiliate/marketing-store";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Compliance",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const notices: Record<string, string> = {
  flagged: "Flag opened.",
  correction: "Correction requested.",
  resolved: "Flag resolved.",
  accepted: "Disclosure proof accepted.",
};

export default async function AdminCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  const notice = notices[query.notice ?? ""] ?? "";
  let loadError = "";
  let affiliates: AffiliateChoice[] = [];
  let flags: ComplianceFlag[] = [];
  let proofs: DisclosureProof[] = [];
  try {
    [affiliates, flags, proofs] = await Promise.all([listAffiliateChoices(), loadComplianceFlags(), loadDisclosureProofs()]);
  } catch {
    loadError = "Compliance tools are unavailable right now.";
  }
  const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          {notice}
        </p>
      ) : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Flag content</h2>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Flag a missing sponsorship disclosure, a misleading medical claim, or unauthorized promotional content. Request a correction when the affiliate should respond.
        </p>
        {affiliates.length > 0 ? (
          <form action={openComplianceFlagAction} className="mt-6 grid gap-4">
            <label className="block text-sm font-medium text-ink">
              Affiliate
              <select name="code" required className={fieldClass} defaultValue={affiliates[0]?.code}>
                {affiliates.map((affiliate) => (
                  <option key={affiliate.code} value={affiliate.code}>
                    {affiliate.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              Reason
              <select name="reason" required className={fieldClass} defaultValue="missing_disclosure">
                {FLAG_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {flagReasonLabel(reason)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              Note
              <textarea name="note" required rows={3} className={fieldClass} />
            </label>
            <div>
              <button type="submit" className={buttonClass}>
                Open flag
              </button>
            </div>
          </form>
        ) : null}
      </section>
      <section className="rounded-[28px] bg-white p-4 sm:p-8" aria-labelledby="open-flags-title">
        <h2 id="open-flags-title" className="text-2xl">
          Flags
        </h2>
        {flags.length === 0 ? <p className="mt-4 text-sm text-brown">No flags yet.</p> : null}
        <ul className="mt-4 divide-y divide-rose/60" aria-labelledby="open-flags-title">
          {flags.map((flag) => (
            <li key={flag.id} id={flag.id} className="py-5 text-sm">
              <p className="font-medium">{flagReasonLabel(flag.reason)}</p>
              <p className="mt-1 text-brown">
                {names.get(flag.code) ?? flag.code} · {flagStatusLabel(flag.status)} · {formatWhen(flag.createdAt)}
              </p>
              <p className="mt-3 break-words">{flag.note}</p>
              {flag.reply ? <p className="mt-3 break-words">Reply: {flag.reply}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {flag.status === "open" ? (
                  <form action={requestFlagCorrectionAction}>
                    <input type="hidden" name="id" value={flag.id} />
                    <button type="submit" className={quietButtonClass}>
                      Request correction
                    </button>
                  </form>
                ) : null}
                {flag.status !== "resolved" ? (
                  <form action={resolveComplianceFlagAction}>
                    <input type="hidden" name="id" value={flag.id} />
                    <button type="submit" className={quietButtonClass}>
                      Resolve
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-[28px] bg-white p-4 sm:p-8" aria-labelledby="disclosure-proofs-title">
        <h2 id="disclosure-proofs-title" className="text-2xl">
          Disclosure proof
        </h2>
        {proofs.length === 0 ? <p className="mt-4 text-sm text-brown">No proof submitted yet.</p> : null}
        <ul className="mt-4 divide-y divide-rose/60">
          {proofs.map((proof) => (
            <li key={proof.id} className="py-5 text-sm">
              <p className="font-medium">{names.get(proof.code) ?? proof.code}</p>
              <p className="mt-1 text-brown">
                {proof.status === "accepted" ? "Accepted" : "Submitted"} · {formatWhen(proof.submittedAt)}
              </p>
              {proof.postUrl ? (
                <p className="mt-3 break-all">
                  <a href={proof.postUrl} className="underline underline-offset-4">
                    {proof.postUrl}
                  </a>
                </p>
              ) : null}
              {proof.screenshotPath ? (
                <p className="mt-3">
                  <a href={`/admin/affiliates/disclosure-file?proof=${encodeURIComponent(proof.id)}`} className="underline underline-offset-4">
                    View screenshot
                  </a>
                </p>
              ) : null}
              {proof.status !== "accepted" ? (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <form action={acceptDisclosureProofAction}>
                    <input type="hidden" name="id" value={proof.id} />
                    <button type="submit" className={buttonClass}>
                      Accept proof
                    </button>
                  </form>
                  <form action={requestProofCorrectionAction} className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                    <input type="hidden" name="code" value={proof.code} />
                    <label className="min-w-48 flex-1 text-sm font-medium text-ink">
                      Correction note
                      <input name="note" required defaultValue="Add a clear sponsorship disclosure where viewers will see it." className={fieldClass} />
                    </label>
                    <button type="submit" className={quietButtonClass}>
                      Request correction
                    </button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
