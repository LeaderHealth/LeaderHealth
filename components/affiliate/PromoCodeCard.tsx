"use client";

import { useId, useState } from "react";
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
  products: { id: string; name: string }[];
  url: string;
  saved: boolean;
}) {
  const listId = useId();
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

  const productLabel = `${products.length} ${products.length === 1 ? "product" : "products"}`;

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
        {products.length === 0 ? (
          <p className="text-sm text-brown">No eligible products.</p>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((current) => !current)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Eligible products
              <span className="font-normal text-brown">{productLabel}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={open ? "rotate-180" : ""}>
                <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {open ? (
              <ul id={listId} className="mt-3 space-y-2 text-sm leading-6 text-ink">
                {products.map((product) => (
                  <li key={product.id} className="break-words">
                    {product.name}
                  </li>
                ))}
              </ul>
            ) : null}
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
