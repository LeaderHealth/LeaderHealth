import Image from "next/image";
import { IconHoverButton } from "@/components/IconHoverButton";
import { assets } from "@/lib/content/site";

export function AdvancedPeptidesHero() {
  return (
    <section className="relative h-[75svh] overflow-hidden bg-[#f4efe9] text-white">
      <Image
        src={assets.peptidesHero}
        alt="Glass dish of pink peptide serum with a dropper resting on the rim"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 34% 40% at 50% 52%, rgba(156, 64, 80, 0.58) 0%, rgba(186, 102, 112, 0.36) 40%, rgba(214, 150, 150, 0.12) 64%, rgba(244, 228, 224, 0) 78%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 text-center md:px-10">
        <div className="flex w-full max-w-[920px] flex-col items-center">
          <h1 className="font-sans text-[42px] font-medium leading-[0.95] tracking-[-0.035em] text-white sm:text-[56px] md:text-[72px] lg:text-[84px]">
            Peptides
          </h1>
          <p className="mt-4 max-w-[36rem] text-[15px] leading-snug text-white/95 sm:text-base md:mt-5 md:text-lg">
            Feel stronger, recover better, and support your long-term wellness with personalized peptide care.
          </p>
          <IconHoverButton variant="accent" className="mt-6 md:mt-8">
            Start Now
          </IconHoverButton>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#e33d4d]" />
    </section>
  );
}
