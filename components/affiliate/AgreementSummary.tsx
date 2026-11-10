import type { AgreementView } from "./agreement-types";

export function AgreementSummary({ agreement, commission, pdfHref }: { agreement: AgreementView; commission: string; pdfHref: string | null }) {
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
        {agreement.deliverables.length === 0 ? <p className="mt-1">None written down.</p> : null}
        <ul className="mt-1 space-y-2">
          {agreement.deliverables.map((item, index) => (
            <li key={`${index}-${item.description}`}>
              <p>{item.description}</p>
              <p className="text-brown">
                Due {item.dueOn} · Stated amount {item.amount}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-brown">Compensation note</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{agreement.compensationNote}</p>
      </div>
      <div>
        <p className="text-brown">Referral rate already used for orders</p>
        <p className="mt-1">{commission}</p>
      </div>
      <div>
        <p className="text-brown">Licensing rights</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{agreement.licensing}</p>
      </div>
      <div>
        <p className="text-brown">Payment conditions</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{agreement.paymentConditions}</p>
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
