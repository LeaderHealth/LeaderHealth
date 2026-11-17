import type { AffiliateApplication } from "@/lib/affiliate/applications";
import { formatWhen } from "@/lib/affiliate/format";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/30 px-5 text-sm font-medium text-ink hover:bg-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const next = "/admin/affiliates/applications";

function promoText(code: string) {
  return code || "Not yet";
}

function Actions({
  application,
  approveAction,
  declineAction,
}: {
  application: AffiliateApplication;
  approveAction: (formData: FormData) => void | Promise<void>;
  declineAction: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {application.commissionLabel ? (
        <form action={approveAction}>
          <input type="hidden" name="email" value={application.email} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className={buttonClass}>
            Approve
          </button>
        </form>
      ) : null}
      <form action={declineAction}>
        <input type="hidden" name="email" value={application.email} />
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={quietButtonClass}>
          Decline
        </button>
      </form>
    </div>
  );
}

export function PendingApplications({
  applications,
  approveAction,
  declineAction,
}: {
  applications: AffiliateApplication[];
  approveAction: (formData: FormData) => void | Promise<void>;
  declineAction: (formData: FormData) => void | Promise<void>;
}) {
  if (applications.length === 0) {
    return <p className="px-4 py-8 text-sm text-brown">No applications are waiting.</p>;
  }

  return (
    <>
      <ul className="xl:hidden" aria-labelledby="pending-applications-title">
        {applications.map((application) => (
          <li key={application.email} className="border-t border-ink/10 px-4 py-5">
            <p className="font-medium text-ink">{application.name}</p>
            <p className="mt-0.5 break-all text-sm text-brown">{application.email}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
              <div>
                <dt className="text-xs text-brown">Lab commission</dt>
                <dd className="mt-1">{application.commissionLabel ?? "Not saved"}</dd>
              </div>
              <div>
                <dt className="text-xs text-brown">Promo code</dt>
                <dd className="mt-1 break-all">{promoText(application.promoCode)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-brown">Submitted</dt>
                <dd className="mt-1">{formatWhen(application.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <Actions application={application} approveAction={approveAction} declineAction={declineAction} />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full border-collapse text-left text-sm leading-6" aria-labelledby="pending-applications-title">
          <thead className="text-brown">
            <tr>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Applicant</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Email</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Lab commission</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Promo code</th>
              <th scope="col" className="px-4 py-4 align-bottom font-medium leading-snug">Submitted</th>
              <th scope="col" className="px-4 py-4 align-bottom">
                <span className="sr-only">Decision</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.email} className="border-t border-ink/10">
                <td className="px-4 py-5 align-middle font-medium">{application.name}</td>
                <td className="break-all px-4 py-5 align-middle">{application.email}</td>
                <td className="whitespace-nowrap px-4 py-5 align-middle">{application.commissionLabel ?? "Not saved"}</td>
                <td className="break-all px-4 py-5 align-middle">{promoText(application.promoCode)}</td>
                <td className="whitespace-nowrap px-4 py-5 align-middle">{formatWhen(application.createdAt)}</td>
                <td className="px-4 py-5 align-middle">
                  <Actions application={application} approveAction={approveAction} declineAction={declineAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
