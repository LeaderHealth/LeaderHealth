"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assets, careSteps, designedFor, GET_STARTED_URL, testimonials } from "@/lib/content/site";
import { HeroVideo } from "./HeroVideo";
import { Marquee } from "./Marquee";
import { LabsTeaser } from "./LabsTeaser";
import { TestimonialsVideoSection } from "./TestimonialsVideoSection";
import { ArticleLibrary } from "./ArticleLibrary";

const campaign = [
  {
    href: "/products/longevity-sermorelin",
    title: "Lose Weight, Keep it Off",
    sub: "with Compounded Sermorelin",
    img: "https://framerusercontent.com/images/DZxl5E96krCg93IEOLZY5gt00YU.png?width=1080&height=1350",
  },
  {
    href: "/products/weight-loss-tirzepatide",
    title: "Transform Your Body",
    sub: "with Compounded Tirzepatide",
    img: "https://framerusercontent.com/images/wLJd6Casd45671gr7VQ42JuQQkE.png?width=1080&height=1350",
  },
  {
    href: "/products/men-trt-testosterone-cypionate",
    title: "Reclaim Your Energy",
    sub: "with Compounded Testosterone",
    img: "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
  },
];

const featured = [
  {
    href: "/products/longevity-sermorelin",
    category: "LONGEVITY",
    name: "Sermorelin",
    price: "Starting From $149/mo",
    image: "https://framerusercontent.com/images/Nxmvv0V7wJmcL1463SseCeRgh8.png?width=1080&height=1350",
  },
  {
    href: "/products/weight-loss-semaglutide#find-what-fits",
    category: "WEIGHT LOSS",
    name: "Semaglutide Sublingual",
    price: "Starting From $129/mo",
    image: "https://framerusercontent.com/images/b3PWiNtSYn3mtcfXtpoTxo38Zo.png?width=1024&height=1024",
  },
  {
    href: "/products/men-sexual-health-tadalafil",
    category: "SEXUAL HEALTH",
    name: "Tadalafil",
    price: "$79/mo",
    image: "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
  },
];

const designedForCards = [
  ...designedFor,
  designedFor[designedFor.length - 1],
];

const intakeUrl = "https://products.leaderhealth.clinic/?quizOpen=true";

const careOptions = [
  {
    href: "/products/men-trt-testosterone-cypionate",
    name: "Testosterone Cypionate",
    category: "Hormone Therapy",
    price: "Starting at $109 per month",
    image: "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
    width: 1080,
    height: 1350,
    imageClass: "max-h-[73.07%]",
    featured: false,
  },
  {
    href: "/products/men-sexual-health-combo-troches",
    name: "Combo Troches",
    category: "Sexual Health",
    price: "Starting at $99 per month",
    image: "https://framerusercontent.com/images/xiLmspoD4quCotY2Ro6T9VdAuU.png?width=1890&height=2363",
    width: 1890,
    height: 2363,
    imageClass: "max-h-full",
    featured: false,
  },
  {
    href: "/products/longevity-nad",
    name: "NAD+",
    category: "Longevity",
    price: "Starting at $139 per month",
    image: "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
    width: 2286,
    height: 1287,
    imageClass: "max-h-full",
    featured: true,
  },
  {
    href: "/products/weight-loss-semaglutide",
    name: "Semaglutide",
    category: "Weight",
    price: "Starting at $159 per month",
    image: "https://framerusercontent.com/images/qjehMU3idCiDUkHLomxHWBSbnkk.png?width=626&height=888",
    width: 626,
    height: 888,
    imageClass: "max-h-full",
    featured: false,
  },
];

function navClearance() {
  const gap = 16;
  const header = document.querySelector("header");
  if (header && getComputedStyle(header).display !== "none") {
    const top = Number.parseFloat(getComputedStyle(header).top) || 0;
    return top + header.offsetHeight + gap;
  }
  return 12 + 50 + gap;
}

function scrollToOurTop3() {
  const grid = document.getElementById("our-top-3");
  const target = grid?.querySelector("a") ?? grid;
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearance = navClearance();
  const rect = target.getBoundingClientRect();
  const absTop = rect.top + window.scrollY;
  const absBottom = rect.bottom + window.scrollY;
  const bottomPad = 16;
  const lift = 72;
  let top = absTop - clearance;

  if (absBottom - top > window.innerHeight - bottomPad) {
    top = absBottom - (window.innerHeight - bottomPad);
  }

  top += lift;

  const vial = target.querySelector("img");
  const label = target.querySelector("p") ?? target.querySelector("h3");
  if (vial) {
    const vialTop = vial.getBoundingClientRect().top + window.scrollY;
    top = Math.min(top, vialTop - clearance);
  }
  if (label) {
    const labelBottom = label.getBoundingClientRect().bottom + window.scrollY;
    top = Math.max(top, labelBottom - (window.innerHeight - bottomPad));
  }

  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
}

const careButtonLabelClass =
  "relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] group-focus-visible:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none";

const careButtonArrowClass =
  "pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] group-focus-visible:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none";

export function HomePage() {
  const [activeStep, setActiveStep] = useState(careSteps[0].step);
  const [trackReady, setTrackReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!container || !viewport || !track) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedQuery.matches;
    let currentX = 0;
    let primed = false;
    let raf = 0;
    let timer = 0;
    let scheduled = false;
    let generation = 0;
    let disposed = false;
    let readyAnnounced = false;
    const geometry = { startX: 0, endX: 0, viewportWidth: 0 };
    const points = [0, 0.5, 1];

    const cards = () => cardRefs.current.filter((card): card is HTMLElement => card !== null);

    const readProgress = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = rect.height - vh;
      const scrolled = travel > 0 ? Math.min(travel, Math.max(0, -rect.top)) : 0;
      const progress = travel > 0 ? scrolled / travel : 0;
      return { rect, progress };
    };

    const measure = () => {
      const list = cards();
      if (list.length < 2 || viewport.clientWidth === 0) return false;
      const saved = list.map((card) => card.style.transform);
      list.forEach((card) => {
        card.style.transform = "none";
      });
      const trackRect = track.getBoundingClientRect();
      const firstRect = list[0].getBoundingClientRect();
      const lastRect = list[list.length - 1].getBoundingClientRect();
      const firstCenter = firstRect.left - trackRect.left + firstRect.width / 2;
      const lastCenter = lastRect.left - trackRect.left + lastRect.width / 2;
      geometry.viewportWidth = viewport.clientWidth;
      geometry.startX = geometry.viewportWidth / 2 - firstCenter;
      geometry.endX = geometry.viewportWidth / 2 - lastCenter;
      list.forEach((card, index) => {
        card.style.transform = saved[index];
      });
      return true;
    };

    const targetFor = (progress: number) => geometry.startX + progress * (geometry.endX - geometry.startX);

    const paint = (progress: number, x: number) => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      cards().forEach((card, index) => {
        if (reduced) {
          card.style.transform = "none";
          card.style.opacity = "1";
          return;
        }
        const distance = Math.abs(progress - points[index]);
        const t = Math.min(distance / 0.5, 1);
        const scale = 1 - t * 0.04;
        const opacity = 1 - t * 0.32;
        const rise = (Math.max(0, distance - 0.45) / 0.55) * 40;
        card.style.opacity = String(opacity);
        card.style.transform = `translate3d(0, ${rise}px, 0) scale(${scale})`;
      });
    };

    const tick = (gen: number) => {
      if (gen !== generation || disposed) return;
      generation += 1;
      scheduled = false;
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      raf = 0;
      timer = 0;
      if (viewport.clientWidth === 0) {
        primed = false;
        return;
      }
      if (geometry.viewportWidth === 0 && !measure()) return;
      const { rect, progress } = readProgress();
      const near = rect.bottom > -320 && rect.top < window.innerHeight + 320;
      const targetX = targetFor(progress);
      if (!near && primed && Math.abs(targetX - currentX) < 0.5) return;
      if (!primed || reduced) {
        currentX = targetX;
        primed = true;
      } else {
        const edge = Math.max(0, (progress - 0.75) / 0.2);
        const startEdge = Math.max(0, (0.12 - progress) / 0.12);
        const rate = Math.min(1, 0.34 + Math.max(edge, startEdge) * 0.66);
        const next = currentX + (targetX - currentX) * rate;
        currentX = Math.abs(targetX - next) < 0.5 ? targetX : next;
      }
      paint(progress, currentX);
      if (near || Math.abs(targetX - currentX) >= 0.5) kick();
    };

    const kick = () => {
      if (disposed || scheduled) return;
      scheduled = true;
      const gen = generation;
      raf = requestAnimationFrame(() => tick(gen));
      timer = window.setTimeout(() => tick(gen), 32);
    };

    const place = () => {
      const previousWidth = geometry.viewportWidth;
      const previousStart = geometry.startX;
      const previousEnd = geometry.endX;
      if (!measure()) {
        primed = false;
        return;
      }
      const { progress } = readProgress();
      const layoutChanged =
        Math.abs(previousWidth - geometry.viewportWidth) > 0.5 ||
        Math.abs(previousStart - geometry.startX) > 0.5 ||
        Math.abs(previousEnd - geometry.endX) > 0.5;
      if (!primed || reduced || layoutChanged) {
        currentX = targetFor(progress);
        primed = true;
        paint(progress, currentX);
      }
      track.style.visibility = "visible";
      if (!readyAnnounced) {
        readyAnnounced = true;
        setTrackReady(true);
      }
      kick();
    };

    const observer = new ResizeObserver(place);
    observer.observe(container);
    observer.observe(viewport);
    observer.observe(track);
    cards().forEach((card) => observer.observe(card));

    const onImage = () => place();
    const images = [...track.querySelectorAll("img")];
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onImage);
    });

    const onReduce = () => {
      reduced = reducedQuery.matches;
      place();
    };

    let follow = 0;
    const placeLater = () => {
      if (follow) cancelAnimationFrame(follow);
      follow = requestAnimationFrame(() => {
        follow = 0;
        if (!disposed) place();
      });
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", place);
    window.addEventListener("orientationchange", place);
    reducedQuery.addEventListener("change", onReduce);
    place();
    placeLater();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      if (follow) cancelAnimationFrame(follow);
      observer.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", place);
      window.removeEventListener("orientationchange", place);
      reducedQuery.removeEventListener("change", onReduce);
      images.forEach((img) => img.removeEventListener("load", onImage));
    };
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#our-top-3") return;
    const frame = window.requestAnimationFrame(() => scrollToOurTop3());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-white">
        <HeroVideo src={assets.heroVideo} />
        <div className="relative z-10 flex h-full flex-col justify-end px-[8%] pb-28 md:px-[12%] md:pb-32">
          <Image
            src={assets.logo}
            alt="LEADERHEALTH"
            width={280}
            height={32}
            className="mb-5 h-auto w-[280px] max-w-[280px] object-contain object-left brightness-0 invert"
            style={{ width: 280, height: "auto", maxWidth: 280 }}
            priority
          />
          <h1 className="max-w-[720px] font-serif-italic text-[42px] leading-[0.95] md:text-[77px] md:leading-[84.7px]">
            Become the strongest version of yourself.
          </h1>
          <p className="mt-5 max-w-[640px] text-base font-medium leading-snug md:text-lg">
            Personalized, clinician-led protocols that help you lose weight, build strength, and live with more energy—no guesswork.
          </p>
          <a
            href={GET_STARTED_URL}
            className="group relative mt-6 inline-flex h-[47px] min-w-[188px] items-center justify-center self-start overflow-hidden rounded-[39px] bg-[#DF4452] px-[26px] py-[14px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#E33D4E] transition-transform duration-[400ms] ease-out group-hover:scale-[36] motion-reduce:scale-100! motion-reduce:transition-none"
            />
            <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
              Get Started
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
            >
              →
            </span>
          </a>
        </div>
      </section>
      <Marquee />

      <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_8%_40%,rgba(246,198,206,0.85),transparent_42%),radial-gradient(ellipse_at_92%_70%,rgba(244,190,200,0.7),transparent_40%),radial-gradient(ellipse_at_50%_100%,rgba(248,214,220,0.55),transparent_46%)]"
        />
        <div className="relative mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="max-w-[560px] font-sans text-[36px] leading-[1.02] font-semibold tracking-[-0.025em] text-[#2c1614] sm:text-[44px] lg:text-[50px]">
              Explore Your Care
              <br />
              Options
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:mb-1.5 lg:max-w-[480px] lg:flex-1 lg:justify-end lg:gap-8">
              <p className="max-w-[240px] font-sans text-[13px] leading-[1.45] text-[#6e6562] sm:text-[14px]">
                One lead treatment from each category, prescribed and monitored by licensed clinicians.
              </p>
              <Link
                href="/shop-all-products"
                className="group relative inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3a221e] px-9 py-2.5 font-sans text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#2c1614]"
              >
                <span className={careButtonLabelClass}>Shop all</span>
                <span aria-hidden className={careButtonArrowClass}>
                  →
                </span>
              </Link>
            </div>
          </div>

          <div className="group/options mt-8 rounded-[28px] border border-white/80 bg-[#f7f4f4]/90 p-3 shadow-[0_16px_50px_rgba(80,40,40,0.06)] sm:p-4 lg:mt-11 lg:p-4">
            <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {careOptions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex h-full flex-col rounded-[20px] border bg-white px-3.5 pt-3.5 pb-4 transition-colors duration-300 ease-out sm:px-4 sm:pt-4 sm:pb-5 ${
                    item.featured
                      ? "border-[#e33d4d] group-hover/options:border-transparent hover:border-[#e33d4d]"
                      : "border-transparent hover:border-[#e33d4d]"
                  }`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-3 right-3 grid size-8 origin-center scale-90 place-items-center rounded-full bg-[#e33d4d] text-white opacity-0 transition-[opacity,scale] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                  >
                    <svg viewBox="0 0 20 20" className="size-3.5" fill="none">
                      <path d="M5.5 14.5 14.5 5.5M8 5.5h6.5V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="flex min-h-7 flex-wrap items-center gap-1.5 pr-9">
                    <span className="rounded-full bg-[#f6e4e6] px-2.5 py-1 font-sans text-[11px] leading-none text-[#3a221e]">
                      Popular
                    </span>
                    <span className="rounded-full border border-[#eadfdd] px-2.5 py-1 font-sans text-[11px] leading-none text-[#3a221e]">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-3 flex min-h-[2.4em] items-center justify-center text-center font-sans text-[17px] leading-[1.2] font-semibold text-[#2c1614] sm:text-[18px]">
                    {item.name}
                  </p>
                  <div className="mt-2 flex h-[312px] w-full items-center justify-center">
                    <Image
                      src={item.image}
                      alt=""
                      width={item.width}
                      height={item.height}
                      className={`h-auto w-auto max-w-full object-contain ${item.imageClass}`}
                    />
                  </div>
                  <p className="mt-1 text-center font-sans text-[12px] leading-snug text-[#8a817e] sm:text-[13px]">
                    {item.price}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#efe8e7] px-1 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="font-sans text-[13px] text-[#8a817e] sm:text-[14px]">Not sure where to start?</p>
              <Link
                href="#our-top-3"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToOurTop3();
                  window.history.pushState(null, "", "#our-top-3");
                }}
                className="group relative inline-flex w-fit items-center justify-center overflow-hidden rounded-full border border-[#3a221e] px-9 py-1.5 font-sans text-[13px] font-medium text-[#3a221e]"
              >
                <span className={careButtonLabelClass}>Our top 3</span>
                <span aria-hidden className={careButtonArrowClass}>
                  →
                </span>
              </Link>
              <a
                href={intakeUrl}
                className="group relative inline-flex w-fit items-center justify-center overflow-hidden rounded-full bg-[#e33d4d] px-9 py-1.5 font-sans text-[13px] font-medium text-white"
              >
                <span className={careButtonLabelClass}>Take our General Form</span>
                <span aria-hidden className={careButtonArrowClass}>
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-center">
        <div ref={scrollRef} className="relative h-[230vh] lg:hidden">
          <div className="sticky top-0 flex h-[100vh] w-full flex-col overflow-hidden pb-4 pt-16 [@media(max-height:740px)]:pb-3 [@media(max-height:740px)]:pt-14">
            <h2 className="shrink-0 px-6 text-[32px] leading-[1.1] font-semibold text-ink sm:text-4xl md:text-5xl [@media(max-height:740px)]:text-[28px]">
              <span className="sm:inline">Care, Delivered </span>
              <span className="block sm:inline">
                in <span className="whitespace-nowrap font-serif-italic text-accent">3 Simple Steps</span>
              </span>
            </h2>
            <p className="mt-2 shrink-0 px-6 text-sm text-taupe sm:text-base [@media(max-height:740px)]:mt-1">
              No clinics. No waiting rooms. No guesswork.
            </p>
            <div ref={viewportRef} className="mt-4 min-h-0 w-full flex-1 overflow-hidden [@media(max-height:740px)]:mt-3">
              <div
                ref={trackRef}
                className="relative flex h-full w-max items-stretch gap-4 will-change-transform md:gap-5"
                style={{ visibility: trackReady ? "visible" : "hidden" }}
              >
                {careSteps.map((step, index) => (
                  <article
                    key={step.step}
                    ref={(node) => {
                      cardRefs.current[index] = node;
                    }}
                    className="relative h-full w-[76vw] max-w-[340px] shrink-0 overflow-hidden rounded-[28px] sm:max-w-[380px] md:w-[min(56vw,500px)] md:max-w-[500px]"
                  >
                    <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="80vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/25" />
                    <p className="absolute left-6 top-6 text-4xl text-white">{step.step}</p>
                    <div className="absolute inset-x-0 bottom-0 box-border w-full max-w-full p-5 text-left text-white [@media(max-height:740px)]:p-4">
                      <h3 className="min-w-0 whitespace-normal break-words text-3xl font-semibold [@media(max-height:740px)]:text-2xl">{step.title}</h3>
                      <p className="mt-2 max-w-full whitespace-normal break-words text-sm leading-snug text-white/85">{step.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <a
              href={intakeUrl}
              className="mt-5 inline-flex shrink-0 items-center gap-2.5 self-center rounded-[39px] bg-[#DF4452] px-[26px] py-[14px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [@media(max-height:740px)]:mt-4"
            >
              Begin your intake
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="hidden px-6 py-20 lg:block">
          <h2 className="text-4xl font-semibold text-ink lg:text-[52px]">
            Care, Delivered in <span className="font-serif-italic text-accent">3 Simple Steps</span>
          </h2>
          <p className="mt-3 text-taupe">No clinics. No waiting rooms. No guesswork.</p>
          <div
            className="mx-auto mt-12 flex max-w-6xl gap-5"
            onMouseLeave={(event) => {
              if (!window.matchMedia("(hover: hover) and (min-width: 1024px)").matches) return;
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.contains(next)) return;
              const focused = document.activeElement;
              if (focused instanceof HTMLElement && event.currentTarget.contains(focused)) return;
              setActiveStep(careSteps[0].step);
            }}
            onBlur={(event) => {
              const next = event.relatedTarget;
              if (next instanceof Node && event.currentTarget.contains(next)) return;
              setActiveStep(careSteps[0].step);
            }}
          >
            {careSteps.map((step) => {
              const active = activeStep === step.step;
              return (
                <article
                  key={step.step}
                  role="button"
                  tabIndex={0}
                  aria-expanded={active}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "mouse") return;
                    if (!window.matchMedia("(min-width: 1024px)").matches) return;
                    setActiveStep(step.step);
                  }}
                  onClick={() => setActiveStep(step.step)}
                  onFocus={() => setActiveStep(step.step)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setActiveStep(step.step);
                  }}
                  className={`relative h-[520px] min-w-0 shrink basis-0 cursor-pointer overflow-hidden rounded-[28px] transition-[flex-grow] duration-[400ms] ease-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
                    active ? "grow-[2]" : "grow"
                  }`}
                >
                  <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="(min-width: 1024px) 40vw, 80vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/25" />
                  <p className="absolute left-6 top-6 text-5xl text-white">{step.step}</p>
                  <div className="absolute inset-x-0 bottom-0 box-border w-full max-w-full p-6 text-left text-white">
                    <h3 className="w-[calc((min(72rem,100vw-4rem)-2.5rem)/4-3rem)] whitespace-normal break-normal text-3xl font-semibold">{step.title}</h3>
                    <p
                      aria-hidden={!active}
                      inert={!active}
                      className={`w-[508px] max-w-[calc((min(72rem,100vw-4rem)-2.5rem)/2-3rem)] whitespace-normal break-words text-base text-white/90 transition-[opacity,translate] duration-[400ms] ease-out motion-reduce:transition-none ${
                        active ? "relative mt-2 translate-y-0 opacity-100 delay-[250ms]" : "absolute opacity-0 delay-0"
                      }`}
                    >
                      {step.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          <a
            href={intakeUrl}
            className="group relative mt-10 inline-flex h-[47px] min-w-[188px] items-center justify-center overflow-hidden rounded-[39px] bg-[#DF4452] px-[26px] py-[14px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#E33D4E] transition-transform duration-[400ms] ease-out group-hover:scale-[36] motion-reduce:scale-100! motion-reduce:transition-none"
            />
            <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
              Begin your intake
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
            >
              →
            </span>
          </a>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-t-[25px]">
        <Image
          src={assets.showUp}
          alt="A man standing beside an oversized LeaderHealth tablet embossed with the LH monogram."
          width={2720}
          height={1536}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative mx-auto w-[min(1174px,calc(100%-2rem))] pb-16 pt-[72px]">
          <h2 className="text-center font-sans text-[40px] font-medium leading-[1.1] tracking-normal text-[#331110] md:text-[56px] md:leading-[61.6px]">
            Show Up <span className="font-serif-italic text-[40px] leading-[1.1] text-[#e43d4e] md:text-[56px] md:leading-[61.6px]">Stronger</span>
          </h2>
          <div className="mt-7 flex justify-center">
            <Link
              href="/shop-all-products"
              className="inline-flex rounded-[39px] bg-[#df4452] px-[26px] py-[14px] font-sans text-base font-semibold leading-[19.2px] text-[#f7f3f5]"
            >
              Explore All Treatments
            </Link>
          </div>

          <div className="mt-5 grid gap-2.5 md:grid-cols-2">
            <article className="relative h-[280px] overflow-hidden rounded-[23px] md:h-[335px]">
              <Image
                src={assets.pills}
                alt="Two round tablets and a capsule on a blush gradient background"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 582px, 92vw"
              />
              <div className="relative flex h-full flex-col justify-between px-[22px] pb-[22px] pt-10">
                <div>
                  <h3 className="max-w-[538px] font-sans text-[28px] font-medium leading-[1.2] tracking-normal text-[#f7f3f4] md:text-[34px] md:leading-[40.8px]">
                    Provider-Guided Weight Loss
                  </h3>
                  <p className="mt-2.5 max-w-[538px] font-sans text-base leading-[19.2px] tracking-normal text-[#f7f3f4]">
                    Physician-prescribed treatments, quarterly labs, and real clinical support — delivered to your door.
                  </p>
                </div>
                <a
                  href={GET_STARTED_URL}
                  className="self-end rounded-[39px] bg-[#f9f9f9] px-[18px] py-[5px] text-[15px] font-medium text-ink"
                >
                  Get Started
                </a>
              </div>
            </article>

            <article className="relative h-[280px] overflow-hidden rounded-[23px] md:h-[335px]">
              <Image
                src={assets.stretching}
                alt="LEADER HEALTH logo over a photo of a man stretching his shoulder"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 582px, 92vw"
              />
              <div className="relative flex h-full flex-col justify-end px-[22px] pb-[22px] pt-10">
                <h3 className="max-w-[345px] font-sans text-[28px] font-medium leading-[40.8px] tracking-normal text-[#f7f3f4] md:text-[34px]">
                  Care Built Around You
                </h3>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <p className="max-w-[345px] font-sans text-base leading-[19.2px] tracking-normal text-[#f7f3f4]">
                    Licensed clinicians, transparent pricing, and support at every step.
                  </p>
                  <Link
                    href="/aboutus"
                    className="shrink-0 rounded-[39px] bg-[#f9f9f9] px-[18px] py-[5px] text-[15px] font-medium text-ink"
                  >
                    About Us
                  </Link>
                </div>
              </div>
            </article>
          </div>

          <div id="our-top-3" className="relative z-10 mt-2.5 scroll-mt-24 grid items-stretch gap-2.5 md:grid-cols-3">
            {campaign.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex h-[660px] w-full flex-col overflow-hidden rounded-[22px] bg-[#442928] px-6 pt-8 pb-7 transition-colors duration-300 ease-out hover:bg-[#e6d8c6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d] motion-reduce:transition-none md:h-[860px] md:px-8 md:pt-10 md:pb-10"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-5 right-5 z-10 grid size-10 place-items-center rounded-full bg-[#3a221e] text-[#f7f3f5] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none md:size-11"
                >
                  <svg viewBox="0 0 20 20" className="size-4" fill="none">
                    <path d="M5.5 14.5 14.5 5.5M8 5.5h6.5V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Image
                    src={card.img}
                    alt=""
                    width={1080}
                    height={1350}
                    className="h-[420px] w-auto max-w-none shrink-0 origin-center object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045] group-hover:-translate-y-2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100 md:h-[560px]"
                  />
                </div>
                <div className="mt-4 w-full shrink-0">
                  <h3 className="font-sans text-[26px] leading-[1.15] font-semibold tracking-normal text-[#e86a6e] transition-colors duration-300 ease-out group-hover:text-[#e33d4d] motion-reduce:transition-none md:min-h-[2.4em] md:text-[34px]">
                    {card.title}
                  </h3>
                  <p className="mt-2 font-sans text-[16px] leading-6 font-medium tracking-normal text-[#f0c2c0] transition-colors duration-300 ease-out group-hover:text-[#e33d4d] motion-reduce:transition-none md:text-[18px]">
                    {card.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white">
        <Image
          src={assets.weightlifting}
          alt="A man in a white tank top lifting weights in a shaft of light."
          width={2496}
          height={1664}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative mx-auto max-w-[1129px] overflow-hidden rounded-[36px] px-6 pb-9 pt-16 md:px-12 md:pt-[84px]">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-sans text-[36px] font-medium leading-tight tracking-normal text-[#f7f3f4] md:text-[47px] md:leading-[56.4px]">
                Designed for the way
              </h2>
              <p className="font-serif-italic text-[36px] leading-tight text-[#f7f3f4] md:text-[47px] md:leading-[37.6px]">
                you want to live.
              </p>
              <p className="mt-6 max-w-[478px] font-sans text-lg font-light leading-snug tracking-normal text-white md:text-[24px] md:leading-[28.8px]">
                Most wellness products are built for the average. Yours is built for you — engineered to move the metrics that matter, and refined as your body changes.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-2.5">
                {designedForCards.map((item, i) => (
                  <div
                    key={`${item}-${i}`}
                    className="flex items-start gap-[11px] rounded-[13px] bg-white/20 p-4 md:p-5"
                  >
                    <Image src={assets.check} alt="" width={28} height={28} className="mt-0.5 h-7 w-7 shrink-0" />
                    <p className="font-sans text-[14px] leading-[16.8px] tracking-normal text-[#f7f3f4]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto hidden min-h-[520px] w-full max-w-[579px] lg:block">
              <Image
                src="https://framerusercontent.com/images/Nxmvv0V7wJmcL1463SseCeRgh8.png?width=1080&height=1350"
                alt="Sermorelin injection vial"
                width={579}
                height={677}
                className="h-auto w-full object-contain"
              />
              <p className="absolute bottom-16 right-4 flex h-16 items-center justify-center rounded-[13px] bg-black/50 px-6 font-serif-italic text-[28px] leading-[33.6px] text-[#f7f3f4] md:right-8">
                More by design.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="font-serif-italic text-[36px] font-normal leading-tight tracking-normal text-[#f7f3f4] md:text-[47px] md:leading-[56.4px]">
              Energy. Weight. Performance.
            </h2>
            <p className="mt-1 font-sans text-xl font-normal leading-snug tracking-normal text-[#f7f3f4] md:text-[30px] md:leading-9">
              When one is off, everything feels off. Here&apos;s where most members start.
            </p>
            <div className="mx-auto mt-10 grid max-w-[980px] gap-4 md:grid-cols-3">
              {featured.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[380px] flex-col items-center justify-between rounded-2xl px-4 pb-10 pt-12 text-center md:min-h-[458px] md:pt-[60px]"
                  style={{ background: "linear-gradient(211deg, rgb(220, 212, 189) 0%, rgb(228, 79, 93) 100%)" }}
                >
                  <p className="font-sans text-[25px] font-bold leading-[30px] tracking-normal text-ink">
                    {item.category}
                  </p>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={241}
                    height={241}
                    className="h-auto w-full max-w-[241px] object-contain"
                  />
                  <div>
                    <p className="font-sans text-[22px] font-semibold leading-[22px] tracking-normal text-white">
                      {item.name}
                    </p>
                    <p className="mt-1.5 font-sans text-[17px] font-normal leading-[20.4px] tracking-normal text-white">
                      {item.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LabsTeaser />

      <TestimonialsVideoSection
        videoSrc={assets.heroVideoAlt}
        posterSrc={assets.weightlifting}
        testimonials={testimonials.map((item) => ({
          quote: item.quote,
          name: item.name,
          role: item.treatment,
          image: item.image,
        }))}
        showDots
        draggable
        initialIndex={1}
      />
      <ArticleLibrary
        slugs={[
          "semaglutide-vs-tirzepatide-comparison-guide",
          "recovery-peptides-anti-doping-sourcing-guide",
          "low-libido-in-women-causes-evaluation-guide",
        ]}
      />
    </>
  );
}
