"use client";

import Image from "next/image";
import Link from "next/link";
import { assets, careSteps, designedFor, GET_STARTED_URL } from "@/lib/content/site";
import { labs } from "@/lib/content/products";
import { HeroVideo } from "./HeroVideo";
import { Marquee } from "./Marquee";
import { Testimonials } from "./Testimonials";
import { ArticleLibrary } from "./ArticleLibrary";

const campaign = [
  {
    href: "/products/weight-loss-semaglutide",
    title: "Lose Weight, Keep it Off",
    sub: "with Compounded Semaglutide",
    img: "https://framerusercontent.com/images/qjehMU3idCiDUkHLomxHWBSbnkk.png?width=626&height=888",
    fit: "object-cover",
  },
  {
    href: "/products/weight-loss-tirzepatide",
    title: "Transform Your Body",
    sub: "with Compounded Tirzepatide",
    img: "https://framerusercontent.com/images/wLJd6Casd45671gr7VQ42JuQQkE.png?width=1080&height=1350",
    fit: "object-cover",
  },
  {
    href: "/products/men-trt-testosterone-cypionate",
    title: "Reclaim Your Energy",
    sub: "with Compounded Testosterone",
    img: "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
    fit: "object-cover",
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

      <section className="relative overflow-hidden">
        <Image
          src={assets.showUp}
          alt="A man standing beside an oversized LeaderHealth tablet embossed with the LH monogram."
          width={1600}
          height={900}
          className="h-[70vh] w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-ink/70 to-transparent pb-16 text-center text-white">
          <h2 className="text-5xl md:text-7xl">Show Up Stronger</h2>
          <Link href="/shop-all-products" className="mt-4 underline">
            Explore All Treatments
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="bg-rose/40 px-8 py-16 md:px-16">
          <p className="text-sm uppercase tracking-wider text-taupe">Weight Loss</p>
          <h2 className="mt-3 text-4xl">Provider-Guided Weight Loss</h2>
          <p className="mt-4 max-w-md text-brown">
            Physician-prescribed treatments, quarterly labs, and real clinical support — delivered to your door.
          </p>
          <a href={GET_STARTED_URL} className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-white">
            Get Started
          </a>
        </div>
        <div className="relative min-h-[320px]">
          <Image src={assets.pills} alt="Two round tablets and a capsule on a blush gradient background" fill className="object-cover" />
        </div>
        <div className="relative min-h-[280px]">
          <Image src={assets.stretching} alt="LEADER HEALTH logo over a photo of a man stretching his shoulder" fill className="object-cover" />
        </div>
        <div className="bg-ink px-8 py-16 text-white md:px-16">
          <h2 className="text-4xl">Care Built Around You</h2>
          <p className="mt-4 max-w-md text-rose">
            Licensed clinicians, transparent pricing, and support at every step.
          </p>
          <Link href="/aboutus" className="mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm text-ink">
            About Us
          </Link>
        </div>
      </section>

      <section className="grid gap-4 bg-background px-6 py-16 md:grid-cols-3">
        {campaign.map((card) => (
          <Link key={card.href} href={card.href} className="overflow-hidden rounded-3xl bg-white">
            <Image
              src={card.img}
              alt={`${card.title} ${card.sub}`}
              width={540}
              height={675}
              className={`h-80 w-full bg-white ${card.fit}`}
            />
            <div className="p-6">
              <h3 className="text-2xl">{card.title}</h3>
              <p className="font-serif-italic text-xl text-accent">{card.sub}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="relative overflow-hidden bg-ink text-white">
        <Image
          src={assets.weightlifting}
          alt="A man in a white tank top lifting weights in a shaft of light."
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-28">
          <h2 className="text-5xl md:text-6xl">
            Designed for the way
            <br />
            <span className="font-serif-italic">you want to live.</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/85">
            Most wellness products are built for the average. Yours is built for you — engineered to move the metrics that matter, and refined as your body changes.
          </p>
          <ul className="mt-8 space-y-3">
            {designedFor.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Image src={assets.check} alt="" width={28} height={28} className="mt-0.5 h-7 w-7" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-10 font-serif-italic text-3xl text-rose">More by design.</p>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl">Energy. Weight. Performance.</h2>
          <p className="mt-3 text-taupe">When one is off, everything feels off. Here&apos;s where most members start.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featured.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-3xl bg-background p-6">
                <Image src={item.image} alt={item.name} width={320} height={320} className="mx-auto h-40 w-auto object-contain" />
                <p className="mt-4 text-xs uppercase tracking-wider text-accent">{item.category}</p>
                <h3 className="mt-2 text-2xl">{item.name}</h3>
                <p className="mt-1 text-sm text-brown">{item.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-wider text-accent">Now available</p>
          <h2 className="mt-2 text-5xl">Labs</h2>
          <p className="mt-3 max-w-xl text-taupe">
            Get a clearer picture of your health with comprehensive lab testing and expert clinical insights.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brown">
            <span>2-5 business days from draw to results</span>
            <span>30 minutes clinical view, included</span>
            <span>HSA / FSA</span>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {labs.map((lab) => (
              <Link key={lab.slug} href={`/labs/${lab.slug}`} className="overflow-hidden rounded-3xl bg-white">
                <Image src={lab.image} alt={lab.name} width={400} height={700} className="h-80 w-full bg-[#1a1a1a] object-contain" />
                <div className="p-6">
                  <h3 className="text-2xl uppercase">
                    {lab.name}
                    {lab.recommended ? (
                      <span className="ml-2 text-sm font-normal normal-case text-accent">Recommended</span>
                    ) : null}
                  </h3>
                  <p className="text-taupe">
                    ({lab.biomarkers}) / {lab.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
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
