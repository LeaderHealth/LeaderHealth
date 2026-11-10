import type { Metadata } from "next";
import { syncMarketingReportsAction } from "../../compliance-actions";
import { MarketingAccountSections, WebsiteReportSection } from "@/components/affiliate/MarketingSections";
import { visibleReportSections } from "@/lib/affiliate/marketing";
import { listAffiliateChoices, loadMarketingReports, type AffiliateChoice, type MarketingReport } from "@/lib/affiliate/marketing-store";
import { loadSocialAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";
import { loadWebsiteEvents, websiteReportMonths, type WebsiteOrder, type WebsiteVisit } from "@/lib/affiliate/website-report";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Marketing reports",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default async function MarketingReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] ?? "" : "";
  let affiliates: AffiliateChoice[] = [];
  let reports: MarketingReport[] = [];
  let accounts: SocialAccountView[] = [];
  let visits: WebsiteVisit[] = [];
  let orders: WebsiteOrder[] = [];
  let loadError = "";
  try {
    const [choices, saved, connected, website] = await Promise.all([
      listAffiliateChoices(),
      loadMarketingReports(),
      loadSocialAccounts(),
      loadWebsiteEvents(),
    ]);
    affiliates = choices;
    reports = saved;
    accounts = connected;
    visits = website.visits;
    orders = website.orders;
  } catch {
    loadError = "Marketing reports are unavailable right now.";
  }
  const names = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  const sections = visibleReportSections(reports, accounts);
  const groups = new Map<string, typeof sections>();
  for (const section of sections) {
    groups.set(section.code, [...(groups.get(section.code) ?? []), section]);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Marketing reports</h2>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Website visits and promo-code orders are included for every affiliate. Social posts are imported from each connected Facebook Page, Instagram account, and TikTok account when the caption contains that affiliate&apos;s tracking link or the affiliate submitted the post URL. The same post is counted once. These figures do not change commission or payouts.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
            {error}
          </p>
        ) : null}
        {query.notice === "synced" ? (
          <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">
            Reports imported.
          </p>
        ) : null}
        {query.notice === "partial" ? (
          <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">
            Some accounts could not be imported. The accounts that responded are saved.
          </p>
        ) : null}
        {loadError ? <p className="mt-4 text-ink">{loadError}</p> : null}
        {affiliates.length === 0 && !loadError ? <p className="mt-4 text-sm text-brown">Add an affiliate before importing a report.</p> : null}
        {affiliates.length > 0 ? (
          <form action={syncMarketingReportsAction} className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-sm font-medium text-ink">
              Affiliate
              <select name="code" required className={fieldClass} defaultValue={affiliates[0]?.code}>
                {affiliates.map((affiliate) => (
                  <option key={affiliate.code} value={affiliate.code}>
                    {affiliate.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className={buttonClass}>
              Import reports
            </button>
          </form>
        ) : null}
      </section>
      <section className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8" aria-labelledby="saved-reports-title">
        <h2 id="saved-reports-title" className="text-2xl">
          Saved reports
        </h2>
        <p className="pt-2 text-sm text-brown">The website section is separate from each connected social account. Spend is not reported for these organic accounts.</p>
        {affiliates.length === 0 && !loadError ? <p className="mt-4 text-sm text-brown">No affiliates yet.</p> : null}
        {affiliates.map((affiliate) => (
          <div key={affiliate.code} className="mt-8">
            <h3 className="text-xl">{names.get(affiliate.code) ?? affiliate.code}</h3>
            <WebsiteReportSection months={websiteReportMonths({ code: affiliate.code, visits, orders })} />
            <MarketingAccountSections sections={groups.get(affiliate.code) ?? []} />
          </div>
        ))}
      </section>
    </div>
  );
}
