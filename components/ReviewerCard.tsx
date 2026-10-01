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
    <aside ref={ref} data-phase={phase} className="reviewer-card mx-auto mt-14 w-full max-w-[782px] sm:mt-16">
      <div className="relative overflow-hidden rounded-[32px] border-[12px] border-[#3d2422] bg-[#3d2422] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_0_0_1px_rgba(255,255,255,0.08),0_22px_48px_rgba(50,17,16,0.18)] sm:rounded-[36px] sm:border-[14px]">
        <Image
          src={reviewerPhoto}
          alt="Stephen Ratcliff, MD, MBA"
          fill
          sizes="(min-width: 782px) 782px, 100vw"
          className="reviewer-card-photo object-cover object-[center_32%]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 bottom-0 h-[58%] backdrop-blur-[3px] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_75%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_75%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_42%,rgba(61,36,34,0.14)_54%,rgba(61,36,34,0.42)_64%,rgba(61,36,34,0.7)_74%,rgba(61,36,34,0.88)_86%,rgba(61,36,34,0.95)_100%)]" />
        </div>
        <div className="relative z-10 px-5 pt-[78%] pb-5 sm:px-6 sm:pt-[58%] sm:pb-6 lg:pt-[52%]">
          <p className="text-[13px] font-medium tracking-[0.04em] text-white/70 sm:text-[14px]">
            About Medical Reviewer
          </p>
          <h2 className="mt-1 font-sans text-[24px] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[32px]">
            Stephen Ratcliff, MD, MBA
          </h2>
          <p className="mt-1 text-[14px] text-white/75 sm:text-[15px]">CMO of Leader Health</p>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-white/92 sm:text-[17px] sm:leading-[1.65]">
            <strong className="font-semibold">Stephen Ratcliff, MD</strong> is the Chief Medical Officer of Leader Health and the board-certified physician responsible for clinical governance and medical content review across the platform.
          </p>
        </div>
      </div>
    </aside>
  );
}
