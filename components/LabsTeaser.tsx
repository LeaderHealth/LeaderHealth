"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { labs } from "@/lib/content/products";

const smoothEase = [0.44, 0, 0.56, 1] as const;

const hoverSpring = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };
const slideSpring = { type: "spring" as const, duration: 0.8, bounce: 0.2, delay: 0 };
const autoplayMs = 4500;

const labMetrics = [
  { value: "2-5", label: "business days from draw to results" },
  { value: "30", label: "minutes clinical view, included" },
  { value: "", label: "HSA / FSA" },
];

type Lab = (typeof labs)[number];

function LabCard({ lab, reduce, fade = true }: { lab: Lab; reduce: boolean | null; fade?: boolean }) {
  return (
    <motion.div
      className="min-w-0"
      initial={reduce || !fade ? false : { opacity: 0 }}
      whileInView={fade ? { opacity: 1 } : undefined}
      whileHover={reduce ? undefined : { scale: 0.9 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        opacity: { duration: 1, ease: smoothEase },
        scale: hoverSpring,
      }}
    >
      <Link
        href={`/labs/${lab.slug}`}
        className="relative block min-w-0 overflow-hidden rounded-[20px] pt-2"
        style={{
          background:
            "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)",
        }}
      >
        {"recommended" in lab && lab.recommended ? (
          <span className="absolute right-[19px] top-[21px] z-10 whitespace-nowrap rounded-[15px] bg-[#e43c4e]/75 px-2.5 py-[5px] text-[12px] font-medium text-white">
            Recommended
          </span>
        ) : null}
        <Image
          src={lab.image}
          alt={lab.name}
          width={332}
          height={415}
          className="mx-auto h-auto w-full max-h-[415px] object-contain"
        />
        <div className="px-6 pb-6">
          <h3 className="font-sans text-[19px] font-medium uppercase leading-[22.8px] tracking-normal text-[#331110]">
            {lab.name}
          </h3>
          <p className="mt-1 font-sans text-[18px] font-medium leading-[21.6px] tracking-normal text-[#e43c4e]">
            ({lab.biomarkers}) / {lab.price}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function LabSlideshow({ reduce }: { reduce: boolean | null }) {
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const count = labs.length;

  useEffect(() => {
    if (reduce || count < 2) return;
    const id = window.setInterval(() => {
      if (!window.matchMedia("(max-width: 809px)").matches) return;
      setIndex((current) => (current + 1) % count);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [count, index, reduce]);

  useEffect(() => {
    if (!frame) return;
    const apply = () => {
      const width = frame.offsetWidth;
      setOffset(reduce ? 0 : -index * (width + 10));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, index, reduce]);

  return (
    <motion.div
      className="relative overflow-hidden min-[810px]:hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Diagnostic labs"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 1, ease: smoothEase }}
    >
      <p className="sr-only" aria-live="polite">
        {labs[index]?.name}, slide {index + 1} of {count}
      </p>
      <button
        type="button"
        aria-label="Previous lab"
        onClick={() => setIndex((current) => (current - 1 + count) % count)}
        className="absolute top-1/2 left-2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#331110] shadow-[0_4px_16px_rgba(50,17,16,0.18)]"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next lab"
        onClick={() => setIndex((current) => (current + 1) % count)}
        className="absolute top-1/2 right-2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#331110] shadow-[0_4px_16px_rgba(50,17,16,0.18)]"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div ref={setFrame} className="overflow-hidden">
        <motion.div
          className="flex w-full min-w-0 gap-[10px]"
          initial={false}
          animate={{ x: offset }}
          transition={reduce ? { duration: 0 } : slideSpring}
        >
          {labs.map((lab, slideIndex) => (
            <div key={lab.slug} className="w-full shrink-0" aria-hidden={slideIndex !== index}>
              <LabCard lab={lab} reduce={reduce} fade={false} />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function LabsTeaser() {
  const reduce = useReducedMotion();

  return (
    <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip bg-white py-[30px]">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-6 min-[810px]:grid-cols-12 min-[810px]:gap-8">
        <motion.div
          className="min-w-0 min-[810px]:col-span-5"
          initial={reduce ? false : { opacity: 0, x: -150 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 1, ease: smoothEase }}
        >
          <p className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#e33b4f]">
            NOW AVAILABLE
          </p>
          <h2 className="mt-2 font-sans text-6xl font-medium leading-none tracking-normal text-[#e43c4e] min-[810px]:text-[74px] min-[810px]:leading-[88.8px]">
            Labs
          </h2>
          <p className="mt-4 max-w-[449px] font-sans text-[21px] font-normal leading-[25.2px] tracking-normal text-[#32120e]">
            Get a clearer picture of your health with comprehensive lab testing and expert clinical insights.
          </p>
          <div className="mt-8">
            {labMetrics.map((metric) => (
              <p
                key={metric.label}
                className="border-t border-ink/15 py-2 font-sans text-[21px] leading-[25.2px] tracking-normal text-[#32120e]"
              >
                {metric.value ? (
                  <span className="font-medium italic text-[#e33b4f]">{metric.value} </span>
                ) : null}
                {metric.label}
              </p>
            ))}
          </div>
        </motion.div>
        <div className="min-w-0 min-[810px]:col-span-7">
          <LabSlideshow reduce={reduce} />
          <div className="hidden min-w-0 gap-[19px] min-[810px]:grid min-[810px]:grid-cols-2">
            {labs.map((lab) => (
              <LabCard key={lab.slug} lab={lab} reduce={reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
