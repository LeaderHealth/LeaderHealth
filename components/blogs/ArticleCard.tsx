"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatMediumDate } from "./content";
import type { BlogArticle } from "./types";

const hoverSpring = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };

export function ArticleCard({ article }: { article: BlogArticle }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="min-w-0"
      whileHover={reduce ? undefined : { scale: 0.9, opacity: 1 }}
      transition={hoverSpring}
    >
      <Link
        href={`/articles/${article.slug}`}
        className="group relative block h-[166px] overflow-hidden rounded-[16px] bg-[#321110] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink min-[810px]:aspect-[4/5] min-[810px]:h-auto min-[810px]:rounded-[20px] min-[1100px]:aspect-square min-[1100px]:rounded-[22px]"
      >
        {article.image ? (
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            sizes="(min-width: 1100px) 370px, (min-width: 810px) 50vw, 50vw"
            className="object-cover"
          />
        ) : null}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1c0d0c]/80 via-[#1c0d0c]/10 to-transparent" />
        <span className="absolute top-3 left-3 hidden font-sans text-[13px] text-white/85 min-[1100px]:block">
          {formatMediumDate(article.date)}
        </span>
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-2.5 text-white min-[810px]:p-4">
          <span className="order-1 line-clamp-2 font-sans text-[12px] leading-[1.2] font-medium tracking-[-0.02em] min-[810px]:text-[18px] min-[1100px]:order-2 min-[1100px]:truncate min-[1100px]:text-[16px]">
            {article.title}
          </span>
          <span className="order-2 flex items-center gap-2 min-[1100px]:order-1">
            <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-white/20 min-[1100px]:size-8">
              <Image src={article.authorImage} alt="" fill sizes="32px" className="object-cover object-top" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-sans text-[10px] font-medium min-[810px]:text-[12px] min-[1100px]:text-[13px]">
                {article.authorName}
              </span>
              <span className="hidden truncate font-sans text-[11px] text-white/80 min-[1100px]:block">
                {article.authorOccupation}
              </span>
            </span>
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
