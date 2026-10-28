"use client";

import { cartItemFromLab } from "@/lib/cart/items";
import { useCart } from "@/components/cart/CartProvider";
import { labs, type Lab, type Product } from "@/lib/content/products";

const labProducts = new Set(["men-trt-testosterone-cypionate", "men-trt-enclomiphene"]);

const panelsBySlug: Record<string, Array<"complete" | "advanced">> = {
  "men-trt-testosterone-cypionate": ["complete"],
  "men-trt-enclomiphene": ["complete", "advanced"],
};

const panelSlug = {
  complete: "labs-complete-panel",
  advanced: "labs-advance-panel",
} as const;

const billingNote: Record<string, string> = {
  "men-trt-testosterone-cypionate": "Billed $327 every 3 months. Three-month start, then cancel anytime.",
  "men-trt-enclomiphene": "Billed $327 every 3 months. Three-month start, then cancel anytime.",
};

const planPrices: Record<string, Array<{ label: string; price: string }>> = {
  "longevity-nad": [
    { label: "1-month plan", price: "$149" },
    { label: "3-month plan, paid in full", price: "$408" },
  ],
};

const labelClass =
  "shrink-0 rounded-full bg-[#F2C6C3] px-3 py-1 font-sans text-[12px] font-medium text-[#331110]";

const cardClass =
  "overflow-hidden rounded-[16px] border border-white/35 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl";

function monthlyPrice(price: string) {
  const match = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return match ? `$${Number(match[1]) % 1 === 0 ? Number(match[1]).toFixed(0) : match[1]}/mo` : price;
}

function pricingNote(product: Product) {
  if (billingNote[product.slug]) return billingNote[product.slug];
  if (!product.highlight) return null;
  const withoutPrice = product.highlight
    .replace(/^(?:starting at\s+)?\$[\d,.]+\s*(?:\/\s*)?(?:month|mo)\.?,?\s*/i, "")
    .trim();
  if (!withoutPrice) return null;
  return withoutPrice.charAt(0).toUpperCase() + withoutPrice.slice(1);
}

function AddLabButton({ lab }: { lab: Lab }) {
  const { items, addItem } = useCart();
  const item = cartItemFromLab(lab, "Men");
  const inCart = items.some((entry) => entry.id === item.id);

  return (
    <button
      type="button"
      disabled={inCart}
      onClick={() => {
        if (inCart) return;
        addItem(item);
      }}
      className="flex w-full items-center justify-center rounded-[12px] bg-[#F7F3F5] px-3 py-3 font-sans text-[14px] font-medium text-[#331110] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-100 motion-reduce:transition-none"
    >
      {inCart ? `${lab.name} in cart` : `Add ${lab.name} · ${lab.price}`}
    </button>
  );
}

export function BundledLabPanel({ product }: { product: Product }) {
  const showCare = labProducts.has(product.slug);
  const panels = panelsBySlug[product.slug] ?? [];
  const offered = panels.flatMap((panel) => {
    const lab = labs.find((item) => item.slug === panelSlug[panel]);
    return lab ? [lab] : [];
  });
  const note = pricingNote(product);
  const plans = planPrices[product.slug];

  return (
    <div className="mt-5 space-y-3 text-white">
      {showCare ? (
        <div className={cardClass}>
          <div className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-4">
              <p className="font-sans text-[15px] font-semibold leading-tight">Labs required</p>
              <span className={labelClass}>Required</span>
            </div>
            <p className="mt-2 font-sans text-[14px] font-semibold leading-snug">
              Already have results? Upload them in the patient portal after checkout.
            </p>
            <p className="mt-1 font-sans text-[13px] leading-snug text-white/80">
              You can finish checkout without adding a lab.
            </p>
          </div>
          {offered.length > 0 ? (
            <div className="mx-4 mb-3.5 border-t border-dotted border-white/40 pt-3">
              <p className="font-sans text-[13px] leading-snug text-white/75">
                No results yet? Add a panel to your cart instead.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {offered.map((lab) => (
                  <AddLabButton key={lab.slug} lab={lab} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`${cardClass} px-4 py-3.5`}>
        <div className="flex items-start justify-between gap-4">
          <p className="font-sans text-[15px] font-semibold leading-tight">
            {showCare ? "Provider consultation" : "Provider review"}
          </p>
          <span className={labelClass}>Required</span>
        </div>
        <p className="mt-1 font-sans text-[13px] leading-snug text-white/80">
          {showCare ? (
            <>
              <span className="font-bold text-white">Free.</span> No charge, before anything is prescribed.
            </>
          ) : (
            <>
              <span className="font-bold text-white">Included.</span> After purchase, you will complete an intake form while your order continues through a provider-only-review pathway. You are not expected to have a 1:1 consultation.
            </>
          )}
        </p>
      </div>

      <div className="px-1 pt-2">
        <p className="font-sans text-[13px] font-medium tracking-[0.16em] text-white/80">PRICING</p>
        {plans ? (
          <div className="mt-3 space-y-2.5 border-b border-white/25 pb-3">
            {plans.map((plan) => (
              <div key={plan.label} className="flex items-center justify-between gap-4">
                <p className="font-sans text-[20px] font-semibold leading-tight">{plan.label}</p>
                <p className="shrink-0 font-sans text-[24px] font-semibold leading-none tracking-[-0.02em]">{plan.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex items-start justify-between gap-4 border-b border-white/25 pb-3">
            <div className="min-w-0">
              <p className="font-sans text-[20px] font-semibold leading-tight">Medication</p>
              {note ? <p className="mt-1.5 font-sans text-[16px] leading-snug text-white/85">{note}</p> : null}
            </div>
            <p className="shrink-0 font-sans text-[24px] font-semibold leading-none tracking-[-0.02em]">{monthlyPrice(product.price)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
