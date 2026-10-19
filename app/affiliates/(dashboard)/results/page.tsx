import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/affiliate/format";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Affiliate results",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliateResultsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[28px] bg-white p-6">
        <dt className="text-sm text-brown">Clicks</dt>
        <dd className="mt-2 text-3xl">{affiliate.clickCount}</dd>
      </div>
      <div className="rounded-[28px] bg-white p-6">
        <dt className="text-sm text-brown">Paid orders</dt>
        <dd className="mt-2 text-3xl">{affiliate.paidConversionCount}</dd>
      </div>
      <div className="rounded-[28px] bg-white p-6">
        <dt className="text-sm text-brown">Commission</dt>
        <dd className="mt-2 text-3xl">{formatCents(affiliate.commissionCents)}</dd>
      </div>
    </dl>
  );
}
