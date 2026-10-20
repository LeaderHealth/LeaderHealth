"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type FAQItem = {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
  title?: string;
  content?: string;
  description?: string;
};

export type FAQArticlesProps = {
  fAQDataJSON?: string;
  cardBackground?: string;
  hoverBackground?: string;
  openBackground?: string;
  questionColor?: string;
  answerColor?: string;
  fontFamily?: string;
};

function readItem(item: FAQItem) {
  const question = item.question || item.q || item.title || "";
  const answer = item.answer || item.a || item.content || item.description || "";
  return { question, answer };
}

export function FAQArticles({
  fAQDataJSON = "[]",
  cardBackground = "#f5f2ee",
  hoverBackground = "#f0ece6",
  openBackground = "#ede9e3",
  questionColor = "#000000",
  answerColor = "#555555",
  fontFamily = "inherit",
}: FAQArticlesProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = useMemo(() => {
    try {
      const parsed = JSON.parse(fAQDataJSON || "[]") as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is FAQItem => Boolean(item) && typeof item === "object")
        .map(readItem)
        .filter((item) => item.question || item.answer);
    } catch {
      return [];
    }
  }, [fAQDataJSON]);

  if (!items.length) return null;

  return (
    <div
      className="flex w-full max-w-[827px] flex-col gap-[10px]"
      style={{ fontFamily }}
    >
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const answerId = `faq-answer-${index}`;
        return (
          <motion.div
            key={`${item.question}-${index}`}
            className="w-full overflow-hidden rounded-[16px]"
            initial={false}
            animate={{ backgroundColor: isOpen ? openBackground : cardBackground }}
            whileHover={{ backgroundColor: isOpen ? openBackground : hoverBackground }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="flex w-full cursor-pointer items-center gap-[14px] border-0 bg-transparent px-[18px] py-4 text-left min-[810px]:px-[22px] min-[810px]:py-[18px]"
              type="button"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              style={{ fontFamily: "inherit", color: questionColor }}
            >
              <motion.span
                className="inline-block w-5 shrink-0 text-center text-[20px] leading-none font-light"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                +
              </motion.span>
              <span className="min-w-0 flex-1 text-[15px] leading-[1.3] font-semibold min-[810px]:text-[16px]">
                {item.question}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={answerId}
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.44, 0, 0.56, 1] }}
                >
                  <div
                    className="pr-[18px] pb-4 pl-[52px] text-[14px] leading-[1.6] font-normal min-[810px]:pr-[22px] min-[810px]:pb-[18px] min-[810px]:pl-[56px] min-[810px]:text-[15px]"
                    style={{ color: answerColor }}
                  >
                    {item.answer}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
