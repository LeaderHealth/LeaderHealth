"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";

const reviewerPhoto =
  "https://framerusercontent.com/images/CBEORhbxaa9YtXhJqFi9Ce8oWS8.png?width=664&height=798";

type ScrollPhase = "pending" | "waiting" | "in";

function useScrollPhase(ref: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState<ScrollPhase>("pending");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = node.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.86 && rect.bottom > 64;
    if (reduce || visible) {
      setPhase("in");
      return;
    }

    setPhase("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setPhase("in");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return phase;
}

export function ReviewerCard() {
  const ref = useRef<HTMLElement>(null);
  const phase = useScrollPhase(ref);

  return (
    <aside ref={ref} data-phase={phase} className="reviewer-card w-full">
      <div className="rounded-[24px] bg-[#3c2624] px-4 py-5 text-white min-[810px]:rounded-[28px] min-[810px]:px-6 min-[810px]:py-6 min-[1100px]:px-8 min-[1100px]:py-7">
        <h2 className="mx-auto max-w-[210px] text-center font-sans text-[28px] leading-[1.08] font-semibold tracking-[-0.03em] min-[810px]:mx-0 min-[810px]:max-w-none min-[810px]:text-left min-[810px]:text-[26px] min-[1100px]:text-[32px]">
          About Medical Reviewer
        </h2>

        <div className="mt-5 flex flex-col items-center gap-4 min-[810px]:mt-5 min-[810px]:flex-row min-[810px]:items-stretch min-[810px]:gap-4 min-[1100px]:gap-5">
          <div className="order-2 flex w-full items-center rounded-[16px] bg-[#d4cec9] px-4 py-5 min-[810px]:order-1 min-[810px]:min-h-0 min-[810px]:flex-1 min-[810px]:px-5 min-[810px]:py-6 min-[1100px]:px-8 min-[1100px]:py-8">
            <p className="text-center font-sans text-[14px] leading-[1.55] text-[#2c1c1a] min-[810px]:text-[13px] min-[810px]:leading-[1.5] min-[1100px]:text-[16px] min-[1100px]:leading-[1.6]">
              <strong className="font-semibold">Stephen Ratcliff, MD</strong> is the Chief Medical Officer of Leader Health and the board-certified physician responsible for clinical governance, medical content review, and regulatory oversight across the platform. Every article on the Leader Health blog is reviewed and approved by Dr. Ratcliff before publication.
            </p>
          </div>

          <div className="order-1 flex w-[78%] max-w-[280px] flex-col items-center min-[810px]:order-2 min-[810px]:w-[210px] min-[810px]:max-w-none min-[810px]:shrink-0 min-[1100px]:w-[280px]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[16px] bg-[#d4cec9]">
              <Image
                src={reviewerPhoto}
                alt="Stephen Ratcliff, MD, MBA"
                fill
                sizes="(min-width: 1100px) 280px, (min-width: 810px) 210px, 240px"
                className="reviewer-card-photo object-cover object-[center_18%]"
              />
            </div>
            <p className="mt-3 text-center font-sans text-[14px] leading-tight font-semibold min-[1100px]:text-[16px]">
              Stephen Ratcliff, MD, MBA
            </p>
            <p className="mt-1 text-center font-sans text-[12px] text-white/75 min-[1100px]:text-[13px]">CMO of Leader Health</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
