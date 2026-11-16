import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AgreementSummary } from "@/components/affiliate/AgreementSummary";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { presentAgreement } from "@/lib/affiliate/agreement-view";
import { loadAffiliateAgreements } from "@/lib/affiliate/agreements";
import { loadDisclosureAcknowledgement } from "@/lib/affiliate/disclosures";
import { formatCents, formatWhen } from "@/lib/affiliate/format";
import { DISCLOSURE_LINE } from "@/lib/affiliate/post-review";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Contracts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliateContractsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  const fee = affiliate.deliverableFeeCents == null ? "Not set" : `${formatCents(affiliate.deliverableFeeCents)} per 1,000 views`;
  const payLabel = LAB_COMMISSIONS_ENABLED ? `${fee}. Lab commission applies to lab orders.` : `${fee}. Lab commission is not active.`;
  let unavailable = false;
  let agreements: ReturnType<typeof presentAgreement>[] = [];
  let disclosure: { acknowledgedAt: string | null } | null = null;
  let disclosureUnavailable = false;
  try {
    agreements = (await loadAffiliateAgreements(affiliate.code)).map((agreement) => presentAgreement(agreement));
  } catch {
    unavailable = true;
  }
  try {
    disclosure = await loadDisclosureAcknowledgement(affiliate.code);
  } catch {
    disclosureUnavailable = true;
  }

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
          I will include a clear sponsorship disclosure on posts and videos I publish for Leader Health, and I will send each new post for review before I publish it, with my tracking link in the caption.
        </p>
        <p className="mt-3 text-sm text-brown">The caption line is “{DISCLOSURE_LINE}.” A link in your bio is not enough.</p>
      </section>
      <section className="rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-contracts-title">
        <h2 id="portal-contracts-title" className="text-2xl">Saved contracts</h2>
        <p className="mt-3 text-sm text-brown">Each contract saved for your account is listed here, newest first. Open the PDF when one is stored.</p>
        {unavailable ? <p className="mt-6 text-sm text-ink">Contracts are unavailable right now.</p> : null}
        {!unavailable && agreements.length === 0 ? <p className="mt-6 text-sm text-brown">No other contract on file.</p> : null}
        {agreements.map((agreement, index) => (
          <div key={agreement.id} className={index === 0 ? "mt-6" : "mt-6 border-t border-rose/60 pt-6"}>
            <h3 className="mb-3 text-lg">{index === 0 ? "Current contract" : "Older contract"}</h3>
            <AgreementSummary
              agreement={agreement}
              commission={payLabel}
              pdfHref={agreement.file ? `/affiliates/agreement-file?agreement=${encodeURIComponent(agreement.id)}` : null}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
