"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const stepTransition = { type: "spring" as const, duration: 0.5, bounce: 0.2, delay: 0 };
const listTransition = { type: "spring" as const, duration: 0.7, bounce: 0, delay: 0 };

const steps = [
  {
    label: "01",
    title: "Online Order",
    src: "/images/labs-step-order.png",
    alt: "Phone showing a red Order button and shopping cart",
    width: 327,
    height: 555,
  },
  {
    label: "02",
    title: "Choose a Partner Draw Site",
    src: "/images/labs-step-site.png",
    alt: "Phone showing a map for choosing a partner draw site",
    width: 420,
    height: 573,
  },
  {
    label: "03",
    title: "Fast as Instructed and complete your draw",
    src: "/images/labs-step-draw.png",
    alt: "Stopwatch, blood draw, and sample vial",
    width: 620,
    height: 396,
  },
  {
    label: "04",
    title: "View Results on Portal",
    src: "/images/labs-step-results.png",
    alt: "Phone showing lab results and a download report button",
    width: 445,
    height: 637,
  },
];

const panelGradient =
  "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)";

function isCompact() {
  return window.matchMedia("(max-width: 1199px)").matches;
}

function StepImage({ step }: { step: (typeof steps)[number] }) {
  return (
    <div
      className="relative mx-auto h-[420px] w-full max-w-[520px] overflow-hidden rounded-[28px] shadow-[0_5px_10px_rgba(0,0,0,0.1)] min-[1200px]:h-[540px]"
      style={{ background: panelGradient }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.44, 0, 0.56, 1] }}
          className="absolute inset-8 flex items-center justify-center"
        >
          <Image
            src={step.src}
            alt={step.alt}
            width={step.width}
            height={step.height}
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CompleteLabSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  function clearHover() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function hoverStep(index: number) {
    if (isCompact()) return;
    clearHover();
    timeoutRef.current = window.setTimeout(() => setActiveStep(index), 200);
  }

  return (
    <section className="bg-[#fafafa] px-5 py-16 min-[810px]:px-8 min-[810px]:py-20 min-[1200px]:px-6">
      <div className="mx-auto flex w-full max-w-[1074px] flex-col items-center gap-12 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-center min-[1200px]:gap-20">
        <div className="w-full min-[1200px]:w-[520px] min-[1200px]:shrink-0">
          <h2 className="text-left font-sans text-[32px] font-medium leading-[1.15] tracking-normal text-[#321213] min-[810px]:text-center min-[810px]:text-[34px] min-[1200px]:whitespace-nowrap min-[1200px]:text-left min-[1200px]:text-[34px]">
            Getting Your Labs Done in{" "}
            <span className="font-serif-italic font-normal text-[#CE6475]">4 Steps</span>
          </h2>

          <div className="mt-8 min-[1200px]:hidden">
            <StepImage step={steps[activeStep]} />
          </div>

          <motion.div layout className="mt-8 flex flex-col gap-3 min-[1200px]:mt-10" transition={listTransition}>
            {steps.map((step, index) => {
              const active = activeStep === index;
              return (
                <motion.button
                  key={step.label}
                  type="button"
                  layout
                  transition={listTransition}
                  aria-label={`${step.label} ${step.title}`}
                  aria-pressed={active}
                  onMouseEnter={() => hoverStep(index)}
                  onMouseLeave={clearHover}
                  onClick={() => {
                    clearHover();
                    setActiveStep(index);
                  }}
                  className="relative w-full text-left"
                >
                  {active ? (
                    <motion.span
                      layoutId="lab-step-highlight"
                      className="absolute inset-0 rounded-[18px]"
                      style={{ background: panelGradient }}
                      transition={stepTransition}
                    />
                  ) : null}
                  <span
                    className={`relative flex justify-between gap-4 ${
                      active ? "min-h-[132px] items-center px-6 py-6" : "items-start px-6 py-3"
                    }`}
                  >
                    <span className="font-sans text-[20px] font-medium leading-[1.25] text-[#321213] min-[810px]:text-[22px] min-[1200px]:text-[26px]">
                      {step.title}
                    </span>
                    <span
                      className={`shrink-0 font-sans text-[13px] leading-none ${
                        active ? "text-[#321213]/55" : "text-[#a5a5a5]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <div className="hidden w-full max-w-[520px] min-[1200px]:block">
          <StepImage step={steps[activeStep]} />
        </div>
      </div>
    </section>
  );
}
