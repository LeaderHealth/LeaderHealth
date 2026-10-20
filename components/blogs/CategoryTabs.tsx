"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { BlogCategory } from "./types";

const reveal = {
  duration: 0.4,
  ease: [0.44, 0, 0.56, 1] as const,
  delay: 0,
};

export function CategoryTabs({
  categories,
  selectedCategory,
  onChange,
}: {
  categories: BlogCategory[];
  selectedCategory: string | null;
  onChange: (categoryId: string | null) => void;
}) {
  const reduce = useReducedMotion();
  const active = selectedCategory ?? "new";

  return (
    <motion.div
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      initial={reduce ? false : { opacity: 0, y: 150 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={reveal}
    >
      {categories.map((category) => {
        const selected = active === category.id;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category.id)}
            className={`font-sans text-[14px] font-medium tracking-[-0.01em] transition-colors min-[1100px]:text-[15px] ${
              selected ? "text-[#e23d4c]" : "text-[#e7b4bc] hover:text-[#e23d4c]"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </motion.div>
  );
}
