import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { listPromoCodes, personalPromoForAffiliate } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Tracking link",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const badgeClass = "inline-flex max-w-full items-center rounded-full bg-rose px-3 py-1 text-xs font-medium leading-5 text-ink";

export default async function TrackingLinkPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  let personalCode: string | null = null;
  let unavailable = false;
  try {
    personalCode = personalPromoForAffiliate(await listPromoCodes(), affiliate.code)?.code ?? null;
  } catch {
    unavailable = true;
  }
  const url = affiliateTrackingLink(affiliate.code);
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
      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Promo code</p>
        <p className="mt-1 text-sm text-brown">The customer enters this code to earn your commission.</p>
        <p className="mt-2 break-all text-lg text-ink">{unavailable ? "Promo codes are unavailable right now." : personalCode ?? "No personal code is assigned yet."}</p>
        {personalCode ? <CopyTrackingLink url={personalCode} label="Copy code" copiedNotice="Code copied." failedNotice="Couldn't copy the code." /> : null}
        <p id="referral-link-label" className="mt-6 text-sm font-medium text-ink">
          Tracking link
        </p>
        <p className="mt-1 text-sm text-brown">Optional. Customers can open this link instead of typing the code.</p>
        <p id="referral-link" aria-labelledby="referral-link-label" className="mt-2 break-all rounded-[24px] bg-background px-4 py-3 text-sm leading-6 text-ink">
          {url}
        </p>
        <CopyTrackingLink url={url} />
      </div>
    </div>
  );
}
