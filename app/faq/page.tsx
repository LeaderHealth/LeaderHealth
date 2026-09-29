import Link from "next/link";
import { TestimonialsVideoSection } from "@/components/TestimonialsVideoSection";
import { FaqBrowse } from "@/components/FaqBrowse";
import { FaqHero } from "@/components/FaqHero";
import { assets, testimonials } from "@/lib/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs" };

export default function FaqPage() {
  return (
    <div>
      <FaqHero />
      <FaqBrowse />
      <section className="bg-[#f7f3f5] py-14 md:py-20">
        <div className="mx-auto w-[95%] rounded-[28px] bg-[#EFCFD2]/51 px-6 py-12 text-center shadow-[0_12px_28px_rgba(50,17,16,0.06)] sm:px-10 sm:py-14 md:rounded-[32px] md:py-16">
          <h2 className="font-sans text-[28px] font-bold leading-tight text-[#1a1a1a] sm:text-[34px] md:text-[40px]">
            Still have questions?
          </h2>
          <p className="mx-auto mt-3 max-w-[36rem] font-sans text-[15px] leading-snug text-[#1a1a1a] sm:text-[17px] md:mt-4 md:text-[18px]">
            Can&apos;t find answer you&apos;re looking for? Please contact our team.
          </p>
          <Link
            href="/contact-us"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#2C1412] px-5 py-2.5 font-sans text-[14px] font-medium text-white transition-colors hover:bg-[#451816] md:mt-7"
          >
            Get in touch
          </Link>
        </div>
      </section>
      <TestimonialsVideoSection
        videoSrc={assets.heroVideoAlt}
        posterSrc={assets.weightlifting}
        testimonials={testimonials.map((item) => ({
          quote: item.quote,
          name: item.name,
          role: item.treatment,
          image: item.image,
        }))}
        showDots
        draggable
        initialIndex={1}
      />
    </div>
  );
}
