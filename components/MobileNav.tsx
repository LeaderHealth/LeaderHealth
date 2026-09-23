"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { assets, PORTAL_URL, site } from "@/lib/content/site";
import { getProduct, products } from "@/lib/content/products";
import {
  findMegaCategory,
  menDefaultCard,
  menMegaCategories,
  type FeatureCard,
  type MegaCategory,
  type MegaItem,
  womenDefaultCard,
  womenMegaCategories,
} from "@/lib/content/nav";

const MOBILE_GET_STARTED_URL = "https://products.leaderhealth.clinic?quizOpen=true";

type Audience = "men" | "women";

type MobileScreen =
  | { name: "root" }
  | { name: "who" }
  | { name: "audience"; audience: Audience }
  | { name: "list"; audience: Audience; categoryId: string };

const whoRows = [
  { href: "/aboutus", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Blogs" },
];

type RootTile =
  | { label: string; image: string; screen: { name: "who" } | { name: "audience"; audience: Audience } }
  | { label: string; image: string; href: string };

const rootTiles: RootTile[] = [
  { label: "Women", image: assets.stretching, screen: { name: "audience", audience: "women" } },
  { label: "Men", image: assets.weightlifting, screen: { name: "audience", audience: "men" } },
  { label: "Who Are We?", image: assets.showUp, screen: { name: "who" } },
  { label: "Shop All Products", image: assets.shopHero, href: "/shop-all-products" },
  {
    label: "Peptides",
    image: getProduct("longevity-sermorelin")?.image ?? assets.pills,
    href: "/advanced-peptides",
  },
];

function categoryImage(category: MegaCategory) {
  return category.card.image || assets.shopHero;
}

const menTiles = [
  { id: "hormone", label: "Testosterone Replacement Therapy" },
  { id: "sexual", label: "Sexual Health" },
  { id: "weight-loss", label: "Weight Loss" },
  { id: "longevity", label: "Longevity" },
  { id: "labs", label: "Labs", wide: true },
];

const womenTiles = [
  { id: "hormone", label: "Hormone Replacement Therapy" },
  { id: "sexual", label: "Sexual Health" },
  { id: "weight-loss", label: "Weight Loss" },
  { id: "longevity", label: "Longevity" },
  { id: "labs", label: "Labs", wide: true },
];

function listItems(audience: Audience, categoryId: string): MegaItem[] {
  const categories = audience === "men" ? menMegaCategories : womenMegaCategories;
  const category = findMegaCategory(categories, categoryId);
  if (!category || category.kind === "link") return [];

  if (audience === "women" && categoryId === "sexual") {
    const combo = category.items.find((item) => item.href.includes("women-sexual-health-combo-troches"));
    const pt141 = category.items.find((item) => item.href.includes("pt-141"));
    return [
      combo && { ...combo, label: "Combo Troches" },
      pt141 && { ...pt141, label: "PT-141 Nasal" },
    ].filter((item): item is MegaItem => Boolean(item));
  }

  if (categoryId === "longevity") {
    const nad = category.items.find((item) => item.label === "NAD+");
    const glutathione = category.items.find((item) => item.label === "Glutathione");
    const sermorelin = category.items.find((item) => item.label === "Sermorelin");
    return [nad, glutathione, sermorelin].filter((item): item is MegaItem => Boolean(item));
  }

  if (categoryId === "labs") {
    return category.items.map((item) => ({
      ...item,
      label: item.href.includes("advance") ? "Advanced Panel" : "Complete Panel",
    }));
  }

  return category.items;
}

function featuredFor(audience: Audience, categoryId?: string): { label: string; card: FeatureCard } {
  const label = audience === "men" ? "Explore Popular Treatment" : "Popular Therapies";
  if (!categoryId) {
    return { label, card: audience === "men" ? menDefaultCard : womenDefaultCard };
  }
  const categories = audience === "men" ? menMegaCategories : womenMegaCategories;
  const category = findMegaCategory(categories, categoryId);
  return { label, card: category?.card ?? (audience === "men" ? menDefaultCard : womenDefaultCard) };
}

const MORPH_EASE = "cubic-bezier(0.32,0.72,0,1)";
const OPEN_MS = 450;
const CLOSE_MS = 380;
const REDUCED_MS = 150;
const PILL_CLIP =
  "inset(var(--lh-nav-top) var(--lh-nav-x) calc(100% - var(--lh-nav-h) - var(--lh-nav-top)) var(--lh-nav-x) round 999px)";
const OPEN_CLIP = "inset(0px 0px 0px 0px round 0px)";
const PILL_VARS = {
  ["--lh-nav-top" as string]: "max(12px, env(safe-area-inset-top, 0px))",
  ["--lh-nav-x" as string]: "clamp(12px, 4vw, 16px)",
  ["--lh-nav-h" as string]: "50px",
  ["--lh-nav-pad" as string]: "clamp(16px, 4.5vw, 18px)",
};

type NavPhase = "closed" | "opening" | "open" | "closing";
type ScrollFade = "none" | "bottom" | "top" | "both";

function readScrollFade(el: HTMLElement): ScrollFade {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight) return "none";
  const showTop = scrollTop > 4;
  const showBottom = scrollTop + clientHeight < scrollHeight - 4;
  if (showTop && showBottom) return "both";
  if (showTop) return "top";
  if (showBottom) return "bottom";
  return "none";
}

function MenuToggleIcon({ open }: { open: boolean }) {
  const line =
    "origin-center [transform-box:fill-box] motion-reduce:transition-none";

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <line
        x1="5"
        y1="9"
        x2="19"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={line}
        style={{
          transform: open ? "translateY(3px) rotate(45deg)" : undefined,
          transition: "transform 250ms ease-out",
        }}
      />
      <line
        x1="5"
        y1="15"
        x2="19"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={line}
        style={{
          transform: open ? "translateY(-3px) rotate(-45deg)" : undefined,
          transition: "transform 250ms ease-out",
        }}
      />
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function introStyle(
  revealed: boolean,
  intro: boolean,
  reduced: boolean,
  delay: number,
  duration: number,
  fromY: number,
): CSSProperties {
  if (reduced) {
    return {
      opacity: revealed ? 1 : 0,
      transition: revealed ? `opacity ${REDUCED_MS}ms linear` : "none",
    };
  }

  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : `translateY(${fromY}px)`,
    transition: intro
      ? `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`
      : "none",
  };
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4.5 11.2 12 5l7.5 6.2V19a1.2 1.2 0 0 1-1.2 1.2H5.7A1.2 1.2 0 0 1 4.5 19v-7.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 20.2V13h4v7.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const menuPad = "pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]";
const tapFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function SearchField({
  id,
  query,
  onQuery,
}: {
  id: string;
  query: string;
  onQuery: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="relative block">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink/45">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <input
        id={id}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search..."
        autoComplete="off"
        enterKeyHint="search"
        className={`h-12 w-full min-w-0 rounded-full bg-white pl-11 pr-4 text-base text-ink outline-none placeholder:text-ink/40 ${tapFocus} focus-visible:outline-ink`}
      />
    </label>
  );
}

function ImageTile({
  label,
  image,
  wide,
  onClick,
  href,
}: {
  label: string;
  image: string;
  wide?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const className = `relative block h-full min-w-0 overflow-hidden rounded-[10px] bg-ink ${tapFocus} ${
    wide ? "col-span-2 min-h-[72px] aspect-[2.6/1]" : "min-h-[8.25rem] aspect-square"
  }`;

  const content = (
    <>
      <Image src={image} alt="" fill className="object-cover object-center" sizes="400px" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
      <span className="absolute right-2.5 bottom-2.5 left-2.5 flex items-end justify-between gap-2">
        <span className="min-w-0 text-[14px] leading-snug font-bold break-words text-white">
          {label}
        </span>
        <span className="shrink-0 text-white" aria-hidden>
          →
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} text-left`}>
      {content}
    </button>
  );
}

function FeaturedCard({ label, card }: { label: string; card: FeatureCard }) {
  return (
    <div className="pt-5 pb-1">
      <p className="text-[12px] leading-4 font-medium text-white/70">{label}</p>
      <Link
        href={card.href}
        className={`mt-2 block overflow-hidden rounded-[12px] bg-white p-2 text-ink ${tapFocus} focus-visible:outline-ink`}
      >
        <div className="relative aspect-[5/4] overflow-hidden rounded-[10px] bg-ink">
          {card.image ? (
            <Image
              src={card.image}
              alt={card.heading}
              fill
              className="object-cover object-center"
              sizes="400px"
            />
          ) : null}
        </div>
        <div className="px-2 pt-3 pb-2">
          <p className="text-[20px] leading-tight font-bold break-words">{card.heading}</p>
          <p className="mt-1 text-[14px] leading-snug text-ink/75 break-words">{card.subline}</p>
          <p className="mt-1.5 text-[13px] font-medium">{card.price}</p>
        </div>
      </Link>
    </div>
  );
}

export function MobileNav({
  open,
  visible,
  onOpen,
  onClose,
  isProductPage = false,
}: {
  open: boolean;
  visible: boolean;
  onOpen: () => void;
  onClose: () => void;
  isProductPage?: boolean;
}) {
  const searchId = useId();
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phaseTimer = useRef(0);
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<NavPhase>(open ? "open" : "closed");
  const [screen, setScreen] = useState<MobileScreen>({ name: "root" });
  const [query, setQuery] = useState("");
  const [fade, setFade] = useState<ScrollFade>("none");

  const busy = phase === "opening" || phase === "closing";
  const expanded = phase === "opening" || phase === "open";
  const morphing = busy;
  const revealed = phase !== "closed";
  const intro = phase === "opening" && !reducedMotion;
  const showBar = visible || phase !== "closed";

  function resetMenu() {
    setScreen({ name: "root" });
    setQuery("");
    setFade("none");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }

  function updateFade() {
    const el = scrollRef.current;
    if (!el || phase === "closed") {
      setFade("none");
      return;
    }
    setFade(readScrollFade(el));
  }

  function beginOpen() {
    window.clearTimeout(phaseTimer.current);
    setPhase("opening");
    phaseTimer.current = window.setTimeout(() => {
      setPhase("open");
      toggleRef.current?.focus();
    }, reducedMotion ? REDUCED_MS : OPEN_MS);
  }

  function beginClose(notifyParent: boolean) {
    window.clearTimeout(phaseTimer.current);
    setPhase("closing");
    phaseTimer.current = window.setTimeout(() => {
      setPhase("closed");
      resetMenu();
      toggleRef.current?.focus();
      if (notifyParent) onClose();
    }, reducedMotion ? REDUCED_MS : CLOSE_MS);
  }

  useEffect(() => {
    return () => window.clearTimeout(phaseTimer.current);
  }, []);

  useEffect(() => {
    if (open && phase === "closed") beginOpen();
    if (!open && (phase === "open" || phase === "opening")) beginClose(false);
    // phase/begin* are intentionally omitted; this syncs parent intent only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pageLocked = phase !== "closed";

  useEffect(() => {
    if (!pageLocked) return;

    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previousOverflow = html.style.overflow;
    const previousOverscroll = html.style.overscrollBehavior;

    const body = document.body;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previousOverflow;
      html.style.overscrollBehavior = previousOverscroll;
      body.style.overflow = previousBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [pageLocked]);

  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  useEffect(() => {
    if (phase !== "open" && phase !== "opening") return;
    const root = shellRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const nodes = [...root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((node) => node.getClientRects().length > 0);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [phase, screen]);

  const results = query.trim()
    ? products.filter(
        (product) =>
          product.listed !== false &&
          product.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  const isRoot = screen.name === "root";
  const showSearch = screen.name === "root" || screen.name === "audience";
  const screenKey = `${screen.name}-${"audience" in screen ? screen.audience : ""}-${"categoryId" in screen ? screen.categoryId : ""}`;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (phase === "closed") {
      el.scrollTop = 0;
      setFade("none");
      return;
    }
    if (phase === "opening" || phase === "open") {
      el.scrollTop = 0;
    }
  }, [phase, screenKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || phase === "closed" || phase === "closing") {
      if (phase === "closed") setFade("none");
      return;
    }

    const sync = () => setFade(readScrollFade(el));
    const frame = window.requestAnimationFrame(sync);
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [phase, screenKey, query, showSearch]);

  function goHome() {
    setScreen({ name: "root" });
    setQuery("");
  }

  function handleToggle() {
    if (busy) return;
    if (phase === "open") {
      beginClose(true);
      return;
    }
    onOpen();
  }

  const morphTransition = reducedMotion
    ? "none"
    : phase === "closing"
      ? `clip-path 300ms ${MORPH_EASE} 80ms`
      : phase === "opening"
        ? `clip-path 420ms ${MORPH_EASE}`
        : "none";

  const markTransition = reducedMotion
    ? "none"
    : phase === "closing"
      ? `transform 300ms ${MORPH_EASE} 80ms, left 300ms ${MORPH_EASE} 80ms, right 300ms ${MORPH_EASE} 80ms, top 300ms ${MORPH_EASE} 80ms`
      : phase === "opening" || phase === "open"
        ? `transform 420ms ${MORPH_EASE}, left 420ms ${MORPH_EASE}, right 420ms ${MORPH_EASE}, top 420ms ${MORPH_EASE}`
        : "none";

  return (
    <div
      ref={shellRef}
      className={`fixed inset-0 z-50 min-[441px]:hidden touch-manipulation overflow-x-hidden ${
        showBar ? "translate-y-0" : "-translate-y-[calc(100%+1rem)]"
      } ${phase === "closed" ? "pointer-events-none" : ""} transition-transform duration-300 ease-out motion-reduce:transition-none`}
    >
      <div
        id={menuId}
        role={phase === "closed" ? undefined : "dialog"}
        aria-modal={phase === "closed" ? undefined : true}
        aria-label="Menu"
        aria-hidden={phase === "closed"}
        className={`absolute inset-0 h-[100vh] overflow-hidden overflow-x-hidden text-white [height:100dvh] [transform:translateZ(0)] ${
          morphing ? "will-change-[clip-path]" : ""
        } ${phase === "closed" ? "pointer-events-none" : ""} ${
          expanded ? "backdrop-blur-[30px]" : "backdrop-blur-[20px]"
        }`}
        style={{
          ...PILL_VARS,
          clipPath: reducedMotion
            ? expanded
              ? OPEN_CLIP
              : PILL_CLIP
            : expanded
              ? OPEN_CLIP
              : PILL_CLIP,
          transition: morphTransition,
        }}
      >
        <div
          className={`absolute inset-0 ${
            isProductPage
              ? "bg-[linear-gradient(rgba(183,47,61,0.80),rgba(150,39,50,0.84))]"
              : "bg-[linear-gradient(rgba(240,117,117,0.55),rgba(145,16,16,0.55))]"
          }`}
          aria-hidden
        />
        <div
          className={`absolute inset-0 ${
            isProductPage
              ? "bg-[linear-gradient(180deg,rgba(150,39,50,0.90),rgba(183,47,61,0.86))]"
              : "bg-[linear-gradient(180deg,rgba(145,16,16,0.78),rgba(196,140,148,0.72))]"
          }`}
          aria-hidden
          style={{
            opacity: expanded ? 1 : 0,
            transition: reducedMotion
              ? `opacity ${REDUCED_MS}ms linear`
              : phase === "closing"
                ? `opacity 300ms ${MORPH_EASE} 80ms`
                : phase === "opening"
                  ? `opacity 420ms ${MORPH_EASE}`
                  : "none",
          }}
        />

        <div
          className="absolute z-10 flex h-[50px] min-w-0 items-center justify-between gap-3"
          style={{
            top: expanded ? "12px" : "var(--lh-nav-top)",
            left: expanded ? "16px" : "calc(var(--lh-nav-x) + var(--lh-nav-pad))",
            right: expanded ? "16px" : "calc(var(--lh-nav-x) + var(--lh-nav-pad))",
            transform: expanded
              ? "translateY(calc(24px + env(safe-area-inset-top, 0px)))"
              : "translateY(0)",
            transition: markTransition,
          }}
        >
          <Link
            href="/"
            className={`flex min-w-0 items-center pointer-events-auto rounded-sm ${tapFocus}`}
            onClick={(event) => {
              if (busy) {
                event.preventDefault();
                return;
              }
              if (phase === "open") beginClose(true);
            }}
          >
            <Image
              src={assets.logo}
              alt={site.name}
              width={160}
              height={18}
              className="h-auto w-[min(9rem,42vw)] object-contain brightness-0 invert"
              style={{ height: "auto" }}
              priority
            />
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            {phase === "open" && !isRoot ? (
              <button
                type="button"
                aria-label="Mobile home"
                onClick={goHome}
                className={`grid h-11 w-11 place-items-center rounded-full border border-white/70 ${tapFocus}`}
              >
                <HomeIcon />
              </button>
            ) : null}
            <button
              ref={toggleRef}
              type="button"
              aria-label={expanded ? "Close menu" : "Open menu"}
              aria-expanded={expanded}
              aria-controls={menuId}
              onClick={handleToggle}
              className={`pointer-events-auto grid h-11 w-11 place-items-center rounded-full ${tapFocus}`}
            >
              <MenuToggleIcon open={expanded} />
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0 flex min-w-0 flex-col pt-[calc(6.25rem+env(safe-area-inset-top,0px))]"
          style={{
            opacity: phase === "closing" ? 0 : revealed ? 1 : 0,
            transform: reducedMotion
              ? "none"
              : phase === "closing"
                ? "translateY(6px)"
                : "translateY(0)",
            transition:
              phase === "closing" && !reducedMotion
                ? "opacity 150ms ease-in, transform 150ms ease-in"
                : reducedMotion
                  ? `opacity ${REDUCED_MS}ms linear`
                  : "none",
            pointerEvents: phase === "open" || phase === "opening" ? "auto" : "none",
          }}
        >
          <div
            ref={scrollRef}
            data-fade={fade}
            onScroll={updateFade}
            className={`lh-mobile-nav-scroll min-h-0 min-w-0 flex-1 ${menuPad} pb-10`}
          >
            {showSearch ? (
              <div className="mb-3.5" style={introStyle(revealed, intro, reducedMotion, 120, 220, 8)}>
                <SearchField id={searchId} query={query} onQuery={setQuery} />
              </div>
            ) : null}

            <div
              key={screenKey}
              className="motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out [@starting-style]:translate-x-2 [@starting-style]:opacity-0"
            >
              {query.trim() && showSearch ? (
                <div className="rounded-2xl bg-white/10">
                  {results.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      className={`flex min-h-12 items-center border-b border-white/15 px-4 py-3.5 text-[15px] leading-snug font-medium break-words last:border-b-0 ${tapFocus}`}
                    >
                      {product.name}
                    </Link>
                  ))}
                  {results.length === 0 ? (
                    <p className="px-4 py-3.5 text-[15px] text-white/70">No matches.</p>
                  ) : null}
                </div>
              ) : (
                <MobileScreenView
                  screen={screen}
                  intro={intro}
                  revealed={revealed}
                  reducedMotion={reducedMotion}
                  onAudience={(audience) => {
                    setQuery("");
                    setScreen({ name: "audience", audience });
                  }}
                  onWho={() => {
                    setQuery("");
                    setScreen({ name: "who" });
                  }}
                  onList={(audience, categoryId) => {
                    setQuery("");
                    setScreen({ name: "list", audience, categoryId });
                  }}
                  onBack={(audience) => {
                    setQuery("");
                    setScreen({ name: "audience", audience });
                  }}
                />
              )}
            </div>
          </div>

          <div
            className={`shrink-0 space-y-2.5 ${menuPad} pt-3 pb-[max(1.25rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))]`}
            style={introStyle(revealed, intro, reducedMotion, 300, 220, 12)}
          >
            <a
              href={PORTAL_URL}
              className={`flex min-h-12 items-center justify-center rounded-full border border-white/70 text-[15px] font-medium text-white ${tapFocus}`}
            >
              Log In / Sign Up
            </a>
            <a
              href={MOBILE_GET_STARTED_URL}
              className={`flex min-h-12 items-center justify-center rounded-full bg-white text-[15px] font-medium text-ink ${tapFocus} focus-visible:outline-ink`}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileScreenView({
  screen,
  intro,
  revealed,
  reducedMotion,
  onAudience,
  onWho,
  onList,
  onBack,
}: {
  screen: MobileScreen;
  intro: boolean;
  revealed: boolean;
  reducedMotion: boolean;
  onAudience: (audience: Audience) => void;
  onWho: () => void;
  onList: (audience: Audience, categoryId: string) => void;
  onBack: (audience: Audience) => void;
}) {
  if (screen.name === "root") {
    return (
      <div className="flex flex-col gap-2.5">
        {rootTiles.map((tile, index) => {
          const motion = introStyle(revealed, intro, reducedMotion, 180 + index * 40, 260, 12);
          const className = `relative flex h-[clamp(82px,21.5vw,90px)] w-full overflow-hidden rounded-[10px] bg-ink ${tapFocus}`;
          const content = (
            <>
              <Image src={tile.image} alt="" fill className="object-cover object-center" sizes="400px" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <span className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between gap-3">
                <span className="min-w-0 text-[16px] leading-snug font-bold break-words">{tile.label}</span>
                <span className="shrink-0" aria-hidden>
                  →
                </span>
              </span>
            </>
          );

          if ("href" in tile) {
            return (
              <div key={tile.label} style={motion}>
                <Link href={tile.href} className={className}>
                  {content}
                </Link>
              </div>
            );
          }

          const { screen } = tile;
          return (
            <div key={tile.label} style={motion}>
              <button
                type="button"
                onClick={() => {
                  if (screen.name === "who") onWho();
                  else onAudience(screen.audience);
                }}
                className={`${className} text-left`}
              >
                {content}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  if (screen.name === "who") {
    return (
      <div>
        <p className="mb-2.5 text-[13px] leading-4 font-medium text-white/70">Who We Are</p>
        {whoRows.map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className={`flex min-h-12 items-center border-b border-white/15 py-3.5 text-[15px] leading-snug font-medium ${tapFocus}`}
          >
            {row.label}
          </Link>
        ))}
      </div>
    );
  }

  if (screen.name === "audience") {
    const tiles = screen.audience === "men" ? menTiles : womenTiles;
    const categories = screen.audience === "men" ? menMegaCategories : womenMegaCategories;
    const shopAll =
      screen.audience === "men"
        ? { href: "/shop-men-products", label: "Shop All Men" }
        : { href: "/shop-women-products", label: "Shop All For Women" };

    return (
      <div className="min-w-0">
        <p className="mb-2.5 text-[13px] leading-4 font-medium text-white/70">
          {screen.audience === "men" ? "Men" : "Women"}
        </p>
        <Link
          href={shopAll.href}
          className={`mb-3 flex min-h-12 items-center justify-between gap-3 rounded-[10px] border border-white/70 px-4 text-[15px] leading-snug font-medium ${tapFocus}`}
        >
          <span className="min-w-0 break-words">{shopAll.label}</span>
          <span className="shrink-0" aria-hidden>
            →
          </span>
        </Link>
        <div className="grid grid-cols-2 items-stretch gap-2.5">
          {tiles.map((tile) => {
            const category = findMegaCategory(categories, tile.id);
            if (!category) return null;
            if (category.kind === "link") {
              return (
                <ImageTile
                  key={tile.id}
                  label={tile.label}
                  image={categoryImage(category)}
                  wide={tile.wide}
                  href={category.href}
                />
              );
            }
            return (
              <ImageTile
                key={tile.id}
                label={tile.label}
                image={categoryImage(category)}
                wide={tile.wide}
                onClick={() => onList(screen.audience, tile.id)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const category = findMegaCategory(
    screen.audience === "men" ? menMegaCategories : womenMegaCategories,
    screen.categoryId,
  );
  const items = listItems(screen.audience, screen.categoryId);
  const featured = featuredFor(screen.audience, screen.categoryId);
  const backLabel = screen.audience === "men" && screen.categoryId === "hormone"
    ? "Testosterone Replacement Therapy"
    : screen.audience === "women" && screen.categoryId === "hormone"
      ? "Hormone Replacement Therapy"
      : category?.label ?? "Back";

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onBack(screen.audience)}
        className={`flex min-h-12 w-full items-center gap-2 py-2 text-left text-[14px] leading-snug text-white/75 ${tapFocus}`}
      >
        <span aria-hidden>←</span>
        <span className="min-w-0 break-words">{backLabel}</span>
      </button>
      <div className="mt-1">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`flex min-h-12 items-center border-b border-white/15 py-4 text-[15px] leading-snug font-medium break-words ${tapFocus}`}
          >
            {item.label}
          </Link>
        ))}
        {screen.categoryId === "longevity" ? (
          <Link
            href="/energy-longevity"
            className={`flex min-h-12 items-center border-b border-white/15 py-4 text-[15px] leading-snug font-medium break-words ${tapFocus}`}
          >
            Learn More About Longevity & Energy
          </Link>
        ) : null}
      </div>
      <FeaturedCard label={featured.label} card={featured.card} />
    </div>
  );
}
