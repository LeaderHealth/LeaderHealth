import Image from "next/image";
import { assets } from "@/lib/content/site";

export function FaqHero() {
  return (
    <section className="relative h-[75svh] overflow-hidden bg-[#c4a882] text-white">
      <Image
        src={assets.faqHero}
        alt="Person in red sweatpants tying a beige sneaker on a wooden floor, with a watch and rolled towel beside them"
        fill
        priority
        className="object-cover object-[center_58%]"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 42% 36% at 50% 58%, rgba(48, 24, 16, 0.38) 0%, rgba(48, 24, 16, 0.16) 46%, rgba(48, 24, 16, 0) 74%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 text-center md:px-10">
        <div className="flex w-full max-w-[40rem] flex-col items-center">
          <h1 className="font-sans text-[42px] font-medium leading-[0.95] tracking-[-0.035em] text-white sm:text-[56px] md:text-[72px] lg:text-[84px]">
            FAQs
          </h1>
          <p className="mt-4 max-w-[34rem] text-[15px] leading-snug text-white/95 sm:text-base md:mt-5 md:text-lg">
            We&apos;ve made it easy to understand how our service works for you, offering clear answers and
            reliable guidance whenever you need helpful support
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#e33d4d]" />
    </section>
  );
}
