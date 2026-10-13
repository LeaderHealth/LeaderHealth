import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { GET_STARTED_URL } from "@/lib/content/site";

const intimacyImage =
  "https://framerusercontent.com/images/ntNnrXlKONfgOvYhVoBLrqDAuo.png?width=2230&height=1796";
const arousalImage =
  "https://framerusercontent.com/images/fPt1kPTjO7NFkRQolR18SbAMU.png?width=1821&height=1467";

const intimacyHref = "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)";
const arousalHref = "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)";

type RecommendedProductsProps = {
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
  blendName,
  headline,
  description,
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
  blendName: string;
  headline: string;
  description: ReactNode;
  benefits: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <article className="relative flex min-h-[600px] w-full flex-col overflow-hidden rounded-[26px]">
      <Image src={image} alt={imageAlt} fill className="object-cover" sizes="(min-width: 1024px) 466px, 100vw" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,16,18,0.62)_0%,rgba(42,16,18,0.16)_40%,rgba(176,64,78,0.42)_70%,rgba(150,42,58,0.82)_100%)]"
      />
      <div className="relative flex flex-1 flex-col p-[22px] sm:p-6 lg:p-7">
        {badgeVisible ? (
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#E7A0A8] px-3.5 py-2 font-sans text-[11px] font-semibold tracking-[0.14em] text-[#331110] uppercase">
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
            Best for
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

export function RecommendedProducts({
  eyebrow = "Sexual health",
  title = (
    <>
      Find What <span className="font-serif-italic">Fits</span> You
    </>
  ),
  subtitle = "Personalized support for performance, arousal, and intimacy. Your licensed provider will determine the formula that's right for you.",
  card1Image = intimacyImage,
  card1ImageAlt = "Woman stretching on a yoga mat in a bright room",
  card1BadgeLabel = "Recommended for Women",
  card1BadgeVisible = true,
  card1BlendName = "Intimacy Blend",
  card1Headline = "$299/mo",
  card1Description = (
    <>
      Supports <strong>desire, arousal, and intimacy</strong> in one personalized treatment. Ideal for women
      experiencing low libido, reduced desire, or changes in sexual wellness who want a comprehensive solution.
    </>
  ),
  card1Benefit1 = "Low libido or reduced desire",
  card1Benefit2 = "Physical arousal support",
  card1Benefit3 = "Longer-lasting spontaneity",
  card1PrimaryButtonLabel = "Start the Intimacy Blend",
  card1PrimaryButtonUrl = GET_STARTED_URL,
  card1SecondaryButtonLabel = "Learn More",
  card1SecondaryButtonUrl = intimacyHref,
  card2Image = arousalImage,
  card2ImageAlt = "Couple resting together in bed",
  card2BadgeLabel = "Recommended for Men",
  card2BadgeVisible = false,
  card2BlendName = "Arousal Blend",
  card2Headline = "$89/mo",
  card2Description = (
    <>
      A more affordable option focused on <strong>physical arousal and sensation</strong>. Best for women whose desire
      is already present but who are looking for additional physical support during intimacy.
    </>
  ),
  card2Benefit1 = "Physical arousal support",
  card2Benefit2 = "Enhanced sensation",
  card2Benefit3 = "Entry-level treatment option",
  card2PrimaryButtonLabel = "Start the Arousal Blend",
  card2PrimaryButtonUrl = GET_STARTED_URL,
  card2SecondaryButtonLabel = "Learn More",
  card2SecondaryButtonUrl = arousalHref,
}: RecommendedProductsProps) {
  const cards = [
    {
      image: card1Image,
      imageAlt: card1ImageAlt,
      badgeLabel: card1BadgeLabel,
      badgeVisible: card1BadgeVisible,
      blendName: card1BlendName,
      headline: card1Headline,
      description: card1Description,
      benefits: [card1Benefit1, card1Benefit2, card1Benefit3],
      primaryLabel: card1PrimaryButtonLabel,
      primaryHref: card1PrimaryButtonUrl,
      secondaryLabel: card1SecondaryButtonLabel,
      secondaryHref: card1SecondaryButtonUrl,
    },
    {
      image: card2Image,
      imageAlt: card2ImageAlt,
      badgeLabel: card2BadgeLabel,
      badgeVisible: card2BadgeVisible,
      blendName: card2BlendName,
      headline: card2Headline,
      description: card2Description,
      benefits: [card2Benefit1, card2Benefit2, card2Benefit3],
      primaryLabel: card2PrimaryButtonLabel,
      primaryHref: card2PrimaryButtonUrl,
      secondaryLabel: card2SecondaryButtonLabel,
      secondaryHref: card2SecondaryButtonUrl,
    },
  ];

  return (
    <section className="bg-[linear-gradient(180deg,#f1848b_0%,#e96b76_46%,#e45060_100%)] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto w-full max-w-[1110px]">
        <p className="inline-flex rounded-full bg-[#F6EFE4] px-3 py-1.5 font-sans text-[11px] font-medium tracking-[0.14em] text-[#331110] uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-6 text-center font-geist text-[clamp(36px,5vw,56px)] leading-[1.05] font-medium text-[#2A1214]">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-[720px] text-center font-sans text-[15px] leading-relaxed text-[#F8F1EA] sm:text-[17px]">
          {subtitle}
        </p>
        <div className="mx-auto mt-10 grid w-full max-w-[960px] grid-cols-1 gap-5 min-[1024px]:grid-cols-2 min-[1024px]:gap-6 lg:mt-12">
          {cards.map((card) => (
            <ProductCard key={card.blendName} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
