"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { TableOfContents } from "./TableOfContents";

export type ArticleBodyWithTableOfContentsProps = {
  content: ReactNode;
  tocTitle?: string;
};

export function ArticleBodyWithTableOfContents({
  content,
  tocTitle = "In this article",
}: ArticleBodyWithTableOfContentsProps) {
  const contentRef = useRef<HTMLElement>(null);
  const [hasToc, setHasToc] = useState(false);

  useEffect(() => {
    const root = contentRef.current;
    setHasToc(Boolean(root?.querySelector("h2[id], h3[id]")));
  }, [content]);

  return (
    <motion.section
      className="relative flex w-full flex-col items-start gap-6 overflow-hidden px-5 min-[810px]:flex-row min-[810px]:justify-center min-[810px]:gap-8 min-[810px]:px-6 min-[1200px]:gap-[58px] min-[1200px]:pr-[25px] min-[1200px]:pl-[50px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.44, 0, 0.56, 1] }}
    >
      <div className={`w-full min-[810px]:hidden ${hasToc ? "" : "hidden"}`}>
        <details className="rounded-[12px] border border-[#e4d8d4] bg-white px-4 py-3">
          <summary className="cursor-pointer font-sans text-[14px] font-semibold text-[#321110]">{tocTitle}</summary>
          <div className="pt-3">
            <TableOfContents containerRef={contentRef} title={tocTitle} showTitle={false} />
          </div>
        </details>
      </div>

      <article
        ref={contentRef}
        className="relative h-auto w-full min-w-0 min-[810px]:flex-1 min-[1200px]:w-[782px] min-[1200px]:flex-none text-[16px] leading-[1.7] text-brown sm:text-[17px] sm:leading-[1.75] [&_a]:text-accent [&_a]:underline [&_h2]:scroll-mt-28 [&_h2]:font-sans [&_h2]:text-[22px] [&_h2]:leading-tight [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-[#321110] [&_h3]:scroll-mt-28 [&_h3]:font-sans [&_h3]:text-[22px] [&_h3]:leading-tight [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-[#321110] [&_h2+p]:mt-3 [&_h3+p]:mt-3 [&_img]:h-auto [&_img]:max-w-full [&_li]:mt-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_h2]:mt-8 [&_h3]:mt-8 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0"
      >
        {content}
      </article>

      <aside className={`relative h-auto w-[200px] shrink-0 min-[1000px]:w-[223px] ${hasToc ? "hidden min-[810px]:block" : "hidden"}`}>
        <TableOfContents containerRef={contentRef} title={tocTitle} fontSize={14} activeColor="#000000" fontFamily="inherit" />
      </aside>
    </motion.section>
  );
}
