"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { saveAffiliateLinkAction } from "@/app/affiliates/actions";
import type { PromoCodeRow } from "@/lib/genhealth/promocodes";

const badgeClass = "inline-flex max-w-full items-center rounded-full bg-rose px-3 py-1 text-xs font-medium leading-5 text-ink";
const outlineBadgeClass = "inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-ink/30 px-3 py-1 text-xs font-medium leading-5 text-brown";
const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

export function PromoCodeCard({
  code,
  discount,
  mode,
  status,
  usage,
  validUntil,
  products,
  url,
  saved,
}: {
  code: string;
  discount: string;
  mode: PromoCodeRow["mode"];
  status: PromoCodeRow["statusLabel"];
  usage: string;
  validUntil: string;
  products: { category: string; items: { id: string; name: string }[] }[];
  url: string;
  saved: boolean;
}) {
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stored, setStored] = useState(saved);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function copyLink() {
    let copiedText = false;
    try {
      await navigator.clipboard.writeText(url);
      copiedText = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      copiedText = document.execCommand("copy");
      area.remove();
    }
    if (!copiedText) {
      setCopied(false);
      setNotice("Couldn't copy the link.");
      return;
    }
    setCopied(true);
    setNotice("Link copied.");
    window.setTimeout(() => {
      setCopied(false);
      setNotice((current) => (current === "Link copied." ? "" : current));
    }, 2000);
  }

  async function saveLink() {
    if (stored || pending) return;
    setPending(true);
    const result = await saveAffiliateLinkAction(code);
    setPending(false);
    setNotice(result.message);
    if (result.ok) setStored(true);
  }

  const productCount = products.reduce((sum, group) => sum + group.items.length, 0);
  const productLabel = `${productCount} ${productCount === 1 ? "product" : "products"}`;

  function closeDialog() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
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
      const nodes = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")];
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
    <article className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-all text-2xl">{code}</h3>
          <p className="mt-3">
            <span className={badgeClass}>{discount}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={badgeClass}>{mode}</span>
          <span className={status === "Active" ? badgeClass : outlineBadgeClass}>{status}</span>
        </div>
      </div>
      <dl className="mt-5 grid gap-4 text-sm leading-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-brown">Usage</dt>
          <dd className="mt-1">{usage}</dd>
        </div>
        <div>
          <dt className="text-xs text-brown">Expires</dt>
          <dd className="mt-1">{validUntil === "Unlimited" ? "No expiration" : validUntil}</dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-ink/10 pt-4">
        {productCount === 0 ? (
          <p className="text-sm text-brown">No eligible products.</p>
        ) : (
          <>
            <button ref={buttonRef} type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>
              Eligible products
              <span className="ml-2 font-normal text-brown">{productLabel}</span>
            </button>
            {open
              ? createPortal(
                  <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
                    <button type="button" aria-label="Close eligible products" className="absolute inset-0 bg-ink/40" onClick={closeDialog} />
                    <div
                      ref={dialogRef}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby={titleId}
                      className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-2xl flex-col rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
                    >
                      <h2 id={titleId} className="text-2xl">
                        Eligible products
                      </h2>
                      <p className="mt-2 break-all text-sm text-brown">
                        {code} · {productLabel}
                      </p>
                      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                        <table className="w-full table-fixed border-collapse text-left text-sm leading-6">
                          <caption className="sr-only">
                            Eligible products for {code}
                          </caption>
                          <colgroup>
                            <col className="w-[38%]" />
                            <col className="w-[62%]" />
                          </colgroup>
                          <thead className="sticky top-0 bg-white text-brown">
                            <tr>
                              <th scope="col" className="px-3 py-3 font-medium">
                                Category
                              </th>
                              <th scope="col" className="px-3 py-3 font-medium">
                                Product
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((group) =>
                              group.items.map((product, index) => (
                                <tr key={product.id} className="border-t border-rose/60">
                                  {index === 0 ? (
                                    <th
                                      scope="rowgroup"
                                      rowSpan={group.items.length}
                                      className="break-words bg-background px-3 py-3 align-top font-medium text-brown"
                                    >
                                      {group.category}
                                    </th>
                                  ) : null}
                                  <td className="break-words px-3 py-3 align-top">{product.name}</td>
                                </tr>
                              )),
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-6">
                        <button type="button" onClick={closeDialog} className={secondaryButtonClass}>
                          Close
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
          </>
        )}
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-ink">Tracking link</p>
        <p className="mt-2 break-all rounded-[24px] bg-background px-4 py-3 text-sm leading-6 text-ink">{url}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={copyLink} className={primaryButtonClass}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <button type="button" onClick={saveLink} className={secondaryButtonClass} disabled={stored || pending}>
            {stored ? "Saved" : pending ? "Saving" : "Save to my links"}
          </button>
          <p role="status" aria-live="polite" className="text-sm text-brown">
            {notice}
          </p>
        </div>
      </div>
    </article>
  );
}
