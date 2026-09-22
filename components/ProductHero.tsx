import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/content/products";
import { ProductHeroCta } from "./ProductHeroCta";

const defaultDisclaimer =
  "Compounded medication. Not FDA approved. This medicine is prepared for you by a licensed U.S. compounding pharmacy on your prescriber's order. FDA does not review compounded medications for safety, effectiveness, or quality before they are sold. Leader Health is not a pharmacy and does not make or dispense medications. The pharmacy that fills your prescription is identified on the medication you receive.";

export function productEyebrow(product: Product) {
  if (product.eyebrow) return product.eyebrow;
  if (product.category === "weight-loss") return "Weight Loss";
  if (product.category === "sexual") return "Sexual Health";
  if (product.category === "longevity") return "Longevity";
  if (product.audience === "women") return "Women HRT";
  if (product.audience === "men") return "Hormone Therapy";
  return "Treatment";
}

export function ProductHero({ product }: { product: Product }) {
  const badge = product.badge ?? (product.disclaimer?.toLowerCase().includes("fda approved") ? undefined : "Medication");

  return (
    <section className="relative bg-gradient-to-b from-[#d07a7c] to-[#a24b4e] pb-16 pt-28 text-white">
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-6 lg:grid-cols-[1fr_minmax(320px,440px)]">
        <div className="flex min-h-[480px] flex-col items-center justify-center">
          <Image
            src={product.image}
            alt={product.name}
            width={785}
            height={995}
            className="mx-auto h-[min(58vh,520px)] w-auto object-contain drop-shadow-2xl"
            sizes="(max-width: 1024px) 80vw, 480px"
            priority
          />
          <p className="mt-6 text-center text-[13px] text-white/80">
            Illustration only. Actual medication and label may vary.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/25 bg-white/14 p-7 shadow-xl backdrop-blur-md md:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-2 text-sm">
              <span className="font-medium">4.8</span>
              <span className="tracking-tight text-[#ff5a5a]">★★★★★</span>
            </p>
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/85">HSA / FSA</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px]">{productEyebrow(product)}</span>
            {badge && <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px]">{badge}</span>}
          </div>
          <h1 className="mt-3 text-[40px] leading-none">{product.name}</h1>
          <p className="mt-4 font-serif-italic text-[12px] leading-relaxed text-white/88">
            {product.disclaimer ?? defaultDisclaimer}
          </p>
          <div className="mt-4 space-y-3 text-[14px] leading-relaxed">
            {(product.paragraphs ?? [product.description]).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            {product.highlight && <p className="font-medium">{product.highlight}</p>}
            {product.safety && <p className="text-[13px] text-white/90">{product.safety}</p>}
          </div>
          <ProductHeroCta product={product} />
          <Link
            href="/legal/important-safety-information"
            className="mt-3 block text-center font-serif-italic text-sm text-white/90"
          >
            Important Safety Info
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-14 grid max-w-5xl gap-8 px-6 text-center md:grid-cols-3">
        {product.benefits.map((b) => (
          <article key={b.title}>
            <h2 className="text-[17px] font-medium">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{b.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
