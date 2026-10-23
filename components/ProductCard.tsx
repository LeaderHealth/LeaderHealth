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
  "weight-loss-semaglutide": 0.92,
  "weight-loss-tirzepatide": 0.92,
  "longevity-sermorelin": 1.31,
  "longevity-glutathione": 1.24,
  "longevity-nad": 0.92,
  "men-trt-testosterone-cypionate": 1.27,
  "men-trt-enclomiphene": 1,
  "men-trt-testosterone-cream": 2.19,
  "women-hormone-therapy": 1.31,
  "men-sexual-health-tadalafil": 1.25,
  "sexual-health-pt-141-nasal": 1.07,
  "men-sexual-health-trimix-injectable": 0.88,
  "men-sexual-health-combo-troches": 1.46,
  "women-sexual-health-combo-troches": 1.46,
  "women-hrt-testosterone-cream": 2.54,
  "women-hrt-testosterone-injection-low-dose": 1.15,
  "women-hormone-therapy-vaginal-estrogen-cream": 2.24,
  "women-hrt-vaginal-estrogen-suppository": 1.78,
  "women-hormone-therapy-estradiol-patch": 1.87,
  "women-hormone-therapy-estradiol-pill": 1.39,
  "women-hormone-therapy-progesterone-(oral)": 2.85,
  "oxytocin-nasal-spray": 0.82,
  "sildenafil-combo-troche-(sildenafil-oxytocin-b12)": 1.42,
  "intimacy-blend-(pt-141-oxytocin-tadalafil)": 1.36,
  "nad-injectable": 1.19,
  "longevity-nad-nasal-spray": 0.78,
};

const categoryLabel: Record<Product["category"], string> = {
  hormone: "Hormone therapy",
  sexual: "Sexual health",
  longevity: "Longevity",
  "weight-loss": "Weight loss",
};

export function ProductCard({ product }: { product: Product }) {
  const imageScale = cardImageScale[product.slug] ?? 1;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#32120E]/10 bg-white shadow-[0_14px_36px_rgba(50,18,14,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(50,18,14,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[4/5] overflow-hidden bg-[#f4e7e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_42%,rgba(255,255,255,0.72),transparent_70%)]" />
        <div className="absolute inset-x-5 top-14 bottom-16">
          <div
            className="relative h-full w-full origin-center scale-[var(--card-image-scale)] transition-transform duration-500 ease-out group-hover:scale-[calc(var(--card-image-scale)*1.04)] motion-reduce:transition-none"
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
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#32120E]/92 px-3 py-1.5 font-sans text-[10px] font-medium tracking-[0.16em] text-[#F7F3F5] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E23D4C]" aria-hidden />
            Lab required
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f4e7e8] via-[#f4e7e8]/90 to-transparent px-4 pt-8 pb-3.5">
          <IllustrationNote tone="dark" compact />
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-5 pt-5 pb-5">
        <Link
          href={`/products/${product.slug}`}
          className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E]"
        >
          <p className="font-sans text-[11px] font-medium tracking-[0.16em] text-[#E23D4C] uppercase">
            {categoryLabel[product.category]}
          </p>
          <h3
            className="font-geist mt-2 text-[22px] leading-[1.15] font-medium text-[#2c1614]"
            style={{ letterSpacing: "-0.03em" }}
          >
            {product.name}
          </h3>
          <p className="mt-2 font-sans text-[15px] text-[#32120E]/70">{product.price}</p>
        </Link>
        <div className="mt-auto pt-5">
          <AddToCartButton item={cartItemFromProduct(product)} variant="ink" />
        </div>
      </div>
    </article>
  );
}
