"use client";

import Link from "next/link";
import { getProduct } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

const blends = {
  men: [
    {
      href: "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
      badge: "Recommended for men",
      name: "Arousal Blend",
      price: "$89/mo",
      body: "Supports physical performance and blood flow with a personalized combination of sildenafil, oxytocin, and B12. Ideal for men looking for on-demand support when desire is not the primary concern.",
      best: ["Achieving and maintaining erections", "Physical performance support", "An affordable entry-level treatment"],
      cta: "Start the Arousal Blend",
    },
    {
      href: "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)",
      badge: "Intimacy Blend",
      name: "Intimacy Blend",
      price: "$299/mo",
      body: "A more comprehensive treatment combining PT-141, tadalafil, and oxytocin to support both desire and physical performance. Ideal for men experiencing low libido or those looking for a longer-lasting, more spontaneous intimacy experience.",
      best: ["Reduced libido or low desire", "Physical performance and arousal", "Longer-lasting spontaneity"],
      cta: "Start the Intimacy Blend",
    },
  ],
  women: [
    {
      href: "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)",
      badge: "Recommended for women",
      name: "Intimacy Blend",
      price: "$299/mo",
      body: "Supports desire, arousal, and intimacy in one personalized treatment. Ideal for women experiencing low libido, reduced desire, or changes in sexual wellness who want a comprehensive solution.",
      best: ["Low libido or reduced desire", "Physical arousal support", "Longer-lasting spontaneity"],
      cta: "Start the Intimacy Blend",
    },
    {
      href: "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
      badge: "Arousal Blend",
      name: "Arousal Blend",
      price: "$89/mo",
      body: "A more affordable option focused on physical arousal and sensation. Best for women whose desire is already present but who are looking for additional physical support during intimacy.",
      best: ["Physical arousal support", "Enhanced sensation", "Entry-level treatment option"],
      cta: "Start the Arousal Blend",
    },
  ],
};

export function SexualHealthBlends({ audience }: { audience: "men" | "women" }) {
  return (
    <section className="mt-20">
      <p className="text-xs uppercase tracking-wider text-accent">Sexual health</p>
      <h2 className="mt-2 text-4xl">Find What Fits You</h2>
      <p className="mt-3 max-w-xl text-taupe">
        Personalized support for performance, arousal, and intimacy. Your licensed provider will determine the formula that is right for you.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {blends[audience].map((blend) => {
          const product = getProduct(blend.href.replace("/products/", ""));
          return (
          <article key={blend.href + blend.name} className="rounded-3xl bg-white p-6">
            <p className="text-xs uppercase tracking-wider text-accent">{blend.badge}</p>
            <h3 className="mt-2 text-2xl">{blend.name}</h3>
            <p className="mt-1 text-xl">{blend.price}</p>
            <p className="mt-4 text-sm leading-relaxed text-brown">{blend.body}</p>
            <p className="mt-4 text-xs uppercase tracking-wider text-taupe">Best for</p>
            <ul className="mt-2 space-y-1 text-sm text-brown">
              {blend.best.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {product ? (
                <AddToCartButton
                  item={cartItemFromProduct(product)}
                  className="w-auto px-5"
                  label="ADD TO CART"
                />
              ) : null}
              <Link href={blend.href} className="rounded-full px-4 py-2 text-sm underline">
                Learn more
              </Link>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
