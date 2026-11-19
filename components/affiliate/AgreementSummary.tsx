import type { AgreementView } from "./agreement-types";
import { STANDARD_DELIVERABLE_DESCRIPTION, STANDARD_PAYMENT_CONDITIONS, monthlyRateCondition } from "@/lib/affiliate/agreement-pay";

export function AgreementSummary({ agreement, commission, pdfHref }: { agreement: AgreementView; commission: string; pdfHref: string | null }) {
  const written = agreement.deliverables.filter((item) => item.description.trim());
  return (
    <div className="space-y-3 text-sm">
      <p className="text-brown">{agreement.statusLabel}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-brown">Start date</dt>
          <dd className="mt-1">{agreement.effectiveOn}</dd>
        </div>
        <div>
          <dt className="text-brown">Expiration date</dt>
          <dd className="mt-1">{agreement.expiresOn}</dd>
        </div>
      </dl>
      <div>
        <p className="text-brown">Deliverables</p>
        <p className="mt-1">{STANDARD_DELIVERABLE_DESCRIPTION}</p>
        <p className="mt-2">{STANDARD_PAYMENT_CONDITIONS}</p>
        {monthlyRateCondition(agreement.monthly, agreement.postTotal) ? <p className="mt-2">{monthlyRateCondition(agreement.monthly, agreement.postTotal)}</p> : null}
        {written.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {written.map((item, index) => (
              <li key={`${index}-${item.description}`}>
                <p>{item.description}</p>
                <p className="text-brown">
                  Publish by {item.dueOn} · {item.amount}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div>
        <p className="text-brown">Compensation note</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{agreement.compensationNote}</p>
      </div>
      <div>
        <p className="text-brown">Standing rate per 1,000 views</p>
        <p className="mt-1">{commission}</p>
      </div>
      <div>
        <p className="text-brown">Licensing rights</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{agreement.licensing}</p>
      </div>
      <div>
        <p className="text-brown">Payment conditions</p>
        <p className="mt-1 whitespace-pre-wrap break-words">
          {agreement.paymentConditions === "—" ? "Included with the deliverables above." : agreement.paymentConditions}
        </p>
      </div>
      {agreement.signerName ? (
        <p>
          Signed by {agreement.signerName}
          {agreement.signedAt ? ` · ${agreement.signedAt}` : ""}
        </p>
      ) : null}
      {agreement.endNote ? <p className="whitespace-pre-wrap break-words">Ended: {agreement.endNote}</p> : null}
      {pdfHref ? (
        <p>
          <a href={pdfHref} className="underline underline-offset-4">
            View PDF
          </a>
        </p>
      ) : (
        <p className="text-brown">No PDF stored.</p>
      )}
    </div>
  );
}
