import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { acknowledgeDisclosureAction } from "../../compliance-actions";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { EligibleProducts } from "@/components/affiliate/EligibleProducts";
import { eligibleProductGroups } from "@/lib/affiliate/eligibleProducts";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { listPromoCodes, personalPromoForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Referral link",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const badgeClass = "inline-flex max-w-full items-center rounded-full bg-rose px-3 py-1 text-xs font-medium leading-5 text-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const linkErrors: Record<string, string> = {
  acknowledge: "Confirm the sponsorship disclosure before continuing.",
  unavailable: "That could not be saved right now.",
};

export default async function TrackingLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const acknowledged = await disclosureAcknowledged(affiliate.code).catch(() => false);
  const error = query.error ? linkErrors[query.error] ?? "" : "";
  let personal: PromoCodeRow | null = null;
  let unavailable = false;
  try {
    personal = personalPromoForAffiliate(await listPromoCodes(), affiliate.code);
  } catch {
    unavailable = true;
  }
  const personalCode = personal?.code ?? null;
  const products = personal ? await eligibleProductGroups(personal.productIds) : [];
  const url = affiliateTrackingLink(affiliate.code);
  const promoUrl = personalCode ? affiliateTrackingLink(affiliate.code, personalCode) : null;
  const commission =
    affiliate.commissionMode === "fixed" ? `${formatCommissionRate(affiliate)} per order` : `${formatCommissionRate(affiliate)} commission`;

  return (
    <div className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      <h2 className="text-2xl">{affiliate.name}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={badgeClass}>
          <span className="shrink-0 text-brown">Affiliate ID</span>
          <span className="ml-1.5 min-w-0 break-all">{affiliate.code}</span>
        </span>
        <span className={badgeClass}>{commission}</span>
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {query.notice === "acknowledged" ? (
        <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">
          Disclosure acknowledged.
        </p>
      ) : null}
      {acknowledged ? null : (
        <form action={acknowledgeDisclosureAction} className="mt-6 border-t border-rose/70 pt-6">
          <h3 className="text-lg">Sponsorship agreement</h3>
          <p className="mt-2 max-w-2xl text-sm text-brown">
            Posts stays closed until you accept this. Then send each new post, including reels, for review before you publish it. Put “Paid partnership with Leader Health” and your tracking link in the caption. A link in your bio is not enough.
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm text-ink">
            <input name="acknowledge" type="checkbox" required className="mt-1 size-4 accent-ink" />
            <span>I will include a clear sponsorship disclosure on posts and videos I publish for Leader Health, and I will send each new post for review before I publish it, with my tracking link in the caption.</span>
          </label>
          <button type="submit" className={`${buttonClass} mt-4`}>
            Acknowledge
          </button>
        </form>
      )}
      {acknowledged ? (
      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Your code</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {personalCode ? (
            <div className="inline-flex max-w-full items-center gap-2 rounded-[24px] bg-background py-2 pl-4 pr-2">
              <p className="min-w-0 break-all text-lg text-ink">{personalCode}</p>
              <CopyTrackingLink url={personalCode} label="Copy" quiet accessibleName="Copy code" copiedNotice="Code copied." failedNotice="Couldn't copy the code." />
            </div>
          ) : (
            <p className="break-all text-lg text-ink">{unavailable ? "Promo codes are unavailable right now." : "No personal code is assigned yet."}</p>
          )}
          {personal ? <EligibleProducts code={personal.code} products={products} /> : null}
        </div>
        {personal && promoUrl ? (
          <>
            <p className="mt-6 text-sm font-medium text-ink">Promo link</p>
            <div className="mt-3 flex items-center gap-2 rounded-[24px] bg-background py-2 pl-4 pr-2">
              <p className="min-w-0 flex-1 break-all text-sm leading-6 text-ink">{promoUrl}</p>
              <CopyTrackingLink url={promoUrl} label="Copy" quiet accessibleName="Copy promo link" copiedNotice="Promo link copied." failedNotice="Couldn't copy the promo link." />
            </div>
            <p className="mt-2 text-sm text-brown">Opening it fills the promo field with your code. The discount applies only to products the code covers.</p>
          </>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p id="referral-link-label" className="text-sm font-medium text-ink">
            Tracking link
          </p>
          <span className="inline-flex items-center rounded-full border border-ink/30 px-2.5 py-0.5 text-xs font-medium text-brown">Optional</span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[24px] bg-background py-2 pl-4 pr-2">
          <p id="referral-link" aria-labelledby="referral-link-label" className="min-w-0 flex-1 break-all text-sm leading-6 text-ink">
            {url}
          </p>
          <CopyTrackingLink url={url} label="Copy" quiet accessibleName="Copy link" />
        </div>
        <p className="mt-2 text-sm text-brown">Stores the visitor for 30 days.</p>
        <p className="mt-4 border-t border-rose/70 pt-4 text-sm text-brown">One paid order pays commission once, even if the customer uses your code and a link.</p>
      </div>
      ) : null}
    </div>
  );
}
