import Image from "next/image";
import { IconHoverButton } from "@/components/IconHoverButton";
import { assets } from "@/lib/content/site";

export function EnergyLongevityHero() {
  return (
    <section className="relative flex min-h-[640px] items-center overflow-hidden bg-ink text-white h-[88svh] max-h-[920px]">
      <Image
        src={assets.energyHero}
        alt="Couple cycling along a coastal mountain road at sunset"
        fill
        priority
        className="object-cover object-[42%_center]"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 8, 8, 0.18) 0%, rgba(20, 8, 8, 0.22) 50%, rgba(20, 8, 8, 0.32) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[920px] flex-col items-center px-6 pt-16 text-center md:px-10">
        <h1 className="font-sans text-[42px] font-medium leading-[0.95] tracking-[-0.035em] text-white sm:text-[56px] md:text-[72px] lg:text-[84px]">
          Energy &amp;
          <br />
          Longevity
        </h1>
        <p className="mt-4 max-w-[34rem] text-[15px] leading-snug text-white/90 sm:text-base md:mt-5 md:text-lg">
          Keep your energy up and invest in your long-term health.
        </p>
        <IconHoverButton variant="accent" className="mt-6 md:mt-8">
          Start Now
        </IconHoverButton>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#e33d4d]" />
    </section>
  );
}
