"use client";

import Image from "next/image";
import type { Product } from "@/lib/content/products";
import { getLegal } from "@/lib/content/legal";
import { getProductSafety } from "@/lib/content/product-safety";
import { HsaFsaBadge } from "./HsaFsaBadge";
import { IllustrationNote } from "./IllustrationNote";
import { BundledLabPanel } from "./BundledLabPanel";
import { ProductHeroCta } from "./ProductHeroCta";
import { SafetyInformationModal } from "./SafetyInformationModal";

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

const tadalafilCover =
  "linear-gradient(339deg, #E43D4E 0%, #331110 100%)";
const oxytocinCover =
  "linear-gradient(105deg, #d85b69 0%, #b04a54 46%, #682a2d 100%)";
const pt141Cover =
  "linear-gradient(105deg, #e5616f 0%, #b84d58 48%, #562224 100%)";

export function ProductHero({ product }: { product: Product }) {
  const safetySections = getProductSafety(product.slug);
  const menHormoneCover = product.category === "hormone" && product.audience === "men";
  const redHeroCover = menHormoneCover || product.slug === "men-sexual-health-tadalafil";
  const oxytocinHero = product.slug === "oxytocin-nasal-spray";
  const pt141Hero = product.slug === "sexual-health-pt-141-nasal";
  const glutathioneHero = product.slug === "longevity-glutathione";
  const nadHero =
    product.slug === "longevity-nad" ||
    product.slug === "nad-injectable" ||
    product.slug === "longevity-nad-nasal-spray";
  const sermorelinHero = product.slug === "longevity-sermorelin";
  const nasalHero = oxytocinHero || pt141Hero;
  const pt141CoverHero =
    pt141Hero ||
    glutathioneHero ||
    product.slug === "weight-loss-semaglutide" ||
    product.slug === "weight-loss-tirzepatide";
  const heroCover = pt141CoverHero ? pt141Cover : oxytocinHero || nadHero || sermorelinHero ? oxytocinCover : redHeroCover ? tadalafilCover : undefined;

  return (
    <SafetyInformationModal
      notice={safetySections ? undefined : product.safety}
      sections={safetySections ?? getLegal("important-safety-information")?.sections ?? []}
    >
    {(trigger) => (
    <section
      className={`relative pb-16 pt-28 text-white ${heroCover ? "overflow-hidden" : "bg-gradient-to-b from-[#d07a7c] to-[#a24b4e]"}`}
      style={heroCover ? { backgroundImage: heroCover } : undefined}
    >
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-6 lg:grid-cols-[1fr_minmax(320px,440px)]">
        <div className="flex min-h-[480px] flex-col items-center justify-center">
          {menHormoneCover ? (
            <div className="relative mx-auto aspect-[363/623] w-full max-w-[363px] overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain object-center"
                sizes="363px"
                priority
              />
            </div>
          ) : (
          <Image
            src={product.image}
            alt={product.name}
            width={pt141Hero ? 208 : oxytocinHero ? 281 : glutathioneHero ? 249 : nadHero ? 819 : 785}
            height={pt141Hero ? 691 : oxytocinHero ? 948 : glutathioneHero ? 625 : nadHero ? 1024 : 995}
            className={`mx-auto w-auto object-contain drop-shadow-2xl ${nasalHero ? "h-[min(52vh,420px)]" : "h-[min(58vh,520px)]"}`}
            sizes="(max-width: 1024px) 80vw, 480px"
            priority
          />
          )}
          <IllustrationNote />
        </div>

        <div className="rounded-[28px] border border-white/25 bg-white/14 p-7 shadow-xl backdrop-blur-md md:p-8">
          <div className="flex justify-end">
            <HsaFsaBadge />
          </div>
          <p className="mt-5 text-[13px] text-white/90">{productEyebrow(product)}</p>
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
          <BundledLabPanel slug={product.slug} />
          <ProductHeroCta product={product} />
          {trigger}
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
    )}
    </SafetyInformationModal>
  );
}
