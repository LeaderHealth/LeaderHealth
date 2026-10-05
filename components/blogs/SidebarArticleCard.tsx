"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMediumDate } from "./content";
import type { BlogArticle } from "./types";

export function SidebarArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="flex w-[260px] shrink-0 gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink min-[1100px]:w-full"
    >
      <span className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-[8px] bg-[#efe6d4] min-[1100px]:h-[68px] min-[1100px]:w-[88px]">
        {article.image ? (
          <Image src={article.image} alt="" fill sizes="88px" className="object-cover" />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-3 font-sans text-[13px] leading-[1.25] font-medium tracking-[-0.02em] text-[#321110]">
          {article.title}
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-2 font-sans text-[12px] text-[#e23d4c]">
          <span className="truncate">{article.topic}</span>
          <span className="shrink-0">{formatMediumDate(article.date)}</span>
        </span>
      </span>
    </Link>
  );
}
