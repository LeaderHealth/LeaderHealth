"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type TestimonialItem = {
  quote: string;
  name: string;
  role?: string;
  image?: string;
  rating?: number;
};

export type TestimonialsVideoSectionProps = {
  videoSrc: string;
  posterSrc?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  fit?: "cover" | "contain";
  overlayColor?: string;
  overlayOpacity?: number;
  videoControls?: boolean;
  heightDesktop?: number;
  heightTablet?: number;
  heightMobile?: number;
  borderRadius?: number;
  backgroundColor?: string;
  testimonials: TestimonialItem[];
  title?: string;
  subtitle?: string;
  autoPlayCarousel?: boolean;
  interval?: number;
  draggable?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  gap?: number;
  transitionDuration?: number;
  initialIndex?: number;
  cardBackground?: string;
  cardTextColor?: string;
  accentColor?: string;
  quoteFontFamily?: string;
  bodyFontFamily?: string;
  cardRadius?: number;
  cardPadding?: number;
};

const DEFAULTS = {
  heightDesktop: 794,
  heightTablet: 740,
  heightMobile: 820,
  overlayColor: "#f4e6e2",
  overlayOpacity: 0.38,
  cardBackground: "#ffffff",
  cardTextColor: "#331110",
  accentColor: "#e33d4d",
  interval: 7000,
  gap: 16,
  transitionDuration: 0.55,
  cardRadius: 20,
  cardPadding: 32,
};

export function TestimonialsVideoSection({
  videoSrc,
  posterSrc,
  autoPlay = true,
  muted = true,
  loop = true,
  fit = "cover",
  overlayColor = DEFAULTS.overlayColor,
  overlayOpacity = DEFAULTS.overlayOpacity,
  videoControls = false,
  heightDesktop = DEFAULTS.heightDesktop,
  heightTablet = DEFAULTS.heightTablet,
  heightMobile = DEFAULTS.heightMobile,
  borderRadius,
  backgroundColor = "#2a1212",
  testimonials,
  title = "Wellness, in their own words.",
  subtitle = "Hear how LeaderHealth has helped people feel their best.",
  autoPlayCarousel = false,
  interval = DEFAULTS.interval,
  draggable = true,
  showDots = true,
  showArrows = false,
  gap = DEFAULTS.gap,
  transitionDuration = DEFAULTS.transitionDuration,
  initialIndex = 0,
  cardBackground = DEFAULTS.cardBackground,
  cardTextColor = DEFAULTS.cardTextColor,
  accentColor = DEFAULTS.accentColor,
  quoteFontFamily,
  bodyFontFamily,
  cardRadius = DEFAULTS.cardRadius,
  cardPadding = DEFAULTS.cardPadding,
}: TestimonialsVideoSectionProps) {
  const count = testimonials.length;
  const labelId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(() => {
    if (testimonials.length === 0) return 0;
    return Math.min(Math.max(initialIndex, 0), testimonials.length - 1);
  });
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const featured = testimonials[index];
  const prev = testimonials[(index + count - 1) % count];
  const next = testimonials[(index + 1) % count];

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.defaultMuted = muted;
    if (!autoPlay || reduceMotion) {
      video.pause();
      return;
    }
    const play = () => {
      void video.play().catch(() => {});
    };
    play();
    video.addEventListener("canplay", play);
    video.addEventListener("loadeddata", play);
    const onVisible = () => {
      if (!document.hidden) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      video.removeEventListener("canplay", play);
      video.removeEventListener("loadeddata", play);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [autoPlay, muted, reduceMotion, videoSrc]);

  useEffect(() => {
    if (!autoPlayCarousel || paused || reduceMotion || count < 2) return;
    const timer = window.setInterval(() => go(1), interval);
    return () => window.clearInterval(timer);
  }, [autoPlayCarousel, paused, reduceMotion, count, interval, go]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  }

  if (!featured) return null;

  const sectionStyle = {
    backgroundColor,
    borderRadius: borderRadius ? `${borderRadius}px` : undefined,
    "--tv-h-desktop": `${heightDesktop}px`,
    "--tv-h-tablet": `${heightTablet}px`,
    "--tv-h-mobile": `${heightMobile}px`,
  } as CSSProperties;

  return (
    <section
      className="relative isolate overflow-hidden"
      style={sectionStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[var(--tv-h-mobile)] pb-10 md:min-h-[var(--tv-h-tablet)] lg:h-[var(--tv-h-desktop)] lg:min-h-[var(--tv-h-desktop)] lg:pb-0">
        <video
          ref={videoRef}
          autoPlay={autoPlay && !reduceMotion}
          muted={muted}
          loop={loop}
          playsInline
          controls={videoControls}
          poster={posterSrc}
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          className={`pointer-events-none absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_18%,rgba(227,61,77,0.16),transparent_68%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex h-full w-[min(370px,calc(100%-20px))] flex-col items-stretch pt-12 md:w-[min(96%,1100px)] md:items-center md:px-0 md:pt-[56px] lg:pt-[64px]">
          <div className="max-w-4xl text-left md:text-center">
            <h2 className="font-sans text-[40px] font-semibold leading-[1.05] tracking-normal text-[#331110] md:text-[44px] lg:text-[58px] lg:leading-[1.05]">
              {title}
            </h2>
            {subtitle ? (
              <p
                className="mt-2 font-sans text-[18px] font-normal leading-snug text-[#e33d4d] md:mx-auto md:mt-3 md:text-[22px] lg:text-[28px] lg:leading-[1.2]"
                style={{ color: accentColor }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <div
            role="region"
            aria-roledescription="carousel"
            aria-labelledby={labelId}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="mt-8 w-full outline-none md:mt-10"
          >
            <p id={labelId} className="sr-only">
              Member stories, slide {index + 1} of {count}
            </p>
            <div className="flex items-stretch justify-center lg:h-[416px]" style={{ gap }}>
              {count > 1 ? (
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => go(-1)}
                  className="relative hidden min-h-[220px] w-[56px] shrink-0 overflow-hidden rounded-l-none rounded-r-[20px] shadow-[0_18px_40px_rgba(50,17,16,0.18)] md:block lg:h-[416px] lg:min-h-0 lg:w-[104px]"
                  style={{
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 58%)",
                    maskImage: "linear-gradient(to right, transparent 0%, black 58%)",
                  }}
                >
                  <PeekCard item={prev} side="left" background={cardBackground} text={cardTextColor} accent={accentColor} />
                </button>
              ) : null}

              <motion.div
                key={index}
                drag={draggable && count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragMomentum={false}
                onDragStart={() => setPaused(true)}
                onDragEnd={(_, info) => {
                  setPaused(false);
                  if (info.offset.x < -72 || info.velocity.x < -480) go(1);
                  else if (info.offset.x > 72 || info.velocity.x > 480) go(-1);
                }}
                initial={reduceMotion ? false : { opacity: 0.55, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 28, duration: transitionDuration }}
                className={`min-w-0 w-[370px] max-w-full touch-pan-y md:w-auto md:flex-1 md:max-w-[726px] lg:h-[416px] lg:w-[726px] lg:flex-none ${draggable && count > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <FeaturedCard
                  item={featured}
                  cardBackground={cardBackground}
                  cardTextColor={cardTextColor}
                  accentColor={accentColor}
                  quoteFontFamily={quoteFontFamily}
                  bodyFontFamily={bodyFontFamily}
                  cardRadius={cardRadius}
                  cardPadding={cardPadding}
                />
              </motion.div>

              {count > 1 ? (
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => go(1)}
                  className="relative hidden min-h-[220px] w-[56px] shrink-0 overflow-hidden rounded-l-[20px] rounded-r-none shadow-[0_18px_40px_rgba(50,17,16,0.18)] md:block lg:h-[416px] lg:min-h-0 lg:w-[104px]"
                  style={{
                    WebkitMaskImage: "linear-gradient(to left, transparent 0%, black 58%)",
                    maskImage: "linear-gradient(to left, transparent 0%, black 58%)",
                  }}
                >
                  <PeekCard item={next} side="right" background={cardBackground} text={cardTextColor} accent={accentColor} />
                </button>
              ) : null}
            </div>

            {showArrows && count > 1 ? (
              <div className="mt-6 flex justify-center gap-3">
                <NavButton label="Previous testimonial" onClick={() => go(-1)} accent={accentColor}>
                  ‹
                </NavButton>
                <NavButton label="Next testimonial" onClick={() => go(1)} accent={accentColor}>
                  ›
                </NavButton>
              </div>
            ) : null}

            {showDots && count > 1 ? (
              <div className="mt-7 flex justify-center gap-2" role="tablist" aria-label="Choose a testimonial">
                {testimonials.map((item, i) => (
                  <button
                    key={`${item.name}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show testimonial from ${item.name}`}
                    onClick={() => setIndex(i)}
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: i === index ? 22 : 10,
                      backgroundColor: i === index ? accentColor : `${accentColor}55`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({
  item,
  cardBackground,
  cardTextColor,
  accentColor,
  quoteFontFamily,
  bodyFontFamily,
  cardRadius,
  cardPadding,
}: {
  item: TestimonialItem;
  cardBackground: string;
  cardTextColor: string;
  accentColor: string;
  quoteFontFamily?: string;
  bodyFontFamily?: string;
  cardRadius: number;
  cardPadding: number;
}) {
  const quoteMark = <QuoteIcon className="h-12 w-12" />;

  const type = bodyFontFamily ?? "var(--font-geist), system-ui, sans-serif";

  return (
    <article
      className="relative mx-auto overflow-hidden font-sans shadow-[0_20px_50px_rgba(50,17,16,0.18)]"
      style={{
        backgroundColor: cardBackground,
        color: cardTextColor,
        borderRadius: cardRadius,
        fontFamily: type,
      }}
    >
      <div className="flex min-h-[667px] w-[370px] max-w-full flex-col px-5 pb-8 pt-5 md:hidden">
        <div className="flex justify-center">
          <Portrait
            src={item.image}
            alt={item.name}
            className="h-[271px] w-[203px] rounded-[16px] object-fill"
          />
        </div>
        <div className="mt-8 flex min-w-0 flex-1 flex-col text-left">
          <div className="flex items-start gap-3">
            <QuoteIcon className="mt-0.5 h-10 w-10 shrink-0" />
            {item.role ? (
              <p className="pt-1.5 font-sans text-[16px] font-medium leading-snug tracking-normal" style={{ color: accentColor }}>
                {item.role}
              </p>
            ) : null}
          </div>
          <blockquote className="mt-5 font-sans text-[16px] font-normal leading-[1.55] tracking-normal">
            {item.quote}
          </blockquote>
          {item.rating ? <Stars rating={item.rating} accent={accentColor} /> : null}
          <p className="mt-8 font-sans text-[27px] font-semibold leading-tight tracking-normal">{item.name}</p>
        </div>
      </div>

      <div className="hidden w-full md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] md:items-stretch md:gap-x-6 md:px-6 md:py-6 lg:h-[416px] lg:w-[726px] lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-x-6 lg:px-8 lg:py-8">
        <div className="flex min-w-0 flex-col text-left">
          <span className="block">{quoteMark}</span>
          {item.role ? (
            <p className="mt-2 font-sans text-[16px] font-medium leading-none tracking-normal" style={{ color: accentColor }}>
              {item.role}
            </p>
          ) : null}
          <blockquote className="mt-3 font-sans text-[16px] font-normal leading-[1.42] tracking-normal">
            {item.quote}
          </blockquote>
          {item.rating ? <Stars rating={item.rating} accent={accentColor} /> : null}
          <p className="mt-6 font-sans text-[27px] font-semibold leading-tight tracking-normal lg:mt-auto">
            {item.name}
          </p>
        </div>
        <div className="relative min-h-[280px] w-full overflow-hidden rounded-[16px] lg:h-[332px] lg:min-h-0 lg:w-[250px]">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover lg:object-fill"
              sizes="(min-width: 1024px) 250px, 40vw"
            />
          ) : (
            <div className="h-full w-full bg-[#f2e4e0]" />
          )}
        </div>
      </div>
    </article>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className ?? "h-12 w-12"}`}
      style={{
        WebkitMaskImage: "url(/icons/bxs-quote-alt-left.png)",
        maskImage: "url(/icons/bxs-quote-alt-left.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function Portrait({ src, alt, className }: { src?: string; alt: string; className: string }) {
  if (!src) return <div className={`bg-[#f2e4e0] ${className}`} />;
  return <Image src={src} alt={alt} width={250} height={332} className={className} />;
}

function PeekCard({
  item,
  side,
  background,
  text,
  accent,
}: {
  item: TestimonialItem;
  side: "left" | "right";
  background: string;
  text: string;
  accent: string;
}) {
  if (side === "left" && item.image) {
    return (
      <span className="absolute inset-0">
        <Image src={item.image} alt="" fill className="object-cover" sizes="92px" />
      </span>
    );
  }

  return (
    <span className="absolute inset-0 flex flex-col p-3 text-left font-sans" style={{ backgroundColor: background, color: text, fontFamily: "var(--font-geist), system-ui, sans-serif" }}>
      <QuoteIcon className="h-7 w-7" />
      {item.role ? (
        <span className="mt-2 truncate text-[11px] font-medium" style={{ color: accent }}>
          {item.role}
        </span>
      ) : null}
      <span className="mt-2 line-clamp-4 text-[11px] leading-snug">{item.quote}</span>
      <span className="mt-auto truncate pt-3 text-sm font-medium">{item.name}</span>
    </span>
  );
}

function Stars({ rating, accent }: { rating: number; accent: string }) {
  const value = Math.max(0, Math.min(5, rating));
  return (
    <p className="mt-3 flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < value ? accent : `${accent}40` }} aria-hidden="true">
          ★
        </span>
      ))}
    </p>
  );
}

function NavButton({
  label,
  onClick,
  accent,
  children,
}: {
  label: string;
  onClick: () => void;
  accent: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-md"
      style={{ color: accent }}
    >
      {children}
    </button>
  );
}
