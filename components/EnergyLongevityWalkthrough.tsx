"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { IconHoverButton } from "@/components/IconHoverButton";
import { assets } from "@/lib/content/site";

const ease = [0.85, 0, 0.15, 1] as const;
const entrance = { duration: 1.1, ease };

type Step = { n: string; text: string };

type Row = {
  id: string;
  image: string;
  imageAlt: string;
  imageOnLeft: boolean;
  objectPosition?: string;
  title: string;
  body: string;
  howItWorks?: boolean;
  steps: Step[];
  href?: string;
};

const rows: Row[] = [
  {
    id: "control",
    image: assets.energyWalkthrough,
    imageAlt: "Older couple hiking together on a wooded trail",
    imageOnLeft: true,
    objectPosition: "left center",
    title: "Take control of how you age",
    body: "Longevity care is about looking beyond today, understanding how your body is changing and making informed decisions with your provider to support your health over time.",
    steps: [
      { n: "01", text: "Use your health history and relevant labs to understand where you are today." },
      { n: "02", text: "Review appropriate treatment options with a licensed provider." },
      { n: "03", text: "Revisit your plan as your goals, labs, and needs change." },
    ],
  },
  {
    id: "nad",
    image: assets.nadVial,
    imageAlt: "NAD+ injectable vial",
    imageOnLeft: false,
    title: "NAD+",
    body: "NAD+ is a coenzyme involved in cellular energy metabolism and other cellular processes. NAD+ levels can change with age and may be considered by your provider as part of an individualized care plan.",
    howItWorks: true,
    steps: [
      { n: "01", text: "Plays a role in cellular processes involved in energy metabolism." },
      { n: "02", text: "Functions as a coenzyme in cellular pathways involving sirtuins and PARPs." },
      { n: "03", text: "Your provider determines whether NAD+ may be appropriate based on your health history and goals." },
    ],
    href: "/products/nad-injectable",
  },
  {
    id: "glutathione",
    image: assets.glutathioneVial,
    imageAlt: "Glutathione injectable vial",
    imageOnLeft: true,
    title: "Glutathione",
    body: "Glutathione is an antioxidant involved in protecting cells from oxidative stress and supporting cellular defense and detoxification processes. Your provider determines dosing and treatment based on your individual health history and wellness goals.",
    howItWorks: true,
    steps: [
      { n: "01", text: "Participates in antioxidant processes that help protect cells from oxidative stress." },
      { n: "02", text: "Works with enzymes involved in processing reactive compounds and supporting cellular detoxification pathways." },
      { n: "03", text: "Treatment is prescribed and monitored by a licensed medical provider based on your individual treatment plan." },
    ],
    href: "/products/longevity-glutathione",
  },
];

function ImagePanel({ row }: { row: Row }) {
  return (
    <div className="h-[475px] w-full overflow-hidden bg-[#1a0909]">
      <motion.div
        className="relative h-full w-full"
        initial={{ scale: 1 }}
        whileInView={{ scale: 1.05 }}
        viewport={{ once: true, amount: 0 }}
        transition={entrance}
      >
        <Image
          src={row.image}
          alt={row.imageAlt}
          fill
          className={`object-cover ${row.objectPosition ? "" : "object-center"}`}
          style={row.objectPosition ? { objectPosition: row.objectPosition } : undefined}
          sizes="(min-width: 768px) 44vw, 92vw"
        />
      </motion.div>
    </div>
  );
}

function TextPanel({ row }: { row: Row }) {
  return (
    <motion.div
      className="origin-center"
      initial={{ opacity: 0, scale: 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={entrance}
    >
      <h3 className="font-sans text-[28px] font-medium leading-[1.12] tracking-[-0.03em] text-[#331110] md:text-[32px] lg:text-[36px]">
        {row.title}
      </h3>
      <p className="mt-3 max-w-[36rem] font-sans text-[14px] leading-[1.55] text-[#331110] md:text-[15px]">{row.body}</p>
      {row.howItWorks ? (
        <p className="mt-6 font-sans text-[11px] font-semibold tracking-[0.08em] text-[#331110] uppercase">How it works</p>
      ) : null}
      <ol className={`space-y-3 ${row.howItWorks ? "mt-3" : "mt-6"}`}>
        {row.steps.map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="shrink-0 font-sans text-[14px] text-[#e43d4e]">({step.n})</span>
            <p className="font-sans text-[14px] leading-[1.5] text-[#331110] md:text-[15px]">{step.text}</p>
          </li>
        ))}
      </ol>
      {row.href ? (
        <IconHoverButton href={row.href} variant="accent" size="sm" className="mt-7 min-w-[7.5rem]">
          View
        </IconHoverButton>
      ) : null}
    </motion.div>
  );
}

function TimelineDot() {
  return (
    <div className="relative flex h-full items-start justify-center pt-[38%]">
      <span className="relative z-10 h-3.5 w-3.5 rounded-full border-[3px] border-[#F7F3F5] bg-[#331110]" />
    </div>
  );
}

export function EnergyLongevityWalkthrough() {
  return (
    <section className="relative overflow-hidden bg-[#F7F3F5] px-6 py-14 md:px-10 md:py-16 lg:py-[72px]">
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 bottom-24 left-1/2 hidden w-px -translate-x-1/2 bg-[#331110]/20 md:block"
      />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-16 md:gap-20 lg:gap-24">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] md:gap-x-5 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] lg:gap-x-8"
          >
            <div className={row.imageOnLeft ? "md:col-start-1" : "md:col-start-3 md:row-start-1"}>
              <ImagePanel row={row} />
            </div>
            <div className="hidden md:col-start-2 md:row-start-1 md:block">
              <TimelineDot />
            </div>
            <div className={row.imageOnLeft ? "md:col-start-3 md:row-start-1" : "md:col-start-1 md:row-start-1"}>
              <TextPanel row={row} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
