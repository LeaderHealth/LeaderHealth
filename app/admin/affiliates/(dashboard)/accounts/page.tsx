import type { Metadata } from "next";
import { accountColumnTotals } from "@/lib/affiliate/account-figures";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { loadPayoutRecords, type PayoutRecord } from "@/lib/affiliate/payouts";
import { syncAttributedGenHealthSales } from "@/lib/affiliate/sales";
import {
  AffiliateStoreError,
  AFFILIATE_MAX_AGE,
  alignAffiliateRecordTotals,
  loadAffiliateOverview,
  loadClickCounts,
  loadUncommissionedPendingOrders,
  type AffiliateSummary,
  type ConversionSummary,
} from "@/lib/affiliate/store";
import { AccountSettings } from "@/components/affiliate/AccountSettings";
import { AccountTracking } from "@/components/affiliate/AccountTracking";
import type { AffiliatePromoDetail } from "@/components/affiliate/AffiliatePromoCodes";
import { listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { AccountActions } from "@/components/affiliate/AccountActions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Affiliate accounts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function accountStatus(affiliate: AffiliateSummary) {
  if (!affiliate.active) return "Inactive";
  if (affiliate.pendingInvite) return "Invited";
  return "Active";
}

function statusClass(affiliate: AffiliateSummary) {
  return affiliate.active && !affiliate.pendingInvite ? "bg-rose text-ink" : "border border-ink/20 text-brown";
}

function discountText(promo: PromoCodeRow) {
  if (promo.discount.kind === "price") return `Set price ${promo.discount.amount}`;
  return promo.discount.label;
}

function paidEarningsCents(code: string, payouts: PayoutRecord[]) {
  return payouts.reduce((sum, payout) => {
    if (payout.code !== code || payout.status !== "paid" || payout.paidCents == null) return sum;
    return sum + payout.paidCents;
  }, 0);
}

function money(cents: number | null) {
  return cents == null ? "—" : formatCents(cents);
}

function countText(value: number | null) {
  return value == null ? "—" : String(value);
}

export default async function AffiliateAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; invited?: string; resent?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const created = normalizeAffiliateCode(query.created);

  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let clickCounts = new Map<string, number>();
  let loadError = "";
  const unpaidOrders = new Map<string, number>();
  let unpaidOrdersReady = false;
  let payouts: PayoutRecord[] = [];
  let payoutsReady = false;
  try {
    await syncAttributedGenHealthSales();
    const overview = await loadAffiliateOverview();
    affiliates = overview.affiliates;
    conversions = overview.conversions;
    clickCounts = await loadClickCounts();
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load affiliate records.";
  }
  if (!loadError) {
    try {
      const pending = await loadUncommissionedPendingOrders();
      for (const code of pending.values()) unpaidOrders.set(code, (unpaidOrders.get(code) ?? 0) + 1);
      unpaidOrdersReady = true;
    } catch {
      unpaidOrdersReady = false;
    }
    try {
      payouts = await loadPayoutRecords();
      payoutsReady = true;
    } catch {
      payoutsReady = false;
    }
  }

  let catalog: PromoCodeRow[] | null = null;
  let promoError = "";
  try {
    catalog = await listPromoCodes();
  } catch {
    promoError = "Promo codes are unavailable right now.";
  }

  function promosFor(affiliate: AffiliateSummary): AffiliatePromoDetail[] {
    if (!catalog) return [];
    return promoRowsForAffiliate(catalog, affiliate.code).map((promo) => ({
      code: promo.code,
      mode: promo.mode,
      discount: discountText(promo),
      scope: promo.scope,
      usage: promo.usage,
      validUntil: promo.validUntil,
      status: promo.statusLabel,
    }));
  }

  function trackingPromos(affiliate: AffiliateSummary) {
    return promosFor(affiliate).map((promo) => ({
      code: promo.code,
      discount: promo.discount,
      url: affiliateTrackingLink(affiliate.code, promo.code),
    }));
  }

  const cookieDays = AFFILIATE_MAX_AGE / (60 * 60 * 24);

  function figures(affiliate: AffiliateSummary) {
    return accountColumnTotals({
      code: affiliate.code,
      clicks: clickCounts.get(affiliate.code) ?? 0,
      orders: conversions,
      unpaidOrders: unpaidOrdersReady ? (unpaidOrders.get(affiliate.code) ?? 0) : null,
      paidOutCents: payoutsReady ? paidEarningsCents(affiliate.code, payouts) : null,
    });
  }

  if (!loadError) {
    await Promise.all(
      affiliates.map(async (affiliate) => {
        const totals = figures(affiliate);
        try {
          await alignAffiliateRecordTotals(
            affiliate.code,
            {
              clickCount: affiliate.clickCount,
              paidConversionCount: affiliate.paidConversionCount,
              commissionCents: affiliate.commissionCents,
            },
            {
              clickCount: totals.visitors,
              paidConversionCount: totals.paidOrders,
              commissionCents: totals.earnedCents,
            },
          );
        } catch (caught) {
          console.error("[affiliate] total align failed", caught instanceof Error ? caught.message : "unknown");
        }
      }),
    );
  }

  function settings(affiliate: AffiliateSummary) {
    return (
      <AccountSettings name={affiliate.name}>
        <AccountTracking
          name={affiliate.name}
          code={affiliate.code}
          commission={formatCommissionRate(affiliate)}
          cookieDays={cookieDays}
          trackingLink={affiliateTrackingLink(affiliate.code)}
          promos={trackingPromos(affiliate)}
          unavailable={Boolean(promoError)}
        />
        <AccountActions code={affiliate.code} name={affiliate.name} active={affiliate.active} pendingInvite={affiliate.pendingInvite && affiliate.active} />
      </AccountSettings>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {loadError ? <p className="text-ink">{loadError}</p> : null}
      {created && affiliates.some((affiliate) => affiliate.code === created) ? (
        <p role="status" className="break-all rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          Affiliate ID <span className="font-medium">{created}</span>. Tracking link{" "}
          <span className="font-medium">{affiliateTrackingLink(created)}</span>
          {query.invited === "1" ? " An invitation email was sent so they can set a password." : ""}
        </p>
      ) : null}
      {query.resent === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          A new invitation was sent. The previous unused link no longer works.
        </p>
      ) : null}
      <div className="min-w-0 rounded-[28px] bg-white">
        <h2 id="accounts-title" className="px-4 pt-6 text-2xl">
          Accounts
        </h2>
        <p className="px-4 pt-2 text-sm text-brown">
          Unique visitors counts each person once a day. Unpaid orders are checkouts that have not been paid. Unpaid earnings are commission that has not been paid to the affiliate.
        </p>
        {affiliates.length === 0 ? (
          <p className="px-4 py-8 text-sm text-brown">No affiliates yet.</p>
        ) : (
          <>
            <ul className="xl:hidden" aria-labelledby="accounts-title">
              {affiliates.map((affiliate) => {
                const stats = figures(affiliate);
                return (
                  <li key={affiliate.code} className="border-t border-ink/10 px-4 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-ink">{affiliate.name}</div>
                        <div className="mt-0.5 break-all text-xs text-brown">{affiliate.email}</div>
                        <div className="mt-1 break-all text-sm text-brown">{affiliate.code}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass(affiliate)}`}>
                          {accountStatus(affiliate)}
                        </span>
                        {settings(affiliate)}
                      </div>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
                      <div>
                        <dt className="text-xs text-brown">Unique visitors</dt>
                        <dd className="mt-1">{stats.visitors}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Paid orders</dt>
                        <dd className="mt-1">{stats.paidOrders}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Unpaid orders</dt>
                        <dd className="mt-1">{countText(stats.unpaidOrders)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Unpaid earnings</dt>
                        <dd className="mt-1">{money(stats.unpaidEarnings)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Paid earnings</dt>
                        <dd className="mt-1">{money(stats.paidEarnings)}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full border-collapse text-left text-sm leading-6" aria-labelledby="accounts-title">
                <thead className="text-brown">
                  <tr>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">ID</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Name</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">E-mail</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Unique visitors</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Paid orders</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Unpaid orders</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Unpaid earnings</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Paid earnings</th>
                    <th scope="col" className="px-3 py-4 align-bottom">
                      <span className="sr-only">Settings</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => {
                    const stats = figures(affiliate);
                    return (
                      <tr key={affiliate.code} className="border-t border-ink/10">
                        <td className="whitespace-nowrap px-3 py-5 align-middle font-medium">{affiliate.code}</td>
                        <td className="px-3 py-5 align-middle">
                          <div className="font-medium text-ink">{affiliate.name}</div>
                          {accountStatus(affiliate) === "Active" ? null : (
                            <div className="mt-1">
                              <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusClass(affiliate)}`}>
                                {accountStatus(affiliate)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="break-all px-3 py-5 align-middle">{affiliate.email}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{stats.visitors}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{stats.paidOrders}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{countText(stats.unpaidOrders)}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{money(stats.unpaidEarnings)}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{money(stats.paidEarnings)}</td>
                        <td className="px-3 py-5 align-middle">{settings(affiliate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
