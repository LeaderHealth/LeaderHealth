"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { assets, GET_STARTED_URL, PORTAL_URL, site } from "@/lib/content/site";
import { products } from "@/lib/content/products";
import {
  type FeatureCard,
  type MegaCategory,
  menDefaultCard,
  menMegaCategories,
  womenDefaultCard,
  womenMegaCategories,
} from "@/lib/content/nav";
import { CartButton } from "./cart/CartButton";
import { MobileNav } from "./MobileNav";

const GENERAL_FORM_URL = "https://products.leaderhealth.clinic/";

const menLinks = [
  { href: "/shop-men-products", label: "Shop All Men" },
  { href: "/products/men-trt-testosterone-cypionate", label: "Testosterone Cypionate" },
  { href: "/products/men-trt-enclomiphene", label: "Enclomiphene" },
  { href: "/products/men-trt-testosterone-cream", label: "Testosterone Cream" },
  { href: "/products/men-sexual-health-tadalafil", label: "Tadalafil" },
  { href: "/products/weight-loss-semaglutide", label: "Semaglutide" },
];

const womenLinks = [
  { href: "/shop-women-products", label: "Shop All Women" },
  { href: "/products/women-hormone-therapy", label: "Women's Hormone Therapy" },
  { href: "/products/women-hrt-testosterone-cream", label: "Testosterone Cream" },
  { href: "/products/women-hormone-therapy-estradiol-patch", label: "Estradiol Patch" },
  { href: "/products/sexual-health-pt-141-nasal", label: "PT-141" },
  { href: "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)", label: "Intimacy Blend" },
  { href: "/products/weight-loss-semaglutide", label: "Semaglutide" },
];

const whoLinks = [
  { href: "/aboutus", label: "About Us" },
  { href: "/contact-us", label: "Contact" },
  { href: "/faq", label: "FAQs" },
  { href: "/blogs", label: "Learn" },
];

type MegaId = "men" | "women" | "who";

function cardKey(card: FeatureCard) {
  return `${card.href}|${card.heading}|${card.image}`;
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" aria-hidden>
      <path
        d="M8 3.5h6.2L18.5 8v12.5H8V3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M14.2 3.5V8h4.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.2 12h5.2M10.2 15.4h5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const megaLinkClass =
  "text-left text-[15px] font-semibold text-white transition-opacity duration-150 hover:opacity-80";
const megaHoverBridgeClass = "absolute top-full z-50 pt-[24px]";
const megaPanelSurfaceClass =
  "overflow-hidden rounded-[16px] bg-[linear-gradient(to_bottom_right,rgba(22,6,8,0.94),rgba(145,16,16,0.86))] shadow-xl backdrop-blur-md transition-[opacity,transform] duration-200 ease-out [@starting-style]:translate-y-2 [@starting-style]:opacity-0";

function megaPanelMotionClass(fading: boolean) {
  return fading ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100";
}

function FeatureCardLink({
  card,
  className,
}: {
  card: FeatureCard;
  className?: string;
}) {
  const amount = card.price.match(/\$[\d,]+(?:\.\d+)?/)?.[0] ?? card.price;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[14px] bg-[#F7F3F5] p-2 font-sans ${className ?? ""}`}
    >
      <div className="relative h-[56%] shrink-0 overflow-hidden rounded-[10px] bg-[#331110]">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.heading}
            fill
            className="object-contain object-center"
            sizes="320px"
          />
        ) : null}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F7F3F5] px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-[#331110]">
          Prescription required
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-2 pt-2.5">
        <p className="line-clamp-2 text-[22px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#331110]">
          {card.heading}
        </p>
        {card.subline ? (
          <p className="line-clamp-2 text-[13px] leading-[1.4] font-normal text-[#5A3431]">{card.subline}</p>
        ) : null}
      </div>

      <div className="mx-2 mt-2 h-px bg-[#DBD4BD]" />

      <div className="mt-2 flex items-end justify-between gap-2 px-2 pb-1">
        <p className="min-w-0">
          <span className="block text-[10px] font-semibold tracking-[0.06em] text-[#6B4A48] uppercase">
            Starting at
          </span>
          <span className="mt-0.5 flex items-baseline gap-1">
            <span className="text-[22px] leading-none font-extrabold text-[#331110]">{amount}</span>
            <span className="text-[13px] font-medium text-[#6B4A48]">/mo</span>
          </span>
        </p>
        <Link
          href={card.href}
          className="inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#331110] px-3.5 text-[13px] font-semibold text-[#F7F3F5] transition-colors duration-200 ease-out hover:bg-[#5A3431] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#331110]"
        >
          Get started
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path
              d="M3 8h9M8.5 4.5 12.5 8 8.5 11.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function FeatureCardView({ label, card }: { label: string; card: FeatureCard }) {
  const [current, setCurrent] = useState(card);
  const [outgoing, setOutgoing] = useState<FeatureCard | null>(null);
  const [revealed, setRevealed] = useState(true);
  const currentRef = useRef(card);

  useEffect(() => {
    if (cardKey(card) === cardKey(currentRef.current)) {
      return;
    }

    const previous = currentRef.current;
    currentRef.current = card;
    setOutgoing(previous);
    setCurrent(card);
    setRevealed(false);

    const frame = window.requestAnimationFrame(() => setRevealed(true));
    const timer = window.setTimeout(() => setOutgoing(null), 200);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [card]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[12px] text-white/70">{label}</p>
      <div className="relative mt-3 min-h-0 flex-1">
        {outgoing ? (
          <FeatureCardLink
            card={outgoing}
            className={`absolute inset-0 transition-opacity duration-200 ${
              revealed ? "opacity-0" : "opacity-100"
            }`}
          />
        ) : null}
        <FeatureCardLink
          card={current}
          className={`absolute inset-0 transition-opacity duration-200 ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}

function MegaMenu({
  label,
  open,
  fading,
  onOpen,
  onClose,
  shift,
  categories,
  shopAll,
  defaultCard,
  featureLabel,
}: {
  label: string;
  open: boolean;
  fading: boolean;
  onOpen: () => void;
  onClose: () => void;
  shift?: boolean;
  categories: MegaCategory[];
  shopAll: { href: string; label: string };
  defaultCard: FeatureCard;
  featureLabel: string;
}) {
  const [view, setView] = useState("root");
  const [longevityOpen, setLongevityOpen] = useState(false);
  const [hovered, setHovered] = useState<FeatureCard | null>(null);

  useEffect(() => {
    if (!open) {
      setView("root");
      setLongevityOpen(false);
      setHovered(null);
    }
  }, [open]);

  const activeCategory = categories.find((category) => category.id === view);
  const lockedCard =
    view === "root" || !activeCategory ? defaultCard : activeCategory.card;
  const card = hovered ?? lockedCard;

  function openDrill(id: string) {
    setView(id);
    setLongevityOpen(false);
    setHovered(null);
  }

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        className="flex items-center gap-1 text-[13px] text-white transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.96]"
        onClick={() => (open ? onClose() : onOpen())}
        type="button"
      >
        {label}
        <svg
          viewBox="0 0 12 8"
          className={`h-2 w-2.5 opacity-80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open ? (
        <div className={`${megaHoverBridgeClass} ${shift ? "left-0 translate-x-6" : "left-0"}`}>
          <div
            className={`flex h-[460px] w-[660px] ${megaPanelSurfaceClass} ${megaPanelMotionClass(fading)}`}
          >
            <div className="flex w-[45%] flex-col px-6 py-6">
              {view === "root" || !activeCategory ? (
                <p className="text-[13px] font-medium text-white/70">Categories</p>
              ) : (
                <button
                  type="button"
                  className="text-left text-[13px] font-medium text-white/70"
                  onClick={() => {
                    setView("root");
                    setLongevityOpen(false);
                    setHovered(null);
                  }}
                >
                  ‹ {activeCategory.label}
                </button>
              )}
              <nav className="mt-4 flex min-h-0 flex-1 flex-col">
                <div
                  className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto"
                  onMouseLeave={() => setHovered(null)}
                >
                  {view === "root"
                    ? categories.map((category) => {
                        if (category.kind === "link") {
                          return (
                            <Link
                              key={category.id}
                              href={category.href}
                              className={megaLinkClass}
                              onMouseEnter={() => setHovered(category.card)}
                            >
                              {category.label}
                            </Link>
                          );
                        }

                        if (category.kind === "expand-drill") {
                          return (
                            <div key={category.id}>
                              <button
                                type="button"
                                className={megaLinkClass}
                                onMouseEnter={() => setHovered(category.card)}
                                onClick={() => setLongevityOpen((value) => !value)}
                              >
                                {category.label}
                              </button>
                              {longevityOpen ? (
                                <p className="mt-2 text-[13px] text-white/80">
                                  <Link href={category.coverHref} className="hover:opacity-80">
                                    What Longevity Covers
                                  </Link>
                                  <span aria-hidden> • </span>
                                  <button
                                    type="button"
                                    className="hover:opacity-80"
                                    onClick={() => openDrill(category.id)}
                                  >
                                    Browse Longevity
                                  </button>
                                </p>
                              ) : null}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={category.id}
                            type="button"
                            className={megaLinkClass}
                            onMouseEnter={() => setHovered(category.card)}
                            onClick={() => openDrill(category.id)}
                          >
                            {category.label}
                          </button>
                        );
                      })
                    : activeCategory && activeCategory.kind !== "link"
                      ? activeCategory.items.map((item) => (
                          <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={megaLinkClass}
                            onMouseEnter={() => setHovered(item.card)}
                          >
                            {item.label}
                          </Link>
                        ))
                      : null}
                </div>
                <Link href={shopAll.href} className={`mt-3.5 ${megaLinkClass}`}>
                  {shopAll.label}
                </Link>
              </nav>
              <a
                href={GENERAL_FORM_URL}
                className="mt-4 flex h-12 w-[285px] max-w-full items-center gap-3 rounded-full bg-white px-3 text-ink"
              >
                <DocumentIcon />
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-bold">Don&apos;t see your goal?</span>
                  <span className="block text-[12px]">Start with our General Form.</span>
                </span>
                <svg viewBox="0 0 16 16" className="ml-auto h-4 w-4 shrink-0" fill="none" aria-hidden>
                  <path d="M3 8h9M8.5 4.5 12.5 8 8.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="flex w-[55%] flex-col px-5 py-6 pr-6">
              <FeatureCardView label={featureLabel} card={card} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WhoWeAreMenu({
  open,
  fading,
  onOpen,
  onClose,
}: {
  open: boolean;
  fading: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        className="flex items-center gap-1 text-[13px] text-white transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.96]"
        onClick={() => (open ? onClose() : onOpen())}
        type="button"
      >
        Who We Are
        <svg
          viewBox="0 0 12 8"
          className={`h-2 w-2.5 opacity-80 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden
        >
          <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open ? (
        <div className={`${megaHoverBridgeClass} left-0`}>
          <div className={`w-[260px] px-6 py-6 ${megaPanelSurfaceClass} ${megaPanelMotionClass(fading)}`}>
            <nav className="flex flex-col gap-3.5">
              {whoLinks.map((item) => (
                <Link key={item.href + item.label} href={item.href} className={megaLinkClass}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BrandLogo() {
  return (
    <Image
      src={assets.logo}
      alt={site.name}
      width={180}
      height={20}
      className="h-3.5 w-auto max-w-[108px] object-contain object-left brightness-0 invert sm:h-4 sm:max-w-[140px] md:h-5 md:max-w-[180px]"
      priority
    />
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 18.5c1.2-2.6 3.5-4 6.5-4s5.3 1.4 6.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();

  const onCheckout = pathname.startsWith("/checkout");
  const isProductPage = pathname.startsWith("/products/");

  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [navVisible, setNavVisible] = useState(true);
  const [mega, setMega] = useState<MegaId | null>(null);
  const [shownMega, setShownMega] = useState<MegaId | null>(null);
  const [megaFading, setMegaFading] = useState(false);
  const lastScrollY = useRef(0);
  const megaCloseTimer = useRef(0);

  useEffect(() => {
    window.clearTimeout(megaCloseTimer.current);
    setMega(null);
    setShownMega(null);
    setMegaFading(false);
    setMobile(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    if (mega === shownMega) {
      setMegaFading(false);
      return;
    }

    if (shownMega !== null) {
      setMegaFading(true);
      const timer = window.setTimeout(() => {
        setShownMega(mega);
        setMegaFading(false);
      }, 200);
      return () => window.clearTimeout(timer);
    }

    setShownMega(mega);
  }, [mega, shownMega]);

  function openMega(id: MegaId) {
    window.clearTimeout(megaCloseTimer.current);
    setMega(id);
  }

  function closeMega(id: MegaId) {
    window.clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = window.setTimeout(() => {
      setMega((current) => (current === id ? null : current));
    }, 100);
  }

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      if (mobile || search || y <= 10) {
        setNavVisible(true);
        lastScrollY.current = y;
        return;
      }

      if (Math.abs(delta) < 8) {
        return;
      }

      setNavVisible(delta < 0);
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobile, search]);

  const results = query.trim()
    ? products.filter(
        (p) =>
          p.listed !== false &&
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  const shell = isProductPage
    ? "bg-[linear-gradient(rgba(183,47,61,0.80),rgba(150,39,50,0.84))] backdrop-blur-[23px]"
    : "bg-[linear-gradient(rgba(240,117,117,0.4),rgba(145,16,16,0.4))] backdrop-blur-[23px]";

  return (
    <>
      <MobileNav
        open={mobile}
        visible={navVisible || mobile || search}
        isProductPage={isProductPage}
        onOpen={() => {
          setMega(null);
          setSearch(false);
          setMobile(true);
        }}
        onClose={() => setMobile(false)}
      />

      <header
        className={`pointer-events-none fixed inset-x-0 top-2 z-50 hidden justify-center px-2 transition-transform duration-300 ease-out min-[441px]:flex sm:top-3 sm:px-3 md:top-4 ${
          navVisible || mobile || search
            ? "translate-y-0"
            : "-translate-y-[calc(100%+1rem)]"
        }`}
      >
        <div
          className={`pointer-events-auto relative flex w-full max-w-[1120px] min-w-0 items-center gap-1.5 overflow-hidden rounded-full px-2 py-1.5 text-white shadow-lg shadow-ink/10 sm:gap-3 sm:px-5 sm:py-2 ${shell}`}
        >
          {/* LEFT NAV */}
          <div className="hidden items-center gap-5 md:flex">
            <MegaMenu
              label="Men"
              open={shownMega === "men"}
              fading={shownMega === "men" && megaFading}
              onOpen={() => openMega("men")}
              onClose={() => closeMega("men")}
              categories={menMegaCategories}
              shopAll={{ href: "/shop-men-products", label: "Shop All Men →" }}
              defaultCard={menDefaultCard}
              featureLabel="Explore Popular Treatment"
            />

            <MegaMenu
              label="Women"
              open={shownMega === "women"}
              fading={shownMega === "women" && megaFading}
              onOpen={() => openMega("women")}
              onClose={() => closeMega("women")}
              shift
              categories={womenMegaCategories}
              shopAll={{ href: "/shop-women-products", label: "Shop All For Women →" }}
              defaultCard={womenDefaultCard}
              featureLabel="Popular Therapies"
            />

            <Link
              href="/shop-all-products"
              className="text-[13px] transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.96]"
            >
              Shop All →
            </Link>

            <button
              type="button"
              aria-label="Search"
              className="grid h-8 w-11 place-items-center rounded-full bg-white/15 transition-[transform,background-color] duration-200 ease-out hover:scale-[1.06] hover:bg-white/25 active:scale-95"
              onClick={() => {
                setMega(null);
                setSearch(true);
              }}
            >
              <SearchIcon />
            </button>
          </div>

          {/* MOBILE MENU */}
          <button
            className="shrink-0 px-1.5 text-xs transition-transform duration-200 ease-out hover:scale-[1.05] active:scale-[0.96] sm:px-2 sm:text-sm md:hidden"
            onClick={() => {
              setMega(null);
              setMobile((v) => !v);
            }}
            type="button"
            aria-label="Menu"
          >
            Menu
          </button>

          {/* CENTER LOGO */}
          <Link
            href="/"
            className="
              flex
              min-w-0
              flex-1
              items-center
              justify-center
              md:absolute
              md:left-1/2
              md:w-[180px]
              md:flex-none
              md:-translate-x-1/2
            "
          >
            <Image
              src={assets.logo}
              alt={site.name}
              width={180}
              height={20}
              className="
                block
                h-auto
                w-[108px]
                max-w-full
                object-contain
                brightness-0
                invert
                sm:w-[140px]
                md:w-[180px]
              "
              style={{ height: "auto" }}
              priority
            />
          </Link>

          {/* RIGHT NAV */}
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <WhoWeAreMenu
              open={shownMega === "who"}
              fading={shownMega === "who" && megaFading}
              onOpen={() => openMega("who")}
              onClose={() => closeMega("who")}
            />

            <a
              href={PORTAL_URL}
              aria-label="Patient portal"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/35 bg-white/10 px-3 text-[13px] text-white transition-[transform,background-color] duration-200 ease-out hover:scale-[1.04] hover:bg-white/20 active:scale-[0.96]"
            >
              Log In / Sign Up
              <UserIcon />
            </a>

            <CartButton />

            {!onCheckout ? (
              <a
                href={GET_STARTED_URL}
                className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-ink transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.96]"
              >
                <BrandLogo />
              </Link>
              <div className="ml-auto hidden items-center gap-3 md:flex">
                <button
                  type="button"
                  aria-label="Search"
                  className="grid h-8 w-11 place-items-center rounded-full bg-white/15"
                  onClick={() => setSearch(true)}
                >
                  <SearchIcon />
                </button>
                <Dropdown label="Who We Are" items={whoLinks} />
                <a href={PORTAL_URL} aria-label="Patient portal" className="grid h-8 w-8 place-items-center">
                  <UserIcon />
                </a>
                <CartButton />
                {!onCheckout ? (
                  <a
                    href={GET_STARTED_URL}
                    className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-ink"
                  >
                    Get Started
                  </a>
                ) : null}
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 md:hidden">
                <CartButton compact />
                {!onCheckout ? (
                  <a
                    href={GET_STARTED_URL}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink sm:px-3 sm:py-1.5 sm:text-xs"
                  >
                    Start
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link href="/" className="min-w-0 shrink-0 pl-0.5 sm:pl-1">
                <BrandLogo />
              </Link>
              <button
                className="shrink-0 px-1.5 text-xs sm:px-2 sm:text-sm md:hidden"
                onClick={() => setMobile((v) => !v)}
                type="button"
                aria-label="Menu"
              >
                Start
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      {mobile && (
        <div className="fixed inset-0 z-40 hidden bg-ink/80 pt-24 max-[440px]:hidden min-[441px]:block md:hidden">
          <nav className="mx-4 space-y-3 rounded-3xl bg-white p-6 text-ink">
            {[
              ...menLinks.slice(0, 1),
              ...womenLinks.slice(0, 1),
              {
                href: "/shop-all-products",
                label: "Shop All",
              },
              ...whoLinks,
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-lg"
                onClick={() => setMobile(false)}
              >
                {item.label}
              </Link>
            ))}

            <a
              href={GET_STARTED_URL}
              className="block text-lg text-accent"
            >
              Get Started
            </a>
          </nav>
        </div>
      )}

      {/* SEARCH MODAL */}
      {search && (
        <div
          className="fixed inset-0 z-[60] bg-ink/50 px-4 pt-28"
          onClick={() => setSearch(false)}
        >
          <div
            className="mx-auto max-w-lg rounded-3xl bg-white p-5 text-ink shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-full border border-ink/10 bg-background px-4 py-3 outline-none"
            />

            <div className="mt-3 space-y-1">
              {results.map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="block rounded-xl px-3 py-2 hover:bg-background"
                  onClick={() => setSearch(false)}
                >
                  {p.name}
                </Link>
              ))}

              {query && results.length === 0 && (
                <p className="px-3 py-2 text-sm text-taupe">
                  No matches.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
