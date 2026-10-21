"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

function productIds(search: string) {
  return new URLSearchParams(search).getAll("product").filter(Boolean);
}

function sameProducts(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((id, index) => id === b[index]);
}

export function CheckoutCartSync() {
  const { items, ready } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const seen = useRef<string | null>(null);
  const request = useRef(0);
  const lineKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (!ready || pathname !== "/checkout") return;
    if (seen.current === null) {
      seen.current = lineKey;
      return;
    }
    if (seen.current === lineKey) return;
    seen.current = lineKey;
    const generation = ++request.current;
    const snapshot = items;

    async function sync() {
      const current = productIds(window.location.search);
      if (!snapshot.length) {
        if (!current.length) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("product");
        const query = params.toString();
        router.replace(query ? `/checkout?${query}` : "/checkout", { scroll: false });
        return;
      }

      let data: { ok?: boolean; url?: string };
      try {
        const response = await fetch("/api/cart/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: snapshot.map((item) => ({
              slug: item.slug,
              name: item.name,
              variant: item.variant,
              quantity: item.quantity,
              clientProductId: item.clientProductId,
            })),
          }),
        });
        data = (await response.json()) as { ok?: boolean; url?: string };
      } catch {
        return;
      }
      if (generation !== request.current) return;
      if (!data.ok || typeof data.url !== "string") return;
      const nextIds = new URL(data.url, window.location.origin).searchParams.getAll("product");
      if (sameProducts(current, nextIds)) return;
      router.replace(data.url, { scroll: false });
    }

    void sync();
  }, [ready, pathname, lineKey, items, router]);

  return null;
}
