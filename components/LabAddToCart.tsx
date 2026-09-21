"use client";

import { labs } from "@/lib/content/products";
import { cartItemFromLab } from "@/lib/cart/items";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function LabAddToCart({ slug }: { slug: string }) {
  const lab = labs.find((item) => item.slug === slug);
  if (!lab) return null;
  return <AddToCartButton item={cartItemFromLab(lab)} className="mt-8 max-w-xs" />;
}
