import type { Metadata } from "next";
import Link from "next/link";
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

const PAGE_SIZE = 10;

const pageLinkClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function pageList(page: number, count: number): (number | null)[] {
  const wanted = new Set([1, count, page - 1, page, page + 1].filter((item) => item >= 1 && item <= count));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((item, index) => (index > 0 && item - sorted[index - 1] > 1 ? [null, item] : [item]));
}

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
  searchParams: Promise<{ who?: string; action?: string; q?: string; page?: string }>;
}) {
  const query = await searchParams;
  const person = personOf(query.who);
  const action = actionOf(query.action);
  const search = (query.q ?? "").trim().slice(0, 120);
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
  const needle = search.toLowerCase();
  const matches = needle
    ? events.filter((event) =>
        [complianceActionLabel(event.action), event.detail, affiliateName(event.code), event.code ?? "", actorLabel(event.actor, event.code), formatWhen(event.createdAt)]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : events;
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(query.page)) || 1));
  const shown = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (target: number, keepSearch = true) => {
    const params = new URLSearchParams();
    if (query.who && person) params.set("who", query.who);
    if (action) params.set("action", action);
    if (search && keepSearch) params.set("q", search);
    if (target > 1) params.set("page", String(target));
    const text = params.toString();
    return text ? `/admin/affiliates/records?${text}` : "/admin/affiliates/records";
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Compliance records</h2>
        <p className="mt-2 max-w-2xl text-sm text-brown">
          Account changes, payment authorizations, marketing reports, disclosure reviews, and correction requests. Records are kept and are not edited.
        </p>
        <form action="/admin/affiliates/records" className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          {search ? <input type="hidden" name="q" value={search} /> : null}
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 pt-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id="compliance-events-title" className="text-2xl">
              History
            </h2>
            {matches.length > 0 ? (
              <p className="text-sm text-brown">
                {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + shown.length} of {matches.length}
              </p>
            ) : null}
          </div>
          <form action="/admin/affiliates/records" role="search" aria-label="Search history" className="flex w-full min-w-0 gap-2 sm:w-auto">
            {query.who && person ? <input type="hidden" name="who" value={query.who} /> : null}
            {action ? <input type="hidden" name="action" value={action} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={120}
              autoComplete="off"
              aria-label="Search history"
              placeholder="Search events"
              className="min-h-11 w-full min-w-0 rounded-full border border-ink/15 bg-white px-4 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:w-72"
            />
            <button type="submit" className={buttonClass}>
              Search
            </button>
            {search ? (
              <Link href={pageHref(1, false)} className="inline-flex min-h-11 items-center px-2 text-sm text-ink underline underline-offset-4">
                Clear
              </Link>
            ) : null}
          </form>
        </div>
        {loadError ? <p className="px-4 py-6 text-sm text-ink">{loadError}</p> : null}
        {!loadError && events.length === 0 ? <p className="px-4 py-6 text-sm text-brown">No records yet.</p> : null}
        {!loadError && events.length > 0 && matches.length === 0 ? (
          <p className="px-4 py-6 text-sm text-brown">No records match &ldquo;{search}&rdquo;.</p>
        ) : null}
        {shown.length > 0 ? (
          <ul aria-labelledby="compliance-events-title" className="mt-4">
            {shown.map((event) => (
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
        {pageCount > 1 ? (
          <nav aria-label="History pages" className="flex flex-wrap items-center justify-center gap-1 border-t border-ink/10 px-4 py-4">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className={`${pageLinkClass} text-ink hover:bg-background`}>
                Previous
              </Link>
            ) : (
              <span aria-disabled="true" className={`${pageLinkClass} text-brown/60`}>
                Previous
              </span>
            )}
            {pageList(page, pageCount).map((item, index) =>
              item === null ? (
                <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-brown">
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={pageHref(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`${pageLinkClass} tabular-nums ${item === page ? "bg-ink text-white" : "text-ink hover:bg-background"}`}
                >
                  {item}
                </Link>
              ),
            )}
            {page < pageCount ? (
              <Link href={pageHref(page + 1)} className={`${pageLinkClass} text-ink hover:bg-background`}>
                Next
              </Link>
            ) : (
              <span aria-disabled="true" className={`${pageLinkClass} text-brown/60`}>
                Next
              </span>
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
