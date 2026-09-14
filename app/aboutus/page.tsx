import { GET_STARTED_URL, founders } from "@/lib/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="pt-28">
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-wider text-accent">Who Are We?</p>
        <h1 className="mt-4 text-5xl md:text-6xl">
          Leader is about health, fitness &{" "}
          <span className="font-serif-italic text-accent">formulas</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-brown">
          Leader Health is a physician-led telehealth practice bringing clinical-grade hormone, weight, and longevity care within reach of everyone who needs it.
        </p>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl">Where Science Meets Care</h2>
            <p className="mt-4 text-brown">
              Personalized therapies for hormones, weight, and vitality — guided by doctors, backed by research, designed for real results.
            </p>
          </div>
          <div>
            <h2 className="text-3xl">To Redefine Modern Wellness</h2>
            <p className="mt-4 text-brown">
              At Leader Health, the goal is simple: to make advanced medical therapies accessible, safe, and effective for everyone.
            </p>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-5xl text-sm uppercase tracking-[0.2em] text-taupe">
          Pharmaceutical-grade
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-wider text-accent">Our Mission</p>
        <h2 className="mt-3 text-4xl">Why We Exist</h2>
        <p className="mt-6 leading-relaxed text-brown">
          Leader Health started with a simple observation from inside the exam room: the most effective clinical tools were reserved for elite athletes, executives, and people who knew the right specialist.
        </p>
        <p className="mt-4 leading-relaxed text-brown">
          We set out to change that. Drawing from endocrinology, sports medicine, and longevity research, our clinical team built a protocol-first practice that moves at the pace of science — not insurance timelines or institutional inertia.
        </p>
        <p className="mt-4 leading-relaxed text-brown">
          The result is a practice built around the individual — where your biology, your goals, and your timeline shape everything from intake to ongoing care.
        </p>
        <p className="mt-8 font-serif-italic text-3xl text-accent">Lead your health. Live your potential.</p>
        <a href={GET_STARTED_URL} className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-white">
          Get Started
        </a>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Personalized Care",
              sub: "Care That Works, Because It's Built for You",
              body: "Personalized treatment plans tailored to your body and goals. Every treatment is tailored to your health profile, so results feel natural and sustainable.",
            },
            {
              title: "Licensed clinicians",
              sub: "Licensed providers. Real medicine.",
              body: "Care is delivered by independent licensed clinicians, each licensed in the state where you are located. Medical experts guide your progress and adjust your plan when needed.",
            },
            {
              title: "Support from start to finish",
              sub: "Safe and clinically proven therapies.",
              body: "Backed by science and trusted by thousands, ensuring results you can rely on. From first consultation to delivery, we make care simple and stress-free.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl bg-background p-6">
              <h3 className="text-xl">{item.title}</h3>
              <p className="mt-2 font-serif-italic text-accent">{item.sub}</p>
              <p className="mt-3 text-sm text-taupe">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-4xl">Guided by Experts, Driven by Innovation</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {founders.map((f) => (
            <article key={f.name} className="rounded-3xl bg-white p-6">
              <h3 className="text-xl">{f.name}</h3>
              <p className="mt-2 text-sm text-taupe">{f.role}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
