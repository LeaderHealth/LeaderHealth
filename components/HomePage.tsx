"use client";

import Image from "next/image";
import Link from "next/link";
import { assets, careSteps, designedFor, GET_STARTED_URL, testimonials } from "@/lib/content/site";
import { labs } from "@/lib/content/products";
import { HeroVideo } from "./HeroVideo";
import { Marquee } from "./Marquee";
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

const labMetrics = [
  { value: "2-5", label: "business days from draw to results" },
  { value: "30", label: "minutes clinical view, included" },
  { value: "", label: "HSA / FSA" },
];

export function HomePage() {
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
        </div>
      </section>
      <Marquee />

      <section className="bg-white px-6 py-20 text-center">
        <h2 className="text-4xl text-ink md:text-[52px]">
          Care, Delivered in <span className="font-serif-italic text-coral">3 Simple Steps</span>
        </h2>
        <p className="mt-3 text-taupe">No clinics. No waiting rooms. No guesswork.</p>
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
          {careSteps.map((step) => (
            <article
              key={step.step}
              className="relative h-[520px] overflow-hidden rounded-[28px]"
            >
              <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="(min-width: 768px) 33vw, 86vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/25" />
              <p className="absolute left-6 top-6 text-4xl text-white md:text-5xl">{step.step}</p>
              <div className="absolute inset-x-0 bottom-0 p-6 text-left text-white">
                <h3 className="text-3xl">{step.title}</h3>
                <p className="mt-1 text-sm text-white/85">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
        <a
          href={GET_STARTED_URL}
          className="mt-10 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-white"
        >
          Begin your intake
        </a>
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

          <div className="relative z-10 mt-2.5 grid gap-2.5 md:grid-cols-3">
            {campaign.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="flex min-h-[560px] w-full flex-col items-center justify-center gap-2.5 rounded-[19px] bg-[#442928] p-6 md:min-h-[860px] md:p-10"
              >
                <Image
                  src={card.img}
                  alt={`${card.title} ${card.sub}`}
                  width={297}
                  height={550}
                  className="h-auto w-full max-w-[297px] object-cover md:h-[550px] md:w-[297px]"
                />
                <h3 className="w-full font-sans text-[28px] font-medium leading-[1.2] tracking-normal text-accent md:text-[36px] md:leading-[43.2px]">
                  {card.title}
                </h3>
                <p className="w-full font-sans text-[18px] font-medium leading-6 tracking-normal text-accent md:text-[20px]">
                  {card.sub}
                </p>
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

      <section className="overflow-x-hidden bg-white px-6 py-[30px]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-12 md:gap-8">
          <div className="min-w-0 md:col-span-5">
            <p className="font-sans text-[16px] font-semibold leading-[19.2px] tracking-normal text-[#e33b4f]">
              NOW AVAILABLE
            </p>
            <h2 className="mt-2 font-sans text-6xl font-medium leading-none tracking-normal text-[#e43c4e] md:text-[74px] md:leading-[88.8px]">
              Labs
            </h2>
            <p className="mt-4 max-w-[449px] font-sans text-[21px] font-normal leading-[25.2px] tracking-normal text-[#32120e]">
              Get a clearer picture of your health with comprehensive lab testing and expert clinical insights.
            </p>
            <div className="mt-8">
              {labMetrics.map((metric) => (
                <p
                  key={metric.label}
                  className="border-t border-ink/15 py-2 font-sans text-[21px] leading-[25.2px] tracking-normal text-[#32120e]"
                >
                  {metric.value ? (
                    <span className="font-medium italic text-[#e33b4f]">{metric.value} </span>
                  ) : null}
                  {metric.label}
                </p>
              ))}
            </div>
          </div>
          <div className="grid min-w-0 gap-[19px] md:col-span-7 md:grid-cols-2">
            {labs.map((lab) => (
              <Link
                key={lab.slug}
                href={`/labs/${lab.slug}`}
                className="relative min-w-0 overflow-hidden rounded-[20px] pt-2"
                style={{
                  background:
                    "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)",
                }}
              >
                {lab.recommended ? (
                  <span className="absolute right-[19px] top-[21px] z-10 whitespace-nowrap rounded-[15px] bg-[#e43c4e]/75 px-2.5 py-[5px] text-[12px] font-medium text-white">
                    Recommended
                  </span>
                ) : null}
                <Image
                  src={lab.image}
                  alt={lab.name}
                  width={332}
                  height={415}
                  className="mx-auto h-auto w-full max-h-[415px] object-contain"
                />
                <div className="px-6 pb-6">
                  <h3 className="font-sans text-[19px] font-medium uppercase leading-[22.8px] tracking-normal text-[#331110]">
                    {lab.name}
                  </h3>
                  <p className="mt-1 font-sans text-[18px] font-medium leading-[21.6px] tracking-normal text-[#e43c4e]">
                    ({lab.biomarkers}) / {lab.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
