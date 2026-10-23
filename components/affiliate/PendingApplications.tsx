"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AffiliateApplication } from "@/lib/affiliate/applications";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/30 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function PendingApplications({
  applications,
  approveAction,
  declineAction,
}: {
  applications: AffiliateApplication[];
  approveAction: (formData: FormData) => void | Promise<void>;
  declineAction: (formData: FormData) => void | Promise<void>;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const count = applications.length;

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.querySelector<HTMLElement>("button")?.focus();
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

  if (count === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`${quietButtonClass} mt-4`}
      >
        Pending applications
        <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-rose px-2 py-0.5 text-xs text-ink">{count}</span>
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close pending applications" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  Pending applications
                </h2>
                <p className="mt-2 text-sm text-brown">The commission was set on the link. Approve creates the account and sends the invitation. Decline leaves no account.</p>
                <ul className="mt-6 space-y-6">
                  {applications.map((application) => (
                    <li key={application.email} className="border-t border-ink/10 pt-6 first:border-t-0 first:pt-0">
                      <p className="font-medium">{application.name}</p>
                      <p className="mt-1 break-all text-sm text-brown">{application.email}</p>
                      <p className="mt-3 text-sm text-ink">Commission {application.commissionLabel ?? "was not saved with this application."}</p>
                      {application.commissionLabel ? (
                        <form action={approveAction} className="mt-4">
                          <input type="hidden" name="email" value={application.email} />
                          <button type="submit" className={buttonClass}>
                            Approve
                          </button>
                        </form>
                      ) : null}
                      <form action={declineAction} className="mt-3">
                        <input type="hidden" name="email" value={application.email} />
                        <button type="submit" className={quietButtonClass}>
                          Decline
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setOpen(false)} className={`${quietButtonClass} mt-6`}>
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
