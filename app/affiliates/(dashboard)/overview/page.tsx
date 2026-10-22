import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyTrackingLink } from "@/components/affiliate/CopyTrackingLink";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { loadPayoutRecords, paidOutInRange } from "@/lib/affiliate/payouts";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import { AffiliateStoreError, loadAffiliateActivity, type ConversionSummary } from "@/lib/affiliate/store";
import { listPromoCodes, personalPromoForAffiliate } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Range = "30" | "90" | "all";

const ranges: { id: Range; label: string }[] = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
];

const pillClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const badgeClass = "inline-flex max-w-full items-center rounded-full bg-rose px-3 py-1 text-xs font-medium leading-5 text-ink";

function rangeOf(value: string | undefined): Range {
  if (value === "30" || value === "90") return value;
  return "all";
}

function overviewHref(range: Range) {
  return range === "all" ? "/affiliates/overview" : `/affiliates/overview?range=${range}`;
}

function inRange(createdAt: string | null, range: Range) {
  if (range === "all") return true;
  if (!createdAt) return false;
  const days = range === "30" ? 30 : 90;
  return new Date(createdAt).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function formatDay(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function AffiliatePortalOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  const range = rangeOf((await searchParams).range);
  let conversions: ConversionSummary[] = [];
  let clickTimes: string[] = [];
  let paidOutCents = 0;
  let loadError = "";
  try {
    await syncAttributedGenHealthSales();
    const activity = await loadAffiliateActivity(affiliate.code);
    conversions = activity.conversions;
    clickTimes = activity.clickTimes;
    paidOutCents = paidOutInRange(await loadPayoutRecords(affiliate.code), range);
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load your overview.";
  }

  let promosUnavailable = false;
  let personalCode: string | null = null;
  try {
    personalCode = personalPromoForAffiliate(await listPromoCodes(), affiliate.code)?.code ?? null;
  } catch {
    promosUnavailable = true;
  }

  const paid = conversions.filter((conversion) => !conversion.dryRun && inRange(conversion.createdAt, range));
  const salesCents = paid.reduce((sum, conversion) => sum + (conversion.amountCents ?? 0), 0);
  const commissionCents = paid.reduce((sum, conversion) => sum + conversion.commissionCents, 0);
  const unpaidCents = Math.max(0, commissionCents - paidOutCents);
  const clicks = clickTimes.filter((createdAt) => inRange(createdAt, range)).length;
  const recent = [...paid].sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "")).slice(0, 5);
  const commission =
    affiliate.commissionMode === "fixed" ? `${formatCommissionRate(affiliate)} per order` : `${formatCommissionRate(affiliate)} commission`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl">{affiliate.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={badgeClass}>
              <span className="text-brown">Affiliate ID</span>
              <span className="ml-1.5 break-all">{affiliate.code}</span>
            </span>
            <span className={badgeClass}>{commission}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Time range">
          {ranges.map((item) => (
            <Link
              key={item.id}
              href={overviewHref(item.id)}
              aria-current={range === item.id ? "true" : undefined}
              className={`${pillClass} ${range === item.id ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {loadError ? <p className="text-ink">{loadError}</p> : null}

      <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-share-link-title">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="portal-share-link-title" className="text-xl">
            Your code
          </h3>
          <Link href="/affiliates/tracking-link" className="text-sm font-medium text-ink underline underline-offset-4">
            Referral link
          </Link>
        </div>
        {personalCode ? (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-[24px] bg-background py-2 pl-4 pr-2">
            <p className="min-w-0 break-all text-lg text-ink">{personalCode}</p>
            <CopyTrackingLink url={personalCode} label="Copy" quiet accessibleName="Copy code" copiedNotice="Code copied." failedNotice="Couldn't copy the code." />
          </div>
        ) : (
          <p className="mt-3 break-all text-lg text-ink">{promosUnavailable ? "Promo codes are unavailable right now." : "No personal code is assigned yet."}</p>
        )}
        <p className="mt-2 text-sm text-brown">Customers enter this code at checkout. Your promo link and tracking link are on the referral link page.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Sales</h3>
          <p className="mt-2 text-3xl">{formatCents(salesCents)}</p>
          <p className="mt-2 text-sm text-brown">From paid orders</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Paid orders</h3>
          <p className="mt-2 text-3xl">{paid.length}</p>
          <p className="mt-2 text-sm text-brown">Paid orders in this period</p>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <h3 className="text-sm text-brown">Unique visitors</h3>
          <p className="mt-2 text-3xl">{clicks}</p>
          <p className="mt-2 text-sm text-brown">Each person counts once a day</p>
        </section>
      </div>

      <section className="rounded-[28px] bg-white p-6" aria-labelledby="portal-earnings-title">
        <h3 id="portal-earnings-title" className="sr-only">
          Your earnings
        </h3>
        <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-rose/60">
          <div className="sm:pr-8">
            <h4 className="text-sm text-brown">Unpaid earnings</h4>
            <p className="mt-2 text-3xl">{formatCents(unpaidCents)}</p>
            <p className="mt-2 text-sm text-brown">Commission not paid out yet</p>
          </div>
          <div className="mt-6 border-t border-rose/60 pt-6 sm:mt-0 sm:border-0 sm:pt-0 sm:pl-8">
            <h4 className="text-sm text-brown">Total earnings</h4>
            <p className="mt-2 text-3xl">{formatCents(commissionCents)}</p>
            <p className="mt-2 text-sm text-brown">Commission from paid orders</p>
          </div>
        </div>
        <p className="mt-6 border-t border-rose/60 pt-4 text-sm text-brown">
          Unpaid earnings can change if a referred order is refunded. Order details are on the Orders page.
        </p>
      </section>

      <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-6" aria-labelledby="portal-recent-orders-title">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="portal-recent-orders-title" className="text-xl">
              Recent orders
            </h3>
            <Link href="/affiliates/orders" className="text-sm font-medium text-ink underline underline-offset-4">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-6 text-sm text-brown">No paid orders in this period.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rose/60">
              {recent.map((conversion) => (
                <li key={conversion.orderId} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="break-words font-medium">{conversion.productName}</div>
                    <p className="mt-1 text-brown">{formatDay(conversion.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full bg-rose px-3 py-1 text-xs font-medium text-ink">Paid</span>
                    <p className="mt-2 font-medium">{conversion.amountCents == null ? "—" : formatCents(conversion.amountCents)}</p>
                    <p className="text-brown">{formatCents(conversion.commissionCents)} commission</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}
