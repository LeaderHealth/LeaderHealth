"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PORTAL_URL } from "@/lib/content/site";
import { CHECKOUT_SUCCESS_KEY } from "@/lib/genhealth/types";
import { useCart } from "@/components/cart/CartProvider";

type SuccessPayload = {
  orderId?: string;
  productName?: string;
  magicLink?: string | null;
  email?: string;
  charged?: boolean;
};

const NEXT_STEPS = [
  { title: "Clinical review", body: "A licensed provider reviews your request and history." },
  { title: "Prescription", body: "If approved, your clinician writes the plan." },
  { title: "Discreet delivery", body: "Medication ships in plain packaging to your address." },
];

export function SuccessView() {
  const { clear } = useCart();
  const [payload, setPayload] = useState<SuccessPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_SUCCESS_KEY);
      if (raw) setPayload(JSON.parse(raw) as SuccessPayload);
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (payload) clear();
  }, [clear, payload]);

  const publicOrderId =
    payload?.orderId && !payload.orderId.startsWith("preview-") ? payload.orderId : null;

  return (
    <section className="relative bg-gradient-to-b from-[#d07a7c] to-[#a24b4e] pb-20 pt-32 text-white">
      <div className="mx-auto max-w-xl px-6">
        <div className="rounded-[28px] border border-white/25 bg-white/14 p-8 shadow-xl backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/80">Order received</p>
          <h1 className="mt-3 text-4xl md:text-5xl">
            You&apos;re all <span className="font-serif-italic">set</span>
          </h1>
          <p className="mt-4 text-white/88">
            {payload?.email
              ? `A confirmation is on its way to ${payload.email}. `
              : ""}
            {payload?.charged
              ? payload?.productName
                ? `We received payment for ${payload.productName} and submitted it for clinician review.`
                : "We received your payment and submitted your request for clinician review."
              : payload?.productName
                ? `We submitted ${payload.productName} for clinician review.`
                : "We submitted your request for clinician review."}{" "}
            A licensed provider will look it over before any prescription is written.
          </p>
          {publicOrderId ? <p className="mt-4 text-sm text-white/70">Order {publicOrderId}</p> : null}
          <ol className="mt-8 space-y-4">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-medium">{step.title}</span>
                  <span className="mt-1 block text-sm text-white/75">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            {payload?.magicLink ? (
              <a
                href={payload.magicLink}
                className="rounded-[10px] bg-[#dcd4bd] px-5 py-3 text-xs font-medium tracking-[0.08em] text-ink"
              >
                OPEN YOUR PORTAL
              </a>
            ) : (
              <a
                href={PORTAL_URL}
                className="rounded-[10px] bg-[#dcd4bd] px-5 py-3 text-xs font-medium tracking-[0.08em] text-ink"
              >
                PATIENT PORTAL
              </a>
            )}
            <Link href="/" className="rounded-[10px] border border-white/30 px-5 py-3 text-xs font-medium tracking-[0.08em]">
              BACK HOME
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
