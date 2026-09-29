"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export type AccordionPanel = {
  title: string;
  description: string;
  image: string;
  alt: string;
  tag?: string;
  video?: string;
  button?: { label: string; href: string };
  objectPosition?: string;
};

type Props = {
  panels: AccordionPanel[];
  label?: string;
  expandedFlex?: number;
  collapsedFlex?: number;
  gap?: number;
  transitionSpeed?: number;
  breakpoint?: number;
  mobileExpanded?: number;
  mobileCollapsed?: number;
  desktopHeight?: number;
};

function PanelMedia({
  panel,
  open,
}: {
  panel: AccordionPanel;
  open: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !panel.video) return;
    if (open) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [open, panel.video]);

  if (panel.video) {
    return (
      <video
        ref={videoRef}
        src={panel.video}
        poster={panel.image}
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: panel.objectPosition ?? "center" }}
      />
    );
  }

  return (
    <Image
      src={panel.image}
      alt={panel.alt}
      fill
      className="object-cover"
      style={{ objectPosition: panel.objectPosition ?? "center" }}
      sizes="(max-width: 700px) 100vw, 50vw"
    />
  );
}

export function AccordionGallery({
  panels,
  label = "Image gallery",
  expandedFlex = 5,
  collapsedFlex = 1,
  gap = 2,
  transitionSpeed = 0.6,
  breakpoint = 700,
  mobileExpanded = 470,
  mobileCollapsed = 96,
  desktopHeight = 510,
}: Props) {
  const [active, setActive] = useState(0);
  const [stacked, setStacked] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const speed = reduce ? 0 : transitionSpeed;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setStacked(frame.getBoundingClientRect().width < breakpoint);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [breakpoint]);

  const mainTransition = { duration: speed, ease: EASE };
  const contentTransition = {
    duration: speed * 0.8,
    delay: speed * 0.2,
    ease: EASE,
  };
  const contentExit = { duration: speed * 0.35, ease: EASE };
  const mobileLabelTransition = { duration: speed * 0.5, ease: EASE };

  return (
    <div
      ref={frameRef}
      role="group"
      aria-label={label}
      className="mx-auto flex w-[94%] overflow-hidden"
      style={{
        gap,
        flexDirection: stacked ? "column" : "row",
        height: stacked ? "auto" : desktopHeight,
      }}
    >
      {panels.map((panel, index) => {
        const open = active === index;
        return (
          <motion.div
            key={panel.title}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={panel.title}
            onPointerEnter={(event) => {
              if (!stacked && event.pointerType === "mouse") setActive(index);
            }}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(index);
              }
            }}
            className="relative min-h-0 min-w-0 cursor-pointer overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
            initial={false}
            animate={
              stacked
                ? {
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: "auto",
                    height: open ? mobileExpanded : mobileCollapsed,
                  }
                : {
                    flexGrow: open ? expandedFlex : collapsedFlex,
                    flexShrink: 1,
                    flexBasis: 0,
                    height: desktopHeight,
                  }
            }
            transition={mainTransition}
          >
            <PanelMedia panel={panel} open={open} />

            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={false}
              animate={{ opacity: open ? 1 : 0.4 }}
              transition={mainTransition}
              style={{
                background:
                  "linear-gradient(to top, rgba(12, 8, 8, 0.78) 0%, rgba(12, 8, 8, 0.28) 42%, rgba(12, 8, 8, 0) 72%)",
              }}
            />

            {panel.tag ? (
              <motion.span
                className="pointer-events-none absolute top-4 right-4 rounded-full bg-black/35 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm"
                initial={false}
                animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={open ? contentTransition : contentExit}
              >
                {panel.tag}
              </motion.span>
            ) : null}

            {stacked ? (
              <motion.p
                className="pointer-events-none absolute inset-x-0 bottom-0 truncate px-4 pb-4 text-[18px] font-semibold text-white"
                initial={false}
                animate={{ opacity: open ? 0 : 1 }}
                transition={mobileLabelTransition}
              >
                {panel.title}
              </motion.p>
            ) : null}

            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-5 sm:pb-6"
              initial={false}
              animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={open ? contentTransition : contentExit}
            >
              <h3 className="truncate font-sans text-[20px] font-semibold leading-tight text-white sm:text-[24px]">
                {panel.title}
              </h3>
              <p className="mt-1.5 max-w-[16rem] text-[13px] leading-snug text-white/95 sm:text-[14px]">
                {panel.description}
              </p>
              {panel.button ? (
                <a
                  href={panel.button.href}
                  className="pointer-events-auto mt-3 inline-flex text-[13px] font-semibold text-white underline underline-offset-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  {panel.button.label}
                </a>
              ) : null}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
