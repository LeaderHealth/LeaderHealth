"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { unassignPromoCodeAction } from "@/app/admin/affiliates/actions";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function RemovePromoAffiliate({ code, affiliate, name }: { code: string; affiliate: string; name: string }) {
  const titleId = useId();
  const descriptionId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function closeDialog() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>("button")];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !root.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="ml-0.5 grid size-8 place-items-center rounded-full text-brown hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close remove dialog" className="absolute inset-0 bg-ink/40" onClick={closeDialog} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="relative w-full max-w-md rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Remove {name}?
                </h2>
                <p id={descriptionId} className="mt-2 text-sm text-brown">
                  Are you sure? {name} will be removed from {code}. An admin has to assign them to this code again.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={unassignPromoCodeAction}>
                    <input type="hidden" name="code" value={code} />
                    <input type="hidden" name="affiliate" value={affiliate} />
                    <button type="submit" className={buttonClass}>
                      Remove {name}
                    </button>
                  </form>
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={closeDialog}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Cancel
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
