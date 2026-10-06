"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { GET_STARTED_URL } from "@/lib/content/site";
import { getLegal } from "@/lib/content/legal";
import { getProductSafety } from "@/lib/content/product-safety";
import { PriceCompare } from "@/components/PriceCompare";
import { SafetyInformationModal } from "@/components/SafetyInformationModal";
import { IconHoverButton } from "@/components/IconHoverButton";
import { IllustrationNote } from "@/components/IllustrationNote";

const HERO_IMAGE =
  "https://framerusercontent.com/images/NNkqjkjcButh0STKbHYnciyEKA.png?width=1000&height=1119";
const LIFESTYLE_IMAGE =
  "https://framerusercontent.com/images/fXdgvQ4jAyAXXNvdduQOz4TVZgY.png?width=1122&height=1402";

const treatments = [
  {
    title: "Estradiol",
    body: "Oral estrogen to ease hot flashes, night sweats, and mood changes.",
    image: "https://framerusercontent.com/images/QccXzfEABySUc3i2VF7w6EqClI.png?width=1080&height=1080",
    links: [
      {
        label: "Start with pill",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_4f6c68b97e6447cf8869b3dc",
      },
      {
        label: "Start with patch",
        href: "https://products.leaderhealth.clinic/checkout?product=prod_4f6c68b97e6447cf8869b3dc_1",
      },
    ],
  },
  {
    title: "Testosterone",
    body: "Supports libido, energy, and muscle tone.",
    image: "https://framerusercontent.com/images/KKe4pkm8YcnNTtXupD23fO0xUY.png?width=926&height=854",
    links: [
      {
        label: "Start with cream",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_6iIhc7giORvkHheSgDLi",
      },
      {
        label: "Start with injection",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_bf762c10c31501cffa97b613",
      },
    ],
  },
  {
    title: "Vaginal Estrogen",
    body: "Relief for dryness, discomfort, and pain during sex.",
    image: "https://framerusercontent.com/images/GG6wBKk214mEUH5k4M0ygcFWD4.png?width=683&height=406",
    links: [
      {
        label: "Start with suppository",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_838073b1b57336246da98f60",
      },
      {
        label: "Start with cream",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_4c65ccba2e29c45050817b74",
      },
    ],
  },
  {
    title: "Progesterone (oral)",
    body: "Balances estrogen and supports better sleep and mood stability.",
    image: "https://framerusercontent.com/images/PxzYFazSndzX1KNPYIo8nHuFy5w.png?width=681&height=465",
    links: [
      {
        label: "Start with capsule",
        href: "https://products.leaderhealth.clinic/checkout?product=lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_iZT4cfCiDcwOkqT3TCLg",
      },
    ],
  },
] as const;

const stats = [
  { value: 68, label: "Reported fewer hot flashes and night sweats" },
  { value: 47, label: "noticed improved mood and reduced anxiety" },
  { value: 41, label: "reported better mental clarity and focus" },
] as const;

const symptomGroups = [
  {
    title: "Emotional Symptoms",
    items: ["Anxiety", "Mood Swings", "Depression", "Irritability", "Brain Fog", "Skin/Hair Changes", "Achy Joints"],
    icon: "mood",
  },
  {
    title: "Hormonal Symptoms",
    items: ["Change In Cycle Length", "PMS", "Low Libido"],
    icon: "hormone",
  },
  {
    title: "Physical Symptoms",
    items: ["Hot Flashes", "Night Sweats", "Vaginal Dryness", "Skin/Hair Changes", "Achy Joints", "Weight Changes"],
    icon: "body",
  },
  {
    title: "Sleep & Energy Symptoms",
    items: ["Headaches", "Trouble Sleeping"],
    icon: "sleep",
  },
] as const;

const included = ["Quarterly Hormone Labs", "Dedicated Care Team Support", "Licensed Clinician Visits"];

function SymptomIcon({ name }: { name: (typeof symptomGroups)[number]["icon"] }) {
  const common = "h-5 w-5";
  if (name === "mood") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 14.2c.8 1.2 2 1.8 3.5 1.8s2.7-.6 3.5-1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M9 10.2h.01M15 10.2h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "hormone") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <path d="M12 4.5v15M8 8.5h8M9 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (name === "body") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
        <circle cx="12" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 20.5v-5.2L6.8 12a3.2 3.2 0 0 1 3-4h4.4a3.2 3.2 0 0 1 3 4L16 15.3v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden>
      <path d="M16.5 13.2A5.2 5.2 0 1 1 12 6.2a4 4 0 0 0 4.5 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function StatRing({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const animate = useRef(false);
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(value);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = node.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.86 && rect.bottom > 64;
    if (reduce || visible) {
      setShown(true);
      setCount(value);
      return;
    }
    animate.current = true;
    setCount(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!shown || !animate.current) return;
    animate.current = false;
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, value]);

  const progress = shown ? value / 100 : count / 100;

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <div className="relative grid h-40 w-40 place-items-center sm:h-44 sm:w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="7" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#fff"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{
              transition: shown ? "stroke-dashoffset 1600ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            }}
          />
        </svg>
        <p className="absolute text-[34px] font-medium tracking-[-0.04em] text-white sm:text-[40px]">
          {count}
          <span className="text-[22px]">%</span>
        </p>
      </div>
      <p className="mt-4 max-w-[16rem] text-[15px] leading-snug text-white/95">{label}</p>
    </div>
  );
}

function MenopauseCount() {
  const ref = useRef<HTMLParagraphElement>(null);
  const frame = useRef(0);
  const [count, setCount] = useState(80);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = node.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.86 && rect.bottom > 64;
    if (reduce || visible) {
      setCount(80);
      return;
    }

    setCount(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 1600);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(80 * eased));
          if (progress < 1) frame.current = requestAnimationFrame(tick);
        };
        frame.current = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <p
      ref={ref}
      className="mt-12 font-serif-italic text-[92px] leading-none tracking-[-0.03em] text-[#732e38] sm:mt-16 sm:text-[128px]"
      aria-label="80%"
    >
      <span aria-hidden>
        {count}%
      </span>
    </p>
  );
}

export function WomenHormoneTherapy() {
  const safetySections = getProductSafety("women-hormone-therapy");
  const [open, setOpen] = useState<string | null>(null);
  const panelId = useId();

  return (
    <SafetyInformationModal
      sections={safetySections ?? getLegal("important-safety-information")?.sections ?? []}
    >
      {(trigger) => (
        <>
          <section className="bg-gradient-to-b from-[#f37477] to-[#e9989f] px-6 pb-16 pt-28 text-white">
            <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.05fr_minmax(280px,460px)] md:gap-8 lg:gap-10">
              <div className="flex min-h-[280px] flex-col items-center justify-center sm:min-h-[420px]">
                <Image
                  src={HERO_IMAGE}
                  alt="Women's hormone therapy medications"
                  width={1000}
                  height={1119}
                  priority
                  className="h-auto w-full max-w-[460px] object-contain drop-shadow-2xl"
                  sizes="(max-width: 1024px) 80vw, 460px"
                />
                <IllustrationNote />
              </div>
              <div className="rounded-[28px] border border-white/30 bg-white/15 p-6 shadow-[0_18px_50px_rgba(51,17,16,0.12)] backdrop-blur-md sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="font-medium">4.8</span>
                    <span className="tracking-tight text-[#ff5a5a]" aria-hidden>
                      ★★★★★
                    </span>
                    <span className="sr-only">4.8 out of 5 stars</span>
                  </p>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium tracking-[0.12em] uppercase">
                    HSA / FSA
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-white/90">Women HRT</span>
                  <span className="rounded-full bg-[#331110] px-3 py-1 text-[11px] text-white">
                    Lab + clinician visit required
                  </span>
                </div>
                <h1 className="mt-4 text-[40px] leading-[0.95] font-medium tracking-[-0.04em] text-balance sm:text-[52px]">
                  Women&apos;s Hormone Therapy
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-white/95">
                  Women&apos;s Hormone Therapy is a clinician-led program for perimenopause and menopause symptoms. After a 64-marker lab panel and clearance visit, your provider may recommend estradiol, progesterone, testosterone, or other options. Treatment is personalized based on your symptoms, age, health history, and individual risk factors. Ongoing monitoring ensures safe and effective care.
                </p>
                <p className="mt-4 text-[16px] font-semibold">Starting at just $69/Month.</p>
                <p className="mt-3 text-[14px] leading-relaxed text-white/90">
                  Already have your labs? You can upload them during intake. If not, we&apos;ll schedule your panel for you — no extra steps.
                </p>
                <a
                  href="#womenintakes"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dbd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-[#331110]"
                >
                  CHOOSE YOUR TREATMENT
                  <span aria-hidden className="text-[10px]">
                    ▾
                  </span>
                </a>
                {trigger}
              </div>
            </div>
          </section>

          <PriceCompare />

          <div className="bg-gradient-to-b from-[#e9989f] to-[#e56070] text-[#331110]">
            <section id="womenintakes" className="scroll-mt-28 px-6 py-16 sm:py-20">
              <div className="mx-auto max-w-6xl">
                <h2 className="max-w-3xl text-[36px] leading-[1.05] font-medium tracking-[-0.04em] text-balance text-white sm:text-[48px]">
                  Transparent <span className="font-serif-italic">Pricing</span>. No{" "}
                  <span className="font-serif-italic">Surprises</span>.
                </h2>
                <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-white/95">
                  HRT is an ongoing process. Dosing and application evolve with your journey. For $50/month (billed quarterly), all labs and clinician visits are included. Medications are billed separately per your treatment plan. Everything ships and bills quarterly. Cancel anytime after the first 3 months.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {treatments.map((item) => (
                    <article key={item.title} className="flex flex-col rounded-[12px] bg-[#dbd4bd] p-5">
                      <h3 className="text-[22px] leading-tight font-medium tracking-[-0.03em]">{item.title}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[#331110]/85">{item.body}</p>
                      <div className="relative my-4 h-36">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 80vw, 240px"
                        />
                      </div>
                      <div className="mt-auto flex flex-col gap-2">
                        {item.links.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            aria-label={`${link.label} — ${item.title}`}
                            className="inline-flex h-11 w-full items-center justify-center rounded-[6px] bg-[#f7f3f5] px-3 text-center text-[11px] font-medium tracking-[0.06em] text-[#331110] uppercase transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#331110] hover:text-white focus-visible:bg-[#331110] focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#331110] motion-reduce:transition-none"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-6 py-6 sm:py-10">
              <div className="mx-auto max-w-6xl">
                <h2 className="max-w-3xl text-[34px] leading-[1.08] font-medium tracking-[-0.04em] text-balance text-white sm:text-[46px]">
                  Menopause affects <span className="font-serif-italic">more</span> than how you feel — it affects how you{" "}
                  <span className="font-serif-italic">live</span>.
                </h2>
                <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-white/95">
                  A growing body of research shows that women on HRT for six months or more report meaningful improvements across key areas of health and wellbeing.
                </p>
                <div className="mt-10 grid gap-10 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <StatRing key={stat.value} value={stat.value} label={stat.label} />
                  ))}
                </div>
              </div>
            </section>

            <section className="px-6 py-14 sm:py-16">
              <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
                <div>
                  <h2 className="text-[34px] leading-[1.08] font-medium tracking-[-0.04em] text-balance text-white sm:text-[44px]">
                    Straightforward <span className="font-serif-italic">pricing</span>. No{" "}
                    <span className="font-serif-italic">surprises</span>. $50/month.
                  </h2>
                  <p className="mt-5 text-[16px] leading-relaxed text-white/95">
                    HRT is an ongoing process — your dosing and treatment adapt as your body changes. At $50/month (billed quarterly), all follow-up labs and clinician visits are covered. Medications are billed separately and shipped directly to your door.
                  </p>
                  <p className="mt-6 text-[16px] font-medium text-white">Here&apos;s what&apos;s included:</p>
                  <ul className="mt-3 space-y-2">
                    {included.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-[16px] text-white">
                        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[12px]">
                          +
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <IconHoverButton href={GET_STARTED_URL}>Get Started</IconHoverButton>
                  </div>
                </div>
                <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px] overflow-hidden rounded-[28px]">
                  <Image
                    src={LIFESTYLE_IMAGE}
                    alt="Two women smiling together"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 90vw, 460px"
                  />
                </div>
              </div>
            </section>

            <section className="px-6 py-8 pb-16 sm:py-12">
              <div className="mx-auto max-w-6xl">
                <h2 className="text-[34px] leading-[1.05] font-medium tracking-[-0.04em] text-white sm:text-[46px]">
                  What is Perimenopause?
                </h2>
                <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-white/95">
                  Perimenopause marks the beginning of your hormonal transition — and it&apos;s one of the most important windows for protecting your long-term health. Even without noticeable symptoms, small imbalances during this time can compound into larger issues if left untreated.
                </p>
                <div className="mt-8 grid items-start gap-4 md:grid-cols-2">
                  {symptomGroups.map((group) => {
                    const isOpen = open === group.title;
                    return (
                      <div key={group.title} className="self-start rounded-[27px] bg-[#efe6d4] px-5 py-4 text-[#331110]">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 text-left"
                          aria-expanded={isOpen}
                          aria-controls={`${panelId}-${group.title}`}
                          onClick={() => setOpen(isOpen ? null : group.title)}
                        >
                          <SymptomIcon name={group.icon} />
                          <span className="flex-1 text-[18px] font-medium tracking-[-0.02em]">{group.title}</span>
                          <span
                            aria-hidden
                            className={`grid h-8 w-8 place-items-center text-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`}
                          >
                            +
                          </span>
                        </button>
                        <div
                          id={`${panelId}-${group.title}`}
                          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="flex flex-wrap gap-2 pt-4">
                              {group.items.map((item) => (
                                <span key={item} className="rounded-full bg-[#e98591] px-3 py-1.5 text-[14px]">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mx-auto mt-16 max-w-4xl text-center sm:mt-20">
                  <p className="text-[26px] leading-[1.28] font-medium tracking-[-0.03em] text-balance text-[#331110] sm:text-[34px] lg:text-[40px]">
                    <span className="font-serif-italic font-normal">Menopause</span> is not a phase you simply wait out. Most women experience significant symptoms — and hot flashes alone can last a median of 7.4 years. The right care, started early, changes that trajectory.
                  </p>
                  <MenopauseCount />
                  <p className="mt-2 text-[15px] text-[#331110] sm:text-[17px]">of women experience menopause</p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </SafetyInformationModal>
  );
}
