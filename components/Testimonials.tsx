"use client";

import Image from "next/image";
import { useState } from "react";
import { testimonials } from "@/lib/content/site";

export function Testimonials({ variant = "grid" }: { variant?: "grid" | "featured" }) {
  const [index, setIndex] = useState(1);
  const featured = testimonials[index];
  const prev = testimonials[(index + testimonials.length - 1) % testimonials.length];
  const next = testimonials[(index + 1) % testimonials.length];

  if (variant === "featured") {
    return (
      <section className="relative overflow-hidden bg-[#f7f3f5] px-6 py-20">
        <div className="pointer-events-none absolute inset-x-0 top-10 h-64 bg-[radial-gradient(ellipse_at_center,rgba(243,116,119,0.18),transparent_65%)]" />
        <div className="relative mx-auto max-w-5xl">
          <h2 className="text-center text-4xl md:text-[48px]">Wellness, in their own words.</h2>
          <p className="mt-3 text-center font-serif-italic text-2xl text-accent">
            Hear how LeaderHealth has helped people feel their best.
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              type="button"
              className="hidden shrink-0 md:block"
              onClick={() => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
              aria-label="Previous"
            >
              <Image
                src={prev.image}
                alt=""
                width={160}
                height={210}
                className="h-[210px] w-[130px] rotate-[-8deg] rounded-2xl object-cover opacity-80 shadow-md"
              />
            </button>
            <article className="grid max-w-[640px] overflow-hidden rounded-[24px] bg-white shadow-lg md:grid-cols-[1.05fr_0.95fr]">
              <div className="p-6 md:p-8">
                <p className="font-serif-italic text-4xl leading-none text-ink">&ldquo;</p>
                <p className="text-sm font-medium text-accent">{featured.treatment}</p>
                <p className="mt-3 text-sm leading-relaxed text-brown">{featured.quote}</p>
                <p className="mt-5 text-lg font-medium">{featured.name}</p>
              </div>
              <Image
                src={featured.image}
                alt={featured.name}
                width={360}
                height={420}
                className="h-full min-h-[280px] w-full object-cover"
              />
            </article>
            <button
              type="button"
              className="hidden shrink-0 md:block"
              onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
              aria-label="Next"
            >
              <Image
                src={next.image}
                alt=""
                width={160}
                height={210}
                className="h-[210px] w-[130px] rotate-[8deg] rounded-2xl object-cover opacity-80 shadow-md"
              />
            </button>
          </div>
          <div className="mt-8 flex justify-center gap-3 md:hidden">
            <button
              type="button"
              className="rounded-full border border-ink/15 px-4 py-2 text-sm"
              onClick={() => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-full border border-ink/15 px-4 py-2 text-sm"
              onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-4xl md:text-5xl">Wellness, in their own words.</h2>
        <p className="mt-3 text-center font-serif-italic text-2xl text-accent">
          Hear how LeaderHealth has helped people feel their best.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <article key={t.name} className="rounded-[28px] bg-background p-5">
              <Image
                src={t.image}
                alt={t.name}
                width={280}
                height={360}
                className="h-[280px] w-full rounded-2xl object-cover"
              />
              <p className="mt-4 text-sm leading-relaxed text-brown">{t.quote}</p>
              <p className="mt-5 font-medium">{t.name}</p>
              <p className="text-sm text-taupe">{t.treatment}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
