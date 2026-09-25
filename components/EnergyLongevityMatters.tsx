"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { assets } from "@/lib/content/site";

const rowSpring = { type: "spring" as const, stiffness: 400, damping: 49, mass: 1 };
const entranceSpring = { type: "spring" as const, stiffness: 400, damping: 68, mass: 1, delay: 0.1 };
const imageEase = [0.44, 0, 0.56, 1] as const;
const imageTween = { duration: 0.9, delay: 0.2, ease: imageEase };
const imageCloseTween = { duration: 0.9, delay: 0, ease: imageEase };
const underlineSpring = { type: "spring" as const, stiffness: 454, damping: 176, mass: 6.1, delay: 0.6 };

const CLOSED = "#e98a90";
const OPEN = "#4a2a26";

type Matter = {
  n: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

const items: Matter[] = [
  {
    n: "001",
    title: "Stable, sustained energy throughout the day",
    body: "Understand the factors that may be influencing your day-to-day energy.",
    image: assets.mattersEnergy,
    alt: "Woman running on a grassy trail wearing a hydration vest",
  },
  {
    n: "002",
    title: "Healthy aging",
    body: "Get a clearer picture of key health markers as they change over time.",
    image: assets.mattersAging,
    alt: "Two people by a lake, one reading on a log and one meditating",
  },
  {
    n: "003",
    title: "Sleep & daily habits",
    body: "Consider how sleep, nutrition, activity, and everyday habits fit into the bigger picture.",
    image: assets.mattersSleep,
    alt: "Woman sleeping in a softly lit bedroom",
  },
  {
    n: "004",
    title: "Recovery & performance",
    body: "Bring your recovery, activity, and performance goals into the conversation.",
    image: assets.mattersRecovery,
    alt: "Man at a desk holding a mug and looking out a window",
  },
];

function ArrowCircle() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1a1210] text-white shadow-[0_6px_16px_rgba(26,18,16,0.22)]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="2.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DesktopTabletRow({
  item,
  open,
  mode,
  onOpen,
}: {
  item: Matter;
  open: boolean;
  mode: "desktop" | "tablet";
  onOpen: () => void;
}) {
  const imageW = 264;
  const imageH = 161;
  const reduceMotion = useReducedMotion();
  const imageMotion = reduceMotion
    ? { duration: 0.7, delay: 0, ease: imageEase }
    : open
      ? imageTween
      : imageCloseTween;

  return (
    <motion.article
      className="relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={entranceSpring}
      onPointerEnter={mode === "desktop" ? onOpen : undefined}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onOpen}
        className="relative block w-full cursor-pointer overflow-visible text-left"
      >
        <motion.div
          className={`relative grid w-full overflow-visible ${open ? "items-start" : "items-center"}`}
          initial={false}
          animate={{
            minHeight: open ? imageH + 72 : 109,
            gridTemplateColumns: open
              ? `6.25rem minmax(0,1fr) ${imageW + 28}px 3rem`
              : "6.25rem minmax(0,1fr) 0px 3rem",
          }}
          transition={rowSpring}
          style={{ paddingTop: open ? 28 : 0, paddingBottom: open ? 44 : 0, paddingLeft: 0 }}
        >
          <motion.span
            className="font-sans text-[30px] font-medium leading-none tabular-nums tracking-[0.02em]"
            initial={false}
            animate={{ color: open ? OPEN : CLOSED }}
            transition={{ duration: 0 }}
          >
            {item.n}
          </motion.span>

          <div className="min-w-0 pr-6">
            <motion.h3
              className="font-sans text-[30px] font-medium leading-none tracking-[0.04em] uppercase"
              initial={false}
              animate={{ color: open ? OPEN : CLOSED }}
              transition={{ duration: 0 }}
            >
              {item.title}
            </motion.h3>
            <motion.div
              className="grid"
              initial={false}
              animate={{
                gridTemplateRows: open ? "1fr" : "0fr",
                opacity: open ? 1 : 0,
                marginTop: open ? 12 : 0,
              }}
              transition={rowSpring}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="max-w-[28rem] font-sans text-[16px] font-normal leading-[1.45] text-[#331110]/90">
                  {item.body}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex h-full items-center justify-end overflow-visible pb-1">
            <motion.div
              className="pointer-events-none relative shrink-0 overflow-hidden rounded-[14px] border border-white/90 shadow-[0_18px_40px_rgba(51,17,16,0.22)]"
              style={{ width: imageW, height: imageH }}
              initial={false}
              animate={
                open
                  ? { opacity: 1, rotate: reduceMotion ? 0 : -5, x: 0, y: 0 }
                  : {
                      opacity: 0,
                      rotate: reduceMotion ? 0 : 66,
                      x: reduceMotion ? 0 : -28,
                      y: reduceMotion ? 0 : 64,
                    }
              }
              transition={imageMotion}
            >
              <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="264px" />
            </motion.div>
          </div>

          <div className="relative z-20 flex justify-end self-center">
            <ArrowCircle />
          </div>
        </motion.div>

        <motion.span
          className="absolute right-0 bottom-0 left-0 z-[1] h-px origin-left bg-[#e8a3a6]"
          initial={false}
          animate={{ scaleX: open ? 1 : 0 }}
          transition={underlineSpring}
        />
        <span className="absolute right-0 bottom-0 left-0 h-px bg-[#331110]/10" />
      </button>
    </motion.article>
  );
}

function HoverList({ mode }: { mode: "desktop" | "tablet" }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(mode === "tablet" ? 0 : null);

  return (
    <div onPointerLeave={mode === "desktop" ? () => setActiveIndex(null) : undefined}>
      {items.map((item, i) => (
        <DesktopTabletRow
          key={item.n}
          item={item}
          mode={mode}
          open={activeIndex === i}
          onOpen={() => setActiveIndex(i)}
        />
      ))}
    </div>
  );
}

function MobileCard({ item }: { item: Matter }) {
  return (
    <motion.article
      className="border-b border-[#331110]/10 py-7"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={entranceSpring}
    >
      <p className="font-sans text-[30px] font-medium leading-none tabular-nums tracking-[0.02em] text-[#e98a90]">{item.n}</p>
      <h3 className="mt-3 font-sans text-[22px] font-medium leading-[1.15] tracking-[0.04em] text-[#4a2a26] uppercase sm:text-[30px]">
        {item.title}
      </h3>
      <p className="mt-3 max-w-[22rem] font-sans text-[16px] leading-[1.45] text-[#331110]/90">{item.body}</p>
      <div className="mt-5 flex justify-center">
        <div className="relative h-[168px] w-[86%] max-w-[320px] overflow-hidden rounded-[16px] border border-white/90 shadow-[0_16px_36px_rgba(51,17,16,0.18)] rotate-[-4deg]">
          <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="320px" />
        </div>
      </div>
    </motion.article>
  );
}

export function EnergyLongevityMatters() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8f3f4_0%,#fbe9e6_42%,#f7f3f5_100%)] px-6 py-16 pb-8 md:px-10 md:py-20 md:pb-10 lg:py-24 lg:pb-12">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mx-auto max-w-[46rem] text-center">
          <h2 className="font-sans text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[#6b3030] sm:text-[38px] md:text-[42px] lg:text-[46px]">
            Built Around What Matters to You
          </h2>
          <p className="mx-auto mt-3 max-w-[32rem] font-sans text-[14px] leading-[1.5] text-[#331110] md:text-[15px]">
            Your care starts with understanding the factors that may influence how you feel.
          </p>
        </header>

        <div className="mt-10 md:mt-12">
          <div className="hidden lg:block">
            <HoverList mode="desktop" />
          </div>
          <div className="hidden md:block lg:hidden">
            <HoverList mode="tablet" />
          </div>
          <div className="md:hidden">
            {items.map((item) => (
              <MobileCard key={item.n} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
