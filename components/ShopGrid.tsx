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
  centeredHero = false,
}: {
  audience?: Audience;
  title: string;
  intro: string;
  children?: React.ReactNode;
  centeredHero?: boolean;
}) {
  const [active, setActive] = useState<Category | undefined>();
  const [who, setWho] = useState<Audience | undefined>(audience);
  const [query, setQuery] = useState("");

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
          centeredHero
            ? "relative h-[78vh] overflow-hidden bg-ink text-white"
            : "relative flex min-h-[70vh] items-end overflow-hidden bg-ink pb-16 pt-32 text-white"
        }
      >
        <Image
          src={assets.shopHero}
          alt=""
          fill
          priority
          className={centeredHero ? "object-cover object-left" : "object-cover"}
          sizes="100vw"
        />
        <div
          className={
            centeredHero
              ? "absolute inset-0 bg-[linear-gradient(rgba(51,17,16,0)_15%,rgba(51,17,16,0.45)_55%,rgba(51,17,16,0.78)_100%)] min-[810px]:bg-[radial-gradient(52%_65%_at_50%_52%,rgba(51,17,16,0.72)_0%,rgba(51,17,16,0.21)_45%,rgba(51,17,16,0)_72%)]"
              : "absolute inset-0 bg-[radial-gradient(52%_65%_at_50%_52%,rgba(51,17,16,0.72)_0%,rgba(51,17,16,0.21)_45%,rgba(51,17,16,0)_72%)]"
          }
        />
        {centeredHero ? (
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a product"
          aria-label="Search for a product"
          className="w-full max-w-md rounded-full border border-ink/10 bg-white px-5 py-3 text-sm outline-none"
        />
        <p className="mt-6 text-sm text-brown">
          First-time patient? Lab work is required to help your provider determine the right treatment plan for you.{" "}
          <Link href="/labs/labs-complete-panel" className="underline">
            Explore Labs
          </Link>
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
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
    </div>
  );
}
