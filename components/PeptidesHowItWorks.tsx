"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { assets } from "@/lib/content/site";

const CARD_EASE = [0.34, 1.2, 0.64, 1] as const;

const cardTransition = {
  duration: 0.4,
  ease: CARD_EASE,
};

const parentTransition = {
  type: "spring" as const,
  duration: 0.4,
  bounce: 0.2,
};

const CARD_GRADIENT = "linear-gradient(180deg, #e74655 0%, #f06b72 55%, #f27477 100%)";
const OPEN_SHADOW = "0px 12px 16px rgba(235, 232, 228, 1)";

const steps = [
  {
    number: "01.",
    title: "Start Your Assessment",
    body: "Tell us about your health, goals, and what you’d like to improve.",
    image: assets.peptidesStepAssessment,
    alt: "Phone showing a health history and goals questionnaire",
  },
  {
    number: "02.",
    title: "Meet with a Provider",
    body: "Connect with a licensed provider to review your options.",
    image: assets.peptidesStepProvider,
    alt: "Woman on a video call with a provider from a burgundy chair",
  },
  {
    number: "03.",
    title: "Get Matched to Peptides",
    body: "We’ll identify peptide options tailored to your individual needs and goals.",
    image: assets.peptidesStepMatched,
    alt: "Two people reviewing a personalized plan on a tablet",
  },
  {
    number: "04.",
    title: "Begin Your Plan",
    body: "Start your personalized plan with ongoing guidance and support.",
    image: assets.peptidesStepPlan,
    alt: "Woman relaxing on a sofa while looking at her phone",
  },
];

function StaticCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <article
      className="flex min-h-[467px] flex-col overflow-hidden rounded-[12px] p-2 md:min-h-[440px]"
      style={{ background: CARD_GRADIENT }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[12px]">
        <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="(max-width: 768px) 90vw, 40vw" />
      </div>
      <div className="flex flex-1 flex-col gap-5 px-5 pb-8 pt-5">
        <h3 className="font-sans text-[28px] font-semibold leading-[1.12] tracking-[-0.03em] text-[#2a1210]">
          {step.title}
        </h3>
        <p className="text-[15px] leading-snug text-white">{step.body}</p>
      </div>
    </article>
  );
}

function DesktopCard({
  step,
  open,
  onOpen,
}: {
  step: (typeof steps)[number];
  open: boolean;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : cardTransition;
  const growTransition = reduced ? { duration: 0 } : parentTransition;

  return (
    <motion.article
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onMouseEnter={onOpen}
      onFocus={onOpen}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpen();
      }}
      className="flex w-[257px] shrink-0 cursor-pointer flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#2a1210] focus-visible:ring-offset-2"
      initial={false}
      animate={{
        width: open ? 352 : 257,
        height: open ? 440 : 420,
        borderRadius: open ? 20 : 12,
        paddingTop: open ? 8 : 20,
        paddingRight: open ? 8 : 20,
        paddingBottom: open ? 8 : 40,
        paddingLeft: open ? 8 : 20,
        boxShadow: open ? OPEN_SHADOW : "0px 0px 0px rgba(235, 232, 228, 0)",
      }}
      transition={{
        width: growTransition,
        default: transition,
      }}
      style={{ background: CARD_GRADIENT }}
    >
      <motion.p
        aria-hidden={open}
        initial={false}
        animate={{ opacity: open ? 0 : 1, height: open ? 0 : 68, marginBottom: open ? 0 : 4 }}
        transition={open ? { duration: reduced ? 0 : 0.16, ease: CARD_EASE } : transition}
        className="overflow-hidden font-sans text-[56px] font-medium leading-none tracking-[-0.04em] text-white"
      >
        {step.number}
      </motion.p>

      <motion.div
        className="relative w-full shrink-0 overflow-hidden"
        initial={false}
        animate={{
          height: open ? 236 : 200,
          borderRadius: open ? 12 : 0,
        }}
        transition={transition}
      >
        <motion.div
          className="absolute inset-0 grid place-items-center"
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: reduced ? 0 : open ? 0.2 : 0.35, ease: CARD_EASE }}
        >
          <Image
            src={assets.peptidesStepMosaic}
            alt=""
            fill
            className="object-contain"
            sizes="220px"
          />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.35, ease: CARD_EASE }}
        >
          <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="360px" />
        </motion.div>
      </motion.div>

      <div className={open ? "px-3 pb-3 pt-5" : "mt-auto pt-4"}>
        <motion.h3
          className="font-sans font-semibold leading-[1.12] tracking-[-0.03em] text-[#2a1210]"
          initial={false}
          animate={{ fontSize: open ? 30 : 22 }}
          transition={transition}
        >
          {step.title}
        </motion.h3>
        <motion.div
          initial={false}
          animate={{
            opacity: open ? 1 : 0,
            height: open ? "auto" : 0,
            marginTop: open ? 20 : 0,
          }}
          transition={transition}
          className="overflow-hidden"
          aria-hidden={!open}
        >
          <p className="text-[15px] leading-snug text-white">{step.body}</p>
        </motion.div>
      </div>
    </motion.article>
  );
}

export function PeptidesHowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="bg-[#f7f3f4] px-6 py-14 md:py-20" aria-labelledby="how-it-works-heading">
      <header className="mx-auto max-w-[40rem] text-center">
        <h2
          id="how-it-works-heading"
          className="font-sans text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#2c1410] sm:text-[40px] md:text-[46px]"
        >
          How It Works
        </h2>
        <p className="mt-3 text-[15px] leading-snug text-[#2c1410] sm:text-[17px]">
          Four simple steps to get started with personalized peptide care.
        </p>
      </header>

      <div className="mx-auto mt-8 grid max-w-[1200px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[1240px]:hidden md:mt-12">
        {steps.map((step) => (
          <StaticCard key={step.number} step={step} />
        ))}
      </div>

      <motion.div
        className="mx-auto mt-12 hidden w-fit items-center gap-3 min-[1240px]:flex"
        initial={false}
        transition={parentTransition}
      >
        {steps.map((step, index) => (
          <DesktopCard
            key={step.number}
            step={step}
            open={activeIndex === index}
            onOpen={() => setActiveIndex(index)}
          />
        ))}
      </motion.div>
    </section>
  );
}
