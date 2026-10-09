"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { cartItemFromSlug } from "@/lib/cart/items";
import { getLegal } from "@/lib/content/legal";
import { getProductSafety } from "@/lib/content/product-safety";
import { HsaFsaBadge } from "@/components/HsaFsaBadge";
import { IllustrationNote } from "@/components/IllustrationNote";
import { ChooseTreatmentButton } from "@/components/ProductHeroCta";
import { PriceCompare } from "@/components/PriceCompare";
import { SafetyInformationModal } from "@/components/SafetyInformationModal";

const HERO_IMAGE =
  "https://framerusercontent.com/images/NrhtVV7AHtvLc9vwJ7KBmR0a9c.png?width=1080&height=1350";

const compoundedDisclaimer =
  "Compounded medication. Not FDA approved. This medicine is prepared for you by a licensed U.S. compounding pharmacy on your prescriber's order. FDA does not review compounded medications for safety, effectiveness, or quality before they are sold. Leader Health is not a pharmacy and does not make or dispense medications. The pharmacy that fills your prescription is identified on the medication you receive.";

const blends = [
  {
    name: "Intimacy Blend",
    price: "$299/mo",
    badge: "Recommended for women",
    image:
      "https://framerusercontent.com/images/ntNnrXlKONfgOvYhVoBLrqDAuo.png?width=2230&height=1796",
    body: (
      <>
        Supports <strong>desire, arousal, and intimacy</strong> in one personalized treatment. Ideal for women experiencing low libido, reduced desire, or changes in sexual wellness who want a comprehensive solution.
      </>
    ),
    best: ["Low libido or reduced desire", "Physical arousal support", "Longer-lasting spontaneity"],
    startLabel: "Start the Intimacy Blend",
    slug: "intimacy-blend-(pt-141-oxytocin-tadalafil)",
    learnHref: "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)",
  },
  {
    name: "Arousal Blend",
    price: "$89/mo",
    badge: null,
    image:
      "https://framerusercontent.com/images/fPt1kPTjO7NFkRQolR18SbAMU.png?width=1821&height=1467",
    body: (
      <>
        A more affordable option focused on <strong>physical arousal and sensation</strong>. Best for women whose desire is already present but who are looking for additional physical support during intimacy.
      </>
    ),
    best: ["Physical arousal support", "Enhanced sensation", "Entry-level treatment option"],
    startLabel: "Start the Arousal Blend",
    slug: "sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
    learnHref: "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
  },
] as const;

const benefits = [
  {
    title: "Discreet, on-demand",
    body: "Prescribed only after your provider determines the right combination for you.",
  },
  {
    title: "Multi-pathway review",
    body: "A sublingual troche is taken before activity without an injection or nasal spray.",
  },
  {
    title: "Provider-tailored",
    body: "Formulated to your exact needs by your clinician.",
  },
];

function Stars() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="relative inline-block h-[18px] w-[18px] shrink-0">
          <svg viewBox="0 0 24 24" className="h-full w-full">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill="#e43d4e"
              opacity={index === 4 ? 0.35 : 1}
            />
          </svg>
          {index === 4 ? (
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full" style={{ clipPath: "inset(0 20% 0 0)" }}>
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill="#e43d4e"
              />
            </svg>
          ) : null}
        </span>
      ))}
    </span>
  );
}

function BlendAddButton({ slug, label }: { slug: string; label: string }) {
  const { addItem } = useCart();
  const item = cartItemFromSlug(slug);
  if (!item) return null;
  return (
    <button
      type="button"
      onClick={() => addItem(item)}
      className="flex h-[46px] w-full items-center justify-between gap-3 rounded-[14px] bg-[#dcd4bd] px-5 text-[13px] font-semibold tracking-[0.1em] text-[#331110] uppercase transition-colors duration-200 hover:bg-[#efe6d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
    >
      <span>{label}</span>
      <span aria-hidden>→</span>
    </button>
  );
}

function BlendLink({
  href,
  label,
  external,
  tone,
}: {
  href: string;
  label: string;
  external?: boolean;
  tone: "solid" | "glass";
}) {
  const className = `flex h-[46px] items-center justify-between gap-3 rounded-[14px] px-5 text-[13px] font-semibold tracking-[0.1em] text-[#2e1b16] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
    tone === "solid" ? "bg-[#dcd4bd] hover:bg-[#efe8d4]" : "bg-[rgba(242,198,195,0.76)] hover:bg-[rgba(255,230,228,0.92)]"
  }`;
  const content = (
    <>
      <span>{label}</span>
      <span aria-hidden>→</span>
    </>
  );
  if (external) {
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

export function WomenComboTroches() {
  const safetySections = getProductSafety("women-sexual-health-combo-troches");

  return (
    <SafetyInformationModal
      sections={safetySections ?? getLegal("important-safety-information")?.sections ?? []}
    >
      {(trigger) => (
        <>
          <section className="bg-[linear-gradient(180deg,#f37477_0%,#e9989f_100%)] px-[15px] pt-28 pb-20 text-white sm:px-6 lg:pt-32 lg:pb-24">
            <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,493px)] lg:gap-16 xl:gap-24">
              <div className="flex flex-col items-center">
                <Image
                  src={HERO_IMAGE}
                  alt="Compounded arousal blend and intimacy blend troches dispensed by a licensed compounding pharmacy"
                  width={1080}
                  height={1350}
                  priority
                  className="h-auto w-full max-w-[420px] object-contain lg:max-w-[460px]"
                  sizes="(max-width: 1024px) 80vw, 460px"
                />
                <IllustrationNote />
              </div>

              <div className="rounded-[28px] border border-white/30 bg-white/14 px-6 py-7 shadow-[0_22px_50px_-18px_rgba(51,17,16,0.28)] backdrop-blur-xl sm:px-8 sm:py-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#f7f3f4]">
                    <span>4.8</span>
                    <Stars />
                    <span className="sr-only">4.8 out of 5 stars</span>
                  </p>
                  <HsaFsaBadge />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#2a1212]/45 px-3 py-1 text-[11px] text-white">Sexual Health</span>
                  <span className="rounded-full bg-[#2a1212]/45 px-3 py-1 text-[11px] text-white">Medication</span>
                </div>
                <h1 className="mt-3 font-geist text-[40px] leading-none font-semibold tracking-[-0.04em]">
                  Combo Troches
                </h1>
                <p className="mt-4 font-serif-italic text-[12px] leading-relaxed text-white/88">{compoundedDisclaimer}</p>
                <div className="mt-5 space-y-4 text-[15px] leading-6 font-light text-[#f7f3f4] [&_strong]:font-semibold">
                  <p>
                    <strong>Personalized support for desire, arousal, and intimacy.</strong> Our custom-compounded combo troches are designed to support women&apos;s sexual wellness with provider-guided treatment tailored to your needs. For most women, we recommend our <strong>Intimacy Blend</strong>, which combines PT-141, tadalafil, and oxytocin to support both desire and physical arousal in a single treatment. Your licensed provider will determine the formula that&apos;s right for you.
                  </p>
                  <p>
                    <strong>Starting at $89/month. Recommended Intimacy Blend: $229/month.</strong>
                  </p>
                </div>
                <ChooseTreatmentButton
                  href="#find-what-fits"
                  className="mt-8"
                  onClick={(event) => {
                    const section = document.getElementById("find-what-fits");
                    if (!section) return;
                    event.preventDefault();
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                    history.pushState(null, "", "#find-what-fits");
                  }}
                />
                {trigger}
              </div>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-10 text-center sm:mt-20 lg:mt-24 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit.title}>
                  <h2 className="font-geist text-[18px] font-semibold !tracking-[0.03em] text-[#f7f3f4]">{benefit.title}</h2>
                  <p className="mx-auto mt-2 max-w-[220px] text-[14px] leading-relaxed text-[#f7f3f4]/85">{benefit.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="find-what-fits" className="scroll-mt-0 bg-white px-[15px] pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
            <div className="mx-auto max-w-[1000px]">
              <h2 className="text-center font-geist text-[40px] leading-none font-medium tracking-normal text-[#331110] sm:text-[44px]">
                Find What <span className="font-serif-italic text-[#e43d4e]">Fits</span> You
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-center text-[16px] leading-relaxed text-[#331110]">
                Personalized support for performance, arousal, and intimacy. Your licensed provider will determine the formula that&apos;s right for you.
              </p>
              <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-2">
                {blends.map((blend) => (
                  <article
                    key={blend.name}
                    className="group relative flex min-h-[520px] flex-col overflow-hidden rounded-[28px] p-6 text-white sm:min-h-[580px] sm:p-8"
                  >
                    <Image
                      src={blend.image}
                      alt=""
                      fill
                      className="object-cover brightness-[0.72] saturate-[0.55] transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      sizes="(max-width: 1024px) 100vw, 480px"
                    />
                    <div className="absolute inset-0 bg-[#3a2426]/50" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#331110]/40 via-[#5c3034]/35 to-[#b85a64]/55" />
                    <div className="relative flex flex-1 flex-col">
                      {blend.badge ? (
                        <p className="w-fit rounded-full bg-[#e98591] px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#331110] uppercase">
                          ★ {blend.badge}
                        </p>
                      ) : (
                        <span className="h-[29px]" aria-hidden />
                      )}
                      <h3 className="mt-8 font-serif-italic text-[29px] leading-none font-normal !tracking-[0.074em] text-[#f7f3f4] uppercase">
                        {blend.name}
                      </h3>
                      <p className="mt-3 font-geist text-[29px] leading-none font-medium tracking-[-0.025em] text-[#fdfcf8]">
                        {blend.price}
                      </p>
                      <p className="mt-4 max-w-md text-[15px] leading-[1.55] text-[#fdfcf8] [&_strong]:font-semibold">{blend.body}</p>
                      <p className="mt-6 text-[11px] font-semibold tracking-[0.14em] text-[#fdfcf8]/60 uppercase">Best for</p>
                      <ul className="mt-2">
                        {blend.best.map((item) => (
                          <li key={item} className="border-b border-white/35 py-2.5 text-[14px] text-[#fdfcf8]">
                            <span className="mr-2" aria-hidden>
                              •
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-col gap-3 pt-8">
                        <BlendAddButton slug={blend.slug} label={blend.startLabel} />
                        <BlendLink href={blend.learnHref} label="Learn More" tone="glass" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <PriceCompare />
        </>
      )}
    </SafetyInformationModal>
  );
}
