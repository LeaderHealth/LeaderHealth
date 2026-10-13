"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { IllustrationNote } from "@/components/IllustrationNote";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

// Artwork fills a different share of each source file. Scale so every product
// occupies about the same area inside the card.
const cardImageScale: Record<string, number> = {
  "weight-loss-semaglutide": 1.12,
  "weight-loss-tirzepatide": 1.15,
  "longevity-sermorelin": 0.72,
  "longevity-glutathione": 0.72,
  "longevity-nad": 0.72,
  "men-trt-testosterone-cypionate": 0.78,
  "men-trt-enclomiphene": 0.86,
  "men-trt-testosterone-cream": 0.86,
  "women-hormone-therapy": 1.15,
  "men-sexual-health-tadalafil": 1.15,
  "sexual-health-pt-141-nasal": 0.72,
  "men-sexual-health-trimix-injectable": 0.76,
  "men-sexual-health-combo-troches": 0.76,
  "women-sexual-health-combo-troches": 0.76,
  "women-hrt-testosterone-cream": 1.15,
  "women-hrt-testosterone-injection-low-dose": 0.78,
  "women-hormone-therapy-vaginal-estrogen-cream": 1.15,
  "women-hrt-vaginal-estrogen-suppository": 1.15,
  "women-hormone-therapy-estradiol-patch": 0.72,
  "women-hormone-therapy-estradiol-pill": 0.72,
  "women-hormone-therapy-progesterone-(oral)": 0.72,
  "oxytocin-nasal-spray": 0.72,
  "sildenafil-combo-troche-(sildenafil-oxytocin-b12)": 0.76,
  "intimacy-blend-(pt-141-oxytocin-tadalafil)": 0.72,
  "nad-injectable": 0.72,
  "longevity-nad-nasal-spray": 0.72,
};

export function ProductCard({ product }: { product: Product }) {
  const imageScale = cardImageScale[product.slug] ?? 1;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative aspect-[4/5] bg-[#f3e6e8]">
        <div className="absolute inset-x-6 top-12 bottom-14">
          <div
            className="relative h-full w-full origin-center scale-[var(--card-image-scale)] transition-transform duration-300 ease-out group-hover:scale-[calc(var(--card-image-scale)*1.02)] motion-reduce:transition-none"
            style={{ "--card-image-scale": imageScale } as CSSProperties}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain object-center"
            />
          </div>
        </div>
        {product.labRequired && (
          <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs text-white">
            Lab required
          </span>
        )}
        <IllustrationNote tone="dark" className="absolute inset-x-0 bottom-3 mt-0" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-2xl">{product.name}</h3>
          <p className="mt-2 text-sm text-brown">{product.price}</p>
        </Link>
        <div className="mt-auto pt-5">
          <AddToCartButton item={cartItemFromProduct(product)} />
        </div>
      </div>
    </article>
  );
}
