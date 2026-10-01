"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PORTAL_URL } from "@/lib/content/site";

const CLOSE_MS = 320;
const popupEase = "cubic-bezier(0.22,1,0.36,1)";

export function ProductSignupPrompt() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeTimer = useRef<number | null>(null);
  const shown = useRef(false);
  const dismissRef = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const [entered, setEntered] = useState(false);

  function present() {
    returnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPhase("open");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    let scrolled = false;
    let wasBelow = node.getBoundingClientRect().top >= window.innerHeight;
    const onScroll = () => {
      scrolled = true;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(() => {
      const top = node.getBoundingClientRect().top;
      const reached = top < window.innerHeight;
      const crossed = wasBelow && reached;
      wasBelow = !reached;
      if (shown.current || !scrolled || !crossed || window.scrollY < 160) return;
      shown.current = true;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      present();
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!entered) return;
    closeRef.current?.focus();
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
        dismissRef.current();
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

  function dismiss() {
    setEntered(false);
    returnFocus.current?.focus();
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(() => setPhase("closed"), reduced ? 0 : CLOSE_MS);
  }

  useEffect(() => {
    dismissRef.current = dismiss;
  });

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full bg-white" />
      {phase === "open" ? (
        <div className="fixed inset-0 z-[70]">
          <div
            className={`absolute inset-0 bg-[#331110]/45 backdrop-blur-[3px] transition-opacity duration-[320ms] motion-reduce:transition-none ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionTimingFunction: popupEase }}
            onClick={dismiss}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            inert={entered ? undefined : true}
            className={`absolute top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-white px-6 py-7 text-center text-[#331110] shadow-[0_24px_80px_rgba(51,17,16,0.22)] transition-[opacity,scale] duration-[380ms] motion-reduce:transition-none sm:px-8 sm:py-8 ${
              entered ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            }`}
            style={{ transitionTimingFunction: popupEase }}
          >
            <button
              ref={closeRef}
              type="button"
              aria-label="Close sign up"
              onClick={dismiss}
              className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-[#331110] hover:bg-[#331110]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#331110]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <p className="font-sans text-[12px] font-medium tracking-[0.16em] text-[#a14e56] uppercase">
              Patient portal
            </p>
            <h2
              id={titleId}
              className="mt-2 font-sans text-[32px] leading-[1.05] font-medium tracking-[-0.03em] text-[#331110]"
            >
              Sign up
            </h2>
            <p id={descriptionId} className="mx-auto mt-3 max-w-[28rem] font-sans text-[15px] leading-snug text-[#4a2a26] sm:text-[16px]">
              Create an account to follow your visit, prescriptions, and messages.
            </p>
            <a
              href={PORTAL_URL}
              className="group relative mt-6 inline-flex h-[47px] min-w-[148px] items-center justify-center overflow-hidden rounded-[39px] bg-[#DF4452] px-[26px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#331110]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#E33D4E] transition-transform duration-[400ms] ease-out group-hover:scale-[36] motion-reduce:scale-100! motion-reduce:transition-none"
              />
              <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
                Sign Up
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
              >
                →
              </span>
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 block w-full font-sans text-[14px] text-[#6e5555] underline decoration-[#6e5555]/40 underline-offset-4 hover:text-[#331110] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#331110]"
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
