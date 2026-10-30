"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import { cartLineId, parsePriceAmount, type CartItem } from "@/lib/cart/types";
import type { Product } from "@/lib/content/products";

type PlanOffer = {
  term: "1m" | "3m";
  rowLabel: string;
  rowPrice: string;
  title: string;
  badge: string;
  badgeTone: "pill" | "quiet";
  perMonth: string;
  billedToday: string;
  note: string;
};

const planOffers: Record<string, PlanOffer[]> = {
  "longevity-nad": [
    {
      term: "1m",
      rowLabel: "1-month plan",
      rowPrice: "$149/mo",
      title: "1 MONTH",
      badge: "Most flexible",
      badgeTone: "quiet",
      perMonth: "$149",
      billedToday: "$149",
      note: "Renews at $149 every month. Cancel anytime.",
    },
    {
      term: "3m",
      rowLabel: "3-month plan, paid in full",
      rowPrice: "$136/mo",
      title: "3 MONTHS",
      badge: "Save $39 vs. monthly",
      badgeTone: "pill",
      perMonth: "$136",
      billedToday: "$408",
      note: "Renews at $408 every 3 months. Cancel anytime after your first 3 months.",
    },
  ],
};

export function productOffersPlans(slug: string) {
  return Boolean(planOffers[slug]);
}

export function plansFor(slug: string) {
  return planOffers[slug] ?? null;
}

function planCartItem(product: Product, plan: PlanOffer): CartItem | null {
  const clientProductId = plan.term === "3m" ? product.threeMonthProductId : product.clientProductId;
  if (!clientProductId) return null;
  const name = plan.term === "1m" ? "1-month plan" : "3-month plan";
  return {
    id: cartLineId(product.slug, name),
    slug: product.slug,
    name: product.name,
    href: `/products/${product.slug}`,
    image: product.image,
    priceLabel: `${name} · ${plan.billedToday}`,
    amount: parsePriceAmount(plan.billedToday),
    quantity: 1,
    clientProductId,
  };
}

const CLOSE_MS = 280;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PlanAddToCart({ product }: { product: Product }) {
  const plans = plansFor(product.slug);
  const { items, addItem, removeItem, openCart } = useCart();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const titleId = useId();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<"closed" | "open">("closed");
  const [entered, setEntered] = useState(false);
  const choices = plans ? [...plans].sort((a, b) => Number(b.term === "3m") - Number(a.term === "3m")) : [];

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
    closeTimer.current = window.setTimeout(() => setPhase("closed"), prefersReducedMotion() ? 0 : CLOSE_MS);
  }

  useEffect(() => {
    if (!entered) return;
    dialogRef.current?.focus();
  }, [entered]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "open") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setEntered(false);
      triggerRef.current?.focus();
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => setPhase("closed"), prefersReducedMotion() ? 0 : CLOSE_MS);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [phase]);

  if (!plans) return null;

  function choose(plan: PlanOffer) {
    const item = planCartItem(product, plan);
    if (!item) return;
    const current = items.filter((entry) => entry.slug === product.slug);
    for (const entry of current) {
      if (entry.id !== item.id) removeItem(entry.id);
    }
    if (current.some((entry) => entry.id === item.id)) openCart();
    else addItem(item);
    closeDialog();
  }

  const dialog = (
    <div className={phase === "closed" ? "pointer-events-none invisible" : undefined}>
      <button
        type="button"
        aria-label="Close plan choices"
        onClick={closeDialog}
        className={`fixed inset-0 z-[90] bg-[#331110]/45 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={phase !== "open"}
        tabIndex={-1}
        className={`fixed top-1/2 left-1/2 z-[91] max-h-[min(90vh,760px)] w-[min(520px,calc(100%-2rem))] -translate-x-1/2 overflow-y-auto rounded-[24px] bg-[#f7f4f2] p-5 text-[#32120E] shadow-[0_24px_80px_rgba(51,17,16,0.22)] transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none motion-reduce:transition-none sm:p-6 ${
          entered
            ? "-translate-y-1/2 scale-100 opacity-100"
            : "pointer-events-none -translate-y-[46%] scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-sans text-[26px] leading-none font-semibold tracking-[-0.03em]">
            Choose your plan
          </h2>
          <button
            type="button"
            onClick={closeDialog}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xl leading-none text-[#32120E]/70 transition-colors duration-200 hover:bg-white motion-reduce:transition-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {choices.map((plan) => {
            const item = planCartItem(product, plan);
            const chosen = Boolean(item && items.some((entry) => entry.id === item.id));
            return (
              <button
                key={plan.term}
                type="button"
                onClick={() => choose(plan)}
                aria-pressed={chosen}
                className="group/plan w-full rounded-[18px] border border-[#e6dfd8] bg-white p-4 text-left shadow-[0_1px_0_rgba(50,18,14,0.04)] transition-colors duration-200 hover:border-[#32120E]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E] motion-reduce:transition-none"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid size-[18px] shrink-0 place-items-center rounded-full border border-[#c9c0b8] transition-colors duration-200 group-hover/plan:border-[#32120E] motion-reduce:transition-none"
                      aria-hidden
                    >
                      <span className="size-[8px] origin-center scale-0 rounded-full bg-[#32120E] opacity-0 transition-[scale,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/plan:scale-100 group-hover/plan:opacity-100 motion-reduce:transition-none" />
                    </span>
                    <span className="font-sans text-[14px] font-semibold tracking-[0.08em]">{plan.title}</span>
                  </span>
                  {plan.badgeTone === "pill" ? (
                    <span className="shrink-0 rounded-full bg-[#32120E] px-3 py-1 font-sans text-[12px] font-medium text-white">
                      {plan.badge}
                    </span>
                  ) : (
                    <span className="shrink-0 font-sans text-[13px] text-[#8a8178]">{plan.badge}</span>
                  )}
                </span>
                <span className="mt-4 grid grid-cols-2 gap-3">
                  <span className="rounded-[14px] border border-[#ece6e0] px-3 py-3">
                    <span className="block font-sans text-[12px] text-[#8a8178]">Per month</span>
                    <span className="mt-1 block font-sans text-[28px] leading-none font-semibold tracking-[-0.03em]">{plan.perMonth}</span>
                  </span>
                  <span className="rounded-[14px] bg-[#32120E] px-3 py-3 text-white">
                    <span className="block font-sans text-[12px] text-white/80">Billed today</span>
                    <span className="mt-1 block font-sans text-[28px] leading-none font-semibold tracking-[-0.03em]">{plan.billedToday}</span>
                  </span>
                </span>
                <span className="mt-3 block font-sans text-[13px] leading-snug text-[#5c534c]">{plan.note}</span>
                <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/plan:grid-rows-[1fr] group-focus-visible/plan:grid-rows-[1fr] motion-reduce:transition-none [@media(hover:none)]:grid-rows-[1fr]">
                  <span className="overflow-hidden">
                    <span className="mt-4 flex items-center justify-center rounded-[10px] bg-[#32120E] py-3 font-sans text-[13px] font-medium tracking-[0.08em] text-white opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/plan:opacity-100 group-focus-visible/plan:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100">
                      Selected
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-7">
        <p className="mb-3 font-sans text-[15px] leading-snug text-white/90">Pick your plan, cancel anytime.</p>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={phase === "open"}
          onClick={openDialog}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.12em] text-ink transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E] motion-reduce:transition-none"
        >
          ADD TO CART
          <span aria-hidden>→</span>
        </button>
      </div>
      {mounted ? createPortal(dialog, document.body) : null}
    </>
  );
}
