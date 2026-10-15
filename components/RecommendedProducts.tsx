import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getProduct } from "@/lib/content/products";

const intimacyImage = "/images/intimacy-blend-card.png";
const arousalImage = "/images/arousal-blend-card.png";

const intimacySlug = "intimacy-blend-(pt-141-oxytocin-tadalafil)";
const arousalSlug = "sildenafil-combo-troche-(sildenafil-oxytocin-b12)";

function productHref(slug: string) {
  return `/products/${slug}`;
}

function checkoutHref(slug: string) {
  const id = getProduct(slug)?.clientProductId;
  if (!id) return productHref(slug);
  return `https://products.leaderhealth.clinic/checkout?product=${encodeURIComponent(id)}`;
}

type RecommendedTone = "women" | "men";

type RecommendedProductsProps = {
  tone?: RecommendedTone;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: string;
  card1Image?: string;
  card1ImageAlt?: string;
  card1BadgeLabel?: string;
  card1BadgeVisible?: boolean;
  card1BlendName?: string;
  card1Headline?: string;
  card1Description?: ReactNode;
  card1Label?: string;
  card1Benefit1?: string;
  card1Benefit2?: string;
  card1Benefit3?: string;
  card1PrimaryButtonLabel?: string;
  card1PrimaryButtonUrl?: string;
  card1SecondaryButtonLabel?: string;
  card1SecondaryButtonUrl?: string;
  card2Image?: string;
  card2ImageAlt?: string;
  card2BadgeLabel?: string;
  card2BadgeVisible?: boolean;
  card2BlendName?: string;
  card2Headline?: string;
  card2Description?: ReactNode;
  card2Label?: string;
  card2Benefit1?: string;
  card2Benefit2?: string;
  card2Benefit3?: string;
  card2PrimaryButtonLabel?: string;
  card2PrimaryButtonUrl?: string;
  card2SecondaryButtonLabel?: string;
  card2SecondaryButtonUrl?: string;
};

function CardLink({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "primary" | "secondary";
}) {
  const className = `group relative flex h-[46px] w-full items-center justify-center rounded-[14px] px-5 text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
    tone === "primary"
      ? "bg-[#dcd4bd] text-[#331110] hover:bg-[#32120E] hover:text-[#F7F3F5] focus-visible:bg-[#32120E] focus-visible:text-[#F7F3F5]"
      : "bg-[rgba(242,198,195,0.76)] text-[#2e1b16] hover:bg-[#32120E] hover:text-[#F7F3F5] focus-visible:bg-[#32120E] focus-visible:text-[#F7F3F5]"
  }`;
  const content = (
    <>
      <span>{label}</span>
      <span aria-hidden className="absolute right-5">
        →
      </span>
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function ProductCard({
  image,
  imageAlt,
  badgeLabel,
  badgeVisible,
  badgeClassName,
  frameClassName,
  overlayClassName,
  blendName,
  headline,
  description,
  label,
  benefits,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  image: string;
  imageAlt: string;
  badgeLabel: string;
  badgeVisible: boolean;
  badgeClassName: string;
  frameClassName: string;
  overlayClassName: string;
  blendName: string;
  headline: string;
  description: ReactNode;
  label: string;
  benefits: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <article className="relative flex min-h-[600px] w-full flex-col overflow-hidden rounded-[26px]">
      <Image src={image} alt={imageAlt} fill className="object-cover object-center" sizes="(min-width: 1024px) 466px, 100vw" />
      <div aria-hidden className={`absolute inset-0 ${overlayClassName}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-0 z-10 rounded-[26px] ${frameClassName}`} />
      <div className="relative z-20 flex flex-1 flex-col p-[22px] sm:p-6 lg:p-7">
        {badgeVisible ? (
          <p className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 font-sans text-[11px] font-semibold tracking-[0.14em] text-[#331110] uppercase ${badgeClassName}`}>
            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden>
              <path
                d="M8 1.4 9.7 5.6l4.6.4-3.5 3 .9 4.5L8 11.4 4.3 13.5l.9-4.5-3.5-3 4.6-.4L8 1.4Z"
                fill="currentColor"
              />
            </svg>
            {badgeLabel}
          </p>
        ) : (
          <span className="hidden h-8 min-[1024px]:block" aria-hidden />
        )}
        <div className="mt-8 flex flex-1 flex-col">
          <h3
            className="text-[clamp(26px,3vw,32px)] leading-none text-[#F7F3F5] uppercase"
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              fontStyle: "normal",
              fontWeight: 400,
              letterSpacing: "0.06em",
            }}
          >
            {blendName}
          </h3>
          <p className="mt-3 font-sans text-[clamp(26px,3vw,32px)] leading-none font-medium text-[#FDFCF8]">
            {headline}
          </p>
          <p className="mt-4 max-w-[34rem] font-sans text-[15px] leading-[1.55] text-[#FDFCF8] [&_strong]:font-semibold">
            {description}
          </p>
          <p className="mt-6 font-sans text-[11px] font-semibold tracking-[0.14em] text-[#FDFCF8]/70 uppercase">
            {label}
          </p>
          <ul className="mt-1">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 border-b border-white/35 py-2.5 font-sans text-[14px] text-[#FDFCF8]"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-[#E7D3B0]" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <CardLink href={primaryHref} label={primaryLabel} tone="primary" />
            <CardLink href={secondaryHref} label={secondaryLabel} tone="secondary" />
          </div>
        </div>
      </div>
    </article>
  );
}

const womenPreset = {
  eyebrow: "Sexual health",
  title: (
    <>
      Find What <span className="font-serif-italic">Fits</span> You
    </>
  ),
  subtitle: "Personalized support for performance, arousal, and intimacy. Your licensed provider will determine the formula that's right for you.",
  card1Image: intimacyImage,
  card1ImageAlt: "Woman holding a lunge on a yoga mat in a bright room",
  card1BadgeLabel: "Recommended for Women",
  card1BadgeVisible: true,
  card1BlendName: "Intimacy Blend",
  card1Headline: "$299/mo",
  card1Description: (
    <>
      Supports <strong>desire, arousal, and intimacy</strong> in one personalized treatment. Ideal for women
      experiencing low libido, reduced desire, or changes in sexual wellness who want a comprehensive solution.
    </>
  ),
  card1Label: "Best for",
  card1Benefit1: "Low libido or reduced desire",
  card1Benefit2: "Physical arousal support",
  card1Benefit3: "Longer-lasting spontaneity",
  card1PrimaryButtonLabel: "Start the Intimacy Blend",
  card1PrimaryButtonUrl: checkoutHref(intimacySlug),
  card1SecondaryButtonLabel: "Learn More",
  card1SecondaryButtonUrl: productHref(intimacySlug),
  card2Image: arousalImage,
  card2ImageAlt: "Couple resting together in bed",
  card2BadgeLabel: "Recommended for Men",
  card2BadgeVisible: false,
  card2BlendName: "Arousal Blend",
  card2Headline: "$89/mo",
  card2Description: (
    <>
      A more affordable option focused on <strong>physical arousal and sensation</strong>. Best for women whose desire
      is already present but who are looking for additional physical support during intimacy.
    </>
  ),
  card2Label: "Best for",
  card2Benefit1: "Physical arousal support",
  card2Benefit2: "Enhanced sensation",
  card2Benefit3: "Entry-level treatment option",
  card2PrimaryButtonLabel: "Start the Arousal Blend",
  card2PrimaryButtonUrl: checkoutHref(arousalSlug),
  card2SecondaryButtonLabel: "Learn More",
  card2SecondaryButtonUrl: productHref(arousalSlug),
};

const menArousalImage = "/images/men-arousal-blend-card.png";
const menIntimacyImage = "/images/men-intimacy-blend-card.png";

const menPreset = {
  eyebrow: "Sexual health",
  title: (
    <>
      Find What <span className="font-serif-italic text-[#dcd4bd]">Fits</span> You
    </>
  ),
  subtitle: "Personalized support for performance, arousal, and intimacy. Your licensed provider will determine the formula that's right for you.",
  card1Image: menArousalImage,
  card1ImageAlt: "Man in a red shirt standing with his arms crossed in a living room",
  card1BadgeLabel: "Recommended for Men",
  card1BadgeVisible: true,
  card1BlendName: "Arousal Blend",
  card1Headline: "$89/mo",
  card1Description: (
    <>
      Supports <strong>physical performance and blood flow</strong> with a personalized combination of sildenafil,
      oxytocin, and B12. Ideal for men looking for on-demand support when desire isn&apos;t the primary concern.
    </>
  ),
  card1Label: "Best for",
  card1Benefit1: "Achieving and maintaining erections",
  card1Benefit2: "Physical performance support",
  card1Benefit3: "An affordable entry-level treatment",
  card1PrimaryButtonLabel: "Start the Arousal Blend",
  card1PrimaryButtonUrl: checkoutHref(arousalSlug),
  card1SecondaryButtonLabel: "Learn More",
  card1SecondaryButtonUrl: productHref(arousalSlug),
  card2Image: menIntimacyImage,
  card2ImageAlt: "Couple smiling together while holding a mug in a kitchen",
  card2BadgeLabel: "For Women",
  card2BadgeVisible: false,
  card2BlendName: "Intimacy Blend",
  card2Headline: "$299/mo",
  card2Description: (
    <>
      A more comprehensive treatment combining <strong>PT-141, tadalafil, and oxytocin</strong> to support both{" "}
      <strong>desire and physical performance</strong>. Ideal for men experiencing low libido or those looking for a
      longer-lasting, more spontaneous intimacy experience.
    </>
  ),
  card2Label: "Best for",
  card2Benefit1: "Reduced libido or low desire",
  card2Benefit2: "Physical performance and arousal",
  card2Benefit3: "Longer-lasting spontaneity",
  card2PrimaryButtonLabel: "Start the Intimacy Blend",
  card2PrimaryButtonUrl: checkoutHref(intimacySlug),
  card2SecondaryButtonLabel: "Learn More",
  card2SecondaryButtonUrl: productHref(intimacySlug),
};

export function RecommendedProducts({ tone = "women", ...overrides }: RecommendedProductsProps) {
  const preset = tone === "men" ? menPreset : womenPreset;
  const content = { ...preset };
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && key in content) {
      (content as Record<string, unknown>)[key] = value;
    }
  }
  const dark = tone === "men";
  const cards = [
    {
      image: content.card1Image,
      imageAlt: content.card1ImageAlt,
      badgeLabel: content.card1BadgeLabel,
      badgeVisible: content.card1BadgeVisible,
      blendName: content.card1BlendName,
      headline: content.card1Headline,
      description: content.card1Description,
      label: content.card1Label,
      benefits: [content.card1Benefit1, content.card1Benefit2, content.card1Benefit3],
      primaryLabel: content.card1PrimaryButtonLabel,
      primaryHref: content.card1PrimaryButtonUrl,
      secondaryLabel: content.card1SecondaryButtonLabel,
      secondaryHref: content.card1SecondaryButtonUrl,
      badgeClassName: dark ? "bg-[#dcd4bd]" : "bg-[#E7A0A8]",
      frameClassName: "",
      overlayClassName: dark
        ? "bg-[linear-gradient(180deg,rgba(46,27,22,0.66)_0%,rgba(46,27,22,0.3)_38%,rgba(169,39,33,0.66)_70%,rgba(228,61,78,0.94)_100%)]"
        : "bg-[linear-gradient(180deg,rgba(42,16,18,0.62)_0%,rgba(42,16,18,0.16)_40%,rgba(176,64,78,0.42)_70%,rgba(150,42,58,0.82)_100%)]",
    },
    {
      image: content.card2Image,
      imageAlt: content.card2ImageAlt,
      badgeLabel: content.card2BadgeLabel,
      badgeVisible: content.card2BadgeVisible,
      blendName: content.card2BlendName,
      headline: content.card2Headline,
      description: content.card2Description,
      label: content.card2Label,
      benefits: [content.card2Benefit1, content.card2Benefit2, content.card2Benefit3],
      primaryLabel: content.card2PrimaryButtonLabel,
      primaryHref: content.card2PrimaryButtonUrl,
      secondaryLabel: content.card2SecondaryButtonLabel,
      secondaryHref: content.card2SecondaryButtonUrl,
      badgeClassName: dark ? "bg-[#dcd4bd]" : "bg-[#E7A0A8]",
      frameClassName: dark ? "shadow-[inset_0_0_0_1px_rgba(253,252,248,0.14)]" : "",
      overlayClassName: dark
        ? "bg-[linear-gradient(180deg,rgba(46,27,22,0.66)_0%,rgba(46,27,22,0.3)_38%,rgba(169,39,33,0.66)_70%,rgba(228,61,78,0.94)_100%)]"
        : "bg-[linear-gradient(180deg,rgba(42,16,18,0.62)_0%,rgba(42,16,18,0.16)_40%,rgba(176,64,78,0.42)_70%,rgba(150,42,58,0.82)_100%)]",
    },
  ];

  return (
    <section
      className={
        dark
          ? "bg-[linear-gradient(232deg,#f27374_-13%,#492f2b_46%,#32120e_108%)] px-5 pt-[30px] pb-[58px] sm:px-8"
          : "bg-[linear-gradient(180deg,#f1848b_0%,#e96b76_46%,#e45060_100%)] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24"
      }
    >
      <div className="mx-auto flex w-full max-w-[1110px] flex-col items-center">
        <p
          className={`inline-flex self-start rounded-full px-3 py-1.5 font-sans text-[11px] font-medium tracking-[0.14em] text-[#331110] uppercase ${dark ? "bg-[#ddd3be]" : "bg-[#F6EFE4]"}`}
        >
          {content.eyebrow}
        </p>
        <h2
          className={`mt-6 text-center font-geist leading-[1.05] font-medium ${dark ? "text-[32px] text-[#F7F3F4] sm:text-[40px]" : "text-[clamp(36px,5vw,56px)] text-[#2A1214]"}`}
        >
          {content.title}
        </h2>
        <p
          className={`mx-auto mt-4 max-w-[720px] text-center font-sans leading-relaxed ${dark ? "text-[16px] font-light text-[#F7F3F4] sm:text-[18px]" : "text-[15px] text-[#F8F1EA] sm:text-[17px]"}`}
        >
          {content.subtitle}
        </p>
        <div
          className={
            dark
              ? "mx-auto mt-8 grid w-full max-w-[952px] grid-cols-1 gap-5 min-[760px]:grid-cols-2"
              : "mx-auto mt-10 grid w-full max-w-[960px] grid-cols-1 gap-5 min-[1024px]:grid-cols-2 min-[1024px]:gap-6 lg:mt-12"
          }
        >
          {cards.map((card) => (
            <ProductCard key={card.blendName} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
