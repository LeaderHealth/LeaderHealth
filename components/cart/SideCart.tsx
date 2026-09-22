"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/genhealth/types";

export function SideCart() {
  const router = useRouter();
  const pathname = usePathname();
  const { items, isOpen, closeCart, removeItem, setQuantity, subtotal, count } = useCart();
  const onCheckout = pathname.startsWith("/checkout");

  function go(href: string) {
    if (href === pathname || (href === "/checkout" && onCheckout)) {
      closeCart();
      return;
    }
    router.push(href);
    closeCart();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[70] bg-ink/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[420px] flex-col bg-[#f7f3f5] text-ink shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div className="flex items-center justify-between px-6 pb-4 pt-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Your bag</p>
                <h2 className="mt-1 text-3xl">
                  Cart <span className="font-serif-italic text-accent">{count}</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg"
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-6 pb-4">
              {items.length === 0 ? (
                <div className="rounded-[24px] bg-white p-6">
                  <p className="text-brown">Your cart is empty.</p>
                  <button
                    type="button"
                    onClick={() => go("/shop-all-products")}
                    className="mt-4 inline-flex rounded-[10px] bg-[#dcd4bd] px-4 py-2.5 text-xs font-medium tracking-[0.08em] text-ink"
                  >
                    SHOP TREATMENTS
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="flex gap-3 rounded-[22px] bg-white p-3">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[16px] bg-[#f3e6e8]">
                      <Image src={item.image} alt="" fill className="object-contain p-2" sizes="80px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => go(item.href)}
                        className="block text-left text-[15px] leading-tight"
                      >
                        {item.name}
                      </button>
                      <p className="mt-1 text-sm text-taupe">{item.priceLabel}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-full bg-background">
                          <button
                            type="button"
                            className="h-8 w-8 text-lg"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease ${item.name}`}
                          >
                            –
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            className="h-8 w-8 text-lg"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-taupe underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="border-t border-ink/10 bg-white px-6 py-5">
              <div className="flex items-end justify-between">
                <p className="text-sm text-taupe">Subtotal</p>
                <p className="text-2xl">{formatPrice(subtotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => go("/checkout")}
                className="mt-4 flex w-full items-center justify-center rounded-[10px] bg-ink py-3.5 text-xs font-medium tracking-[0.08em] text-white"
              >
                {onCheckout ? "BACK TO CHECKOUT" : items.length ? "CONTINUE TO CHECKOUT" : "START CHECKOUT"}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
