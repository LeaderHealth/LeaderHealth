"use client";

import Image from "next/image";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "framer-motion";

const rowSpring = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

type Group = {
  title: string;
  icon: ReactNode;
  markers: string[];
};

const leftColumn: Group[] = [
  {
    title: "Heart & Cardiovascular",
    icon: <BiomarkerIcon src="/images/biomarkers/heart.png" />,
    markers: [
      "Total Cholesterol",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "Triglycerides",
      "Apolipoprotein B (ApoB)",
      "High-Sensitivity C-Reactive Protein (hs-CRP)",
    ],
  },
  {
    title: "Metabolic & Blood Sugar",
    icon: <BiomarkerIcon src="/images/biomarkers/metabolic.png" />,
    markers: ["Fasting Glucose", "HbA1c", "Fasting Insulin"],
  },
  {
    title: "Electrolytes & Fluid Balance",
    icon: <BiomarkerIcon src="/images/biomarkers/electrolytes.png" />,
    markers: ["Sodium", "Potassium", "Chloride", "CO2 (Bicarbonate)", "Calcium"],
  },
  {
    title: "Sex Hormones",
    icon: <BiomarkerIcon src="/images/biomarkers/hormones.png" />,
    markers: [
      "Total Testosterone",
      "Free Testosterone",
      "SHBG",
      "Estradiol",
      "LH",
      "FSH",
      "Prolactin",
      "IGF-1",
      "Progesterone",
    ],
  },
  {
    title: "Thyroid",
    icon: <BiomarkerIcon src="/images/biomarkers/thyroid.png" />,
    markers: ["TSH", "Free T4", "Free T3"],
  },
];

const rightColumn: Group[] = [
  {
    title: "Liver Function",
    icon: <BiomarkerIcon src="/images/biomarkers/liver.png" />,
    markers: [
      "ALT",
      "AST",
      "ALP",
      "GGT",
      "Total Bilirubin",
      "Albumin",
      "Globulin",
      "Total Protein",
      "Albumin / Globulin Ratio",
    ],
  },
  {
    title: "Kidney Function",
    icon: <BiomarkerIcon src="/images/biomarkers/kidney.png" />,
    markers: ["Creatinine", "eGFR", "BUN", "BUN / Creatinine Ratio"],
  },
  {
    title: "Prostate Health (Men 40+)",
    icon: <BiomarkerIcon src="/images/biomarkers/prostate.png" />,
    markers: ["Prostate-Specific Antigen (PSA)"],
  },
  {
    title: "Blood & Immune",
    icon: <BloodIcon />,
    markers: [
      "WBC",
      "RBC",
      "Hemoglobin",
      "Hematocrit",
      "MCV",
      "MCH",
      "MCHC",
      "RDW",
      "Platelets",
      "MPV (Mean Platelet Volume)",
      "Neutrophils %",
      "Lymphocytes %",
      "Monocytes %",
      "Eosinophils %",
      "Basophils %",
      "Neutrophils Absolute",
      "Lymphocytes Absolute",
      "Monocytes Absolute",
      "Eosinophils Absolute",
      "Basophils Absolute",
      "Immature Granulocytes %",
      "Immature Granulocytes Absolute",
    ],
  },
  {
    title: "Vitamins & Nutrients",
    icon: <BiomarkerIcon src="/images/biomarkers/vitamins.png" />,
    markers: ["Vitamin D, 25-Hydroxy", "Ferritin"],
  },
];

const advanceLeft: Group[] = [
  {
    title: "Heart & Cardiovascular",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-heart.png" />,
    markers: [
      "Total Cholesterol",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "Triglycerides",
      "Non-HDL Cholesterol",
      "Total Cholesterol / HDL Ratio",
      "Apolipoprotein B (ApoB)",
      "Lipoprotein(a)",
      "High-Sensitivity C-Reactive Protein (hs-CRP)",
    ],
  },
  {
    title: "Metabolic & Blood Sugar",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-metabolic.png" />,
    markers: ["Fasting Glucose", "HbA1c", "Fasting Insulin", "Amylase", "Lipase", "Uric Acid", "Apolipoprotein B (ApoB)"],
  },
  {
    title: "Inflammation",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-inflammation.png" />,
    markers: ["Homocysteine"],
  },
  {
    title: "Sex Hormones",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-hormones.png" />,
    markers: [
      "Total Testosterone",
      "Free Testosterone",
      "SHBG",
      "Estradiol",
      "LH",
      "FSH",
      "DHEA-S",
      "Prolactin",
      "IGF-1",
      "Progesterone",
      "AMH",
    ],
  },
  {
    title: "Thyroid",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-thyroid.png" />,
    markers: ["TSH", "Free T4", "Free T3", "TPO Antibody", "Thyroglobulin Antibodies (TgAb)"],
  },
  {
    title: "Electrolytes & Fluid Balance",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-electrolytes.png" />,
    markers: ["Sodium", "Potassium", "Chloride", "CO2 (Bicarbonate)", "Calcium"],
  },
];

const advanceRight: Group[] = [
  {
    title: "Liver Function",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-liver.png" />,
    markers: ["ALT", "AST", "ALP", "GGT", "Total Bilirubin", "Albumin", "Globulin", "Total Protein", "Albumin / Globulin Ratio"],
  },
  {
    title: "Kidney Function",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-kidney.png" />,
    markers: ["Creatinine", "eGFR", "BUN", "BUN / Creatinine Ratio", "Microalbumin (Urine)"],
  },
  {
    title: "Urinalysis",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-urinalysis.png" />,
    markers: [
      "Color",
      "Appearance",
      "Specific Gravity",
      "pH",
      "Protein",
      "Glucose",
      "Ketones",
      "Bilirubin",
      "Urobilinogen",
      "Nitrite",
      "Blood (Hemoglobin)",
      "Leukocyte Esterase",
      "RBC (microscopic)",
      "WBC (microscopic)",
      "Epithelial Cells (microscopic)",
      "Bacteria (microscopic)",
    ],
  },
  {
    title: "Blood & Immune",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-blood.png" />,
    markers: [
      "WBC",
      "RBC",
      "Hemoglobin",
      "Hematocrit",
      "MCV",
      "MCH",
      "MCHC",
      "RDW",
      "Platelets",
      "MPV (Mean Platelet Volume)",
      "Neutrophils %",
      "Lymphocytes %",
      "Monocytes %",
      "Eosinophils %",
      "Basophils %",
      "Neutrophils Absolute",
      "Lymphocytes Absolute",
      "Monocytes Absolute",
      "Eosinophils Absolute",
      "Basophils Absolute",
      "Immature Granulocytes %",
      "Immature Granulocytes Absolute",
    ],
  },
  {
    title: "Vitamins & Nutrients",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-vitamins.png" />,
    markers: [
      "Vitamin D, 25-Hydroxy",
      "Iron",
      "Ferritin",
      "TIBC",
      "Iron % Saturation",
      "Magnesium, RBC",
      "MCHC",
      "Zinc",
      "Vitamin B12",
      "Methylmalonic Acid (MMA)",
    ],
  },
  {
    title: "Prostate Health (Men 40+)",
    icon: <BiomarkerIcon src="/images/biomarkers/advance-prostate.png" />,
    markers: ["Prostate-Specific Antigen (PSA)"],
  },
];

const layoutSpring = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };

function BiomarkerIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={628}
      height={614}
      className="h-[52px] w-[52px] shrink-0"
    />
  );
}

function BloodIcon() {
  return (
    <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#F8E4E8] text-[#E23B4A]">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
        <path d="M12 4.2s4.8 4.6 4.8 8.2a4.8 4.8 0 0 1-9.6 0C7.2 8.8 12 4.2 12 4.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 11.2v3.2M10.4 12.8h3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full border border-[#2a2a2a]/80 text-[#222]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path d="M6 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {open ? null : <path d="M12 6v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

function BiomarkerRow({
  item,
  open,
  onToggle,
  cardClassName = "px-4 py-5 min-[810px]:px-6 min-[810px]:py-6",
}: {
  item: Group;
  open: boolean;
  onToggle: () => void;
  cardClassName?: string;
}) {
  return (
    <article className={`overflow-hidden rounded-[24px] bg-[#f5f5f5] text-[#121212] ${cardClassName}`}>
      <div className={`flex gap-3 min-[810px]:gap-4 ${open ? "items-start" : "items-center"}`}>
        <span className={open ? "mt-0.5" : undefined}>{item.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-[16px] font-normal leading-[1.4] text-[#121212] min-[810px]:text-[18px] min-[810px]:leading-[1.6]">
            {item.title}
          </h3>
          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={rowSpring}
            className="overflow-hidden"
            aria-hidden={!open}
          >
            <div className="flex flex-wrap gap-2 pt-2.5 min-[810px]:gap-x-2.5 min-[810px]:gap-y-[10px]">
              {item.markers.map((marker) => (
                <span
                  key={marker}
                  className="inline-flex items-center rounded-full bg-[#DF6975] px-2.5 py-1 font-sans text-[10px] font-normal leading-[1.2] text-white min-[810px]:px-3 min-[810px]:text-[12px]"
                >
                  {marker}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${item.title}` : `Expand ${item.title}`}
          onClick={onToggle}
          className={`shrink-0 self-center ${open ? "mt-2" : ""}`}
        >
          <ToggleIcon open={open} />
        </button>
      </div>
    </article>
  );
}

function BiomarkerColumn({ items, cardClassName }: { items: Group[]; cardClassName?: string }) {
  const [open, setOpen] = useState<boolean[]>(() => items.map(() => false));

  return (
    <div className="flex w-full flex-col gap-2.5 min-[1200px]:w-[556px]">
      {items.map((item, index) => (
        <BiomarkerRow
          key={item.title}
          item={item}
          open={open[index]}
          onToggle={() =>
            setOpen((current) => current.map((value, i) => (i === index ? !value : value)))
          }
          cardClassName={cardClassName}
        />
      ))}
    </div>
  );
}

function useClientLayoutReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CompleteLabBiomarkers({ panel = "complete" }: { panel?: "complete" | "advance" }) {
  const layoutReady = useClientLayoutReady();

  if (panel === "advance") {
    return (
      <section
        className="flex flex-col items-center gap-[63px] overflow-hidden px-4 py-[50px] min-[810px]:px-[50px]"
        style={{
          background:
            "linear-gradient(298deg, rgb(232, 132, 144) 0%, rgb(232, 114, 126) 65%, rgb(229, 80, 92) 100%)",
        }}
      >
        <h2 className="max-w-[860px] text-center font-sans text-[26px] font-medium leading-[1.2] tracking-normal text-white min-[810px]:text-[36px] min-[1200px]:text-[40px]">
          Advance lab panel offers a streamlined
          <br className="hidden min-[810px]:block" /> analysis of{" "}
          <span className="font-serif-italic font-normal text-[#321110]">100 key biomarkers</span>
        </h2>
        <motion.div
          layout={layoutReady}
          transition={layoutSpring}
          className="flex w-full max-w-[360px] flex-col items-start justify-center gap-2.5 overflow-hidden min-[810px]:w-[694px] min-[810px]:max-w-[694px] min-[1200px]:w-auto min-[1200px]:max-w-none min-[1200px]:flex-row min-[1200px]:justify-center min-[1200px]:gap-[21px]"
        >
          <BiomarkerColumn items={advanceLeft} cardClassName="p-6" />
          <BiomarkerColumn items={advanceRight} cardClassName="p-6" />
        </motion.div>
      </section>
    );
  }

  return (
    <section className="bg-[#32120E] px-4 py-16 min-[810px]:px-8 min-[810px]:py-20 min-[1200px]:px-6">
      <h2 className="mx-auto max-w-[860px] text-center font-sans text-[26px] font-medium leading-[1.2] tracking-normal text-white min-[810px]:text-[36px] min-[1200px]:text-[40px]">
        Complete lab panel offers a streamlined
        <br className="hidden min-[810px]:block" /> analysis of{" "}
        <span className="font-serif-italic font-normal text-[#AE221E]">64 key biomarkers</span>
      </h2>
      <div className="mx-auto mt-10 flex w-full flex-col gap-2.5 min-[810px]:mt-12 min-[1200px]:max-w-[1133px] min-[1200px]:flex-row min-[1200px]:items-start min-[1200px]:justify-center min-[1200px]:gap-[21px]">
        <BiomarkerColumn items={leftColumn} />
        <BiomarkerColumn items={rightColumn} />
      </div>
    </section>
  );
}
