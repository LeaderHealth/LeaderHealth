"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { assets, GET_STARTED_URL, PORTAL_URL, site } from "@/lib/content/site";
import { products } from "@/lib/content/products";

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

function Dropdown({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-[13px] text-white"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {label}
        <svg viewBox="0 0 12 8" className="h-2 w-2.5 opacity-80" fill="none" aria-hidden>
          <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 min-w-[220px] pt-2">
          <div className="rounded-2xl bg-white py-2 text-ink shadow-lg">
            {items.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="block px-4 py-2 text-sm hover:bg-background"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
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
  const overlay = pathname === "/" || pathname.startsWith("/products/");
  const [hero, setHero] = useState(overlay);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const update = () => {
      if (!overlay) {
        setHero(false);
        return;
      }
      setHero(window.scrollY < window.innerHeight * 0.55);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [overlay]);

  const results = query.trim()
    ? products.filter(
        (p) =>
          p.listed !== false &&
          p.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  const shell = hero
    ? "bg-[linear-gradient(rgba(240,117,117,0.4),rgba(145,16,16,0.4))] backdrop-blur-[23px]"
    : "bg-header";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-4">
        <div
          className={`pointer-events-auto relative flex w-full max-w-[1120px] items-center gap-3 rounded-full px-3 py-2 text-white shadow-lg shadow-ink/10 sm:px-5 ${shell}`}
        >
          {hero ? (
            <>
              <div className="hidden items-center gap-5 md:flex">
                <Dropdown label="Men" items={menLinks} />
                <Dropdown label="Women" items={womenLinks} />
                <Link href="/shop-all-products" className="text-[13px]">
                  Shop All →
                </Link>
              </div>
              <button
                className="px-2 text-sm md:hidden"
                onClick={() => setMobile((v) => !v)}
                type="button"
                aria-label="Menu"
              >
                Menu
              </button>
              <Link href="/" className="absolute left-1/2 shrink-0 -translate-x-1/2">
                <Image
                  src={assets.logo}
                  alt={site.name}
                  width={180}
                  height={20}
                  className="h-auto w-[180px] max-w-[180px] object-contain brightness-0 invert"
                  style={{ width: 180, height: "auto", maxWidth: 180 }}
                  priority
                />
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
                <a
                  href={PORTAL_URL}
                  aria-label="Patient portal"
                  className="grid h-8 w-8 place-items-center"
                >
                  <UserIcon />
                </a>
                <a
                  href={GET_STARTED_URL}
                  className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-ink"
                >
                  Get Started
                </a>
              </div>
              <a
                href={GET_STARTED_URL}
                className="ml-auto rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink md:hidden"
              >
                Start
              </a>
            </>
          ) : (
            <>
              <Link href="/" className="shrink-0 pl-1">
                <Image
                  src={assets.logo}
                  alt={site.name}
                  width={160}
                  height={18}
                  className="h-4 w-auto brightness-0 invert"
                  priority
                />
              </Link>
              <button
                className="px-2 text-sm md:hidden"
                onClick={() => setMobile((v) => !v)}
                type="button"
                aria-label="Menu"
              >
                Menu
              </button>
              <div className="ml-auto hidden items-center gap-4 md:flex">
                <Dropdown label="Men" items={menLinks} />
                <Dropdown label="Women" items={womenLinks} />
                <Dropdown label="Who We Are" items={whoLinks} />
                <Link href="/shop-all-products" className="text-[13px]">
                  Shop All
                </Link>
                <a href={PORTAL_URL} aria-label="Patient portal" className="grid h-8 w-8 place-items-center">
                  <UserIcon />
                </a>
                <button
                  type="button"
                  aria-label="Search"
                  className="grid h-8 w-11 place-items-center rounded-full bg-white/20"
                  onClick={() => setSearch(true)}
                >
                  <SearchIcon />
                </button>
                <a
                  href={GET_STARTED_URL}
                  className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-ink"
                >
                  Get Started
                </a>
              </div>
              <a
                href={GET_STARTED_URL}
                className="ml-auto rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink md:hidden"
              >
                Start
              </a>
            </>
          )}
        </div>
      </header>

      {mobile && (
        <div className="fixed inset-0 z-40 bg-ink/80 pt-24 md:hidden">
          <nav className="mx-4 space-y-3 rounded-3xl bg-white p-6 text-ink">
            {[
              ...menLinks.slice(0, 1),
              ...womenLinks.slice(0, 1),
              { href: "/shop-all-products", label: "Shop All" },
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
            <a href={GET_STARTED_URL} className="block text-lg text-accent">
              Get Started
            </a>
          </nav>
        </div>
      )}

      {search && (
        <div className="fixed inset-0 z-[60] bg-ink/50 px-4 pt-28" onClick={() => setSearch(false)}>
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
                <p className="px-3 py-2 text-sm text-taupe">No matches.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
