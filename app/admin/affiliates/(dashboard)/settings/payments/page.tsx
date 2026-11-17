import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentRatesPanel } from "@/components/affiliate/PaymentRatesPanel";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

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
        error={error}
      />
    </div>
  );
}
