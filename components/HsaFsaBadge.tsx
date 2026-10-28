"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export const HSA_FSA_LABEL = "HSA/FSA accepted";

const tones = {
  onDark: "bg-[#F7F3F5] text-[#331110]",
  onLight: "bg-[#331110] text-[#F7F3F5]",
} as const;

const CLOSE_MS = 280;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HsaFsaBadge({ tone = "onDark" }: { tone?: keyof typeof tones }) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const [entered, setEntered] = useState(false);

  function openDialog() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setPhase("open");
    if (prefersReducedMotion()) {
      setEntered(true);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }

  function closeDialog() {
    setEntered(false);
    triggerRef.current?.focus();
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(
      () => setPhase("closed"),
      prefersReducedMotion() ? 0 : CLOSE_MS,
    );
  }

  useEffect(() => {
    if (!entered) return;
    dialogRef.current?.focus();
  }, [entered]);

  useEffect(() => {
    if (phase !== "open") return;
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = [
        ...root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const closed = phase === "closed";

  const overlay = (
    <div className={closed ? "pointer-events-none invisible" : undefined}>
      <div
        className={`fixed inset-0 z-[80] bg-[#331110]/45 backdrop-blur-[3px] transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDialog}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={closed}
        tabIndex={-1}
        inert={phase === "open" && entered ? undefined : true}
        className={`fixed z-[81] overflow-y-auto bg-white text-[#331110] shadow-[0_24px_80px_rgba(51,17,16,0.22)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none motion-reduce:transition-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[90vh] max-sm:rounded-t-[20px] sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-[calc(100%-3rem)] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] ${
          entered
            ? "max-sm:translate-y-0 sm:scale-100 sm:opacity-100"
            : "max-sm:translate-y-full sm:pointer-events-none sm:scale-95 sm:opacity-0"
        }`}
      >
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <h2
            id={titleId}
            className="font-sans text-[20px] leading-snug font-semibold tracking-[-0.02em] text-[#331110]"
          >
            Using HSA and FSA funds
          </h2>
          <p className="mt-4 text-[15px] leading-[1.6] text-[#331110] sm:text-[16px]">
            For eligible medical expenses.
          </p>
          <h3 className="mt-4 font-sans text-[16px] leading-snug font-semibold text-[#331110]">
            Using your HSA or FSA
          </h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-[#331110] sm:text-[16px]">
            You may be able to use HSA or FSA funds for eligible medical expenses. Eligibility depends
            on the care you receive and your plan&apos;s requirements. Treatment for a diagnosed
            condition may qualify; services for general wellness or appearance alone may not.
          </p>
          <p className="mt-4 text-[15px] leading-[1.6] text-[#331110] sm:text-[16px]">
            Check with your plan administrator before purchasing. If you pay with another method, you
            may be able to request reimbursement for an eligible expense. Keep an itemized receipt and
            any documentation your plan requires. Payment or reimbursement is not guaranteed.
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDialog}
            className="mt-5 font-sans text-[16px] leading-snug font-semibold text-[#331110] underline decoration-[#331110]/40 underline-offset-[5px] hover:decoration-[#331110] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#331110]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={phase === "open"}
        onClick={openDialog}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border-0 px-3 py-1.5 text-[13px] font-semibold leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${tones[tone]}`}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
          <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        {HSA_FSA_LABEL}
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
