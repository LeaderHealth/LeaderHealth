"use client";

import { useCart } from "./CartProvider";
import type { CartItem } from "@/lib/cart/types";

type Props = {
  item: CartItem;
  className?: string;
  label?: string;
  variant?: "sand" | "ink";
};

export function AddToCartButton({ item, className = "", label = "ADD TO CART", variant = "sand" }: Props) {
  const { addItem } = useCart();
  const tone =
    variant === "ink"
      ? "rounded-full bg-[#32120E] text-[#F7F3F5] hover:bg-[#E23D4C] focus-visible:outline-white"
      : "rounded-[10px] bg-[#dcd4bd] text-ink hover:bg-white focus-visible:outline-[#32120E]";

  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className={`flex w-full items-center justify-center gap-2 py-3.5 text-xs font-medium tracking-[0.12em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${tone} ${className}`}
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}
