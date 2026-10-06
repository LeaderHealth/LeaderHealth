"use client";

import type { MouseEvent } from "react";
import type { Product } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ChooseTreatmentButton({
  href,
  onClick,
  className,
}: {
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-ink transition-colors duration-200 hover:bg-[#efe6d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${className ?? ""}`}
    >
      CHOOSE YOUR TREATMENT
      <svg viewBox="0 0 12 12" className="size-2.5 shrink-0" fill="none" aria-hidden>
        <path
          d="M2.25 4.25 6 8 9.75 4.25"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

export function ProductHeroCta({ product }: { product: Product }) {
  if (product.variants?.length) {
    return <ChooseTreatmentButton href="#find-what-fits" className="mt-7" />;
  }

  return (
    <div className="mt-7">
      <AddToCartButton item={cartItemFromProduct(product)} />
    </div>
  );
}
