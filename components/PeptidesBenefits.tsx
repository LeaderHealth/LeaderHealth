import { AccordionGallery } from "@/components/AccordionGallery";
import { assets } from "@/lib/content/site";

const panels = [
  {
    title: "Metabolic Health",
    description: "Weight management, body composition, and metabolic support",
    image: assets.peptidesMetabolic,
    alt: "Woman in a pink shirt and apron chopping vegetables in a bright kitchen",
    objectPosition: "center 42%",
  },
  {
    title: "Strength & Recovery",
    description: "Muscle support, physical performance, and post-training recovery",
    image: assets.peptidesStrength,
    alt: "Man resting after a workout with a towel over his shoulder",
    objectPosition: "center 40%",
  },
  {
    title: "Rest & Resilience",
    description: "Sleep quality, stress support, and mental clarity",
    image: assets.peptidesRest,
    alt: "Woman sitting up in bed with her eyes closed in morning light",
    objectPosition: "center 45%",
  },
  {
    title: "Healthy Aging",
    description: "Cellular health, skin health, and overall vitality",
    image: assets.peptidesAging,
    alt: "Older man smiling in a garden",
    objectPosition: "62% center",
  },
  {
    title: "Sexual Wellness",
    description: "Libido, arousal, and intimate wellness support",
    image: assets.peptidesSexual,
    alt: "Couple standing close with their foreheads touching",
    objectPosition: "center 35%",
  },
];

export function PeptidesBenefits() {
  return (
    <section className="bg-[#f7f3f4] pb-16 pt-12 md:pb-20 md:pt-16">
      <header className="mx-auto max-w-[46rem] px-6 text-center">
        <h2 className="font-sans text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#d14b5c] sm:text-[40px] md:text-[46px]">
          What Can Peptides Do For You?
        </h2>
        <p className="mx-auto mt-4 max-w-[40rem] text-[15px] leading-snug text-[#1c1412] sm:text-[17px] md:text-[18px]">
          Peptides are short chains of amino acids that work with your body&apos;s natural signaling processes
          to help support your health and wellness
        </p>
      </header>
      <div className="mt-8 md:mt-10">
        <AccordionGallery panels={panels} label="What peptides can support" />
      </div>
    </section>
  );
}
