"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { LabsTeaser } from "@/components/LabsTeaser";
import { productsFor, type Audience, type Category } from "@/lib/content/products";
import { assets } from "@/lib/content/site";

const filters: { label: string; category?: Category }[] = [
  { label: "All" },
  { label: "Hormone Therapy", category: "hormone" },
  { label: "Sexual Health", category: "sexual" },
  { label: "Longevity", category: "longevity" },
  { label: "Weight Loss", category: "weight-loss" },
];

export function ShopGrid({
  audience,
  title,
  intro,
  children,
  feature,
  spotlight,
  centeredHero = false,
  heroImage,
  heroAlt = "",
  heroTitle,
  catalogTitle,
  catalogTone = "light",
  searchPlaceholder = "Search for a product or treatment…",
}: {
  audience?: Audience;
  title: string;
  intro: string;
  children?: React.ReactNode;
  feature?: React.ReactNode;
  spotlight?: React.ReactNode;
  centeredHero?: boolean;
  heroImage?: string;
  heroAlt?: string;
  heroTitle?: React.ReactNode;
  catalogTitle?: string;
  catalogTone?: "light" | "dark";
  searchPlaceholder?: string;
}) {
  const [active, setActive] = useState<Category | undefined>();
  const [who, setWho] = useState<Audience | undefined>(audience);
  const [query, setQuery] = useState("");

  const catalogHeading =
    (active && filters.find((filter) => filter.category === active)?.label) || catalogTitle;

  const list = useMemo(() => {
    const scoped = productsFor(who ?? audience, active);
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((p) => p.name.toLowerCase().includes(q));
  }, [audience, who, active, query]);

  return (
    <div className="w-full">
      <section
        className={
          heroImage
            ? "relative flex h-[78vh] items-center justify-center overflow-hidden bg-[#2a1814] text-white"
            : centeredHero
              ? "relative h-[78vh] overflow-hidden bg-ink text-white"
              : "relative flex min-h-[70vh] items-end overflow-hidden bg-ink pb-16 pt-32 text-white"
        }
      >
        <Image
          src={heroImage ?? assets.shopHero}
          alt={heroImage ? heroAlt : ""}
          fill
          priority
          className={
            heroImage
              ? "object-cover object-center"
              : centeredHero
                ? "object-cover object-left"
                : "object-cover"
          }
          sizes="100vw"
        />
        <div
          className={
            heroImage
              ? "absolute inset-0 bg-[radial-gradient(closest-side,rgba(42,24,20,0.28),rgba(42,24,20,0.05)_72%)]"
              : centeredHero
                ? "absolute inset-0 bg-[linear-gradient(rgba(51,17,16,0)_15%,rgba(51,17,16,0.45)_55%,rgba(51,17,16,0.78)_100%)] min-[810px]:bg-[radial-gradient(52%_65%_at_50%_52%,rgba(51,17,16,0.72)_0%,rgba(51,17,16,0.21)_45%,rgba(51,17,16,0)_72%)]"
                : "absolute inset-0 bg-[radial-gradient(52%_65%_at_50%_52%,rgba(51,17,16,0.72)_0%,rgba(51,17,16,0.21)_45%,rgba(51,17,16,0)_72%)]"
          }
        />
        {heroImage ? (
          <div className="relative z-10 flex w-[min(680px,calc(100%-32px))] flex-col items-center px-4 pt-16 text-center">
            <h1
              className="font-geist text-[clamp(46px,6.4vw,84px)] leading-[0.95] font-medium text-white [text-shadow:0_2px_18px_rgba(40,20,16,0.28)]"
              style={{ letterSpacing: "-0.03em" }}
            >
              {heroTitle ?? title}
            </h1>
            <p className="mt-5 max-w-[560px] font-sans text-[16px] leading-[1.55] text-white [text-shadow:0_1px_10px_rgba(40,20,16,0.35)] sm:text-[18px]">
              {intro}
            </p>
          </div>
        ) : centeredHero ? (
          <div className="absolute top-[54%] left-1/2 flex w-[min(385px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 text-center min-[810px]:top-[52%] min-[810px]:left-[52%] min-[810px]:w-[440px] min-[1200px]:w-[516px]">
            <h1
              className="font-sans text-[46px] leading-[0.96] font-medium text-[#F7F3F5] min-[810px]:text-[60px] min-[1200px]:text-[96px]"
              style={{ letterSpacing: "-0.035em" }}
            >
              {title}
            </h1>
            <p className="font-sans text-[16px] leading-[1.6] font-normal text-[rgba(247,243,245,0.9)] min-[810px]:text-[18px]">
              {intro}
            </p>
          </div>
        ) : (
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <h1 className="max-w-xl text-5xl md:text-[60px]">{title}</h1>
            <p className="mt-4 max-w-xl text-white/85">{intro}</p>
          </div>
        )}
        {centeredHero ? <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E33D4D]" /> : null}
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        {catalogTitle ? (
          <div>
            <h2 className="font-geist text-[clamp(34px,4vw,48px)] leading-none font-medium tracking-[-0.02em] text-[#2c1614]">
              {catalogHeading}
            </h2>
            <label className={`mt-8 flex h-[55px] w-full items-center gap-3 rounded-full border-0 px-[18px] py-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_16px_rgba(50,17,16,0.06)] ${catalogTone === "dark" ? "bg-[#ECE8E0]" : "bg-[#E4D6C3]"}`}>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-[#32120E]" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16.5 20.2 20.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder.replace(/…$/, "")}
                className="w-full bg-transparent font-sans text-[15px] font-semibold text-[#32120E] outline-none placeholder:text-[#32120E]"
              />
            </label>
            <div
              className={`relative left-1/2 mt-5 flex min-h-[58px] w-screen max-w-[100vw] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-2 text-center sm:px-6 ${
                catalogTone === "dark" ? "bg-[#32120E]" : "bg-[#F6F1DC]"
              }`}
            >
              <p
                className={`min-w-0 text-center font-sans text-[16px] leading-snug sm:text-[17px] ${
                  catalogTone === "dark" ? "text-white" : "text-[#32120E]"
                }`}
              >
                <span className={catalogTone === "dark" ? "font-semibold text-[#E04450]" : "font-semibold"}>
                  First-time patient?
                </span>{" "}
                Lab work may be required to help your provider determine the right treatment plan for you.
              </p>
              <a
                href="#explore-labs"
                className={`group relative inline-flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-full px-4 font-sans text-[14px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  catalogTone === "dark"
                    ? "bg-[#DC4450] focus-visible:outline-white"
                    : "bg-[#E23D4C] focus-visible:outline-[#32120E]"
                }`}
              >
                <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] group-hover:-translate-x-3 group-focus-visible:-translate-x-3 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0">
                  Explore Labs
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] group-hover:translate-x-[calc(100%-26px)] group-focus-visible:translate-x-[calc(100%-26px)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-full motion-reduce:group-focus-visible:translate-x-full"
                >
                  →
                </span>
              </a>
            </div>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a product"
              aria-label="Search for a product"
              className="w-full max-w-md rounded-full border border-ink/10 bg-white px-5 py-3 text-sm outline-none"
            />
            <p className="mt-6 text-sm text-brown">
              First-time patient? Lab work may be required to help your provider determine the right treatment plan for you.{" "}
              <Link href="/labs/labs-complete-panel" className="underline">
                Explore Labs
              </Link>
            </p>
          </>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {filters.filter((filter) => !filter.category || productsFor(who ?? audience, filter.category).length > 0).map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActive(f.category)}
              className={`rounded-full px-4 py-2 text-sm ${
                active === f.category ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
          {!audience && (
            <select
              aria-label="All All Men Women"
              value={who ?? "all"}
              onChange={(e) =>
                setWho(e.target.value === "all" ? undefined : (e.target.value as Audience))
              }
              className="ml-auto rounded-full bg-white px-4 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
            </select>
          )}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        {children}
      </div>
      <LabsTeaser />
      {spotlight}
      {feature}
    </div>
  );
}
