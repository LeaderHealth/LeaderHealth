"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { cartCount, cartSubtotal, type CartItem } from "@/lib/cart/types";

const STORAGE_KEY = "lh-cart-v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem, options?: { open?: boolean }) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_ITEMS: CartItem[] = [];
const SERVER_CART = { items: EMPTY_ITEMS, ready: false };

type CartSnapshot = { items: CartItem[]; ready: boolean };

let cartSnapshot: CartSnapshot | null = null;
const cartListeners = new Set<() => void>();

function parseStored(raw: string | null): CartItem[] {
  if (!raw) return EMPTY_ITEMS;
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.name) : EMPTY_ITEMS;
  } catch {
    return EMPTY_ITEMS;
  }
}

function emitCart() {
  cartListeners.forEach((listener) => listener());
}

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);
  return () => cartListeners.delete(listener);
}

function getCartSnapshot(): CartSnapshot {
  if (!cartSnapshot) cartSnapshot = { items: parseStored(localStorage.getItem(STORAGE_KEY)), ready: true };
  return cartSnapshot;
}

function commitCart(items: CartItem[]) {
  cartSnapshot = { items, ready: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* Persistence is best-effort; the in-memory cart still updates. */
  }
  emitCart();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useSyncExternalStore(subscribeCart, getCartSnapshot, () => SERVER_CART);
  const { items, ready } = cart;
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: CartItem, options?: { open?: boolean }) => {
    const current = getCartSnapshot().items;
    const existing = current.find((entry) => entry.id === item.id);
    const next = existing
      ? current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + (item.quantity || 1) } : entry,
        )
      : [...current, { ...item, quantity: item.quantity || 1 }];
    commitCart(next);
    if (options?.open !== false) setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    commitCart(getCartSnapshot().items.filter((item) => item.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = getCartSnapshot().items;
    commitCart(
      quantity < 1
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }, []);

  const clear = useCallback(() => commitCart([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      ready,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [items, ready, isOpen, addItem, removeItem, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
