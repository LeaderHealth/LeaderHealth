import { disconnectSocialAction } from "@/app/affiliates/social-actions";
import { formatReportMonth, networkLabel, reportMetricsBlank, type SocialNetwork } from "@/lib/affiliate/marketing";
import type { SocialAccountView } from "@/lib/affiliate/social-store";
import type { WebsiteMonthReport } from "@/lib/affiliate/website-report";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SocialConnections({
  metaReady,
  tiktokReady,
  accounts,
}: {
  metaReady: boolean;
  tiktokReady: boolean;
  accounts: SocialAccountView[];
}) {
  const facebook = accounts.filter((account) => account.network === "facebook");
  const instagram = accounts.filter((account) => account.network === "instagram");
  const tiktok = accounts.filter((account) => account.network === "tiktok");

  return (
    <div className="grid gap-4">
      <NetworkRow
        network="facebook"
        ready={metaReady}
        accounts={facebook}
        connectHref="/api/affiliate/social/meta/start"
        unsetLabel="Facebook reporting is not set up."
      />
      <div className="rounded-2xl bg-background px-4 py-4">
        <p className="text-sm font-medium">Instagram</p>
        {instagram.length > 0 ? (
          <p className="mt-2 text-sm text-brown">{instagram.map((account) => account.accountName).join(", ")}</p>
        ) : (
          <p className="mt-2 text-sm text-brown">
            {metaReady
              ? "A professional Instagram account is included when it is connected to the Facebook Page. Disconnecting Facebook removes it."
              : "Instagram reporting is not set up."}
          </p>
        )}
      </div>
      <NetworkRow
        network="tiktok"
        ready={tiktokReady}
        accounts={tiktok}
        connectHref="/api/affiliate/social/tiktok/start"
        unsetLabel="TikTok reporting is not set up."
      />
    </div>
  );
}

function NetworkRow({
  network,
  ready,
  accounts,
  connectHref,
  unsetLabel,
}: {
  network: "facebook" | "tiktok";
  ready: boolean;
  accounts: SocialAccountView[];
  connectHref: string;
  unsetLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-background px-4 py-4">
      <p className="text-sm font-medium">{networkLabel(network)}</p>
      {accounts.length > 0 ? <p className="mt-2 text-sm text-brown">{accounts.map((account) => account.accountName).join(", ")}</p> : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {ready ? (
          <a href={connectHref} className={buttonClass}>
            Connect {networkLabel(network)}
          </a>
        ) : accounts.length === 0 ? (
          <button type="button" disabled className={`${buttonClass} cursor-not-allowed opacity-70`}>
            {unsetLabel}
          </button>
        ) : null}
        {accounts.length > 0 ? (
          <form action={disconnectSocialAction}>
            <input type="hidden" name="network" value={network} />
            <button type="submit" className={quietClass}>
              Disconnect {networkLabel(network)}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function WebsiteReportSection({ months }: { months: WebsiteMonthReport[] }) {
  return (
    <section className="mt-4 border-t border-rose/60 pt-4">
      <h3 className="text-lg">Website</h3>
      <p className="mt-1 text-sm text-brown">Visits come from tracking links. A promo code is counted when the link carries that code, or when a paid order uses it.</p>
      <ul className="mt-3 divide-y divide-rose/60">
        {months.map((month) => (
          <li key={month.month} className="py-4 text-sm">
            <p className="font-medium">{formatReportMonth(month.month)}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="Tracking link visits" value={month.trackingVisits} />
              <Metric label="Tracking link orders" value={month.trackingOrders} />
              <Metric label="Promo link visits" value={month.promoVisits} />
              <Metric label="Promo code orders" value={month.promoOrders} />
            </dl>
            {month.promos.length === 0 ? <p className="mt-3 text-brown">No promo code was used.</p> : null}
            {month.promos.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {month.promos.map((promo) => (
                  <li key={promo.code} className="text-brown">
                    <span className="font-medium text-ink">{promo.code}</span>
                    {` · ${count(promo.visits)} visits · ${count(promo.orders)} paid orders`}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function count(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function MarketingAccountSections({
  sections,
}: {
  sections: {
    network: SocialNetwork;
    accountId: string;
    accountName: string;
    months: {
      month: string;
      impressions: number;
      reach: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
    }[];
  }[];
}) {
  if (sections.length === 0) return <p className="mt-4 text-sm text-brown">No connected social account yet.</p>;
  return (
    <div className="mt-4 space-y-6">
      {sections.map((section) => (
        <section key={`${section.network}-${section.accountId}`} className="border-t border-rose/60 pt-4">
          <h3 className="text-lg">
            {networkLabel(section.network)} · {section.accountName}
          </h3>
          <ul className="mt-3 divide-y divide-rose/60">
            {section.months.map((month) => {
              const blank = reportMetricsBlank(month);
              return (
                <li key={month.month} className="py-4 text-sm">
                  <p className="font-medium">{formatReportMonth(month.month)}</p>
                  {blank ? (
                    <p className="mt-2 text-brown">The post must contain the tracking link, or its URL must be submitted.</p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Metric label="Impressions" value={month.impressions} />
                    <Metric label="Reach" value={month.reach} />
                    <Metric label="Likes" value={month.likes} />
                    <Metric label="Comments" value={month.comments} />
                    <Metric label="Shares" value={month.shares} />
                    <Metric label="Saves" value={month.saves} />
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-brown">{label}</dt>
      <dd className="mt-1">{count(value)}</dd>
    </div>
  );
}
