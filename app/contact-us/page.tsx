import { site } from "@/lib/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">Contact Us</h1>
      <p className="mt-4 max-w-2xl text-taupe">
        Have a question or ready to get started? Our team is available to help you take the first step.
      </p>
      <h2 className="mt-12 text-3xl">We are here to help</h2>
      <p className="mt-4 max-w-2xl text-brown">
        Questions about your treatment, orders, or getting started with Leader Health? Our team is ready to provide answers, guidance, and support, whenever you need it.
      </p>
      <p className="mt-4 max-w-2xl text-brown">
        We cover all 50 states, with a network of providers ready to meet you wherever you are. Our home base is in Tomball, Texas — and if you are in the greater Houston area, we would love to see you in person. Email ahead to schedule an appointment for on-site labs and more.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-6">
          <h3 className="text-xl">Email Support</h3>
          <p className="mt-2 text-sm text-taupe">We will get you the help you need.</p>
          <a href={`mailto:${site.email}`} className="mt-4 inline-block underline">
            {site.email}
          </a>
        </article>
        <article className="rounded-3xl bg-white p-6">
          <h3 className="text-xl">Visit Our Clinic</h3>
          <p className="mt-2 text-sm text-taupe">Email ahead to schedule an appointment</p>
          <a href={site.addressHref} className="mt-4 inline-block underline">
            321 S Persimmon St Tomball, Texas 77375
          </a>
        </article>
        <article className="rounded-3xl bg-white p-6">
          <h3 className="text-xl">Call Us</h3>
          <p className="mt-2 text-sm text-taupe">Tue-Sat, 9am-5pm CT</p>
          <a href={site.phoneHref} className="mt-4 inline-block underline">
            {site.phone}
          </a>
        </article>
      </div>
      <form
        className="mt-12 max-w-lg space-y-4 rounded-3xl bg-white p-6"
        action={`mailto:${site.email}`}
        method="get"
      >
        <h3 className="text-xl">Send a message</h3>
        <input
          required
          name="subject"
          placeholder="Your name"
          className="w-full rounded-full bg-background px-4 py-3 outline-none"
        />
        <textarea
          name="body"
          required
          placeholder="How can we help?"
          rows={5}
          className="w-full rounded-3xl bg-background px-4 py-3 outline-none"
        />
        <button type="submit" className="rounded-full bg-ink px-6 py-3 text-sm text-white">
          Email Us
        </button>
      </form>
    </div>
  );
}
