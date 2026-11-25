"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const steps = {
  instagram: {
    title: "Connect Instagram",
    lines: [
      "A Meta window opens with Facebook and Instagram. Choose Instagram.",
      "Sign in with the Instagram account you post from.",
      "Select that account. Leave every other account unselected.",
      "Use a professional account. Leader Health reads its posts and stats and does not post for you.",
    ],
  },
  facebook: {
    title: "Connect a Facebook Page",
    lines: [
      "A Facebook window opens. Continue as yourself.",
      "The first screen shows your name and picture. Continue.",
      "On the next screen, allow access to your Page.",
      "Leader Health reads that Page's posts and stats and does not post for you.",
    ],
  },
} as const;

export function SocialConnectLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const network = href.includes("/instagram/start") ? "instagram" : href.includes("/meta/start") ? "facebook" : null;
  if (!network) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <SocialConnectPrompt href={href} className={className} network={network}>
      {children}
    </SocialConnectPrompt>
  );
}

function SocialConnectPrompt({
  href,
  className,
  network,
  children,
}: {
  href: string;
  className: string;
  network: keyof typeof steps;
  children: ReactNode;
}) {
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const copy = steps[network];

  function closeDialog() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();
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
      const nodes = [...root.querySelectorAll<HTMLElement>("a, button:not([disabled])")];
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
      <button ref={buttonRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close connect instructions" className="absolute inset-0 bg-ink/40" onClick={closeDialog} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-lg rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  {copy.title}
                </h2>
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-brown">
                  {copy.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={href}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Continue
                  </a>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-ink/15 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
