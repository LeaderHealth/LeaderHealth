"use client";

import { useCart } from "./CartProvider";

export function CartButton({ compact = false }: { compact?: boolean }) {
  const { count, ready, openCart } = useCart();
  const visibleCount = ready ? count : 0;

  return (
    <button
      type="button"
      aria-label={visibleCount ? `Open cart, ${visibleCount} items` : "Open cart"}
      onClick={openCart}
      className={`relative grid place-items-center rounded-full bg-white/15 transition-[transform,background-color] duration-200 ease-out hover:scale-[1.06] hover:bg-white/25 active:scale-95 ${compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-10"}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M6.5 8.5h11l-.8 9.2a2 2 0 0 1-2 1.8H9.3a2 2 0 0 1-2-1.8L6.5 8.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {visibleCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-medium text-ink">
          {visibleCount}
        </span>
      ) : null}
    </button>
  );
}
