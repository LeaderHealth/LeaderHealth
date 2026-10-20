"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconHoverButton } from "@/components/IconHoverButton";
import { GET_STARTED_URL } from "@/lib/content/site";
import { products as catalogProducts } from "@/lib/content/products";
import { cartItemFromProduct } from "@/lib/cart/items";
import { useCart } from "@/components/cart/CartProvider";

export type HormoneRoute = {
  label: string;
  slug?: string;
  href?: string;
};

export type HormoneProductCard = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  routes: HormoneRoute[];
};

export type HormoneFeatureMode = "hero" | "carousel" | "cards";

const defaultProducts: HormoneProductCard[] = [
  {
    title: "Estradiol",
    description: "Oral estrogen to ease hot flashes, night sweats, and mood changes.",
    image: "https://framerusercontent.com/images/QccXzfEABySUc3i2VF7w6EqClI.png?width=1080&height=1080",
    imageAlt: "Estradiol medication",
    routes: [
      { label: "Start with pill", slug: "women-hormone-therapy-estradiol-pill" },
      { label: "Start with patch", slug: "women-hormone-therapy-estradiol-patch" },
    ],
  },
  {
    title: "Vaginal Estrogen",
    description: "Relief for dryness, discomfort, and pain during sex.",
    image: "https://framerusercontent.com/images/GG6wBKk214mEUH5k4M0ygcFWD4.png?width=683&height=406",
    imageAlt: "Vaginal estrogen medication",
    routes: [
      { label: "Start with suppository", slug: "women-hrt-vaginal-estrogen-suppository" },
      { label: "Start with cream", slug: "women-hormone-therapy-vaginal-estrogen-cream" },
    ],
  },
  {
    title: "Progesterone (oral)",
    description: "Balances estrogen and supports better sleep and mood stability.",
    image: "https://framerusercontent.com/images/PxzYFazSndzX1KNPYIo8nHuFy5w.png?width=681&height=465",
    imageAlt: "Oral progesterone capsules",
    routes: [
      { label: "Start with capsule", slug: "women-hormone-therapy-progesterone-(oral)" },
    ],
  },
];

const defaultHeadline = (
  <>
    Hormone
    <br />
    imbalances are
    <br />
    becoming
    <br />
    increasingly <span className="font-serif-italic text-[#1c1210]">common</span>
    <br />
    in younger women.
  </>
);

type HormoneTreatmentFeatureProps = {
  mode?: HormoneFeatureMode;
  headline?: ReactNode;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
  imageAlt?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  products?: HormoneProductCard[];
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
};

export function HormoneTreatmentFeature({
  mode = "hero",
  headline = defaultHeadline,
  description = "Personalized care can help you restore balance and feel your best.",
  ctaLabel = "Get Started",
  ctaHref = GET_STARTED_URL,
  image = "/images/hormone-feature-solid-5.png",
  imageAlt = "Smiling woman in a brown shirt and white tank top",
  gradientFrom = "#d23d52",
  gradientVia = "#e14459",
  gradientTo = "#e14459",
  products = defaultProducts,
  autoplay = true,
  interval = 1500,
  showArrows = false,
  showDots = false,
}: HormoneTreatmentFeatureProps) {
  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12" aria-label="Hormone treatment">
      {mode === "hero" ? (
        <HeroPanel
          headline={headline}
          description={description}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          image={image}
          imageAlt={imageAlt}
          gradientFrom={gradientFrom}
          gradientVia={gradientVia}
          gradientTo={gradientTo}
        />
      ) : (
        <ProductShowcase
          mode={mode}
          products={products}
          autoplay={autoplay}
          interval={interval}
          showArrows={showArrows}
          showDots={showDots}
        />
      )}
    </section>
  );
}

function HeroPanel({
  headline,
  description,
  ctaLabel,
  ctaHref,
  image,
  imageAlt,
  gradientFrom,
  gradientVia,
  gradientTo,
}: Required<
  Pick<
    HormoneTreatmentFeatureProps,
    | "headline"
    | "description"
    | "ctaLabel"
    | "ctaHref"
    | "image"
    | "imageAlt"
    | "gradientFrom"
    | "gradientVia"
    | "gradientTo"
  >
>) {
  return (
    <div
      className="relative mx-auto w-full max-w-[1140px] overflow-hidden rounded-2xl sm:rounded-[20px] min-[900px]:min-h-[560px]"
      style={{
        backgroundImage: `linear-gradient(180deg, ${gradientFrom} 0%, ${gradientVia} 24%, ${gradientTo} 46%, ${gradientTo} 100%)`,
      }}
    >
      <div className="relative z-10 px-6 pt-8 pb-2 sm:px-10 sm:pt-12 min-[900px]:max-w-[62%] min-[900px]:py-16 min-[900px]:pb-16 lg:px-14 lg:py-[72px]">
        <h2
          className="font-geist text-[clamp(34px,4.5vw,56px)] leading-[1.05] font-medium text-white"
          style={{ letterSpacing: "-0.03em" }}
        >
          {headline}
        </h2>
        <p className="mt-6 max-w-[22rem] font-sans text-[clamp(18px,1.8vw,22px)] leading-snug font-medium text-[#f4e3d0] min-[900px]:max-w-[26rem]">
          {description}
        </p>
        <div className="mt-7 sm:mt-8">
          <IconHoverButton href={ctaHref}>{ctaLabel}</IconHoverButton>
        </div>
      </div>
      <div className="pointer-events-none relative -mt-6 h-[min(92vw,460px)] w-full min-[900px]:absolute min-[900px]:top-[-2%] min-[900px]:right-[-6%] min-[900px]:bottom-[-8%] min-[900px]:mt-0 min-[900px]:h-auto min-[900px]:w-[64%]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-contain object-bottom object-right"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, #000 90%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, #000 90%, transparent 100%)",
          }}
          sizes="(max-width: 900px) 92vw, 720px"
        />
      </div>
    </div>
  );
}

function ProductShowcase({
  mode,
  products,
  autoplay,
  interval,
  showArrows,
  showDots,
}: {
  mode: "carousel" | "cards";
  products: HormoneProductCard[];
  autoplay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const count = products.length;
  const slides = count > 0 ? [...products, products[0]] : [];
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    if (mode !== "carousel" || !autoplay || reduceMotion || count < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, interval);
    return () => window.clearInterval(id);
  }, [mode, autoplay, reduceMotion, count, interval]);

  useEffect(() => {
    if (index < count) return;
    const timeout = window.setTimeout(() => {
      setInstant(true);
      setIndex(0);
    }, 560);
    return () => window.clearTimeout(timeout);
  }, [index, count]);

  useEffect(() => {
    if (!instant) return;
    const frame = window.requestAnimationFrame(() => setInstant(false));
    return () => window.cancelAnimationFrame(frame);
  }, [instant]);

  if (count === 0) return null;

  if (mode === "cards" || reduceMotion) {
    return (
      <div className="mx-auto grid w-full max-w-[1140px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductTile key={product.title} product={product} />
        ))}
      </div>
    );
  }

  const visibleIndex = index % count;

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `${-index * 100}%` }}
          transition={instant ? { duration: 0 } : { type: "spring", duration: 0.55, bounce: 0.18 }}
        >
          {slides.map((product, slideIndex) => {
            const active = slideIndex === index || (index === count && slideIndex === count);
            return (
              <div
                key={`${product.title}-${slideIndex}`}
                className="w-full shrink-0"
                aria-hidden={!active}
                inert={!active ? true : undefined}
              >
                <ProductTile product={product} />
              </div>
            );
          })}
        </motion.div>
      </div>
      {showArrows ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous product"
            onClick={() => setIndex((current) => (current - 1 + count) % count)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#F7F3F5] text-[#32120E] transition-colors duration-200 hover:bg-[#32120E] hover:text-[#F7F3F5] focus-visible:bg-[#32120E] focus-visible:text-[#F7F3F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E]"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next product"
            onClick={() => setIndex((current) => current + 1)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[#F7F3F5] text-[#32120E] transition-colors duration-200 hover:bg-[#32120E] hover:text-[#F7F3F5] focus-visible:bg-[#32120E] focus-visible:text-[#F7F3F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E]"
          >
            →
          </button>
        </div>
      ) : null}
      {showDots ? (
        <div className="mt-4 flex justify-center gap-2">
          {products.map((product, dotIndex) => (
            <button
              key={product.title}
              type="button"
              aria-label={`Show ${product.title}`}
              aria-current={dotIndex === visibleIndex}
              onClick={() => setIndex(dotIndex)}
              className={`h-2 w-2 rounded-full ${dotIndex === visibleIndex ? "bg-[#32120E]" : "bg-[#32120E]/30"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductTile({ product }: { product: HormoneProductCard }) {
  return (
    <article className="flex h-full flex-col rounded-[12px] bg-[#dbd4bd] p-[22px] text-[#32120E]">
      <div className="relative h-40 w-full">
        <Image src={product.image} alt={product.imageAlt} fill className="object-contain" sizes="360px" />
      </div>
      <h3 className="font-serif-italic mt-4 text-[29px] leading-none font-normal">{product.title}</h3>
      <p className="mt-2 font-sans text-[13px] leading-relaxed">{product.description}</p>
      <div className="my-4 h-px bg-[#32120E]/15" />
      <div className="mt-auto flex flex-wrap gap-2">
        {product.routes.map((route) => (
          <RouteLink key={route.slug ?? route.href ?? route.label} route={route} title={product.title} />
        ))}
      </div>
    </article>
  );
}

function RouteLink({ route, title }: { route: HormoneRoute; title: string }) {
  const { addItem } = useCart();
  const className =
    "inline-flex h-9 items-center justify-center rounded-[6px] bg-[#F7F3F5] px-3 text-center text-[11px] font-medium tracking-[0.08em] text-[#32120E] uppercase transition-colors duration-200 hover:bg-[#32120E] hover:text-[#F7F3F5] focus-visible:bg-[#32120E] focus-visible:text-[#F7F3F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#32120E] motion-reduce:transition-none";
  const product = route.slug ? catalogProducts.find((item) => item.slug === route.slug) : undefined;
  if (product) {
    return (
      <button
        type="button"
        onClick={() => addItem(cartItemFromProduct(product))}
        aria-label={`${route.label} — ${title}`}
        className={className}
      >
        {route.label}
      </button>
    );
  }
  const href = route.href;
  if (!href) return null;
  if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) {
    return (
      <a href={href} aria-label={`${route.label} — ${title}`} className={className}>
        {route.label}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={`${route.label} — ${title}`} className={className}>
      {route.label}
    </Link>
  );
}
