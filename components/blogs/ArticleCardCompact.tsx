"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const hoverSpring = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };

export type ArticleCardCompactProps = {
  blogTitle: string;
  blogDescription?: string;
  blogImage: string;
  blogDate: string;
  blogAuthor: string;
  blogAuthorImage: string;
  blogAuthorOccupation: string;
  href?: string;
};

export function ArticleCardCompact({
  blogTitle,
  blogImage,
  blogDate,
  blogAuthor,
  blogAuthorImage,
  blogAuthorOccupation,
  href,
}: ArticleCardCompactProps) {
  const reduce = useReducedMotion();

  const card = (
    <span className="relative block h-full w-full overflow-hidden rounded-[20px]">
      {blogImage ? (
        <Image src={blogImage} alt={blogTitle} fill sizes="293px" className="object-cover" />
      ) : null}
      <span
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(180deg, rgba(186, 102, 91, 0) 70%, rgb(77, 37, 32) 100%)" }}
      />
      <span className="absolute inset-x-[18px] bottom-[18px] z-[2] font-sans text-[#f9f9f9]">
        <span className="mb-2 block text-[9px] font-medium tracking-[0.03em] text-[#f9f9f9]">{blogDate}</span>
        <span className="mb-2.5 flex items-center gap-2">
          <span className="relative size-[27px] shrink-0 overflow-hidden rounded-full border border-[#222]">
            <Image src={blogAuthorImage} alt="" fill sizes="27px" className="object-cover object-top" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[9px] font-medium tracking-[0.03em] text-[rgba(249,249,249,0.9)]">
              {blogAuthor}
            </span>
            <span className="block truncate text-[7px] leading-[1.2] font-medium text-[#f9f9f9]">{blogAuthorOccupation}</span>
          </span>
        </span>
        <span className="block w-[257px] truncate text-[15px] leading-[1.4] font-medium tracking-[-0.04em] text-[rgba(249,249,249,0.87)]">
          {blogTitle}
        </span>
      </span>
    </span>
  );

  return (
    <motion.div
      className="relative h-[365px] w-[293px] shrink-0 overflow-hidden rounded-[20px] shadow-[0px_6px_6px_rgba(0,0,0,0.25)]"
      whileHover={reduce ? undefined : { scale: 0.9, opacity: 1, x: 0, y: 0, rotate: 0 }}
      transition={hoverSpring}
    >
      {href ? (
        <Link
          href={href}
          className="block h-full w-full overflow-hidden rounded-[20px] text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          {card}
        </Link>
      ) : (
        <article className="block h-full w-full overflow-hidden rounded-[20px]">{card}</article>
      )}
    </motion.div>
  );
}
