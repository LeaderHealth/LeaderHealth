"use client";

import { useState, type ReactNode } from "react";

export type AccountTrackingPromo = {
  code: string;
  discount: string;
  url: string;
};

const copyClass =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[#F7F3F2] px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

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
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1 break-all font-semibold">{value}</span>
      <button type="button" onClick={copy} className={copyClass} aria-label={copied ? `${label} copied` : `Copy ${label}`}>
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-[#F0E8E6] py-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-sm text-[#4A3A37]">{label}</dt>
      <dd className="min-w-0 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm leading-6 text-[#6B5A57]">{children}</p>;
}

export function AccountTracking({
  name,
  commission,
  viewRate,
  cookieDays,
  trackingLink,
  promos,
  unavailable,
}: {
  name: string;
  commission: string;
  viewRate: string;
  cookieDays: number;
  trackingLink: string;
  promos: AccountTrackingPromo[];
  unavailable: boolean;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <section aria-labelledby="link-tracking-title" className="flex flex-col gap-2 rounded-[24px] bg-white px-6 py-[22px]">
        <h3 id="link-tracking-title" className="text-lg font-semibold">
          Link tracking
        </h3>
        <dl>
          <Row label="Tracking link">
            <CopyValue value={trackingLink} label="tracking link" />
            <Note>
              <span className="text-ink">utm_campaign</span> is the affiliate ID. Opening it stores {name} for {cookieDays} days. If that visitor pays later, {name} is credited even when the order has no promo code.
            </Note>
          </Row>
          <Row label="Commission">{commission}</Row>
          <Row label="View rate">{viewRate}</Row>
          <Row label="Cookie duration">{cookieDays} days</Row>
        </dl>
      </section>

      <section aria-labelledby="promo-tracking-title" className="flex flex-col gap-2 rounded-[24px] bg-white px-6 py-[22px]">
        <h3 id="promo-tracking-title" className="text-lg font-semibold">
          Promo tracking
        </h3>
        {unavailable ? (
          <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px] text-[#4A3A37]">Promo codes are unavailable right now.</p>
        ) : promos.length === 0 ? (
          <p className="rounded-2xl bg-[#F7F3F2] px-4 py-3.5 text-[15px] text-[#4A3A37]">No promo code is assigned.</p>
        ) : (
          promos.map((promo) => (
            <dl key={promo.code}>
              <Row label="Promo code">
                <CopyValue value={promo.code} label={`${promo.code} promo code`} />
              </Row>
              <Row label="Discount">{promo.discount}</Row>
              <Row label="Promo commission">{commission}</Row>
              <Row label="Promo link">
                <CopyValue value={promo.url} label={`${promo.code} promo link`} />
                <Note>
                  Records the visit with <span className="text-ink">utm_campaign</span> set to {promo.code} and auto-fills {promo.code} on the products it covers. If the paid order includes {promo.code}, {name} is credited from that locked code.
                </Note>
              </Row>
            </dl>
          ))
        )}
      </section>
    </div>
  );
}
