"use client";

import { useCart } from "@/components/cart/CartProvider";
import { cartItemFromLab } from "@/lib/cart/items";
import { labs } from "@/lib/content/products";

const advancedLab = labs.find((lab) => lab.slug === "labs-advance-panel");

export function LabGenderButton({ gender }: { gender: "Men" | "Women" }) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() => {
        if (!advancedLab) return;
        addItem(cartItemFromLab(advancedLab, gender));
      }}
      className="group relative inline-flex h-[47px] min-w-[148px] items-center justify-center overflow-hidden rounded-[39px] bg-[#DF4452] px-[26px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#32120E] transition-transform duration-[400ms] ease-out group-hover:scale-[56] group-focus-visible:scale-[56] motion-reduce:scale-100! motion-reduce:transition-none"
      />
      <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] group-focus-visible:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
        For {gender}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] group-focus-visible:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
      >
        →
      </span>
    </button>
  );
}
