import { AdvancedPeptidesHero } from "@/components/AdvancedPeptidesHero";
import { PeptidesBenefits } from "@/components/PeptidesBenefits";
import { PeptidesFaq } from "@/components/PeptidesFaq";
import { JsonLd } from "@/components/JsonLd";
import { peptideFaqs } from "@/lib/content/faqs";
import { buildFaqSchema } from "@/lib/seo/schema";
import { PeptidesHowItWorks } from "@/components/PeptidesHowItWorks";
import { PeptidesQuality } from "@/components/PeptidesQuality";
import { GET_STARTED_URL } from "@/lib/content/site";
import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = { title: "Peptides" };

export default function PeptidesPage() {
  return (
    <div>
      <JsonLd data={buildFaqSchema(peptideFaqs)} />
      <AdvancedPeptidesHero />
      <PeptidesBenefits />
      <PeptidesQuality />
      <PeptidesHowItWorks />
      <section className="bg-[#F7F3F4] py-14 md:py-20">
        <div
          className="mx-auto flex min-h-[368px] w-[91.17%] flex-col items-center justify-center gap-[43px] overflow-hidden rounded-[20px] px-6 py-10 text-center md:h-[368px] md:py-0"
          style={{
            background:
              "linear-gradient(314deg, rgb(239, 209, 214) -8%, rgb(221, 211, 190) 30%, rgb(221, 211, 190) 85%)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <h2
              className="text-[40px] leading-[1.2] sm:text-[47px]"
              style={{
                fontFamily: cormorant.style.fontFamily,
                fontWeight: 600,
                letterSpacing: 0,
                color: "#32120E",
              }}
            >
              Care that keeps going after checkout
            </h2>
            <p className="max-w-[576px] text-[21px] font-medium leading-[1.2] tracking-normal text-[#32120E]">
              Every protocol is reviewed, prescribed and adjusted by a licensed clinician
            </p>
          </div>
          <p className="max-w-[545px] text-[16px] font-normal leading-[1.2] tracking-normal text-[#5F4947]">
            Physicians, nurse practitioners, pharmacists, dietitians, and coaches share one chart, so your labs,
            your dose, and your goals stay in the same conversation.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href={GET_STARTED_URL}
              className="group relative inline-flex h-[47px] items-center justify-center overflow-hidden rounded-full bg-[#DF4452] px-7 text-base font-medium text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#32120E]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#32120E] transition-transform duration-[400ms] ease-out group-hover:scale-[56] group-focus-visible:scale-[56] motion-reduce:scale-100! motion-reduce:transition-none"
              />
              <span className="relative z-10 inline-flex items-center justify-center">
                <span>Start Assessment</span>
                <span
                  aria-hidden
                  className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-500 ease-[cubic-bezier(0.44,0,0.56,1)] group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100"
                >
                  <span className="min-w-0 overflow-hidden">
                    <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="none">
                      <path
                        d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
                        stroke="currentColor"
                        strokeWidth="2.15"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </span>
            </a>
            <p className="text-[16px] font-normal leading-[1.2] tracking-normal text-[#5F4947]">
              Takes about 5 minutes. No membership required to get your plan.
            </p>
          </div>
        </div>
      </section>
      <PeptidesFaq />
    </div>
  );
}
