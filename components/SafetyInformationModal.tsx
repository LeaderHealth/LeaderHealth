"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type SafetySection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

const CLOSE_MS = 300;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isUrgent(heading: string, paragraphs: string[]) {
  return /do not use|emergency|right away|call 911|boxed warning|risk of thyroid|nitrate/i.test(
    `${heading} ${paragraphs.join(" ")}`,
  );
}

function WarningMark() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-[#9a3038]" fill="none" aria-hidden>
      <path
        d="M12 4.5 20.5 19.5h-17L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 10v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="0.8" fill="currentColor" />
    </svg>
  );
}

function SafetyBlock({
  heading,
  paragraphs,
  items,
  urgent,
}: SafetySection & { urgent: boolean }) {
  return (
    <section
      className={
        urgent
          ? "rounded-[14px] border border-[#9a3038]/30 bg-[#f8ecec] px-4 py-3.5"
          : "border-t border-[#331110]/10 pt-5 first:border-t-0 first:pt-0"
      }
    >
      <div className={urgent ? "flex gap-3" : undefined}>
        {urgent ? <WarningMark /> : null}
        <div className="min-w-0">
          {heading ? (
            <h3 className="font-sans text-[16px] leading-snug font-semibold tracking-[-0.02em] text-[#331110]">
              {heading}
            </h3>
          ) : null}
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className={`text-[15px] leading-[1.6] text-[#331110] sm:text-[16px] ${heading ? "mt-2" : ""}`}
            >
              {paragraph}
            </p>
          ))}
          {items && items.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.6] text-[#331110] sm:text-[16px]">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function SafetyInformationModal({
  notice,
  sections,
  children,
}: {
  notice?: string;
  sections: SafetySection[];
  children: (trigger: ReactNode) => ReactNode;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const [entered, setEntered] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const interactive = phase === "open" && entered;

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={phase === "open"}
      onClick={openDialog}
      className="mt-3 block w-full rounded-full px-3 py-2 text-center font-serif-italic text-sm text-white/90 underline decoration-white/45 underline-offset-[6px] transition-[color,background-color,text-decoration-color] duration-200 ease-out hover:bg-white/16 hover:text-white hover:decoration-white focus-visible:bg-white/16 focus-visible:text-white focus-visible:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
    >
      Important Safety Info
    </button>
  );

  function measure() {
    const el = bodyRef.current;
    if (!el) return;
    setScrolled(el.scrollTop > 4);
    setCanScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }

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
    closeRef.current?.focus();
    const frame = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(frame);
  }, [entered]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onScroll = () => measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

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
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
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

  return (
    <>
      {children(trigger)}
      <div className={closed ? "pointer-events-none invisible" : undefined}>
        <div
          className={`fixed inset-0 z-[80] bg-[#331110]/45 backdrop-blur-[3px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
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
          inert={interactive ? undefined : true}
          className={`fixed z-[81] flex flex-col overflow-hidden bg-white text-[#331110] shadow-[0_24px_80px_rgba(51,17,16,0.22)] transition-transform duration-300 ease-out motion-reduce:transition-none max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[90vh] max-sm:rounded-t-[20px] sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-[calc(100%-3rem)] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px] sm:transition-opacity ${
            entered
              ? "max-sm:translate-y-0 sm:opacity-100"
              : "max-sm:translate-y-full sm:pointer-events-none sm:opacity-0"
          }`}
        >
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-[#331110]/20" />
          </div>
          <div
            className={`flex shrink-0 items-center justify-between gap-3 px-5 py-3 sm:px-6 sm:pt-5 ${
              scrolled ? "border-b border-[#331110]/12" : "border-b border-transparent"
            }`}
          >
            <h2
              id={titleId}
              className="font-sans text-[18px] leading-tight font-semibold tracking-[-0.02em] text-[#331110]"
            >
              Important Safety Information
            </h2>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close safety information"
              onClick={closeDialog}
              className="grid size-11 shrink-0 place-items-center rounded-full text-[#331110] hover:bg-[#331110]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#331110]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={bodyRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:none] sm:px-6 sm:py-5 [&::-webkit-scrollbar]:hidden"
            >
              <div className="space-y-5">
                {notice ? (
                  <SafetyBlock heading="" paragraphs={[notice]} urgent={isUrgent("", [notice])} />
                ) : null}
                {sections.map((section) => (
                  <SafetyBlock
                    key={section.heading}
                    heading={section.heading}
                    paragraphs={section.paragraphs}
                    items={section.items}
                    urgent={isUrgent(section.heading, section.paragraphs)}
                  />
                ))}
              </div>
            </div>
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${
                canScrollMore ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
