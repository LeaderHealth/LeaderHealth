"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type BiomarkerCategory = {
  name: string;
  description: string;
  biomarkers: string[];
  image?: string;
  imageAlt?: string;
};

type BiomarkerRingProps = {
  eyebrow?: string;
  heading1?: string;
  heading2?: string;
  footerText?: string;
  buttonLabel?: string;
  buttonHref?: string;
  accentColor?: string;
  categories?: BiomarkerCategory[];
  defaultActiveIndex?: number;
  showBiomarkers?: boolean;
  enableAnimation?: boolean;
};

const defaultCategories: BiomarkerCategory[] = [
  {
    name: "Heart",
    description: "Lipids and particle counts that shape long-term cardiovascular risk.",
    biomarkers: ["LDL Cholesterol", "HDL Cholesterol", "Non-HDL Cholesterol", "Apolipoprotein B"],
    image: "/images/biomarker-heart.jpg",
    imageAlt: "Person meditating at sunrise beneath palm trees",
  },
  {
    name: "Weight & Metabolism",
    description: "How efficiently your body handles fuel — the engine behind weight change.",
    biomarkers: ["Hemoglobin A1c", "Fasting Insulin", "Uric Acid", "Glucose"],
    image: "/images/biomarker-weight.jpg",
    imageAlt: "Person stretching in a yoga pose at sunset",
  },
  {
    name: "Hormones & Thyroid",
    description: "The signals driving energy, drive, mood, and body composition.",
    biomarkers: ["Total Testosterone", "Free Testosterone", "Estradiol", "TSH"],
    image: "/images/biomarker-hormones.jpg",
    imageAlt: "Hands holding a dropper bottle",
  },
  {
    name: "Inflammation & Stress",
    description: "Chronic load your body carries, and how well it recovers from it.",
    biomarkers: ["hs-CRP", "Homocysteine", "DHEA-S", "White Blood Cell Count"],
    image: "/images/biomarker-inflammation.jpg",
    imageAlt: "Person sitting at the end of a dock on a mountain lake",
  },
  {
    name: "Liver & Kidney",
    description: "Filtration and processing — quiet systems that flag problems early.",
    biomarkers: ["ALT", "AST", "Creatinine", "eGFR"],
    image: "/images/biomarker-liver.jpg",
    imageAlt: "Glass medicine vials and an infusion bottle",
  },
  {
    name: "Immune Defense",
    description: "White cell balance showing how prepared your defenses are.",
    biomarkers: ["Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils"],
    image: "/images/biomarker-immune.jpg",
    imageAlt: "Stethoscope and blood pressure cuff on a white coat",
  },
  {
    name: "Nutrients",
    description: "The deficiencies most often mistaken for burnout or poor sleep.",
    biomarkers: ["Vitamin D", "Vitamin B12", "Ferritin", "Iron"],
    image: "/images/biomarker-nutrients.jpg",
    imageAlt: "Bowl of vegetables, eggs, and avocado on a wooden table",
  },
  {
    name: "Blood",
    description: "Oxygen delivery and clotting capacity across your whole system.",
    biomarkers: ["Hematocrit", "Red Blood Cell Count", "Hemoglobin", "Platelet Count"],
    image: "/images/biomarker-blood.jpg",
    imageAlt: "Gloved hands holding a sample dish in a laboratory",
  },
];

function point(index: number, count: number, radius: number) {
  const angle = ((-90 + (360 / count) * index) * Math.PI) / 180;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
  };
}

function CategoryButton({
  name,
  active,
  accent,
  onSelect,
  className,
}: {
  name: string;
  active: boolean;
  accent: string;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-left font-sans text-[13px] leading-none font-medium text-[#F7F3F5] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none max-[1099px]:px-2.5 max-[1099px]:text-[12px] ${
        active ? "shadow-[0_0_18px_rgba(227,61,77,0.45)]" : "border border-[#E33D4D]/45 bg-[#1a0c10]/80"
      } ${className ?? ""}`}
      style={active ? { backgroundColor: accent } : undefined}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${active ? "bg-white" : "bg-[#E33D4D]"}`} aria-hidden />
      {name}
    </button>
  );
}

export function BiomarkerRing({
  eyebrow = "8 health categories · 64 biomarkers",
  heading1 = "Health signals that",
  heading2 = "tell your unique story",
  footerText = "One blood draw, results in 2–5 days",
  buttonLabel = "Order the panel",
  buttonHref = "/labs/labs-complete-panel",
  accentColor = "#E33D4D",
  categories = defaultCategories,
  defaultActiveIndex = 0,
  showBiomarkers = true,
  enableAnimation = true,
}: BiomarkerRingProps) {
  const reduce = useReducedMotion();
  const count = Math.max(categories.length, 1);
  const initial = Math.min(Math.max(defaultActiveIndex, 0), count - 1);
  const [activeIndex, setActiveIndex] = useState(initial);
  const active = categories[Math.min(activeIndex, count - 1)] ?? categories[0];
  const motionOn = enableAnimation && !reduce;

  const ctaClass =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--ring-accent)] px-6 font-sans text-[13px] font-semibold tracking-[0.12em] text-[#F7F3F5] uppercase transition-colors duration-200 hover:bg-[#32120E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none";

  const cta = (
    <>
      <span>{buttonLabel}</span>
      <span aria-hidden>→</span>
    </>
  );

  return (
    <section className="bg-[#f7f3f5] px-4 py-8 sm:px-6 sm:py-12" style={{ "--ring-accent": accentColor } as CSSProperties}>
      <div className="mx-auto w-full max-w-[1180px] overflow-hidden rounded-[28px] bg-[#14080c] px-4 py-10 sm:px-8 sm:py-14">
        <header className="mx-auto max-w-[720px] text-center">
          <p className="font-sans text-[12px] font-medium tracking-[0.16em] text-[#F7F3F5]/70 uppercase sm:text-[13px]">{eyebrow}</p>
          <h2
            className="mt-4 text-[clamp(34px,4.4vw,52px)] leading-[1.02] font-normal text-[#F7F3F5]"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif", letterSpacing: "-0.02em" }}
          >
            <span className="block">{heading1}</span>
            <span className="font-serif-italic mt-1 block text-[#f0a3ab]">{heading2}</span>
          </h2>
        </header>

        <div className="mt-6 grid items-center gap-8 min-[1100px]:mt-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(280px,340px)] min-[1100px]:gap-2">
          <div className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[480px] min-[1100px]:max-w-[640px]!">
            <div
              aria-hidden
              className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle,rgba(227,61,77,0.5)_0%,rgba(227,61,77,0.16)_46%,transparent_70%)]"
            />
            <div
              aria-hidden
              className="absolute inset-[4%] rounded-full border border-[#E33D4D]/55 shadow-[0_0_70px_18px_rgba(227,61,77,0.28)]"
            />
            <motion.div
              aria-hidden
              className="absolute inset-[14%] rounded-full border border-dashed border-[#E33D4D]/40"
              animate={motionOn ? { rotate: 360 } : undefined}
              transition={motionOn ? { duration: 90, repeat: Infinity, ease: "linear" } : undefined}
            />
            <div aria-hidden className="absolute inset-[20%] rounded-full border border-white/12" />

            <span
              aria-hidden
              className="absolute top-[calc(50%-30px)] right-[27%] z-[5] hidden size-2 -translate-y-1/2 rounded-full bg-[#E33D4D] shadow-[0_0_12px_#E33D4D] min-[1100px]:block"
            />
            <span
              aria-hidden
              className="absolute top-[calc(50%-30px)] -right-44 z-[5] hidden h-px w-[calc(27%+11rem)] -translate-y-1/2 bg-[#E33D4D]/90 min-[1100px]:block"
            />

            <div className="absolute inset-[27%] overflow-hidden rounded-full border border-white/15 shadow-[0_0_48px_rgba(227,61,77,0.35)]">
              {active?.image ? (
                <Image src={active.image} alt={active.imageAlt ?? ""} fill className="object-cover" sizes="280px" />
              ) : (
                <div className="absolute inset-0 bg-[#2a1216]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,8,12,0.05)_30%,rgba(20,8,12,0.78)_100%)]" />
              <p className="absolute bottom-6 left-1/2 w-[58%] -translate-x-1/2 text-center font-sans text-[13px] leading-tight font-medium text-[#F7F3F5] sm:bottom-7 sm:text-[15px]">
                {active?.name}
              </p>
            </div>

            {categories.map((category, index) => {
              const dot = point(index, count, 44);
              const label = point(index, count, 46);
              const selected = index === activeIndex;
              return (
                <div key={category.name}>
                  <motion.span
                    aria-hidden
                    className={`absolute z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E33D4D]/70 min-[1100px]:hidden ${selected ? "bg-[#E33D4D]" : "bg-[#3a161c]"}`}
                    style={{ left: dot.left, top: dot.top, boxShadow: selected ? `0 0 14px ${accentColor}` : undefined }}
                    animate={motionOn && selected ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                    transition={motionOn && selected ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  />
                  <div
                    className="absolute z-20 hidden min-[1100px]:block"
                    style={{
                      left: label.left,
                      top: label.top,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <CategoryButton
                      name={category.name}
                      active={selected}
                      accent={accentColor}
                      onSelect={() => setActiveIndex(index)}
                      className="whitespace-nowrap"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto grid w-full max-w-[640px] grid-cols-2 gap-2.5 min-[1100px]:hidden" role="group" aria-label="Health categories">
            {categories.map((category, index) => (
              <CategoryButton
                key={category.name}
                name={category.name}
                active={index === activeIndex}
                accent={accentColor}
                onSelect={() => setActiveIndex(index)}
                className="justify-start px-2.5 py-2 text-[12px] whitespace-nowrap sm:px-3.5 sm:text-[13px]"
              />
            ))}
          </div>

          <div className="min-[1100px]:col-start-2 min-[1100px]:row-start-1">
            <div
              id="biomarker-detail"
              aria-live="polite"
              className="rounded-[22px] border border-white/10 bg-[#241014]/90 p-5 sm:p-6"
            >
              <p className="flex items-center gap-3 font-sans text-[11px] font-semibold tracking-[0.18em] text-[#E33D4D] uppercase">
                <span aria-hidden className="h-px w-6 bg-[#E33D4D]" />
                What we measure
              </p>
              <motion.div
                key={active?.name}
                initial={motionOn ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3
                  className="mt-3 text-[28px] leading-none font-normal text-[#F7F3F5] sm:text-[32px]"
                  style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
                >
                  {active?.name}
                </h3>
                <p className="mt-3 font-sans text-[15px] leading-[1.55] text-[#F7F3F5]/80">{active?.description}</p>
                {showBiomarkers ? (
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {active?.biomarkers.map((marker) => (
                      <li
                        key={marker}
                        className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 font-sans text-[14px] text-[#F7F3F5]"
                      >
                        {marker}
                        <span className="size-1.5 shrink-0 rounded-full bg-[#E33D4D]" aria-hidden />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <p className="text-center font-sans text-[14px] text-[#F7F3F5]/75 sm:text-[15px]">{footerText}</p>
          {buttonHref.startsWith("http") ? (
            <a href={buttonHref} className={ctaClass}>
              {cta}
            </a>
          ) : (
            <Link href={buttonHref} className={ctaClass}>
              {cta}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
