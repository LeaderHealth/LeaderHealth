import Image from "next/image";
import type { Product } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

function SyringeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M9.5 2.5 13.5 6.5M8 4l4 4-6.5 6.5H2v-3.5L8 4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabletIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.4 4.4 11.6 11.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ProductVariants({ product }: { product: Product }) {
  if (!product.variants?.length) return null;

  return (
    <section id="find-what-fits" className="scroll-mt-28 bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-4xl md:text-[42px]">
          Find What <span className="font-serif-italic">Fits</span> You
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-taupe">
          Same goal, two paths. Each option is personalized to your body and backed by
          clinician support. Tell us what fits your routine, and your provider helps you land
          on the right one.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {product.variants.map((v) => {
            const sublingual = /sublingual|troche|nasal|pill|oral/i.test(
              `${v.eyebrow ?? ""} ${v.name}`,
            );
            return (
              <article
                key={v.name}
                className="overflow-hidden rounded-[16px] bg-[#331110] p-5 text-[#f7f3f5] md:p-6"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#f37477]">
                  {sublingual ? <TabletIcon /> : <SyringeIcon />}
                  {v.eyebrow ?? v.detail.split("·")[0]}
                </p>
                <h3 className="mt-3 font-serif-italic text-[32px] leading-none">{v.name}</h3>
                <p className="mt-2 text-sm text-white/75">
                  {v.detail.includes("·") ? v.detail.split("·").slice(1).join("·").trim() : v.detail}
                </p>
                <div className="mt-5 flex min-h-[220px] items-center justify-center overflow-hidden rounded-[14px] bg-[#4a201e]">
                  <Image
                    src={v.image ?? product.image}
                    alt={v.name}
                    width={640}
                    height={420}
                    className="h-[200px] w-auto object-contain"
                    sizes="400px"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {v.notes.map((n) => (
                    <span
                      key={n}
                      className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/85"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm text-white/70">
                  From{" "}
                  <span className="text-3xl font-medium text-white">
                    {v.priceAmount ?? v.price.match(/\$\d+/)?.[0] ?? v.price}
                  </span>{" "}
                  / month
                </p>
                <AddToCartButton
                  item={cartItemFromProduct(product, v)}
                  className="mt-4"
                  label="ADD TO CART"
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
