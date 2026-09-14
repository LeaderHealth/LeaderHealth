import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/content/products";
import { GET_STARTED_URL } from "@/lib/content/site";

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
  const cta = product.variants ? "CHOOSE YOUR TREATMENT" : "START NOW";
  const ctaHref = product.variants ? "#find-what-fits" : GET_STARTED_URL;

  return (
    <section className="relative overflow-hidden bg-coral pb-16 pt-28 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[520px] flex-col justify-end">
          <Image
            src={product.image}
            alt={product.name}
            width={720}
            height={720}
            className="mx-auto h-[min(62vh,560px)] w-auto object-contain drop-shadow-2xl"
            priority
          />
          <p className="mt-6 text-center font-serif-italic text-sm text-white/85">
            Illustration only. Actual medication and label may vary.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/20 bg-white/12 p-7 shadow-xl backdrop-blur-md md:p-9">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-2 text-sm">
              <span className="font-medium">4.8</span>
              <span className="text-white">★★★★★</span>
            </p>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] uppercase tracking-wider">
              HSA / FSA
            </span>
          </div>
          <p className="mt-6 text-sm text-white/90">{productEyebrow(product)}</p>
          {product.badge && <p className="text-sm text-white/80">{product.badge}</p>}
          <h1 className="mt-2 text-4xl leading-none md:text-[52px]">{product.name}</h1>
          <p className="mt-5 font-serif-italic text-[13px] leading-relaxed text-white/90">
            {product.disclaimer ?? defaultDisclaimer}
          </p>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed">
            {(product.paragraphs ?? [product.description]).map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            {product.highlight && <p>{product.highlight}</p>}
            {product.safety && <p>{product.safety}</p>}
          </div>
          <a
            href={ctaHref}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-medium tracking-wide text-ink"
          >
            {cta}
            <span aria-hidden>→</span>
          </a>
          <Link
            href="/legal/important-safety-information"
            className="mt-4 block text-center font-serif-italic text-sm text-white/90"
          >
            Important Safety Info
          </Link>
        </div>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-6xl gap-10 px-6 text-center md:grid-cols-3">
        {product.benefits.map((b) => (
          <article key={b.title}>
            <h2 className="text-lg font-medium">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{b.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
