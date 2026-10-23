"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { isSellableLine, UNAVAILABLE_TREATMENT } from "@/lib/cart/items";
import { cartRuleIssue } from "@/lib/cart/rules";
import { cartCount, cartSubtotal, type CartItem } from "@/lib/cart/types";

const STORAGE_KEY = "lh-cart-v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  isOpen: boolean;
  rejection: string | null;
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
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.name && isSellableLine(item))
      : EMPTY_ITEMS;
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
  const [rejection, setRejection] = useState<string | null>(null);

  const addItem = useCallback((item: CartItem, options?: { open?: boolean }) => {
    if (!isSellableLine(item)) {
      setRejection(UNAVAILABLE_TREATMENT);
      if (options?.open !== false) setIsOpen(true);
      return;
    }
    const current = getCartSnapshot().items;
    const existing = current.find((entry) => entry.id === item.id);
    const next = existing
      ? current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                quantity: entry.quantity + (item.quantity || 1),
                clientProductId: item.clientProductId ?? entry.clientProductId,
              }
            : entry,
        )
      : [...current, { ...item, quantity: item.quantity || 1 }];
    const issue = cartRuleIssue(next);
    if (issue) {
      setRejection(issue);
      if (options?.open !== false) setIsOpen(true);
      return;
    }
    setRejection(null);
    commitCart(next);
    if (options?.open !== false) setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setRejection(null);
    commitCart(getCartSnapshot().items.filter((item) => item.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = getCartSnapshot().items;
    if (quantity < 1) {
      setRejection(null);
      commitCart(current.filter((item) => item.id !== id));
      return;
    }
    const next = current.map((item) => (item.id === id ? { ...item, quantity } : item));
    const issue = cartRuleIssue(next);
    if (issue) {
      setRejection(issue);
      return;
    }
    setRejection(null);
    commitCart(next);
  }, []);

  const clear = useCallback(() => {
    setRejection(null);
    commitCart([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      ready,
      isOpen,
      rejection,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [items, ready, isOpen, rejection, addItem, removeItem, setQuantity, clear],
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
