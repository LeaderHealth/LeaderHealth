import type { Metadata } from "next";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { AffiliateStoreError, loadAffiliateDashboard, type AffiliateSummary } from "@/lib/affiliate/store";
import { listPromoCodes, promoCodesForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { AccountActions } from "@/components/affiliate/AccountActions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Affiliate accounts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function PromoCodes({ codes, unavailable }: { codes: string[]; unavailable: boolean }) {
  if (unavailable) return <span className="text-brown">Unavailable</span>;
  if (codes.length === 0) return <span className="text-brown">None</span>;
  return (
    <div>
      {codes.map((code) => (
        <div key={code}>{code}</div>
      ))}
    </div>
  );
}

export default async function AffiliateAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const created = normalizeAffiliateCode(query.created);

  let affiliates: AffiliateSummary[] = [];
  let loadError = "";
  try {
    affiliates = (await loadAffiliateDashboard()).affiliates;
  } catch (caught) {
    loadError = caught instanceof AffiliateStoreError ? caught.message : "Could not load affiliate records.";
  }

  let catalog: PromoCodeRow[] | null = null;
  let promoError = "";
  try {
    catalog = await listPromoCodes();
  } catch {
    promoError = "Promo codes are unavailable right now.";
  }

  function codesFor(affiliate: AffiliateSummary) {
    return catalog ? promoCodesForAffiliate(catalog, affiliate.code) : [];
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
        </p>
      ) : null}
      <div className="min-w-0 rounded-[28px] bg-white">
        <h2 id="accounts-title" className="px-4 pt-6 text-2xl">
          Accounts
        </h2>
        {affiliates.length === 0 ? (
          <p className="px-4 py-8 text-sm text-brown">No affiliates yet.</p>
        ) : (
          <>
            <ul className="xl:hidden" aria-labelledby="accounts-title">
              {affiliates.map((affiliate) => (
                <li key={affiliate.code} className="border-t border-ink/10 px-4 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{affiliate.name}</div>
                      <div className="mt-0.5 break-all text-xs text-brown">{affiliate.email}</div>
                      <div className="mt-1 break-all text-sm text-brown">{affiliate.code}</div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ${
                        affiliate.active ? "bg-rose text-ink" : "border border-ink/20 text-brown"
                      }`}
                    >
                      {affiliate.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
                    <div>
                      <dt className="text-xs text-brown">Commission rate</dt>
                      <dd className="mt-1">{formatCommissionRate(affiliate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Clicks</dt>
                      <dd className="mt-1">{affiliate.clickCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Paid orders</dt>
                      <dd className="mt-1">{affiliate.paidConversionCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-brown">Commission</dt>
                      <dd className="mt-1">{formatCents(affiliate.commissionCents)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-brown">Promo code</dt>
                      <dd className="mt-1 break-all">
                        <PromoCodes codes={codesFor(affiliate)} unavailable={Boolean(promoError)} />
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4">
                    <AccountActions code={affiliate.code} name={affiliate.name} active={affiliate.active} />
                  </div>
                </li>
              ))}
            </ul>
            <table className="hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="accounts-title">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[21%]" />
                <col className="w-[7%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="text-brown">
                <tr>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">ID</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Name</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Promo code</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Commission rate</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Clicks</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Paid orders</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Commission</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Status</th>
                  <th scope="col" className="px-3 py-4 align-bottom font-medium leading-snug">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.code} className="border-t border-ink/10">
                    <td className="whitespace-nowrap px-3 py-5 align-middle font-medium">{affiliate.code}</td>
                    <td className="px-3 py-5 align-middle">
                      <div className="whitespace-nowrap font-medium text-ink">{affiliate.name}</div>
                      <div className="mt-1 whitespace-nowrap text-xs leading-5 text-brown">{affiliate.email}</div>
                    </td>
                    <td className="break-words px-3 py-5 align-middle">
                      <PromoCodes codes={codesFor(affiliate)} unavailable={Boolean(promoError)} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 align-middle">{formatCommissionRate(affiliate)}</td>
                    <td className="px-3 py-5 align-middle">{affiliate.clickCount}</td>
                    <td className="px-3 py-5 align-middle">{affiliate.paidConversionCount}</td>
                    <td className="px-3 py-5 align-middle">{formatCents(affiliate.commissionCents)}</td>
                    <td className="px-3 py-5 align-middle">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          affiliate.active ? "bg-rose text-ink" : "border border-ink/20 text-brown"
                        }`}
                      >
                        {affiliate.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-5 align-middle">
                      <AccountActions layout="stack" code={affiliate.code} name={affiliate.name} active={affiliate.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
