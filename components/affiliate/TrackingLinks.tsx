"use client";

import { useState } from "react";

export type TrackingLinkRow = {
  code: string;
  name: string;
  active: boolean;
  url: string;
};

export function TrackingLinks({ links }: { links: TrackingLinkRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyLink(code: string, url: string) {
    const field = document.getElementById(`tracking-link-${code}`);
    if (field instanceof HTMLInputElement) {
      field.focus();
      field.select();
    }
    let copiedText = false;
    try {
      await navigator.clipboard.writeText(url);
      copiedText = true;
    } catch {
      copiedText = document.execCommand("copy");
    }
    if (!copiedText) return;
    setCopied(code);
    window.setTimeout(() => {
      setCopied((current) => (current === code ? null : current));
    }, 2000);
  }

  return (
    <section id="tracking-links" aria-labelledby="tracking-links-title" className="rounded-[28px] bg-white p-4 sm:p-8">
      <h2 id="tracking-links-title" className="text-2xl">
        Tracking links
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-brown">
        Each affiliate has one link. Share that link so visits and paid orders are counted for that ID.{" "}
        <span className="text-ink">utm_source</span> is the affiliate ID and names who sent the visitor.{" "}
        <span className="text-ink">utm_medium</span> is affiliate, the channel this visit came through.{" "}
        <span className="text-ink">utm_campaign</span> is that affiliate&apos;s Gen Health promo code. When they do not have one, it is the affiliate ID.
      </p>
      {links.length === 0 ? (
        <p className="mt-6 text-sm text-brown">No tracking links yet. Create an affiliate to generate one.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rose/60">
          {links.map((link) => (
            <li key={link.code} className="grid gap-3 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:items-center">
              <div>
                <div className="font-medium text-ink">{link.name}</div>
                <div className="text-sm text-brown">
                  {link.code}
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  {link.active ? "Active" : "Off"}
                </div>
              </div>
              <label className="block min-w-0 text-sm text-ink" htmlFor={`tracking-link-${link.code}`}>
                <span className="sr-only">Tracking link for {link.name}</span>
                <input
                  id={`tracking-link-${link.code}`}
                  readOnly
                  value={link.url}
                  className="w-full min-w-0 min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
              </label>
              <button
                type="button"
                onClick={() => copyLink(link.code, link.url)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/40 px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {copied === link.code ? "Copied" : "Copy"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="sr-only" aria-live="polite">
        {copied ? `Copied the tracking link for ${copied}.` : ""}
      </p>
    </section>
  );
}
