"use client";

import { useCart } from "./CartProvider";
import type { CartItem } from "@/lib/cart/types";

type Props = {
  item: CartItem;
  className?: string;
  label?: string;
};

export function AddToCartButton({ item, className = "", label = "ADD TO CART" }: Props) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className={`flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-ink transition hover:bg-white ${className}`}
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}
