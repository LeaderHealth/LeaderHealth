import type { Metadata } from "next";
import { listSubAdmins } from "@/lib/affiliate/admins";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { loadComplianceEvents } from "@/lib/affiliate/compliance-log";
import { COMPLIANCE_ACTIONS, complianceActionLabel, type ComplianceAction } from "@/lib/affiliate/compliance-rules";
import { formatWhen } from "@/lib/affiliate/format";
import { listAffiliateChoices } from "@/lib/affiliate/marketing-store";
import { adminAccountEmail } from "@/lib/affiliate/session";

export const metadata: Metadata = {
  title: "Compliance records",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function actionOf(value: string | undefined): ComplianceAction | null {
  return COMPLIANCE_ACTIONS.find((action) => action === value) ?? null;
}

function personOf(value: string | undefined) {
  if (!value?.startsWith("affiliate:") && !value?.startsWith("admin:")) return null;
  const id = value.slice(value.indexOf(":") + 1).trim();
  if (!id || id.length > 120) return null;
  if (value.startsWith("affiliate:")) {
    const code = normalizeAffiliateCode(id);
    return code ? { kind: "affiliate" as const, id: code } : null;
  }
  return { kind: "admin" as const, id };
}

export default async function ComplianceRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; action?: string }>;
}) {
  const query = await searchParams;
  const person = personOf(query.who);
  const action = actionOf(query.action);
  let loadError = "";
  let events: Awaited<ReturnType<typeof loadComplianceEvents>> = [];
  let affiliates: { code: string; name: string }[] = [];
  let admins: { id: string; label: string }[] = [];
  const names = new Map<string, string>();
  try {
    const [loaded, choices, team] = await Promise.all([
      loadComplianceEvents({
        code: person?.kind === "affiliate" ? person.id : null,
        actor: person?.kind === "admin" ? person.id : null,
        action,
      }),
      listAffiliateChoices().catch(() => []),
      listSubAdmins().catch(() => []),
    ]);
    events = loaded;
    affiliates = choices;
    const owner = adminAccountEmail();
    admins = [
      ...(owner ? [{ id: owner, label: owner }] : []),
      ...team.map((admin) => {
        const name = admin.name.trim() || admin.email;
        const role = admin.role === "owner" ? "Main admin" : admin.role === "admin" ? "Admin" : "Sub admin";
        return { id: admin.id, label: `${name} · ${role}` };
      }),
    ];
    for (const affiliate of affiliates) names.set(affiliate.code, affiliate.name);
    for (const admin of admins) names.set(admin.id, admin.label);
  } catch {
    loadError = "Compliance records are unavailable right now.";
  }
  const affiliateName = (value: string | null) => (value ? names.get(value) ?? value : "—");
  const actorLabel = (actor: string, code: string | null) => {
    if (code && actor === code) return `Affiliate · ${affiliateName(code)}`;
    const known = names.get(actor);
    if (known && actor !== code) return `Admin · ${known}`;
    if (actor.includes("@")) return `Admin · ${actor}`;
    return actor;
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Compliance records</h2>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Account changes, payment authorizations, marketing reports, disclosure reviews, and correction requests. Records are kept and are not edited.
        </p>
        <form action="/admin/affiliates/records" className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="block text-sm font-medium text-ink">
            Person
            <select name="who" defaultValue={query.who ?? ""} className={fieldClass}>
              <option value="">Everyone</option>
              <optgroup label="Affiliates">
                {affiliates.map((affiliate) => (
                  <option key={affiliate.code} value={`affiliate:${affiliate.code}`}>
                    {affiliate.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Admins">
                {admins.map((admin) => (
                  <option key={admin.id} value={`admin:${admin.id}`}>
                    {admin.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Action
            <select name="action" defaultValue={action ?? ""} className={fieldClass}>
              <option value="">All actions</option>
              {COMPLIANCE_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {complianceActionLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass}>
            Filter
          </button>
        </form>
      </section>
      <section className="min-w-0 rounded-[28px] bg-white" aria-labelledby="compliance-events-title">
        <h2 id="compliance-events-title" className="px-4 pt-4 text-2xl">
          History
        </h2>
        {loadError ? <p className="px-4 py-6 text-sm text-ink">{loadError}</p> : null}
        {!loadError && events.length === 0 ? <p className="px-4 py-6 text-sm text-brown">No records yet.</p> : null}
        {events.length > 0 ? (
          <ul aria-labelledby="compliance-events-title">
            {events.map((event) => (
              <li key={event.id} className="border-t border-ink/10 px-4 py-5 text-sm">
                <p className="font-medium">{complianceActionLabel(event.action)}</p>
                <p className="mt-1 text-brown">{formatWhen(event.createdAt)}</p>
                <p className="mt-3 break-words">{event.detail}</p>
                <dl className="mt-3 grid gap-3 text-brown sm:grid-cols-3">
                  <div>
                    <dt className="text-xs">Affiliate</dt>
                    <dd className="break-words">{affiliateName(event.code)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs">Affiliate ID</dt>
                    <dd className="break-all">{event.code ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs">Actor</dt>
                    <dd className="break-words">{actorLabel(event.actor, event.code)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
