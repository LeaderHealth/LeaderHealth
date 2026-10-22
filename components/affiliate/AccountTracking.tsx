"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type AccountTrackingPromo = {
  code: string;
  url: string;
};

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const closeClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const copyClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      ok = document.execCommand("copy");
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-1 flex min-w-0 items-start gap-2">
      <span className="min-w-0 flex-1 break-all">{value}</span>
      <button type="button" onClick={copy} className={copyClass} aria-label={copied ? `${label} copied` : `Copy ${label}`}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-ink/10 py-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm leading-snug text-brown">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-6 text-brown">{children}</p>;
}

export function AccountTracking({
  name,
  code,
  commission,
  cookieDays,
  trackingLink,
  promos,
  unavailable,
}: {
  name: string;
  code: string;
  commission: string;
  cookieDays: number;
  trackingLink: string;
  promos: AccountTrackingPromo[];
  unavailable: boolean;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
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
      const items = [...root.querySelectorAll<HTMLElement>("button")];
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
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={actionClass}>
        Tracking
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close tracking information" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col rounded-[28px] bg-white p-4 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Tracking information
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {name} · {code}
                </p>
                <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
                  <h3 className="text-xs font-medium tracking-wide text-brown">Link tracking</h3>
                  <dl>
                    <Row label="Commission">{commission}</Row>
                    <Row label="Cookie duration">{cookieDays} days</Row>
                    <Row label="Tracking link">
                      <CopyValue value={trackingLink} label="tracking link" />
                      <Note>
                        <span className="text-ink">utm_campaign</span> is the affiliate id. Opening it stores {name} for {cookieDays} days. If that visitor pays later, {name} is credited even when the order has no promo code.
                      </Note>
                    </Row>
                  </dl>
                  <h3 className="mt-8 text-xs font-medium uppercase tracking-wide text-brown">Promo tracking information</h3>
                  {unavailable ? (
                    <p className="mt-4 text-sm text-brown">Promo codes are unavailable right now.</p>
                  ) : promos.length === 0 ? (
                    <p className="mt-4 text-sm text-brown">No promo code is assigned.</p>
                  ) : (
                    promos.map((promo) => (
                      <dl key={promo.code}>
                        <Row label="Promo commission">{commission}</Row>
                        <Row label="Promo code">
                          <CopyValue value={promo.code} label={`${promo.code} promo code`} />
                        </Row>
                        <Row label="Promo link with visitors tracking">
                          <CopyValue value={promo.url} label={`${promo.code} promo link`} />
                          <Note>
                            This does the same visit recording, with <span className="text-ink">utm_campaign</span> set to {promo.code}. The visit still counts. If the paid order includes {promo.code}, {name} is credited from that locked code.
                          </Note>
                        </Row>
                      </dl>
                    ))
                  )}
                </div>
                <div className="mt-6">
                  <button type="button" onClick={() => setOpen(false)} className={closeClass}>
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
