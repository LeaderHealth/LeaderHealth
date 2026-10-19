"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { markPayoutPaidAction } from "@/app/admin/affiliates/actions";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const actionClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function MarkPaidButton({
  code,
  name,
  period,
  amount,
  paidOn,
  monthLabel,
}: {
  code: string;
  name: string;
  period: string;
  amount: string;
  paidOn: string;
  monthLabel: string;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    amountRef.current?.focus();
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, input")].filter((item) => !item.hasAttribute("disabled"));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={actionClass}>
        Mark paid
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close payment dialog" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-md rounded-[28px] bg-white p-8 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  Mark paid
                </h2>
                <p className="mt-2 text-sm text-brown">
                  Record the payment sent to {name} for {monthLabel}. This does not send money.
                </p>
                <form action={markPayoutPaidAction} className="mt-6 space-y-4">
                  <input type="hidden" name="code" value={code} />
                  <input type="hidden" name="period" value={period} />
                  <label className="block text-sm font-medium text-ink" htmlFor={`payout-amount-${code}-${period}`}>
                    Amount
                    <input
                      ref={amountRef}
                      id={`payout-amount-${code}-${period}`}
                      name="amount"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100000"
                      step="0.01"
                      required
                      defaultValue={amount}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink" htmlFor={`payout-date-${code}-${period}`}>
                    Payment date
                    <input
                      id={`payout-date-${code}-${period}`}
                      name="paidOn"
                      type="date"
                      required
                      defaultValue={paidOn}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-ink" htmlFor={`payout-reference-${code}-${period}`}>
                    Reference
                    <input
                      id={`payout-reference-${code}-${period}`}
                      name="reference"
                      type="text"
                      maxLength={80}
                      placeholder="Optional"
                      className={fieldClass}
                    />
                  </label>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button type="submit" className={buttonClass}>
                      Record payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
