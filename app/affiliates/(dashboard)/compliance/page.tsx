import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { replyToComplianceFlagAction } from "../../compliance-actions";
import { loadComplianceFlags } from "@/lib/affiliate/compliance-flags";
import { flagReasonLabel } from "@/lib/affiliate/compliance-rules";
import { formatWhen } from "@/lib/affiliate/format";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Compliance",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-background px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const errors: Record<string, string> = {
  reply: "Write a reply to the correction request.",
  unavailable: "Compliance notes are unavailable right now.",
};

export default async function AffiliateCompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const error = query.error ? errors[query.error] ?? "" : "";
  let loadError = "";
  let flags: Awaited<ReturnType<typeof loadComplianceFlags>> = [];
  try {
    flags = await loadComplianceFlags(affiliate.code);
  } catch {
    loadError = "Compliance notes are unavailable right now.";
  }
  const visible = flags.filter((flag) => flag.status !== "open");

  return (
    <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8" aria-labelledby="affiliate-compliance-title">
      <h2 id="affiliate-compliance-title" className="text-2xl">
        Compliance
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-brown">Correction requests from Leader Health. A reply does not change your earnings.</p>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {query.notice === "replied" ? (
        <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">
          Reply sent.
        </p>
      ) : null}
      {loadError ? <p className="mt-4 text-ink">{loadError}</p> : null}
      {!loadError && visible.length === 0 ? <p className="mt-6 text-sm text-brown">No correction requests.</p> : null}
      <ul className="mt-4 divide-y divide-rose/60">
        {visible.map((flag) => (
          <li key={flag.id} className="py-5 text-sm">
            <p className="font-medium">{flagReasonLabel(flag.reason)}</p>
            <p className="mt-1 text-brown">{formatWhen(flag.createdAt)}</p>
            <p className="mt-3 break-words">{flag.note}</p>
            {flag.reply ? <p className="mt-3 break-words">Your reply: {flag.reply}</p> : null}
            {flag.status === "correction_requested" && !flag.reply ? (
              <form action={replyToComplianceFlagAction} className="mt-4">
                <input type="hidden" name="id" value={flag.id} />
                <label className="block text-sm font-medium text-ink">
                  Reply
                  <textarea name="reply" required rows={3} className={fieldClass} />
                </label>
                <button type="submit" className={`${buttonClass} mt-4`}>
                  Send reply
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
