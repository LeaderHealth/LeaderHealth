"use client";

import Image from "next/image";
import { useState } from "react";
import { assets, testimonials } from "@/lib/content/site";

export function Testimonials() {
  const [index, setIndex] = useState(0);

  return (
    <section className="overflow-hidden bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-4xl md:text-5xl">Wellness, in their own words.</h2>
        <p className="mt-3 text-center font-serif-italic text-2xl text-accent">
          Hear how LeaderHealth has helped people feel their best.
        </p>
        <div className="mt-12 flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
          {testimonials.map((t, i) => (
            <article
              key={t.name}
              className={`min-w-[280px] rounded-[28px] bg-background p-5 ${
                i === index ? "ring-1 ring-ink/10" : ""
              }`}
            >
              <Image
                src={t.image}
                alt={t.name}
                width={280}
                height={360}
                className="h-[280px] w-full rounded-2xl object-cover"
              />
              <Image src={assets.stars} alt="" width={48} height={48} className="mt-4 h-7 w-7" />
              <p className="mt-3 text-sm leading-relaxed text-brown">{t.quote}</p>
              <p className="mt-5 font-medium">{t.name}</p>
              <p className="text-sm text-taupe">{t.treatment}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-3">
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
