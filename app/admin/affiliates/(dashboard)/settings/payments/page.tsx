import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentRatesPanel, type MonthlyRateRow } from "@/components/affiliate/PaymentRatesPanel";
import { loadAffiliateAgreements } from "@/lib/affiliate/agreements";
import { presentAgreement } from "@/lib/affiliate/agreement-view";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
import { loadAffiliateOverview } from "@/lib/affiliate/store";

export const metadata: Metadata = {
  title: "Payment rates",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PaymentRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const actor = await adminSessionActor();
  if (!actor || !adminHasFullAccess(actor)) redirect("/admin/affiliates/overview");
  const query = await searchParams;
  const rates = await loadPaymentRates();
  const error = query.error === "rate" ? "Enter each rate as dollars and cents." : query.error === "unavailable" ? "Payment rates could not be saved." : "";

  let monthlyRates: MonthlyRateRow[] | null = null;
  try {
    const [agreements, overview] = await Promise.all([loadAffiliateAgreements(), loadAffiliateOverview()]);
    const names = new Map(overview.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
    monthlyRates = agreements
      .filter((agreement) => agreement.current && agreement.monthlyCents != null)
      .map((agreement) => ({ agreement, view: presentAgreement(agreement) }))
      .filter(({ view }) => view.phase === "active")
      .map(({ agreement, view }) => ({
        code: agreement.code,
        name: names.get(agreement.code) ?? agreement.code,
        monthly: view.monthly,
        postTotal: view.postTotal,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    monthlyRates = null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl">Payment rates</h2>
        <p className="mt-2 text-sm text-taupe">Set a rate to 0 to stop paying for a part.</p>
      </div>
      <PaymentRatesPanel
        initial={{
          views: rates.views.rateCents,
          engagements: rates.engagements.rateCents,
          clicks: rates.clicks.rateCents,
          pageViews: rates.pageViews.rateCents,
        }}
        monthlyRates={monthlyRates}
        error={error}
      />
    </div>
  );
}
