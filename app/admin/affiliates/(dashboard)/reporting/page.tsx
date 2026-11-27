import type { Metadata } from "next";
import { TrafficReview } from "@/components/affiliate/TrafficReview";
import { formatPayoutMonth, normalizePayoutPeriod } from "@/lib/affiliate/payouts";
import { loadMarketingEvents, loadTrafficKeeps } from "@/lib/affiliate/marketing-events";
import { listAffiliateChoices } from "@/lib/affiliate/marketing-store";
import { trafficReview } from "@/lib/affiliate/traffic-review";
import { loadWebsiteEvents, websiteReportMonths } from "@/lib/affiliate/website-report";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

export const metadata: Metadata = {
  title: "Website traffic",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shiftMonth(period: string, delta: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function WebsiteTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; notice?: string; code?: string; count?: string; error?: string; review?: string }>;
}) {
  const query = await searchParams;
  const current = new Date().toISOString().slice(0, 7);
  const month = normalizePayoutPeriod(query.month) ?? current;
  const next = shiftMonth(month, 1);
  let loadError = "";
  let review = trafficReview({ period: month, today: new Date().toISOString().slice(0, 10), affiliates: [], events: [], keeps: [] });
  try {
    const [affiliates, events, keeps, website] = await Promise.all([
      listAffiliateChoices(),
      loadMarketingEvents({ period: month }),
      loadTrafficKeeps(month),
      loadWebsiteEvents(),
    ]);
    review = trafficReview({
      period: month,
      today: new Date().toISOString().slice(0, 10),
      affiliates,
      events,
      keeps,
    });
    const promo = new Map(
      affiliates.map((affiliate) => {
        const report = websiteReportMonths({ code: affiliate.code, visits: website.visits, orders: website.orders }).find((item) => item.month === month);
        return [affiliate.code, { promoLink: report?.promoVisits ?? 0, promoOrders: (report?.promoOrders ?? 0) + (report?.promoLinkOrders ?? 0) }] as const;
      }),
    );
    review = {
      ...review,
      rows: review.rows.map((row) => ({ ...row, promoLink: promo.get(row.code)?.promoLink ?? 0, promoOrders: promo.get(row.code)?.promoOrders ?? 0 })),
      totals: {
        ...review.totals,
        promoLink: [...promo.values()].reduce((sum, item) => sum + item.promoLink, 0),
        promoOrders: [...promo.values()].reduce((sum, item) => sum + item.promoOrders, 0),
      },
    };
  } catch {
    loadError = "Website traffic is unavailable right now.";
  }
  const actor = await adminSessionActor();
  const removed = Number(query.count);
  const notice =
    query.notice === "excluded" && Number.isInteger(removed) && removed > 0
      ? `${removed.toLocaleString("en-US")} spike clicks won’t be counted.`
      : query.notice === "kept"
        ? "Spike kept. Those clicks stay in the total."
        : "";

  if (loadError) return <p className="text-ink">{loadError}</p>;
  return (
    <TrafficReview
      month={month}
      monthLabel={formatPayoutMonth(month)}
      previousHref={`/admin/affiliates/reporting?month=${shiftMonth(month, -1)}`}
      nextHref={next <= current ? `/admin/affiliates/reporting?month=${next}` : null}
      canReview={actor != null && adminHasFullAccess(actor)}
      notice={notice}
      error={query.error === "traffic" ? "That change could not be saved." : ""}
      openCode={review.rows.some((row) => row.code === query.review && row.status === "flagged") ? query.review ?? "" : ""}
      steps={review.steps}
      rows={review.rows}
      days={review.days}
      totals={review.totals}
    />
  );
}
