"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  endAgreementAction,
  markAgreementWaitingAction,
  replaceAgreementAction,
  saveAgreementAction,
  signAgreementAction,
} from "@/app/admin/affiliates/agreement-actions";
import type { AgreementDraftSeed, AgreementView } from "./agreement-types";
import { AgreementSummary } from "./AgreementSummary";

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const fieldClass =
  "mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type Row = { key: string; description: string; dueOn: string; amount: string };

function rowsFrom(seed: AgreementDraftSeed): Row[] {
  return seed.deliverables.map((item, index) => ({ key: `saved-${index}`, ...item }));
}

export function AccountAgreement({
  name,
  code,
  commission,
  unavailable,
  lead,
  older,
  seed,
  editable,
  canSign,
  canEnd,
  canReplace,
  replaceNeedsNote,
  awaiting,
}: {
  name: string;
  code: string;
  commission: string;
  unavailable: boolean;
  lead: AgreementView | null;
  older: AgreementView[];
  seed: AgreementDraftSeed;
  editable: boolean;
  canSign: boolean;
  canEnd: boolean;
  canReplace: boolean;
  replaceNeedsNote: boolean;
  awaiting: boolean;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => rowsFrom(seed));
  const nextKey = useRef(seed.deliverables.length);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.querySelector<HTMLElement>("button, a, input, select, textarea")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, a, input, select, textarea")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      event.stopPropagation();
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={actionClass}>
        Agreement
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label={`Close agreement for ${name}`} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col rounded-[28px] bg-white p-4 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Agreement
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {name} · {code}
                </p>
                <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-y-auto">
                  <p className="text-sm text-brown">This stores the terms and the PDF that was uploaded. Uploading a PDF does not by itself sign anything, and it does not change pay.</p>
                  <p className="text-sm">
                    <span className="text-brown">Referral rate already used for orders</span>
                    <span className="mt-1 block">{commission}</span>
                  </p>
                  {unavailable ? <p className="text-sm text-ink">Agreements are unavailable right now.</p> : null}
                  {!unavailable && !lead ? <p className="text-sm text-brown">No agreement on file.</p> : null}
                  {!unavailable && lead && !editable ? <AgreementSummary agreement={lead} commission={commission} pdfHref={lead.file ? adminPdf(lead.id) : null} /> : null}
                  {editable ? (
                    <form action={saveAgreementAction} className="grid gap-4">
                      <input type="hidden" name="code" value={code} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-ink">
                          Start date
                          <input name="effectiveOn" type="date" defaultValue={seed.effectiveOn} className={fieldClass} />
                        </label>
                        <label className="block text-sm font-medium text-ink">
                          Expiration date
                          <input name="expiresOn" type="date" defaultValue={seed.expiresOn} className={fieldClass} />
                        </label>
                      </div>
                      <fieldset className="grid gap-3">
                        <legend className="text-sm font-medium text-ink">Deliverables</legend>
                        <p className="text-sm text-brown">A stated amount is only what the agreement says. It is not added to payouts.</p>
                        {rows.map((row) => (
                          <div key={row.key} className="grid gap-3 rounded-[24px] bg-background p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_auto] sm:items-end">
                            <label className="block text-sm font-medium text-ink">
                              Description
                              <input name="deliverableDescription" defaultValue={row.description} className={fieldClass} />
                            </label>
                            <label className="block text-sm font-medium text-ink">
                              Deadline
                              <input name="deliverableDue" type="date" defaultValue={row.dueOn} className={fieldClass} />
                            </label>
                            <label className="block text-sm font-medium text-ink">
                              Stated amount
                              <input name="deliverableAmount" inputMode="decimal" defaultValue={row.amount} className={fieldClass} />
                            </label>
                            <button
                              type="button"
                              className={quietButtonClass}
                              onClick={() => setRows((current) => (current.length === 1 ? current : current.filter((item) => item.key !== row.key)))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div>
                          <button
                            type="button"
                            className={quietButtonClass}
                            onClick={() => {
                              const key = `new-${nextKey.current}`;
                              nextKey.current += 1;
                              setRows((current) => [...current, { key, description: "", dueOn: "", amount: "" }]);
                            }}
                          >
                            Add deliverable
                          </button>
                        </div>
                      </fieldset>
                      <label className="block text-sm font-medium text-ink">
                        Compensation note
                        <textarea name="compensationNote" rows={3} defaultValue={seed.compensationNote} className={fieldClass} />
                      </label>
                      <label className="block text-sm font-medium text-ink">
                        Licensing rights
                        <textarea name="licensing" rows={3} defaultValue={seed.licensing} className={fieldClass} />
                      </label>
                      <label className="block text-sm font-medium text-ink">
                        Payment conditions
                        <textarea name="paymentConditions" rows={3} defaultValue={seed.paymentConditions} className={fieldClass} />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className={buttonClass}>
                          {awaiting ? "Save terms" : "Save draft"}
                        </button>
                        {awaiting ? null : (
                          <button type="submit" formAction={markAgreementWaitingAction} className={quietButtonClass}>
                            Ready for signature
                          </button>
                        )}
                      </div>
                    </form>
                  ) : null}
                  {canSign ? (
                    <form action={signAgreementAction} className="grid gap-4">
                      <p className="text-sm text-brown">Save the terms before storing the PDF.</p>
                      <input type="hidden" name="code" value={code} />
                      <label className="block text-sm font-medium text-ink">
                        Name on the signed agreement
                        <input name="signerName" required className={fieldClass} />
                      </label>
                      <label className="block text-sm font-medium text-ink">
                        Signed PDF
                        <input name="file" type="file" accept="application/pdf" required className={fieldClass} />
                      </label>
                      <div>
                        <button type="submit" className={buttonClass}>
                          Store signed PDF
                        </button>
                      </div>
                    </form>
                  ) : null}
                  {canEnd ? (
                    <form action={endAgreementAction} className="grid gap-4">
                      <input type="hidden" name="code" value={code} />
                      <label className="block text-sm font-medium text-ink">
                        Note
                        <input name="note" required className={fieldClass} />
                      </label>
                      <div>
                        <button type="submit" className={quietButtonClass}>
                          End agreement
                        </button>
                      </div>
                    </form>
                  ) : null}
                  {canReplace ? (
                    <form action={replaceAgreementAction} className="grid gap-4">
                      <input type="hidden" name="code" value={code} />
                      {replaceNeedsNote ? (
                        <label className="block text-sm font-medium text-ink">
                          Note
                          <input name="note" required className={fieldClass} />
                        </label>
                      ) : null}
                      <div>
                        <button type="submit" className={buttonClass}>
                          Replace
                        </button>
                      </div>
                    </form>
                  ) : null}
                  {older.length > 0 ? (
                    <section>
                      <h3 className="text-lg">Older agreements</h3>
                      <ul className="mt-4 divide-y divide-rose/60">
                        {older.map((agreement) => (
                          <li key={agreement.id} className="py-4">
                            <AgreementSummary agreement={agreement} commission={commission} pdfHref={agreement.file ? adminPdf(agreement.id) : null} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
                <div className="mt-6">
                  <button type="button" onClick={() => setOpen(false)} className={quietButtonClass}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function adminPdf(id: string) {
  return `/admin/affiliates/agreement-file?agreement=${encodeURIComponent(id)}`;
}
