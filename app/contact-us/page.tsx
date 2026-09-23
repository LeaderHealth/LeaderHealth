import Image from "next/image";
import type { ReactNode } from "react";
import { ContactForm } from "@/components/ContactForm";
import { assets, site } from "@/lib/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div>
      <section className="relative flex min-h-[78vh] items-center overflow-hidden bg-ink pb-20 pt-32 text-white">
        <Image
          src={assets.contactHero}
          alt="Leader Health clinician on a call"
          fill
          priority
          className="object-cover object-[62%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(40,12,14,0.55)_0%,rgba(40,12,14,0.22)_42%,rgba(40,12,14,0.08)_68%,rgba(40,12,14,0)_100%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-6 text-center">
          <h1 className="text-6xl md:text-[84px] md:leading-[0.95]">
            Contact <span className="font-serif-italic">Us</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 md:text-lg">
            Have a question or ready to get started? Our team is available to help you take the first step.
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#e33d4d]" />
      </section>

      <section className="bg-white px-6 py-14 md:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-2">
          <article className="rounded-[28px] bg-[#eadfd4] p-8 md:p-10">
            <h2 className="text-[40px] leading-none text-ink md:text-[44px]">
              We&apos;re Here to <span className="font-serif-italic text-accent">Help</span>
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink">
              Questions about your treatment, orders, or getting started with Leader Health? Our team is ready
              to provide answers, guidance, and support, whenever you need it.
            </p>
            <hr className="my-8 border-ink/15" />
            <p className="text-[15px] leading-relaxed text-ink">
              We cover <span className="font-semibold">all 50 states</span>, with a network of providers ready
              to meet you wherever you are.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-ink">
              Our home base is in <span className="font-semibold">Tomball, Texas</span> — and if you&apos;re in
              the greater Houston area, we&apos;d love to see you in person. Email ahead to schedule an
              appointment for on-site labs and more.
            </p>

            <ul className="mt-10 space-y-8">
              <ContactRow
                icon={<MailIcon />}
                title="Email Support"
                detail="We'll get you the help you need."
              >
                <a href={`mailto:${site.email}`} className="text-[15px] text-accent">
                  {site.email}
                </a>
              </ContactRow>
              <ContactRow
                icon={<ClinicIcon />}
                title="Visit Our Clinic"
                detail="Email ahead to schedule an appointment"
              >
                <a href={site.addressHref} className="text-[15px] text-accent">
                  321 S Persimmon St Tomball, Texas 77375
                </a>
              </ContactRow>
              <ContactRow
                icon={<PhoneIcon />}
                title="Call Us"
                detail="Available Mon–Fri, 9am – 5pm CST"
              >
                <a href={site.phoneHref} className="text-[15px] text-accent">
                  254-244-0104
                </a>
              </ContactRow>
            </ul>
          </article>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}

function ContactRow({
  icon,
  title,
  detail,
  children,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f3c9c6] text-accent">
        {icon}
      </span>
      <div>
        <h3 className="text-xl leading-tight">{title}</h3>
        <p className="mt-1 text-[13px] text-ink/70">{detail}</p>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4.5 20.5V9.2L12 4.5l7.5 4.7v11.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.5 20.5v-6h5v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 11v3.5M10.25 12.75h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8 3.8h2.4c.4 0 .7.3.8.6l.7 2.3c.1.4 0 .8-.3 1.1L10.3 9.2a12 12 0 0 0 4.5 4.5l1.4-1.3c.3-.3.7-.4 1.1-.3l2.3.7c.3.1.6.4.6.8V16c0 2.3-2.1 4.2-4.5 3.6C9.6 18.3 5.7 14.4 4.4 8.3 3.8 5.9 5.7 3.8 8 3.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
