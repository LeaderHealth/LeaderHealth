"use client";

import Image from "next/image";
import { getLegal } from "@/lib/content/legal";
import { getProduct } from "@/lib/content/products";
import { HsaFsaBadge } from "@/components/HsaFsaBadge";
import { IllustrationNote } from "@/components/IllustrationNote";
import { ProductHeroCta } from "@/components/ProductHeroCta";
import { PriceCompare } from "@/components/PriceCompare";
import { SafetyInformationModal } from "@/components/SafetyInformationModal";

const benefits = [
  {
    title: "Desire support",
    body: "Designed to support sexual desire and interest as part of a more comprehensive approach to intimacy.",
  },
  {
    title: "Physical arousal support",
    body: "Supports the physical aspects of arousal alongside desire for a more complete approach to sexual wellness.",
  },
  {
    title: "Longer-lasting spontaneity",
    body: "Designed to provide extended support that may allow for greater flexibility and spontaneity around intimacy.",
  },
];
const compoundedDisclaimer =
  "Compounded medication. Not FDA approved. This medicine is prepared for you by a licensed U.S. compounding pharmacy on your prescriber's order. FDA does not review compounded medications for safety, effectiveness, or quality before they are sold. Leader Health is not a pharmacy and does not make or dispense medications. The pharmacy that fills your prescription is identified on the medication you receive.";

function Stars() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="relative inline-block h-[18px] w-[18px] shrink-0">
          <svg viewBox="0 0 24 24" className="h-full w-full">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="#e43d4e"
              opacity={index === 4 ? 0.35 : 1}
            />
          </svg>
          {index === 4 ? (
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full" style={{ clipPath: "inset(0 20% 0 0)" }}>
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill="#e43d4e"
              />
            </svg>
          ) : null}
        </span>
      ))}
    </span>
  );
}

export function IntimacyBlend() {
  const product = getProduct("intimacy-blend-(pt-141-oxytocin-tadalafil)");
  if (!product) return null;

  return (
    <SafetyInformationModal sections={getLegal("important-safety-information")?.sections ?? []}>
      {(trigger) => (
        <>
          <section className="bg-[linear-gradient(105deg,#e5616f_0%,#c2505c_46%,#6f2d31_100%)] px-[15px] pt-28 pb-20 text-white sm:px-6 lg:pt-32 lg:pb-24">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,493px)] lg:gap-16 xl:gap-24">
              <div className="flex flex-col items-center">
                <Image
                  src="/images/products/intimacy-blend.png"
                  alt={product.name}
                  width={574}
                  height={219}
                  priority
                  className="h-auto w-full max-w-[460px] object-contain drop-shadow-2xl lg:max-w-[520px]"
                  sizes="(max-width: 1024px) 80vw, 520px"
                />
                <IllustrationNote />
              </div>

              <div className="rounded-[28px] border border-white/25 bg-white/10 px-6 py-7 shadow-[0_22px_50px_-18px_rgba(51,17,16,0.45)] backdrop-blur-xl sm:px-8 sm:py-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#f7f3f4]">
                    <span>4.8</span>
                    <Stars />
                    <span className="sr-only">4.8 out of 5 stars</span>
                  </p>
                  <HsaFsaBadge />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px] text-white">Sexual Health</span>
                  <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px] text-white">Medication</span>
                </div>
                <h1 className="mt-3 text-balance font-geist text-[40px] leading-[0.95] font-semibold tracking-[-0.04em]">
                  {product.name}
                </h1>
                <p className="mt-4 font-serif-italic text-[12px] leading-relaxed text-white/88">{compoundedDisclaimer}</p>
                <div className="mt-5 space-y-4 text-[15px] leading-6 font-light text-[#f7f3f4] [&_strong]:font-semibold">
                  <p>{product.description}</p>
                  <p>
                    <strong>{product.price}</strong>
                  </p>
                </div>
                <ProductHeroCta product={product} />
                {trigger}
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-10 text-center sm:mt-20 lg:mt-24 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title}>
                  <h2 className="font-geist text-[18px] font-semibold !tracking-[0.03em] text-[#f7f3f4]">{benefit.title}</h2>
                  <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-relaxed text-[#f7f3f4]/90">{benefit.body}</p>
                </article>
              ))}
            </div>
          </section>

          <PriceCompare />
        </>
      )}
    </SafetyInformationModal>
  );
}
