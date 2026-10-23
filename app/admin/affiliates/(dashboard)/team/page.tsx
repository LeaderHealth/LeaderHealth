import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminAccountProfile } from "@/lib/affiliate/admin-profile";
import { listSubAdmins, type SubAdminRecord } from "@/lib/affiliate/admins";
import { listOpenDashboardSessions, type DashboardSessionRecord } from "@/lib/affiliate/dashboard-sessions";
import { adminSessionActor, currentAdminSessionId } from "@/lib/affiliate/session";
import { getAffiliate } from "@/lib/affiliate/store";
import { inviteSubAdminAction, removeSubAdminAction, resendSubAdminInvitationAction, revokeDashboardSessionAction, setSubAdminActiveAction } from "../../actions";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const actionClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function statusLabel(admin: SubAdminRecord) {
  if (!admin.active) return "Inactive";
  if (admin.invitePending) return "Invited";
  return "Active";
}

function statusClass(admin: SubAdminRecord) {
  return admin.active && !admin.invitePending ? "bg-rose text-ink" : "border border-ink/20 text-brown";
}

function roleLabel(role: DashboardSessionRecord["role"]) {
  if (role === "owner") return "Main admin";
  if (role === "sub") return "Admin";
  return "Affiliate";
}

function formatSignedIn(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function sessionPerson(
  session: DashboardSessionRecord,
  owner: { name: string; email: string } | null,
  admins: SubAdminRecord[],
  affiliates: Map<string, { name: string; email: string }>,
) {
  if (session.role === "owner") {
    return { name: owner?.name || "Main admin", detail: session.subject };
  }
  if (session.role === "sub") {
    const admin = admins.find((entry) => entry.id === session.subject);
    return { name: admin?.name || "Admin", detail: admin?.email || "Sub-admin" };
  }
  const affiliate = affiliates.get(session.subject);
  return { name: affiliate?.name || session.subject, detail: affiliate?.email || session.subject };
}

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; resent?: string; updated?: string; removed?: string; signedout?: string }>;
}) {
  const actor = await adminSessionActor();
  if (!actor) redirect("/admin/affiliates");
  if (actor.role !== "owner") redirect("/admin/affiliates/overview");

  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";
  const owner = await adminAccountProfile();
  let admins: SubAdminRecord[] = [];
  let loadError = "";
  let sessions: DashboardSessionRecord[] = [];
  let sessionError = "";
  let currentSessionId: string | null = null;
  try {
    admins = await listSubAdmins();
  } catch (caught) {
    console.error("[affiliate] sub-admin list failed", caught instanceof Error ? caught.message : "unknown");
    loadError = "The team list is unavailable right now.";
  }
  try {
    sessions = await listOpenDashboardSessions();
    currentSessionId = await currentAdminSessionId();
  } catch (caught) {
    console.error("[affiliate] session list failed", caught instanceof Error ? caught.message : "unknown");
    sessionError = "Signed-in browsers are unavailable right now.";
  }
  const affiliates = new Map<string, { name: string; email: string }>();
  for (const session of sessions) {
    if (session.role !== "affiliate" || affiliates.has(session.subject)) continue;
    try {
      const affiliate = await getAffiliate(session.subject);
      if (affiliate) affiliates.set(session.subject, { name: affiliate.name, email: affiliate.email });
    } catch (caught) {
      console.error("[affiliate] session affiliate lookup failed", caught instanceof Error ? caught.message : "unknown");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {query.sent === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          Invitation sent. They choose their name, email, and password from that link.
        </p>
      ) : null}
      {query.resent === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          A new invitation was sent. The previous unused link no longer works.
        </p>
      ) : null}
      {query.updated === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          That admin&apos;s access was updated.
        </p>
      ) : null}
      {query.removed === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          That admin was removed.
        </p>
      ) : null}
      {query.signedout === "1" ? (
        <p role="status" className="rounded-2xl bg-white px-4 py-3 text-sm text-ink">
          That browser was signed out. Other sign-ins still work.
        </p>
      ) : null}
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-4xl">Invite an admin</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-taupe">
          Send a link to their inbox. They choose the name, email, and password they will use to sign in. They get the same affiliate dashboard. Only you can invite, list, and remove admins.
        </p>
        <form action={inviteSubAdminAction} className="mt-6 grid max-w-xl gap-4">
          <label className="block text-sm font-medium text-ink" htmlFor="team-email">
            Send invitation to
            <input id="team-email" name="email" type="email" required maxLength={120} autoComplete="email" className={fieldClass} />
          </label>
          <button type="submit" className={`${buttonClass} w-fit`}>
            Send invitation
          </button>
        </form>
      </section>
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Admins</h2>
        {loadError ? <p className="mt-4 text-sm text-ink">{loadError}</p> : null}
        <ul className="mt-6 divide-y divide-ink/10">
          {owner ? (
            <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-ink">{owner.name}</p>
                <p className="mt-1 break-all text-sm text-brown">{owner.email}</p>
              </div>
              <p className="text-sm text-brown">Main admin</p>
            </li>
          ) : null}
          {admins.map((admin) => (
            <li key={admin.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{admin.name || "Invitation sent"}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusClass(admin)}`}>{statusLabel(admin)}</span>
                </div>
                <p className="mt-1 break-all text-sm text-brown">{admin.email}</p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${admin.name || admin.email}`}>
                <form action={setSubAdminActiveAction}>
                  <input type="hidden" name="id" value={admin.id} />
                  <input type="hidden" name="active" value={admin.active ? "false" : "true"} />
                  <button type="submit" className={actionClass}>
                    {admin.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
                {admin.invitePending && admin.active ? (
                  <form action={resendSubAdminInvitationAction}>
                    <input type="hidden" name="id" value={admin.id} />
                    <button type="submit" className={actionClass}>
                      Resend invitation
                    </button>
                  </form>
                ) : null}
                <form action={removeSubAdminAction}>
                  <input type="hidden" name="id" value={admin.id} />
                  <button type="submit" className={actionClass}>
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {admins.length === 0 && !loadError ? <p className="text-sm text-brown">No sub-admins yet.</p> : null}
      </section>
      <section className="rounded-[28px] bg-white p-4 sm:p-8">
        <h2 className="text-2xl">Signed-in browsers</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-taupe">
          Each sign-in is its own session. Signing one out leaves every other browser and account signed in.
        </p>
        {sessionError ? <p className="mt-4 text-sm text-ink">{sessionError}</p> : null}
        {sessions.length === 0 && !sessionError ? <p className="mt-6 text-sm text-brown">No browsers are signed in.</p> : null}
        {sessions.length > 0 ? (
          <ul className="mt-6 divide-y divide-ink/10">
            {sessions.map((session) => {
              const person = sessionPerson(session, owner, admins, affiliates);
              const current = session.id === currentSessionId;
              return (
                <li key={session.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{person.name}</p>
                      <span className="inline-flex rounded-full border border-ink/20 px-2.5 py-1 text-xs text-brown">{roleLabel(session.role)}</span>
                      {current ? <span className="inline-flex rounded-full bg-rose px-2.5 py-1 text-xs text-ink">This browser</span> : null}
                    </div>
                    <p className="mt-1 break-all text-sm text-brown">{person.detail}</p>
                    <p className="mt-1 break-all text-sm text-brown">{session.userAgent || "Unknown browser"}</p>
                    <p className="mt-1 text-sm text-brown">Signed in {formatSignedIn(session.createdAt)}</p>
                  </div>
                  <form action={revokeDashboardSessionAction}>
                    <input type="hidden" name="id" value={session.id} />
                    <button type="submit" className={actionClass}>
                      Sign out
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
