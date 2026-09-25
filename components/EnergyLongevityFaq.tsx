"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { energyLongevityFaqs } from "@/lib/content/faqs";

const rowSpring = { type: "spring" as const, stiffness: 400, damping: 49, mass: 1 };

function Chevron({ open }: { open: boolean }) {
  return (
    <motion.span
      className="grid h-6 w-6 shrink-0 place-items-center text-[#331110]"
      initial={false}
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.35, ease: [0.44, 0, 0.56, 1] }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="M6 9.5 12 15.5 18 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}

export function EnergyLongevityFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#F7F3F5] px-5 pb-16 pt-4 md:px-10 md:pb-20 md:pt-6 lg:pb-24 lg:pt-8">
      <div className="mx-auto w-full max-w-[920px]">
        <h2 className="text-center font-sans text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[#4a2a26] sm:text-[38px] md:text-[42px] lg:text-[46px]">
          Frequently Asked Questions
        </h2>

        <div className="mt-8 overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(51,17,16,0.06)] md:mt-10 md:rounded-[26px]">
          {energyLongevityFaqs.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className={i > 0 ? "border-t border-[#331110]/10" : ""}>
                <button
                  type="button"
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 px-5 py-[18px] text-left md:items-center md:px-7 md:py-5"
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="font-sans text-[15px] font-semibold leading-[1.35] text-[#331110] md:text-[16px]">
                    {item.q}
                  </span>
                  <Chevron open={open} />
                </button>
                <motion.div
                  className="grid"
                  initial={false}
                  animate={{
                    gridTemplateRows: open ? "1fr" : "0fr",
                    opacity: open ? 1 : 0,
                  }}
                  transition={rowSpring}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="px-5 pb-5 font-sans text-[14px] leading-[1.55] text-[#7a5a56] md:px-7 md:pb-6 md:text-[16px] md:leading-[1.55]">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
