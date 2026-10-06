"use client";

import Image from "next/image";
import Link from "next/link";
import { getLegal } from "@/lib/content/legal";
import { getProductSafety } from "@/lib/content/product-safety";
import { IllustrationNote } from "@/components/IllustrationNote";
import { PriceCompare } from "@/components/PriceCompare";
import { SafetyInformationModal } from "@/components/SafetyInformationModal";

const HERO_IMAGE =
  "https://framerusercontent.com/images/NrhtVV7AHtvLc9vwJ7KBmR0a9c.png?width=1080&height=1350";

const compoundedDisclaimer =
  "Compounded medication. Not FDA approved. This medicine is prepared for you by a licensed U.S. compounding pharmacy on your prescriber's order. FDA does not review compounded medications for safety, effectiveness, or quality before they are sold. Leader Health is not a pharmacy and does not make or dispense medications. The pharmacy that fills your prescription is identified on the medication you receive.";

const blends = [
  {
    name: "Arousal Blend",
    price: "$89/mo",
    badge: "Recommended for men",
    image:
      "https://framerusercontent.com/images/QliNwzb2l6amUwHtENmnLizhoQ.png?width=1152&height=928",
    body: (
      <>
        Supports <strong>physical performance and blood flow</strong> with a personalized combination of sildenafil, oxytocin, and B12. Ideal for men looking for on-demand support when desire isn&apos;t the primary concern.
      </>
    ),
    best: ["Achieving and maintaining erections", "Physical performance support", "An affordable entry-level treatment"],
    startLabel: "Start the Arousal Blend",
    startHref: "https://products.leaderhealth.clinic/checkout?product=prod_0016ad161e63a4281e6cc27e_1",
    learnHref: "/products/sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
  },
  {
    name: "Intimacy Blend",
    price: "$299/mo",
    badge: null,
    image:
      "https://framerusercontent.com/images/yKKAJo41v9KwMJI6HoaovkDPHjM.png?width=1807&height=1212",
    body: (
      <>
        A more comprehensive treatment combining <strong>PT-141, tadalafil, and oxytocin</strong> to support both <strong>desire and physical performance</strong>. Ideal for men experiencing low libido or those looking for a longer-lasting, more spontaneous intimacy experience.
      </>
    ),
    best: ["Reduced libido or low desire", "Physical performance and arousal", "Longer-lasting spontaneity"],
    startLabel: "Start the Intimacy Blend",
    startHref:
      "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_0016ad161e63a4281e6cc27e",
    learnHref: "/products/intimacy-blend-(pt-141-oxytocin-tadalafil)",
  },
] as const;

export const menComboTrochesFaqs = [
  {
    q: "Why combine ingredients in one troche?",
    a: "Sexual response can involve both vascular and central pathways. A tailored combination may address both in a single on-demand dose. Whether that is right for you depends on labs, history, and medications.",
  },
  {
    q: "Who is this not a fit for?",
    a: "Patients with uncontrolled hypertension, certain cardiovascular histories, or nitrate use are generally not candidates. A full medication list and clearance visit are required before prescribing.",
  },
  {
    q: "How long until it works?",
    a: "Most patients use the troche before anticipated activity on the timing their provider sets. Onset varies by person and formulation.",
  },
  {
    q: "Can I take it daily?",
    a: "No. Combo troches are intended for on-demand use only. Do not exceed the frequency your prescription specifies.",
  },
  {
    q: "What side effects should I know about?",
    a: "Reported effects can include headache, flushing, nausea, and blood-pressure changes. A prolonged painful erection is rare but requires urgent medical care. Your provider reviews warning signs.",
  },
  {
    q: "Are combo troches available for women?",
    a: "They may be considered for eligible women after the same labs-first review and safety screen. Your provider determines whether a formulation fits your history and goals.",
  },
  {
    q: "What is included in the monthly subscription?",
    a: "Medication and provider access for questions or adjustments are included. Follow-up visits are scheduled when your provider needs to reassess fit or safety.",
  },
  {
    q: "How does the labs-first process work?",
    a: "Start with the $49 intake, which includes the Complete Panel and a clearance visit. Cardiovascular, blood-pressure, and medication review are part of the screen.",
  },
  {
    q: "Is there a commitment?",
    a: "Therapy has a three-month minimum so your provider can adjust if needed. After month three, you can cancel anytime.",
  },
  {
    q: "Do you accept insurance?",
    a: "Leader Health does not accept insurance. Our membership model is designed to keep care simple, transparent, and accessible — with clear pricing and no surprise bills.",
  },
  {
    q: "Can I use my HSA or FSA?",
    a: "Yes — FSA and HSA cards are accepted. It's a great way to put your pre-tax health dollars to work on care that's actually built around you.",
  },
  {
    q: "What if I have another questions?",
    a: "Email us at help@leaderhealth.com with more questions.",
  },
];

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
  const className = `flex h-[46px] items-center justify-between gap-3 rounded-[14px] px-5 text-[13px] font-semibold tracking-[0.1em] text-[#331110] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
    tone === "solid" ? "bg-[#dcd4bd] hover:bg-[#efe6d6]" : "bg-[rgba(242,198,195,0.76)] hover:bg-[rgba(255,230,228,0.92)]"
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

export function MenComboTroches() {
  const safetySections = getProductSafety("men-sexual-health-combo-troches");

  return (
    <SafetyInformationModal
      sections={safetySections ?? getLegal("important-safety-information")?.sections ?? []}
    >
      {(trigger) => (
        <>
          <section className="bg-[linear-gradient(339deg,#e43d4e_0%,#331110_100%)] px-[15px] pt-28 pb-20 text-white sm:px-6 lg:pt-32 lg:pb-24">
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

              <div className="rounded-[28px] border border-white/25 bg-white/10 px-6 py-7 shadow-[0_22px_50px_-18px_rgba(51,17,16,0.45)] backdrop-blur-xl sm:px-8 sm:py-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-[#f7f3f4]">
                    <span>4.8</span>
                    <Stars />
                    <span className="sr-only">4.8 out of 5 stars</span>
                  </p>
                  <span className="pt-0.5 text-[11px] font-medium tracking-[0.14em] text-white/85 uppercase">
                    HSA / FSA
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px] text-white">Sexual Health</span>
                  <span className="rounded-full bg-[#2a1212]/55 px-3 py-1 text-[11px] text-white">Medication</span>
                </div>
                <h1 className="mt-3 font-geist text-[40px] leading-none font-semibold tracking-[-0.04em]">
                  Combo Troches
                </h1>
                <p className="mt-4 font-serif-italic text-[12px] leading-relaxed text-white/88">{compoundedDisclaimer}</p>
                <div className="mt-5 space-y-4 text-[15px] leading-6 font-light text-[#f7f3f4] [&_strong]:font-semibold">
                  <p>
                    <strong>Personalized support for desire, arousal, and intimacy.</strong> Our custom-compounded combo troches are designed to support men&apos;s sexual wellness with provider-guided treatment tailored to your needs. For most men seeking <strong>physical performance support</strong>, we recommend our <strong>Arousal Troche</strong>, which combines sildenafil, oxytocin, and B12 for on-demand support. If reduced desire or libido is also part of the picture, your licensed provider may recommend our more comprehensive <strong>Intimacy Blend</strong> instead.
                  </p>
                  <p>
                    <strong>Start with our Arousal Troche at $89/month.</strong>
                  </p>
                </div>
                <a
                  href="#find-what-fits"
                  onClick={(event) => {
                    const section = document.getElementById("find-what-fits");
                    if (!section) return;
                    event.preventDefault();
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                    history.pushState(null, "", "#find-what-fits");
                  }}
                  className="mt-8 flex h-[57px] w-full items-center justify-center rounded-[12px] bg-[#dbd3bc] text-[16px] font-medium tracking-normal text-[#331110] uppercase transition-colors duration-200 hover:bg-[#efe6d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
                >
                  Choose treatment
                </a>
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

          <section id="find-what-fits" className="scroll-mt-0 bg-[linear-gradient(232deg,#f27374_-13%,#492f2b_46%,#32120e_108%)] px-[15px] pt-10 pb-16 text-white sm:px-6 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24">
            <div className="mx-auto max-w-[1000px]">
              <h2 className="text-center font-geist text-[40px] leading-none font-medium tracking-normal text-[#f7f3f4] sm:text-[44px]">
                Find What <span className="font-serif-italic text-[#dcd4bd]">Fits</span> You
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-center text-[16px] leading-relaxed text-[#f7f3f4]">
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
                      className="object-cover brightness-[0.78] saturate-[0.62] transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      sizes="(max-width: 1024px) 100vw, 480px"
                    />
                    <div className="absolute inset-0 bg-[#32120e]/35" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#32120e]/30 via-[#6a3434]/28 to-[#c45a62]/55" />
                    <div className="relative flex flex-1 flex-col">
                      {blend.badge ? (
                        <p className="w-fit rounded-full bg-[#dcd4bd] px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#331110] uppercase">
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
                        <BlendLink href={blend.startHref} label={blend.startLabel} external tone="solid" />
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
