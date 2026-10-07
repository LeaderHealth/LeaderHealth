"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GET_STARTED_URL, PORTAL_URL } from "@/lib/content/site";
import type { SearchHit } from "@/lib/search";

const tabletEase = [0.45, 0, 0.55, 1] as const;
const tabletTransition = { duration: 0.5, ease: tabletEase };

export type TabletPanel = "men" | "women" | "who" | "search";

type TabletLink = { href: string; label: string };

type TabletCard = {
  title: string;
  image: string;
  href?: string;
  links?: TabletLink[];
  caption?: string;
  overlay?: boolean;
};

const art = {
  hormone: "https://framerusercontent.com/images/0Dc1AHzfwqI1KOT0DPkVQC15OJc.png?width=1243&height=829",
  sexual: "https://framerusercontent.com/images/49YJbEpaofXSfvWXDy61AIkQ6B8.png?width=955&height=637",
  weight: "https://framerusercontent.com/images/QA1T6u9qvcx7CQjYHi0OoXD8.png?width=855&height=570",
  longevity: "https://framerusercontent.com/images/JEVbW8is3dGZ8TcfoGQtiV5Clos.png?width=1029&height=686",
  labs: "https://framerusercontent.com/images/Q44i4peG4DmvEogvXXYSxkQO4.png?width=1063&height=709",
  peptides: "https://framerusercontent.com/images/afGkBI82CZ5CHahlNzZPk7a5SIk.png?width=1536&height=1024",
};

const menCards: TabletCard[] = [
  {
    title: "Testosterone Replacement Therapy",
    image: art.hormone,
    links: [
      { href: "/products/men-trt-testosterone-cypionate", label: "Testosterone Cypionate Injectable" },
      { href: "/products/men-trt-enclomiphene", label: "Enclomiphene" },
      { href: "/products/men-trt-testosterone-cream", label: "Testosterone Cream" },
    ],
  },
  {
    title: "Sexual Health",
    image: art.sexual,
    links: [
      { href: "/products/men-sexual-health-tadalafil", label: "Tadalafil" },
      { href: "/products/sexual-health-pt-141-nasal", label: "PT-141 Nasal" },
      { href: "/products/men-sexual-health-trimix-injectable", label: "Trimix" },
      { href: "/products/men-sexual-health-combo-troches", label: "Combo Troches" },
    ],
  },
  {
    title: "Weight Loss",
    image: art.weight,
    links: [
      { href: "/products/weight-loss-semaglutide", label: "Semaglutide" },
      { href: "/products/weight-loss-tirzepatide", label: "Tirzepatide" },
    ],
  },
  {
    title: "Longevity",
    image: art.longevity,
    links: [
      { href: "/products/longevity-glutathione", label: "Glutathione" },
      { href: "/products/longevity-nad", label: "NAD+" },
      { href: "/products/longevity-sermorelin", label: "Sermorelin" },
      { href: "/energy-longevity", label: "What Longevity Covers ->" },
    ],
  },
  {
    title: "Diagnostic Labs",
    image: art.labs,
    links: [
      { href: "/labs/labs-complete-panel", label: "Complete Panel • 64 biomarkers" },
      { href: "/labs/labs-advance-panel", label: "Advanced Panel • 100 biomarkers" },
    ],
  },
  {
    title: "Peptides",
    image: art.peptides,
    href: "/advanced-peptides",
    caption: "Compare peptides side by side",
    overlay: true,
  },
];

const womenCards: TabletCard[] = [
  {
    title: "Hormone Replacement Therapy",
    image: art.hormone,
    href: "/products/women-hormone-therapy",
    caption: "Physician-guided HRT, tailored to your labs",
  },
  {
    title: "Sexual Health",
    image: art.sexual,
    links: [
      { href: "/products/sexual-health-pt-141-nasal", label: "PT-141 Nasal" },
      { href: "/products/women-sexual-health-combo-troches", label: "Combo Troches" },
    ],
  },
  {
    title: "Weight Loss",
    image: art.weight,
    links: [
      { href: "/products/weight-loss-semaglutide", label: "Semaglutide" },
      { href: "/products/weight-loss-tirzepatide", label: "Tirzepatide" },
    ],
  },
  {
    title: "Longevity",
    image: art.longevity,
    links: [
      { href: "/products/longevity-glutathione", label: "Glutathione" },
      { href: "/products/longevity-nad", label: "NAD+" },
      { href: "/products/longevity-sermorelin", label: "Sermorelin" },
      { href: "/energy-longevity", label: "What Longevity Covers ->" },
    ],
  },
  {
    title: "Diagnostic Labs",
    image: art.labs,
    links: [
      { href: "/labs/labs-complete-panel", label: "Complete Panel • 64 biomarkers" },
      { href: "/labs/labs-advance-panel", label: "Advanced Panel • 100 biomarkers" },
    ],
  },
  {
    title: "Peptides",
    image: art.peptides,
    href: "/advanced-peptides",
    caption: "Compare peptides side by side",
    overlay: true,
  },
];

const whoLinks = [
  { href: "/aboutus", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Learn" },
];

const linkClass = "font-sans text-[16px] leading-snug font-light text-white/95";
const fadeTap =
  "transition-opacity duration-200 ease-out hover:opacity-80 active:opacity-60 motion-reduce:transition-none";
const washTap =
  "rounded-lg transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white active:bg-white/15 motion-reduce:transition-none";

function CategoryImage({ src }: { src: string }) {
  return (
    <div className="lh-tablet-card-media relative aspect-[2/1] w-full overflow-hidden rounded-[12px]">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
        sizes="240px"
      />
    </div>
  );
}

function CategoryCard({ card, onNavigate }: { card: TabletCard; onNavigate: () => void }) {
  const media = <CategoryImage src={card.image} />;

  return (
    <article className="min-w-0">
      {card.href && card.overlay ? (
        <Link
          href={card.href}
          onClick={onNavigate}
          className="group -mx-[9px] -mt-[15px] block rounded-2xl border border-white/30 px-2 pt-3.5 pb-5 transition-[border-color,background-color,transform] duration-200 ease-out hover:border-white/55 hover:bg-white/5 active:scale-[0.99] motion-reduce:transform-none"
        >
          {media}
          <span className="mt-4 flex items-center justify-between gap-3 font-sans text-[16px] leading-tight font-semibold text-white">
            <span>{card.title}</span>
            <span aria-hidden className="shrink-0">
              →
            </span>
          </span>
          {card.caption ? (
            <span className="mt-3 block font-sans text-[13px] leading-snug font-light text-white/90">{card.caption}</span>
          ) : null}
        </Link>
      ) : card.href && !card.links ? (
        <Link href={card.href} onClick={onNavigate} className="group block overflow-hidden rounded-[12px]">
          {media}
        </Link>
      ) : (
        media
      )}
      {card.overlay ? null : (
        <>
          {card.href && !card.links ? (
            <Link
              href={card.href}
              onClick={onNavigate}
              className={`mt-2 block font-sans text-[16px] leading-snug font-semibold text-white ${fadeTap}`}
            >
              {card.title}
            </Link>
          ) : (
            <h3 className="mt-2 font-sans text-[16px] leading-snug font-semibold text-white">{card.title}</h3>
          )}
          {card.caption ? <p className={`${linkClass} mt-1`}>{card.caption}</p> : null}
          {card.links ? (
            <ul className="mt-0.5">
              {card.links.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`${linkClass} ${washTap} flex min-h-8 w-full items-center px-2`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </article>
  );
}

function BrowseRow({
  href,
  detail,
  onNavigate,
}: {
  href: string;
  detail: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3">
      <Link
        href={href}
        onClick={onNavigate}
        className="inline-flex min-h-14 items-center gap-3 rounded-full bg-white px-3 py-2 text-[#331110] transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#331110] hover:text-[#F7F3F5] active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#331110]/20">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M8 3.5h6.2L18.5 8v12.5H8V3.5Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14.2 3.5V8h4.3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <span className="text-left font-sans text-[15px] leading-tight">
          <span className="block font-semibold">Rather browse first?</span>
          <span className="block font-normal">{detail}</span>
        </span>
        <span aria-hidden className="pr-1">
          →
        </span>
      </Link>
      <a
        href={PORTAL_URL}
        className="inline-flex min-h-12 items-center rounded-full border border-white/50 px-5 font-sans text-[15px] font-medium text-white transition-[background-color,border-color] duration-200 ease-out hover:border-white/80 hover:bg-white/10 active:bg-white/15 motion-reduce:transition-none"
      >
        Log In / Sign Up
      </a>
    </div>
  );
}

export function TabletNavBar({
  panel,
  onToggle,
  onShop,
}: {
  panel: TabletPanel | null;
  onToggle: (panel: TabletPanel) => void;
  onShop: () => void;
}) {
  const itemClass = `inline-flex h-11 items-center rounded-full px-1.5 font-sans text-[16px] leading-none font-semibold text-white transition-[opacity,background-color] duration-200 ease-out hover:bg-white/15 hover:opacity-100 active:bg-white/20 aria-expanded:bg-white/20 motion-reduce:transition-none`;

  return (
    <div className="lh-tablet-bar ml-auto hidden h-12 items-center gap-1 pr-5">
      <button type="button" className={itemClass} aria-expanded={panel === "men"} onClick={() => onToggle("men")}>
        Men
      </button>
      <button type="button" className={itemClass} aria-expanded={panel === "women"} onClick={() => onToggle("women")}>
        Women
      </button>
      <Link href="/shop-all-products" className={itemClass} onClick={onShop}>
        Shop All
      </Link>
      <button type="button" className={itemClass} aria-expanded={panel === "who"} onClick={() => onToggle("who")}>
        Who We Are
      </button>
      <button
        type="button"
        aria-label="Search"
        aria-expanded={panel === "search"}
        onClick={() => onToggle("search")}
        className="grid h-11 w-11 place-items-center rounded-full border border-white/35 bg-white/10 text-white transition-[background-color,transform] duration-200 ease-out hover:bg-white/20 active:scale-[0.97] aria-expanded:bg-white/20 motion-reduce:transform-none"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <a
        href={GET_STARTED_URL}
        className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 font-sans text-[15px] font-medium text-[#331110] transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#331110] hover:text-[#F7F3F5] active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
      >
        Get Started
      </a>
    </div>
  );
}

export function TabletNavPanel({
  panel,
  query,
  onQuery,
  results,
  onSubmit,
  onNavigate,
}: {
  panel: TabletPanel;
  query: string;
  onQuery: (value: string) => void;
  results: SearchHit[];
  onSubmit: (value?: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className={`lh-tablet-panel hidden w-full px-5 pt-1 pb-4 ${
        panel === "men" || panel === "women"
          ? "overflow-hidden"
          : "max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain"
      }`}
    >
      {panel === "men" || panel === "women" ? (
        <>
          <div className="mx-auto grid max-w-[760px] grid-cols-3 items-start gap-x-3 gap-y-4">
            {(panel === "men" ? menCards : womenCards).map((card) => (
              <CategoryCard key={card.title} card={card} onNavigate={onNavigate} />
            ))}
          </div>
          <div className="mx-auto max-w-[760px]">
            <BrowseRow
              href={panel === "men" ? "/shop-men-products" : "/shop-women-products"}
              detail={panel === "men" ? "See the full men's lineup." : "See the full women's lineup."}
              onNavigate={onNavigate}
            />
          </div>
        </>
      ) : null}

      {panel === "who" ? (
        <nav className="mx-auto flex max-w-[760px] flex-col py-2" aria-label="Who We Are">
          {whoLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`-mx-2 flex min-h-12 items-center border-b border-white/20 px-2 font-sans text-[16px] font-semibold text-white ${washTap}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {panel === "search" ? (
        <div className="mx-auto max-w-[760px] py-2">
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              const field = event.currentTarget.elements.namedItem("q");
              const value = field instanceof HTMLInputElement ? field.value : query;
              onQuery(value);
              onSubmit(value);
            }}
          >
            <input
              name="q"
              autoFocus
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search…"
              aria-label="Search"
              enterKeyHint="search"
              className="w-full rounded-full border border-white/30 bg-white/10 py-3 pr-12 pl-4 font-sans text-[16px] text-white outline-none placeholder:text-white/60"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white text-[#331110] transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:bg-[#331110] hover:text-[#F7F3F5] active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <div className="mt-3">
            {results.map((hit) => (
              <Link
                key={hit.href}
                href={hit.href}
                onClick={onNavigate}
                className={`-mx-2 flex min-h-12 flex-col justify-center border-b border-white/15 px-2 py-2 font-sans text-white ${washTap}`}
              >
                <span className="text-[16px]">{hit.title}</span>
                <span className="text-[13px] text-white/70">{hit.category}</span>
              </Link>
            ))}
            {query.trim() && results.length === 0 ? (
              <p className="py-3 font-sans text-[15px] text-white/70">No matches.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TabletNavDisclosure({
  panel,
  query,
  onQuery,
  results,
  onSubmit,
  onNavigate,
}: {
  panel: TabletPanel | null;
  query: string;
  onQuery: (value: string) => void;
  results: SearchHit[];
  onSubmit: (value?: string) => void;
  onNavigate: () => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef(panel);
  const [held, setHeld] = useState<TabletPanel | null>(panel);
  if (panel && panel !== held) setHeld(panel);
  const active = panel ?? held;
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!panel || !el) {
      setHeight(0);
      return;
    }

    const measure = () => {
      const next = el.offsetHeight;
      setHeight((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [panel, active, query, results.length]);

  return (
    <motion.div
      className="lh-tablet-clip"
      animate={{ height }}
      transition={reduce ? { duration: 0 } : tabletTransition}
      onAnimationComplete={() => {
        if (!panelRef.current) setHeld(null);
      }}
      style={{ overflow: "hidden" }}
    >
      <div ref={innerRef} className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          {active ? (
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={reduce ? { duration: 0 } : tabletTransition}
            >
              <TabletNavPanel
                panel={active}
                query={query}
                onQuery={onQuery}
                results={results}
                onSubmit={onSubmit}
                onNavigate={onNavigate}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
