"use client";

import type { Product } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ProductHeroCta({ product }: { product: Product }) {
  if (product.variants?.length) {
    return (
      <a
        href="#find-what-fits"
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-ink"
      >
        CHOOSE YOUR TREATMENT
        <span aria-hidden className="text-[10px]">
          ▾
        </span>
      </a>
    );
  }

  return (
    <div className="mt-7">
      <AddToCartButton item={cartItemFromProduct(product)} />
    </div>
  );
}
