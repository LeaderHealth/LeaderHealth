import type { Metadata } from "next";
import { AssignPromoCode, type AssignableAffiliate } from "@/components/affiliate/AssignPromoCode";
import { AttachedSlugs } from "@/components/affiliate/AttachedSlugs";
import { AffiliateStoreError, loadAffiliateDashboard } from "@/lib/affiliate/store";
import { assignmentNames, listPromoCodes, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Promo codes",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusClass(label: PromoCodeRow["statusLabel"]) {
  if (label === "Active") return "bg-rose text-ink";
  return "border border-ink/30 text-brown";
}

function attachedSlugs(promo: PromoCodeRow, accounts: AssignableAffiliate[]) {
  return promo.affiliates.map((item) => {
    const account = accounts.find((entry) => entry.code.toLowerCase() === item.utmSlug.trim().toLowerCase());
    return { slug: item.utmSlug, name: account?.name ?? "" };
  });
}

function AssignmentStatus({ promo, accounts }: { promo: PromoCodeRow; accounts: AssignableAffiliate[] }) {
  const names = assignmentNames(promo, accounts);
  const assigned = names.length > 0;
  return (
    <div className="mt-3">
      <span
        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
          assigned ? "bg-rose text-ink" : "border border-ink/20 text-brown"
        }`}
      >
        {assigned ? "Assigned" : "Available"}
      </span>
      <AttachedSlugs slugs={attachedSlugs(promo, accounts)} />
    </div>
  );
}

function noticeCode(value: string | undefined) {
  if (!value) return "";
  const code = value.trim();
  if (!code || code.length > 80 || /[\u0000-\u001f]/.test(code)) return "";
  return code;
}

export default async function PromoCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; assigned?: string; removed?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const assigned = noticeCode(query.assigned);
  const removed = noticeCode(query.removed);

  let codes: PromoCodeRow[] = [];
  try {
    codes = await listPromoCodes();
  } catch {
    return (
      <p className="rounded-[28px] bg-white px-8 py-6 text-sm text-ink">Promo codes are unavailable right now.</p>
    );
  }

  let accounts: AssignableAffiliate[] = [];
  let accountsError = "";
  try {
    accounts = (await loadAffiliateDashboard()).affiliates
      .map((affiliate) => ({ code: affiliate.code, name: affiliate.name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch (caught) {
    accountsError = caught instanceof AffiliateStoreError ? caught.message : "Affiliate accounts are unavailable right now.";
  }

  const ordered = [...codes].sort((left, right) => {
    const leftAssigned = left.affiliates.length > 0 ? 0 : 1;
    const rightAssigned = right.affiliates.length > 0 ? 0 : 1;
    if (leftAssigned !== rightAssigned) return leftAssigned - rightAssigned;
    return left.code.localeCompare(right.code);
  });
  const assignedCount = codes.filter((promo) => promo.affiliates.length > 0).length;
  const availableCount = codes.length - assignedCount;

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {assigned ? (
        <p role="status" className="break-all rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          Assigned <span className="font-medium">{assigned}</span>.
        </p>
      ) : null}
      {removed ? (
        <p role="status" className="break-all rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          Removed the assignment from <span className="font-medium">{removed}</span>.
        </p>
      ) : null}
      {accountsError ? <p className="text-ink">{accountsError}</p> : null}
    <div className="min-w-0 rounded-[28px] bg-white">
      <h2 id="promo-codes-title" className="px-4 pt-4 text-2xl">
        Promo codes
      </h2>
      <p className="px-4 pt-2 text-sm text-brown">
        {codes.length === 0
          ? "Promo codes created in Gen Health."
          : `${assignedCount} assigned · ${availableCount} available. Promo codes are created in Gen Health.`}
      </p>
      {codes.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">No promo codes yet.</p>
      ) : (
        <ul className="mt-2 xl:hidden" aria-labelledby="promo-codes-title">
          {ordered.map((promo) => (
            <li key={promo.code} className="border-t border-ink/10 px-4 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-all font-medium">{promo.code}</div>
                  <AssignmentStatus promo={promo} accounts={accounts} />
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusClass(promo.statusLabel)}`}>
                  {promo.statusLabel}
                </span>
              </div>
              {promo.activeInGenHealth ? <p className="mt-2 text-xs text-brown">Active in Gen-Health</p> : null}
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
                <div>
                  <dt className="text-xs text-brown">Mode</dt>
                  <dd className="mt-1">{promo.mode}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Discount</dt>
                  <dd className="mt-1">
                    {promo.discount.kind === "price" ? `Set price ${promo.discount.amount}` : promo.discount.label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Scope</dt>
                  <dd className="mt-1">{promo.scope}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brown">Usage</dt>
                  <dd className="mt-1">{promo.usage}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-brown">Valid until</dt>
                  <dd className="mt-1">{promo.validUntil}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-brown">Assign</dt>
                  <dd className="mt-2">
                    <AssignPromoCode code={promo.code} mode={promo.mode} affiliates={promo.affiliates} accounts={accounts} />
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      {codes.length > 0 ? (
      <table className="mt-4 hidden w-full max-w-full table-fixed border-collapse text-left text-sm leading-6 xl:table" aria-labelledby="promo-codes-title">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[10%]" />
          <col className="w-[11%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="text-brown">
          <tr>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Code</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Mode</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Discount</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Scope</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Usage</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Valid until</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Status</th>
            <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Assign</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((promo) => (
              <tr key={promo.code} className="border-t border-rose/60">
                <td className="px-4 py-5 align-top">
                  <div className="break-all font-medium">{promo.code}</div>
                  <AssignmentStatus promo={promo} accounts={accounts} />
                </td>
                <td className="px-4 py-5 align-top">{promo.mode}</td>
                <td className="break-words px-4 py-5 align-top">
                  {promo.discount.kind === "price" ? (
                    <>
                      <div>Set price</div>
                      <div className="mt-1">{promo.discount.amount}</div>
                    </>
                  ) : (
                    promo.discount.label
                  )}
                </td>
                <td className="break-words px-4 py-5 align-top">{promo.scope}</td>
                <td className="break-words px-4 py-5 align-top">{promo.usage}</td>
                <td className="break-words px-4 py-5 align-top">{promo.validUntil}</td>
                <td className="px-4 py-5 align-top">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusClass(promo.statusLabel)}`}>
                    {promo.statusLabel}
                  </span>
                  {promo.activeInGenHealth ? <div className="mt-2 leading-5 text-brown">Active in Gen-Health</div> : null}
                </td>
                <td className="px-4 py-5 align-top">
                  <AssignPromoCode code={promo.code} mode={promo.mode} affiliates={promo.affiliates} accounts={accounts} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      ) : null}
    </div>
    </div>
  );
}
