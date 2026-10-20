"use client";

import { useState } from "react";

export type TrackingLinkRow = {
  code: string;
  name: string;
  active: boolean;
  url: string;
  promos: { code: string; url: string }[];
};

export function TrackingLinks({ links }: { links: TrackingLinkRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyLink(id: string, key: string, url: string) {
    const field = document.getElementById(id);
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
    setCopied(key);
    window.setTimeout(() => {
      setCopied((current) => (current === key ? null : current));
    }, 2000);
  }

  return (
    <section id="tracking-links" aria-labelledby="tracking-links-title" className="rounded-[28px] bg-white p-4 sm:p-8">
      <h2 id="tracking-links-title" className="text-2xl">
        Tracking links
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-brown">
        Each affiliate has a default link, plus a link for every promo code assigned to them. The default link has no promo code. It uses{" "}
        <span className="text-ink">utm_source</span>, <span className="text-ink">utm_medium</span>, and{" "}
        <span className="text-ink">utm_campaign</span>. <span className="text-ink">utm_source</span> and{" "}
        <span className="text-ink">utm_campaign</span> are the affiliate ID. <span className="text-ink">utm_medium</span> is affiliate. A promo link uses that promo code as{" "}
        <span className="text-ink">utm_campaign</span>.
      </p>
      {links.length === 0 ? (
        <p className="mt-6 text-sm text-brown">No tracking links yet. Create an affiliate to generate one.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rose/60">
          {links.map((link) => (
            <li key={link.code} className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto] md:items-end">
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
                <span className="mb-1 block text-brown">Default link</span>
                <span className="mb-1 block text-xs text-taupe">No promo code. UTM parameters only.</span>
                <input
                  id={`tracking-link-${link.code}`}
                  readOnly
                  value={link.url}
                  className="w-full min-w-0 min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
              </label>
              <button
                type="button"
                onClick={() => copyLink(`tracking-link-${link.code}`, link.code, link.url)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/40 px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {copied === link.code ? "Copied" : "Copy"}
              </button>
              {link.promos.map((promo) => {
                const fieldId = `tracking-link-${link.code}-${promo.code.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                const copyKey = `${link.code} ${promo.code}`;
                return (
                  <div key={promo.code} className="contents">
                    <div className="hidden md:block" />
                    <label className="block min-w-0 text-sm text-ink" htmlFor={fieldId}>
                      <span className="mb-1 block text-brown">{promo.code}</span>
                      <input
                        id={fieldId}
                        readOnly
                        value={promo.url}
                        className="w-full min-w-0 min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => copyLink(fieldId, copyKey, promo.url)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/40 px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {copied === copyKey ? "Copied" : "Copy"}
                    </button>
                  </div>
                );
              })}
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
