import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCommissionRate } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { campaignForAffiliateCode } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Tracking link",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-w-0 min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function TrackingLinkPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  return (
    <div className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      <h2 className="text-2xl">{affiliate.name}</h2>
      <p className="mt-2 text-brown">
        Code {affiliate.code} ·{" "}
        {affiliate.commissionMode === "fixed"
          ? `${formatCommissionRate(affiliate)} per order`
          : `${formatCommissionRate(affiliate)} commission`}
      </p>
      <label className="mt-6 block text-sm font-medium text-ink" htmlFor="referral-link">
        Tracking link
        <input
          id="referral-link"
          readOnly
          value={affiliateTrackingLink(affiliate.code, await campaignForAffiliateCode(affiliate.code))}
          className={fieldClass}
        />
      </label>
    </div>
  );
}
