"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const gearClass =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function AccountSettings({ name, children }: { name: string; children: ReactNode }) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Settings for ${name}`}
        onClick={() => setOpen(true)}
        className={gearClass}
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" aria-hidden="true">
          <path
            d="M10.3 2.5h3.4l.4 2.2a7.2 7.2 0 0 1 2.1 1.2l2.1-.9 2.4 2.4-.9 2.1a7.2 7.2 0 0 1 1.2 2.1l2.2.4v3.4l-2.2.4a7.2 7.2 0 0 1-1.2 2.1l.9 2.1-2.4 2.4-2.1-.9a7.2 7.2 0 0 1-2.1 1.2l-.4 2.2h-3.4l-.4-2.2a7.2 7.2 0 0 1-2.1-1.2l-2.1.9-2.4-2.4.9-2.1a7.2 7.2 0 0 1-1.2-2.1l-2.2-.4v-3.4l2.2-.4a7.2 7.2 0 0 1 1.2-2.1l-.9-2.1 2.4-2.4 2.1.9a7.2 7.2 0 0 1 2.1-1.2l.4-2.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        Settings
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label={`Close settings for ${name}`} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  {name}
                </h2>
                <div className="mt-6 flex flex-col gap-2">{children}</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
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
