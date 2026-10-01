"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { faqCategories } from "@/lib/content/faqs";

const accordionEase = [0.12, 0.23, 0.5, 1] as const;

const entrance = {
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1] as const,
  delay: 0.05,
};

function CategoryIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
    className: "h-[22px] w-[22px]",
  };

  switch (id) {
    case "getting-started":
      return (
        <svg {...common}>
          <path d="M8.2 4c3.6 2.8 4 2.8 7.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.2 20c3.6-2.8 4-2.8 7.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 4.2c0 4.6 6 4.6 6 9.2S9 18 9 19.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15 4.2c0 4.6-6 4.6-6 9.2s6 4.6 6 6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.6 12h6.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "medical":
      return (
        <svg {...common}>
          <path d="M6.5 4v4.2a3.2 3.2 0 0 0 6.4 0V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6.5 4.2H5M12.9 4.2H14.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9.7 11.4v1.2a4.2 4.2 0 0 0 4.2 4.2h.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="17.2" cy="17.2" r="2.1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "labs":
      return (
        <svg {...common}>
          <path d="M9.2 3.2h5.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M10.2 3.2v5.2L6.6 17.6A2.3 2.3 0 0 0 8.7 21h6.6a2.3 2.3 0 0 0 2.1-3.4L13.8 8.4V3.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M8.4 14.2h7.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "pharmacy":
      return (
        <svg {...common}>
          <rect x="3.2" y="9.2" width="11.2" height="5.6" rx="2.8" transform="rotate(-28 8.8 12)" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6.2 10.6 11.2 13.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="9.4" y="8.4" width="11.2" height="5.6" rx="2.8" transform="rotate(24 15 11.2)" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "pricing":
      return (
        <svg {...common}>
          <rect x="3.2" y="6.2" width="17.6" height="12.2" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.2 10.2h17.6" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.2" cy="14.4" r="1.05" fill="currentColor" />
        </svg>
      );
    case "privacy":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M6.2 18.8c.9-2.8 2.9-4.2 5.8-4.2s4.9 1.4 5.8 4.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4.2 12.2a7.8 7.8 0 0 1 15.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="3.2" y="12" width="3.8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          <rect x="17" y="12" width="3.8" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20.8 16.2V17a2.4 2.4 0 0 1-2.4 2.4H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

export function FaqBrowse() {
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const category = faqCategories.find((item) => item.id === activeCategory) ?? faqCategories[0];

  return (
    <section
      className="px-5 py-14 sm:px-8 md:px-10 md:py-16 xl:px-12 xl:py-20"
      style={{
        background:
          "linear-gradient(132deg, rgb(239, 207, 210) 0%, rgb(219, 156, 161) 64%, rgb(197, 81, 92) 100%)",
      }}
    >
      <motion.div
        className="mx-auto w-full max-w-[980px]"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : entrance}
      >
        <h2 className="text-left text-[34px] font-medium leading-[1.02] text-[#6E2B32] sm:text-[46px] xl:text-[56px]">
          Find Your <span className="font-serif-italic font-normal">Answer</span>
        </h2>
        <p className="mt-3 font-sans text-[12px] font-medium uppercase tracking-[0.16em] text-[#A14E56]">
          Browse by category
        </p>

        <div className="mt-6 flex flex-col gap-6 xl:mt-8 xl:flex-row xl:items-start xl:gap-7">
          <div
            role="tablist"
            aria-label="FAQ categories"
            className="-mx-1 flex gap-3 overflow-x-auto px-1 py-3 [-ms-overflow-style:none] [scrollbar-width:none] xl:mx-0 xl:w-[307px] xl:shrink-0 xl:flex-col xl:gap-3 xl:overflow-visible xl:px-0 xl:py-1 [&::-webkit-scrollbar]:hidden"
          >
            {faqCategories.map((item) => {
              const active = item.id === activeCategory;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`faq-tab-${item.id}`}
                  aria-selected={active}
                  aria-controls="faq-category-panel"
                  onClick={() => {
                    setActiveCategory(item.id);
                    setOpenQuestionId(null);
                  }}
                  className={`group flex w-max shrink-0 items-center justify-center whitespace-nowrap rounded-full border-[0.5px] px-4 py-2.5 text-center xl:w-[307px] xl:whitespace-normal xl:justify-start xl:gap-3 xl:rounded-[16px] xl:px-3.5 xl:py-3.5 xl:text-left ${
                    active
                      ? "border-transparent text-white shadow-[0px_8px_8px_rgba(0,0,0,0.25)] xl:shadow-[0px_11px_10px_rgba(0,0,0,0.25)]"
                      : "border-[#DCD4BD] bg-[rgba(242,218,218,0.25)] text-[#331110] shadow-[0px_6px_6px_rgba(0,0,0,0.25)] transition-[box-shadow] duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] delay-100 hover:shadow-[0px_11px_11px_rgba(0,0,0,0.25)]"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(104deg, rgb(51, 17, 16) 0%, rgb(69, 16, 15) 55.5%, rgb(179, 60, 56) 100%)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`hidden h-11 w-11 shrink-0 place-items-center rounded-[12px] xl:grid ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white/35 text-[#C44751] transition-[background-color,color] duration-[400ms] ease-[cubic-bezier(0.44,0,0.56,1)] delay-100 group-hover:bg-[#331110] group-hover:text-white"
                    }`}
                  >
                    <CategoryIcon id={item.id} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-sans text-[12px] font-medium leading-[1.2] tracking-[0.02em] xl:text-[19px]">
                      {item.title}
                    </span>
                    <span
                      className={`mt-1 hidden font-sans text-[12px] font-medium leading-[1.2] tracking-[0.02em] xl:block ${
                        active ? "text-[#F9F9F9]" : "text-[#331110]"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="faq-category-panel"
            aria-labelledby={`faq-tab-${category.id}`}
            className="flex w-full max-w-[638px] flex-col gap-[17px]"
          >
            {category.items.map((item) => {
              const open = openQuestionId === item.id;
              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[18px] border-[0.5px] border-[#DCD4BD] bg-[rgba(247,232,228,0.92)] shadow-[0px_6px_8px_rgba(0,0,0,0.16)]"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5 sm:py-[18px]"
                    onClick={() => setOpenQuestionId(open ? null : item.id)}
                  >
                    <svg viewBox="0 0 16 16" className="h-[18px] w-[18px] shrink-0 text-[#e33d4d]" aria-hidden>
                      <path d="M8 2.2v11.6M2.2 8h11.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                    <span className="font-sans text-[15px] font-medium leading-snug tracking-[0.01em] text-[#331110] sm:text-[16px] xl:text-[17px]">
                      {item.q}
                    </span>
                  </button>
                  <motion.div
                    aria-hidden={!open}
                    initial={false}
                    animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "tween", ease: accordionEase, duration: 0.4, delay: open ? 0.2 : 0 }
                    }
                    style={{ overflow: "hidden" }}
                  >
                    <p className="px-4 pb-4 pl-[46px] font-sans text-[14px] leading-[1.55] text-[#4A2A26] sm:px-5 sm:pb-5 sm:pl-[52px] sm:text-[15px]">
                      {item.a}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
