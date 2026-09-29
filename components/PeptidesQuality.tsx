import Image from "next/image";
import { IconHoverButton } from "@/components/IconHoverButton";
import { assets } from "@/lib/content/site";

const points = [
  "Every batch ships with a certificate of analysis from the compounding pharmacy",
  "A licensed provider reviews your history and labs before any prescription is issued",
  "Convenient delivery directly to your door",
  "Ongoing provider oversight, your dose is reviewed and adjusted over time",
];

function CheckIcon() {
  return (
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e43d4e] text-white">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M5 12.5 9.5 17 19 7.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function PeptidesQuality() {
  return (
    <section className="bg-[#f7f3f4] px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto grid w-full max-w-[1200px] bg-[#dcd0bc] md:grid-cols-2 md:items-stretch">
        <div className="relative order-2 mx-4 mb-5 aspect-[5/4] overflow-hidden rounded-2xl md:order-1 md:m-0 md:aspect-auto md:min-h-[620px] md:rounded-none">
          <Image
            src={assets.peptidesQuality}
            alt="Woman in profile in dappled sunlight, looking toward the right"
            fill
            className="object-cover object-[58%_38%]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="order-1 px-6 py-10 sm:px-8 md:order-2 md:flex md:flex-col md:justify-center md:px-10 md:py-14 lg:px-14 lg:py-16">
          <h2 className="font-sans text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[36px] lg:text-[44px]">
            <span className="text-[#e25564]">Quality You Can Trust.</span>{" "}
            <span className="text-[#2c1410]">Care You Can Feel Good About.</span>
          </h2>
          <p className="mt-5 max-w-[36rem] text-[15px] leading-snug text-[#2c1410] md:text-base">
            Our peptides are sourced from licensed compounding pharmacies and prescribed under the guidance of
            licensed medical providers, helping ensure:
          </p>
          <ul className="mt-6 space-y-5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckIcon />
                <p className="text-[15px] leading-snug text-[#2c1410] md:text-base">{point}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center md:justify-end">
            <IconHoverButton variant="accent">Start Assessment</IconHoverButton>
          </div>
        </div>
      </div>
    </section>
  );
}
