"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MonthView = {
  label: string;
  orders: number;
  sales: string;
  earnings: string;
};

const closeClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/30 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function MonthBlock({ month }: { month: MonthView }) {
  return (
    <div className="rounded-[24px] bg-background px-4 py-5">
      <h3 className="text-lg">{month.label}</h3>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm leading-6">
        <div>
          <dt className="text-xs text-brown">Paid orders</dt>
          <dd className="mt-1">{month.orders}</dd>
        </div>
        <div>
          <dt className="text-xs text-brown">Sales</dt>
          <dd className="mt-1">{month.sales}</dd>
        </div>
        <div>
          <dt className="text-xs text-brown">Earnings</dt>
          <dd className="mt-1">{month.earnings}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ManageAffiliate({
  name,
  email,
  prior,
  current,
  className,
}: {
  name: string;
  email: string;
  prior: MonthView;
  current: MonthView;
  className: string;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, input")];
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
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={className}
      >
        Manage
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label={`Close ${name}`} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  {name}
                </h2>
                <p className="mt-1 break-all text-sm text-brown">{email}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <MonthBlock month={prior} />
                  <MonthBlock month={current} />
                </div>
                <p className="mt-6 text-sm text-brown">
                  Payouts are usually recorded around the 3rd, after the prior month has closed. These months match the Payouts page. Allotment is still your check of these numbers.
                </p>
                <button type="button" onClick={() => setOpen(false)} className={`${closeClass} mt-6`}>
                  Close
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
