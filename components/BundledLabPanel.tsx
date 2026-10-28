"use client";

import { cartItemFromLab } from "@/lib/cart/items";
import { useCart } from "@/components/cart/CartProvider";
import { getProduct, labs, type Lab } from "@/lib/content/products";

const panelsBySlug: Record<string, Array<"complete" | "advanced">> = {
  "women-hormone-therapy": ["complete", "advanced"],
  "men-trt-testosterone-cypionate": ["complete"],
  "men-trt-testosterone-cream": ["complete"],
  "men-trt-enclomiphene": ["complete", "advanced"],
  "women-hormone-therapy-estradiol-pill": ["complete", "advanced"],
  "women-hrt-testosterone-cream": ["complete"],
  "women-hrt-testosterone-injection-low-dose": ["complete"],
};

const panelSlug = {
  complete: "labs-complete-panel",
  advanced: "labs-advance-panel",
} as const;

const labelClass =
  "shrink-0 rounded-full bg-[#F2C6C3] px-3 py-1 font-sans text-[12px] font-medium text-[#331110]";

const threeMonthPrice: Record<string, string> = {
  "men-trt-testosterone-cypionate": "$109 per month. Billed $327 every 3 months.",
  "men-trt-enclomiphene": "$109 per month. Billed $327 every 3 months.",
};

function genderFor(slug: string) {
  const audience = getProduct(slug)?.audience;
  if (audience === "men") return "Men";
  if (audience === "women") return "Women";
  return null;
}

function AddLabButton({ lab, gender }: { lab: Lab; gender: "Men" | "Women" }) {
  const { items, addItem } = useCart();
  const item = cartItemFromLab(lab, gender);
  const inCart = items.some((entry) => entry.id === item.id);

  return (
    <button
      type="button"
      disabled={inCart}
      onClick={() => {
        if (inCart) return;
        addItem(item);
      }}
      className="flex w-full items-center justify-center rounded-[10px] bg-[#F7F3F5] px-3 py-2.5 font-sans text-[12px] font-medium tracking-[0.04em] text-[#331110] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:bg-[#F7F3F5] disabled:text-[#331110] disabled:opacity-100 motion-reduce:transition-none"
    >
      {inCart ? `${lab.name} in cart` : `Add ${lab.name} · ${lab.price}`}
    </button>
  );
}

export function BundledLabPanel({ slug }: { slug: string }) {
  const panels = panelsBySlug[slug];
  const gender = genderFor(slug);
  if (!panels || !gender) return null;

  const offered = panels.flatMap((panel) => {
    const lab = labs.find((item) => item.slug === panelSlug[panel]);
    return lab ? [lab] : [];
  });

  return (
    <div className="mt-5 overflow-hidden rounded-[16px] border border-white/35 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-xl">
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
      {offered.length > 0 && (
        <div className="mx-4 mb-3.5 border-t border-dotted border-white/40 pt-3">
          <p className="font-sans text-[12px] leading-snug text-white/70">
            No results yet? Add a panel to your cart instead.
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {offered.map((lab) => (
              <AddLabButton key={lab.slug} lab={lab} gender={gender} />
            ))}
          </div>
        </div>
      )}
      {threeMonthPrice[slug] ? (
        <>
          <div className="mx-4 border-t border-dotted border-white/40" />
          <div className="px-4 py-3.5">
            <p className="font-sans text-[15px] font-semibold leading-tight">Medication</p>
            <p className="mt-0.5 font-sans text-[13px] leading-snug text-white/80">{threeMonthPrice[slug]}</p>
          </div>
        </>
      ) : null}
      <div className="mx-4 border-t border-dotted border-white/40" />
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0">
          <p className="font-sans text-[15px] font-semibold leading-tight">Provider consultation</p>
          <p className="mt-0.5 font-sans text-[13px] leading-snug text-white/80">
            No charge, before anything is prescribed
          </p>
        </div>
        <span className={labelClass}>Free</span>
      </div>
    </div>
  );
}
