import type { Metadata } from "next";
import Link from "next/link";
import { accountColumnTotals } from "@/lib/affiliate/account-figures";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";
import { loadDeliverablePayments, type DeliverablePayment } from "@/lib/affiliate/deliverable-payments";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { loadAllWebsitePayouts, loadMarketingEvents } from "@/lib/affiliate/marketing-events";
import { eventPeriod, socialMonthCents, standingViewRateCents, websiteMonthAmount, type PaymentRates } from "@/lib/affiliate/payment-rates";
import { loadPaymentRates } from "@/lib/affiliate/payment-store";
import { currentPayoutPeriod, formatPayoutMonth, payoutLines, previousPayoutPeriod } from "@/lib/affiliate/payouts";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { loadPayoutRecords, type PayoutRecord } from "@/lib/affiliate/payouts";
import { reportHandledAffiliateError } from "@/lib/affiliate/report";
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
import { AccountAgreement } from "@/components/affiliate/AccountAgreement";
import { AccountReports } from "@/components/affiliate/AccountReports";
import { AccountSettings } from "@/components/affiliate/AccountSettings";
import { AccountTracking } from "@/components/affiliate/AccountTracking";
import { loadAffiliateAgreements, type AffiliateAgreement } from "@/lib/affiliate/agreements";
import { agreementEditorState, agreementSeed, presentAgreement } from "@/lib/affiliate/agreement-view";
import { visibleReportSections } from "@/lib/affiliate/marketing";
import { loadMarketingReports, type MarketingReport } from "@/lib/affiliate/marketing-store";
import {
  loadContentSubmissions,
  metricLines,
  refreshDueMetrics,
  type ContentSubmission,
} from "@/lib/affiliate/post-review";
import type { TrackedPostCard } from "@/components/affiliate/TrackedPosts";
import { loadSocialAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";
import { loadWebsiteEvents, websiteReportMonths, type WebsiteOrder, type WebsiteVisit } from "@/lib/affiliate/website-report";
import type { AffiliatePromoDetail } from "@/components/affiliate/AffiliatePromoCodes";
import { listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { AccountActions } from "@/components/affiliate/AccountActions";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";
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

function marketingPayText(rates: PaymentRates | null) {
  const cents = standingViewRateCents(rates);
  const fee = cents == null ? "Not set" : `${formatCents(cents)} per 1,000 views`;
  return LAB_COMMISSIONS_ENABLED ? `${fee}. Lab commission applies to lab orders.` : `${fee}. Lab commission is not active.`;
}

function MonthBlock({
  label,
  social,
  website,
  lab,
}: {
  label: string;
  social: string;
  website: string;
  lab: string;
}) {
  return (
    <div className="rounded-[24px] bg-background px-4 py-5">
      <h3 className="text-lg">{label}</h3>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm leading-6">
        <div>
          <dt className="text-xs text-brown">Social</dt>
          <dd className="mt-1">{social}</dd>
        </div>
        <div>
          <dt className="text-xs text-brown">Website traffic</dt>
          <dd className="mt-1">{website}</dd>
        </div>
        <div>
          <dt className="text-xs text-brown">Lab</dt>
          <dd className="mt-1">{lab}</dd>
        </div>
      </dl>
    </div>
  );
}


function editableAgreement(current: AffiliateAgreement | null, editable: boolean) {
  return editable ? current : null;
}

const complianceNotices: Record<string, string> = {
  flagged: "Flag opened.",
  correction: "Correction requested.",
  resolved: "Flag resolved.",
  accepted: "Disclosure proof accepted.",
  "agreement-saved": "Agreement saved.",
  "agreement-waiting": "Agreement is awaiting a signature.",
  "agreement-signed": "Signed agreement stored.",
  "agreement-ended": "Agreement ended.",
  "agreement-replaced": "A new agreement draft was started. The previous agreement is still on file.",
  "post-approved": "Post approved. The affiliate can paste the Instagram link.",
  "post-change": "Asked for a change.",
  "post-rejected": "Post rejected.",
  "post-checked": "Link marked as checked. Metrics stay blank until Instagram can be read.",
  "counts-updated": "Post numbers updated.",
  fee: "View rate saved.",
};

function trackedCards(posts: ContentSubmission[]): TrackedPostCard[] {
  return posts
    .filter((post) => post.publicationStatus === "tracking_active")
    .map((post) => ({ id: post.id, caption: post.caption, postUrl: post.postUrl, metrics: metricLines(post) }));
}

export default async function AffiliateAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; created?: string; invited?: string; resent?: string; code?: string }>;
}) {
  const query = await searchParams;
  const actor = await adminSessionActor();
  const canInvite = Boolean(actor && adminHasFullAccess(actor));
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const complianceNotice = complianceNotices[query.notice ?? ""] ?? "";
  const created = normalizeAffiliateCode(query.created);
  const requestedCode = normalizeAffiliateCode(query.code);

  let contentRates: PaymentRates | null = null;
  let affiliates: AffiliateSummary[] = [];
  let conversions: ConversionSummary[] = [];
  let clickCounts = new Map<string, number>();
  let loadError = "";
  const unpaidOrders = new Map<string, number>();
  let unpaidOrdersReady = false;
  let payouts: PayoutRecord[] = [];
  let payoutsReady = false;
  try {
    contentRates = await loadPaymentRates();
  } catch {
    contentRates = null;
  }
  try {
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
          reportHandledAffiliateError("[affiliate] total align failed", caught);
        }
      }),
    );
  }

  let marketingReports: MarketingReport[] = [];
  let socialAccounts: SocialAccountView[] = [];
  let websiteVisits: WebsiteVisit[] = [];
  let websiteOrders: WebsiteOrder[] = [];
  let reportsUnavailable = false;
  let agreements: AffiliateAgreement[] = [];
  let agreementsUnavailable = false;
  let contentPosts: ContentSubmission[] = [];
  let deliverablePayments: DeliverablePayment[] = [];
  let marketingEvents: Awaited<ReturnType<typeof loadMarketingEvents>> = [];
  let websiteSnapshots: Awaited<ReturnType<typeof loadAllWebsitePayouts>> = [];
  let postsUnavailable = false;
  let websiteUnavailable = false;
  if (!loadError) {
    try {
      const [saved, connected, website] = await Promise.all([loadMarketingReports(), loadSocialAccounts(), loadWebsiteEvents()]);
      marketingReports = saved;
      socialAccounts = connected;
      websiteVisits = website.visits;
      websiteOrders = website.orders;
    } catch (caught) {
      reportsUnavailable = true;
      reportHandledAffiliateError("[affiliate] marketing report load failed", caught);
    }
    try {
      agreements = await loadAffiliateAgreements();
    } catch (caught) {
      agreementsUnavailable = true;
      reportHandledAffiliateError("[affiliate] agreement load failed", caught);
    }
    try {
      await refreshDueMetrics(undefined, 8);
    } catch (caught) {
      reportHandledAffiliateError("[affiliate] post metrics refresh failed", caught);
    }
    try {
      [contentPosts, deliverablePayments] = await Promise.all([loadContentSubmissions(), loadDeliverablePayments()]);
    } catch (caught) {
      postsUnavailable = true;
      reportHandledAffiliateError("[affiliate] post load failed", caught);
    }
    try {
      [marketingEvents, websiteSnapshots] = await Promise.all([loadMarketingEvents({ all: true }), loadAllWebsitePayouts()]);
    } catch (caught) {
      websiteUnavailable = true;
      reportHandledAffiliateError("[affiliate] website pay load failed", caught);
    }
  }
  const labByCode = new Map<string, number>();
  if (payoutsReady) {
    for (const line of payoutLines({ affiliates, orders: conversions, payouts })) {
      labByCode.set(line.code, (labByCode.get(line.code) ?? 0) + line.earnedCents);
    }
  }
  function payFor(code: string) {
    const posts = contentPosts.filter((post) => post.code === code);
    const payments = deliverablePayments.filter((payment) => payment.code === code);
    const periods = new Set<string>();
    for (const post of posts) {
      const period = eventPeriod(post.publishedAt ?? "");
      if (period) periods.add(period);
    }
    for (const payment of payments) {
      const period = eventPeriod(payment.approvedAt ?? payment.paidAt ?? "");
      if (period) periods.add(period);
    }
    let socialCents = 0;
    for (const period of periods) {
      const month = socialMonthCents({ period, posts, payments });
      socialCents += month.socialCents + month.adjustmentCents;
    }
    const websitePeriods = new Set<string>();
    for (const event of marketingEvents) {
      if (event.code !== code) continue;
      const period = eventPeriod(event.createdAt);
      if (period) websitePeriods.add(period);
    }
    for (const snapshot of websiteSnapshots) {
      if (snapshot.code === code) websitePeriods.add(snapshot.period);
    }
    let websiteCents = 0;
    if (contentRates) {
      for (const period of websitePeriods) {
        const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
        websiteCents += websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents;
      }
    }
    return { socialCents, websiteCents, labCents: labByCode.get(code) ?? 0 };
  }

  function monthPay(code: string, period: string) {
    const posts = contentPosts.filter((post) => post.code === code);
    const payments = deliverablePayments.filter((payment) => payment.code === code);
    const social = socialMonthCents({ period, posts, payments });
    const snapshot = websiteSnapshots.find((row) => row.code === code && row.period === period) ?? null;
    const website = contentRates ? websiteMonthAmount({ events: marketingEvents, code, period, rates: contentRates, snapshot }).amountCents : null;
    const lab = payoutLines({ affiliates, orders: conversions, payouts, period })
      .filter((line) => line.code === code)
      .reduce((sum, line) => sum + line.earnedCents, 0);
    return {
      social: postsUnavailable ? null : social.socialCents + social.adjustmentCents,
      website: websiteUnavailable || !contentRates ? null : website,
      lab: payoutsReady ? lab : null,
    };
  }

  function monthText(cents: number | null) {
    return cents == null ? "—" : formatCents(cents);
  }

  const reportSections = visibleReportSections(marketingReports, socialAccounts);

  function agreementProps(affiliate: AffiliateSummary) {
    const own = agreements.filter((agreement) => agreement.code === affiliate.code);
    const current = own.find((agreement) => agreement.current) ?? null;
    const history = own.filter((agreement) => agreement.id !== current?.id);
    const editor = agreementEditorState(current, history, agreementsUnavailable);
    const leadAgreement = current ?? history[0] ?? null;
    const older = (current ? history : history.slice(1)).map((agreement) => presentAgreement(agreement));
    return {
      name: affiliate.name,
      code: affiliate.code,
      commission: marketingPayText(contentRates),
      unavailable: agreementsUnavailable,
      lead: leadAgreement ? presentAgreement(leadAgreement) : null,
      older,
      seed: agreementSeed(editableAgreement(current, editor.editable)),
      ...editor,
    };
  }

  function settings(affiliate: AffiliateSummary) {
    return (
      <AccountSettings name={affiliate.name}>
        <AccountTracking
          name={affiliate.name}
          code={affiliate.code}
          commission={formatCommissionRate(affiliate)}
          viewRate={marketingPayText(contentRates)}
          cookieDays={cookieDays}
          trackingLink={affiliateTrackingLink(affiliate.code)}
          promos={trackingPromos(affiliate)}
          unavailable={Boolean(promoError)}
        />
        <AccountAgreement {...agreementProps(affiliate)} />
        <AccountReports
          name={affiliate.name}
          code={affiliate.code}
          unavailable={reportsUnavailable}
          months={websiteReportMonths({ code: affiliate.code, visits: websiteVisits, orders: websiteOrders })}
          sections={reportSections.filter((section) => section.code === affiliate.code)}
          tracked={trackedCards(contentPosts.filter((post) => post.code === affiliate.code))}
        />
        <p className="mt-6 border-t border-rose/60 pt-6 text-sm text-brown">{marketingPayText(contentRates)}</p>
        <Link href={`/admin/affiliates/offers?code=${encodeURIComponent(affiliate.code)}`} className="mt-3 inline-flex text-sm font-medium text-ink underline underline-offset-4">
          Monthly plan
        </Link>
        <AccountActions code={affiliate.code} name={affiliate.name} active={affiliate.active} pendingInvite={affiliate.pendingInvite && affiliate.active} canInvite={canInvite} />
      </AccountSettings>
    );
  }

  const selected = requestedCode ? (affiliates.find((affiliate) => affiliate.code === requestedCode) ?? null) : null;
  const currentPeriod = currentPayoutPeriod();
  const priorPeriod = previousPayoutPeriod(currentPeriod);

  return (
    <div className="space-y-6">
      {selected && priorPeriod ? (
        <section aria-labelledby="month-figures-title" className="rounded-[28px] bg-white p-4 sm:p-8">
          <h2 id="month-figures-title" className="text-2xl">
            {selected.name}
          </h2>
          <p className="mt-1 break-all text-sm text-brown">{selected.email}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[priorPeriod, currentPeriod].map((period) => {
              const pay = monthPay(selected.code, period);
              return (
                <MonthBlock
                  key={period}
                  label={formatPayoutMonth(period)}
                  social={monthText(pay.social)}
                  website={monthText(pay.website)}
                  lab={LAB_COMMISSIONS_ENABLED ? monthText(pay.lab) : "Not active"}
                />
              );
            })}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-brown">
            Payouts are usually recorded around the 3rd, after the prior month has closed. These months match the Payouts page. Allotment is still your check of these numbers.
          </p>
        </section>
      ) : null}
      {requestedCode && !selected && !loadError ? (
        <p className="text-ink">That affiliate was not found.</p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {complianceNotice ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          {complianceNotice}
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
          Visits count each person once a day. Paid orders are completed checkouts. Unpaid orders are checkouts that have not been paid. Social, website traffic, and lab are the same amounts as Payouts: content pay, verified link clicks and eligible page views, and lab commission.
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
                        <dt className="text-xs text-brown">Visits</dt>
                        <dd className="mt-1">{stats.visitors}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Paid orders</dt>
                        <dd className="mt-1">{stats.paidOrders}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Unpaid orders</dt>
                        <dd className="mt-1">{stats.unpaidOrders == null ? "—" : stats.unpaidOrders}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Social</dt>
                        <dd className="mt-1">{postsUnavailable ? "—" : money(payFor(affiliate.code).socialCents)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Website traffic</dt>
                        <dd className="mt-1">{websiteUnavailable || !contentRates ? "—" : money(payFor(affiliate.code).websiteCents)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-brown">Lab</dt>
                        <dd className="mt-1">{LAB_COMMISSIONS_ENABLED ? (payoutsReady ? money(payFor(affiliate.code).labCents) : "—") : "Not active"}</dd>
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
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Visits</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Paid orders</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Unpaid orders</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Social</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Website traffic</th>
                    <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Lab</th>
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
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{stats.unpaidOrders == null ? "—" : stats.unpaidOrders}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{postsUnavailable ? "—" : money(payFor(affiliate.code).socialCents)}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{websiteUnavailable || !contentRates ? "—" : money(payFor(affiliate.code).websiteCents)}</td>
                        <td className="whitespace-nowrap px-3 py-5 align-middle">{LAB_COMMISSIONS_ENABLED ? (payoutsReady ? money(payFor(affiliate.code).labCents) : "—") : "Not active"}</td>
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
