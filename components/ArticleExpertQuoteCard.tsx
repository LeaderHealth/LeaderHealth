"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type ArticleExpertQuoteCardProps = {
  heading?: string;
  quote: string;
  authorImage: string;
  authorName: string;
  authorTitle: string;
};

export function ArticleExpertQuoteCard({
  heading = "Expert insight",
  quote,
  authorImage,
  authorName,
  authorTitle,
}: ArticleExpertQuoteCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] items-center justify-center">
      <motion.section
        className="flex h-auto w-full max-w-[1146px] flex-col items-start justify-center gap-[11px] overflow-hidden rounded-[18px] bg-[linear-gradient(137deg,rgba(107,85,84,1)_17.45%,rgba(50,17,16,1)_79.23%)] p-5 min-[810px]:p-[30px] min-[1200px]:h-[450px] min-[1200px]:w-[1146px]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, ease: [0.44, 0, 0.56, 1], delay: 0 }}
      >
        <div className="flex w-full items-center gap-[10px] min-[1200px]:pl-[30px]">
          <h2
            className="m-0 font-sans text-[25px] leading-[1.1] font-semibold text-[rgba(249,249,249,0.97)] min-[810px]:text-[29px] min-[1200px]:text-[34px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            {heading}
          </h2>
        </div>

        <div className="flex w-full flex-1 flex-col items-center justify-between gap-[10px] overflow-hidden min-[810px]:h-auto min-[810px]:min-h-[280px] min-[810px]:flex-row min-[1200px]:min-h-0">
          <div className="flex h-auto w-full items-center justify-center rounded-[19px] bg-[rgba(249,249,249,0.74)] p-5 min-[810px]:h-full min-[810px]:min-w-0 min-[810px]:flex-1 min-[810px]:p-[25px] min-[1200px]:w-[682px] min-[1200px]:flex-none">
            <p
              className="m-0 w-full text-justify font-sans text-[17px] leading-[1.6] font-medium text-[rgb(50,18,14)] min-[810px]:text-[18px] min-[1200px]:text-[21px]"
              style={{ letterSpacing: "-0.02em" }}
            >
              {quote}
            </p>
          </div>

          <aside className="flex h-auto w-full flex-col items-center justify-center gap-[10px] min-[810px]:w-auto min-[810px]:shrink-0 min-[810px]:items-start min-[1200px]:h-full">
            <div className="relative aspect-[310/253] w-full overflow-hidden rounded-[28px] shadow-[0px_2px_2px_rgba(0,0,0,0.25)] min-[810px]:aspect-auto min-[810px]:h-[284px] min-[810px]:w-[280px] min-[810px]:flex-none min-[1000px]:w-[300px] min-[1200px]:h-auto min-[1200px]:w-[323px] min-[1200px]:min-h-0 min-[1200px]:flex-1">
              <Image
                src={authorImage}
                alt={authorName}
                fill
                sizes="(min-width: 1200px) 323px, (min-width: 810px) 300px, 100vw"
                className="object-cover object-center"
              />
            </div>
            <p className="m-0 w-full text-center font-sans text-[18px] leading-[1.2] font-medium text-[rgb(249,249,249)] min-[810px]:w-[280px] min-[1000px]:w-[300px] min-[1200px]:w-[323px]">
              {authorName}
            </p>
            <p className="m-0 w-full text-center font-sans text-[13px] leading-[1.2] font-medium text-[rgba(249,249,249,0.94)] min-[810px]:w-[280px] min-[1000px]:w-[300px] min-[1200px]:w-[323px]">
              {authorTitle}
            </p>
          </aside>
        </div>
      </motion.section>
    </div>
  );
}
