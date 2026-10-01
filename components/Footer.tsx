"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { assets, PORTAL_URL, site } from "@/lib/content/site";

const wordmark =
  "https://framerusercontent.com/images/LVaS2fRqoJ2LsJYEYoCtlTjng.svg?width=2126&height=166";
const legitScript =
  "https://framerusercontent.com/images/m7MzJZTvZ8ByPgGCLQeRUIA2N54.png?width=292&height=316";

type FooterLink = { label: string; href: string; external?: boolean };

type FooterSection = {
  eyebrow?: string;
  links?: FooterLink[];
  action?: FooterLink;
};

type FooterAccordion = {
  id: string;
  label: string;
  sections: FooterSection[];
};

const treatmentAccordions: FooterAccordion[] = [
  {
    id: "hormone",
    label: "Hormone Therapy",
    sections: [
      {
        eyebrow: "Men",
        links: [
          { label: "Testosterone Cypionate", href: "/products/men-trt-testosterone-cypionate" },
          { label: "Enclomiphene", href: "/products/men-trt-enclomiphene" },
          { label: "Testosterone Cream", href: "/products/men-trt-testosterone-cream" },
        ],
      },
      { action: { label: "Women", href: "/shop-women-products" } },
    ],
  },
  {
    id: "sexual",
    label: "Sexual Health",
    sections: [
      {
        eyebrow: "Men",
        links: [
          { label: "Tadalafil", href: "/products/men-sexual-health-tadalafil" },
          { label: "PT-141 Nasal Spray", href: "/products/sexual-health-pt-141-nasal" },
          { label: "Combo Troches", href: "/products/men-sexual-health-combo-troches" },
        ],
      },
      {
        eyebrow: "Women",
        links: [
          { label: "PT-141 Nasal Spray", href: "/products/sexual-health-pt-141-nasal" },
          { label: "Combo Troches", href: "/products/women-sexual-health-combo-troches" },
        ],
      },
    ],
  },
  {
    id: "weight",
    label: "Weight Loss",
    sections: [
      {
        links: [
          { label: "Semaglutide", href: "/products/weight-loss-semaglutide" },
          { label: "Tirzepatide", href: "/products/weight-loss-tirzepatide" },
        ],
      },
    ],
  },
  {
    id: "longevity",
    label: "Longevity",
    sections: [
      {
        links: [
          { label: "NAD+", href: "/products/longevity-nad" },
          { label: "Glutathione", href: "/products/longevity-glutathione" },
          { label: "Sermorelin", href: "/products/longevity-sermorelin" },
        ],
        action: { label: "What Longevity Covers", href: "/energy-longevity" },
      },
    ],
  },
  {
    id: "labs",
    label: "Labs",
    sections: [
      {
        links: [
          { label: "Complete Panel", href: "/labs/labs-complete-panel" },
          { label: "Advanced Panel", href: "/labs/labs-advance-panel" },
        ],
      },
    ],
  },
];

const whoLinks: FooterLink[] = [
  { href: "/aboutus", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/blogs", label: "Learn More" },
];

const legalLinks: FooterLink[] = [
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/consumer-health-data-privacy", label: "Consumer Health Data Privacy" },
  { href: "/legal/do-not-sell", label: "Do Not Sell or Share My Info" },
];

const legalAccordions: FooterAccordion[] = [
  {
    id: "consent",
    label: "Consent & Notices",
    sections: [
      {
        links: [
          { label: "Terms of Service", href: "/legal/terms-of-service" },
          { label: "Telehealth Consent", href: "/legal/telehealth-consent" },
          { label: "Important Safety Information", href: "/legal/important-safety-information" },
          { label: "HIPAA Notice", href: "/legal/hipaa-notice" },
        ],
      },
    ],
  },
  {
    id: "orders",
    label: "Orders & Billings",
    sections: [
      {
        links: [
          { label: "Subscription Terms", href: "/legal/subscription-terms" },
          { label: "Refunds & Cancellations", href: "/legal/refunds-cancellations" },
          { label: "Shipping Policy", href: "/legal/shipping-policy" },
          { label: "State Restrictions", href: "/legal/state-restrictions" },
        ],
      },
    ],
  },
];

function ColumnTitle({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2.5 font-sans text-[13px] font-medium uppercase tracking-[0.11em] text-[#DBD4BD]">
      <span aria-hidden className="h-px w-3 bg-[#DBD4BD]" />
      {children}
    </p>
  );
}

function ArrowIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path d="M4.5 11.5 11.5 4.5M7 4.5h4.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`size-2.5 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-45 text-[#e33d4d]" : "text-[#F7F3F5]/80"}`}
      fill="none"
      aria-hidden
    >
      <path d="M6 1.2v9.6M1.2 6h9.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FooterAnchor({ link, className, arrow = false }: { link: FooterLink; className: string; arrow?: boolean }) {
  const content = (
    <>
      {link.label}
      {arrow ? <ArrowIcon /> : null}
    </>
  );
  if (link.external) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {content}
    </Link>
  );
}

const linkHover =
  "underline-offset-4 transition-[color,text-decoration-color] duration-200 hover:text-[#f7a8ad] hover:underline hover:decoration-[#f7a8ad] focus-visible:text-[#f7a8ad] focus-visible:underline focus-visible:decoration-[#f7a8ad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const textLink = `font-sans text-[15px] leading-5 tracking-[-0.02em] text-[#F7F3F5] ${linkHover}`;

const subLink = `font-sans text-[14px] leading-[1.2] text-[#F7F3F5]/80 ${linkHover}`;

function AccordionList({
  items,
  openId,
  onToggle,
  labelClassName,
}: {
  items: FooterAccordion[];
  openId: string | null;
  onToggle: (id: string) => void;
  labelClassName: string;
}) {
  return (
    <div>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={openId === item.id}
          onToggle={() => onToggle(item.id)}
          labelClassName={labelClassName}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  item,
  open,
  onToggle,
  labelClassName,
}: {
  item: FooterAccordion;
  open: boolean;
  onToggle: () => void;
  labelClassName: string;
}) {
  const panelId = useId();
  return (
    <div className="border-b border-[#DBD4BD]/20">
      <button
        type="button"
        className="flex h-[46px] w-full items-center justify-between gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={labelClassName}>{item.label}</span>
        <PlusIcon open={open} />
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={open ? undefined : true} aria-hidden={open ? undefined : true}>
          <div className="space-y-3 border-l border-[#DBD4BD]/25 py-3 pl-3.5">
            {item.sections.map((section) => (
              <div key={section.eyebrow ?? section.action?.label ?? section.links?.[0]?.label} className="space-y-2.5">
                {section.eyebrow ? (
                  <p className="font-sans text-[13px] font-medium uppercase tracking-[0.11em] text-[#DBD4BD]/62">
                    {section.eyebrow}
                  </p>
                ) : null}
                {section.links?.map((link) => (
                  <FooterAnchor key={link.label} link={link} className={`block ${subLink}`} />
                ))}
                {section.action ? (
                  <FooterAnchor
                    link={section.action}
                    arrow
                    className={`inline-flex items-center gap-1.5 font-sans text-[13px] font-medium uppercase tracking-[0.11em] text-[#DBD4BD] ${linkHover}`}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0 text-[#e33d4d]" fill="none" aria-hidden>
      <path d="M8 14s4.2-3.7 4.2-7.1A4.2 4.2 0 0 0 8 2.7a4.2 4.2 0 0 0-4.2 4.2C3.8 10.3 8 14 8 14Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="6.8" r="1.3" fill="currentColor" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-[#e33d4d]" fill="none" aria-hidden>
      <rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="m2.4 4.2 5.6 4.2 5.6-4.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0 text-[#e33d4d]" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.2V8l2 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" aria-hidden>
      <circle cx="8" cy="5.1" r="2.15" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.6 12.6c.8-1.9 2.4-2.8 4.4-2.8s3.6.9 4.4 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-[#e33d4d]" fill="none" aria-hidden>
      <path
        d="M6.1 3.2 5.2 4.8c-.4.7-.3 1.5.2 2.1l1.1 1.1a6.6 6.6 0 0 0 2.6 2.6l1.1 1.1c.6.5 1.4.6 2.1.2l1.6-.9c.4-.2.5-.7.3-1.1l-.8-1.5a.8.8 0 0 0-.9-.4l-1.5.4a8.7 8.7 0 0 1-4.2-4.2l.4-1.5a.8.8 0 0 0-.4-.9L5 2.9a.8.8 0 0 0-1.1.3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Footer() {
  const [treatmentOpen, setTreatmentOpen] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState<string | null>(null);

  return (
    <footer id="footer" className="overflow-x-hidden bg-[#331110] font-sans text-[#F7F3F5]">
      <div className="mx-auto w-full max-w-[1540px] px-6 pt-12 pb-8 min-[810px]:px-12 min-[810px]:pt-16 min-[1200px]:px-[35px] min-[1200px]:pt-[88px]">
        <div className="grid gap-y-8 min-[810px]:grid-cols-3 min-[810px]:gap-x-6 min-[1200px]:grid-cols-4 min-[1200px]:gap-x-8 xl:gap-x-14">
          <div className="min-[810px]:col-span-3 min-[1200px]:col-span-1">
            <div className="mx-auto flex w-full max-w-[420px] flex-col items-center text-center min-[1200px]:mx-0 min-[1200px]:max-w-none min-[1200px]:items-start min-[1200px]:text-left">
              <Image
                src={assets.logo}
                alt="Leader Health"
                width={8103}
                height={554}
                className="h-[30px] w-full object-contain object-left min-[1200px]:h-[30px]"
              />
              <p className="mt-2 hidden max-w-[220px] font-sans text-[13px] leading-[22px] tracking-[0.08em] text-[#DBD4BD]/62 min-[1200px]:block">
                PHYSICIAN-LED CARE / FOR THE LONG RUN.
              </p>
              <p className="mt-3 font-sans text-[13px] leading-[22px] tracking-[0.08em] text-[#DBD4BD]/62 uppercase min-[1200px]:hidden">
                Physician-led care for the long run
              </p>
              <form
                className="mt-4 flex h-[52px] w-full items-center gap-2 rounded-full border border-white/10 bg-[#290d0c] py-[5px] pr-[5px] pl-5 min-[1200px]:max-w-[279px]"
                action={`mailto:${site.email}`}
                method="get"
              >
                <div className="relative min-w-0 flex-1">
                  <input
                    type="email"
                    name="body"
                    required
                    placeholder=" "
                    aria-label="Email address"
                    className="peer w-full bg-transparent text-[15px] leading-none text-[#F7F3F5] outline-none"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center text-[15px] text-[#DBD4BD]/50 peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden min-[1200px]:hidden">
                    Email for protocol notes
                  </span>
                  <span className="pointer-events-none absolute inset-0 hidden items-center text-[15px] text-[#DBD4BD]/50 peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden min-[1200px]:flex">
                    Your Email Here
                  </span>
                </div>
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="grid size-[42px] shrink-0 place-items-center rounded-full bg-[#e33d4d] text-white transition-colors duration-200 hover:bg-[#c93240] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ArrowIcon className="size-4" />
                </button>
              </form>
              <p className="mt-3 max-w-[326px] font-sans text-[14px] leading-[1.55] tracking-[-0.02em] text-[#DBD4BD]/62">
                Clinical updates and restock notices. Unsubscribe anytime.
              </p>
            </div>
          </div>

          <div>
            <ColumnTitle>Treatments</ColumnTitle>
            <div className="mt-5">
              <AccordionList
                items={treatmentAccordions.slice(0, 4)}
                openId={treatmentOpen}
                onToggle={(id) => setTreatmentOpen((current) => (current === id ? null : id))}
                labelClassName="font-sans text-[16px] font-medium tracking-[-0.02em] text-[#F7F3F5]"
              />
              <div className="border-b border-[#DBD4BD]/20">
                <Link
                  href="/advanced-peptides"
                  className={`flex h-[46px] items-center justify-between gap-3 font-sans text-[16px] font-medium tracking-[-0.02em] text-[#F7F3F5] ${linkHover}`}
                >
                  Peptides
                  <ArrowIcon />
                </Link>
              </div>
              <AccordionList
                items={treatmentAccordions.slice(4)}
                openId={treatmentOpen}
                onToggle={(id) => setTreatmentOpen((current) => (current === id ? null : id))}
                labelClassName="font-sans text-[16px] font-medium tracking-[-0.02em] text-[#F7F3F5]"
              />
            </div>
          </div>

          <div>
            <ColumnTitle>Who We Are</ColumnTitle>
            <ul className="mt-5 space-y-[13px]">
              {whoLinks.map((link) => (
                <li key={link.href}>
                  <FooterAnchor link={link} className={textLink} />
                </li>
              ))}
              <li className="pt-1">
                <a
                  href={PORTAL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-[37px] items-center gap-2 rounded-[12px] border border-[#F7F3F5]/70 bg-[rgba(227,79,94,0.6)] px-3 font-sans text-[15px] font-medium text-[#F7F3F5] transition-colors duration-200 hover:bg-[rgba(227,79,94,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Patient portal
                  <UserIcon />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <ColumnTitle>Legal</ColumnTitle>
            <ul className="mt-5 space-y-[13px]">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <FooterAnchor link={link} className={textLink} />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <AccordionList
                items={legalAccordions}
                openId={legalOpen}
                onToggle={(id) => setLegalOpen((current) => (current === id ? null : id))}
                labelClassName="font-sans text-[13px] font-medium uppercase tracking-[0.11em] text-[#DBD4BD]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-[#2A100F]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#DBD4BD]/8" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#DBD4BD]/8" />
      <div className="mx-auto grid w-full max-w-[1540px] gap-8 px-6 py-8 min-[810px]:px-12 min-[1200px]:grid-cols-[minmax(0,1fr)_auto] min-[1200px]:items-center min-[1200px]:px-24 min-[1200px]:py-6">
        <div className="flex items-center gap-4">
          <a
            href="https://www.legitscript.com/websites/?checker_keywords=leaderhealth.clinic"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Image src={legitScript} alt="LegitScript Certified" width={292} height={316} className="h-[109px] w-[101px] object-contain" />
          </a>
          <p className="max-w-[386px] font-sans text-[14px] leading-[1.55] tracking-[-0.02em] text-[#DBD4BD]/62">
            Treatment plans are written by licensed U.S. clinicians after review of your intake and lab work. No plan is issued without a provider consultation.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-10">
          <div className="space-y-3 font-sans text-[14px] leading-[1.2] text-[#F7F3F5]">
            <p className="flex gap-2">
              <PinIcon />
              <a href={site.addressHref} className={linkHover}>
                Address: 321 S Persimmon, Tomball, TX 77375
              </a>
            </p>
            <p className="flex gap-2">
              <ClockIcon />
              <span>
                Hours: Tue–Sat, 9am–5pm CT
                <span className="mt-1 block text-[#DBD4BD]/62">Sun–Mon, closed</span>
              </span>
            </p>
          </div>
          <div className="space-y-3 font-sans text-[14px] leading-[1.2] text-[#F7F3F5]">
            <p className="flex items-center gap-2">
              <MailIcon />
              <a href={`mailto:${site.email}`} className={linkHover}>
                Help@myleaderhealth.com
              </a>
            </p>
            <p className="flex items-center gap-2">
              <PhoneIcon />
              <a href={site.phoneHref} className={linkHover}>
                {site.phone}
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>

      <div className="mx-auto w-full max-w-[1540px] px-6 pt-8 min-[810px]:px-12 min-[1200px]:px-24 min-[1200px]:pt-12">
        <Image
          src={wordmark}
          alt=""
          width={2126}
          height={166}
          className="h-auto w-full"
          aria-hidden
        />
      </div>

      <div className="mx-auto w-full max-w-[1540px] px-6 pt-6 pb-4 min-[810px]:px-12 min-[1200px]:px-24">
        <p className="font-sans text-[13px] leading-[1.8] tracking-[0.03em] text-[#DBD4BD]/62">{site.legalNote}</p>
      </div>

      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#DBD4BD]/8" />
      <div className="mx-auto flex w-full max-w-[1540px] items-center justify-between gap-4 px-6 py-4 min-[810px]:px-12 min-[1200px]:px-24">
        <p className="font-sans text-[13px] tracking-[0.06em] text-[#DBD4BD]/62">© 2026 Leader Health. All rights reserved.</p>
        <a
          href="#top"
          className={`font-sans text-[13px] tracking-[0.09em] text-[#DBD4BD] uppercase ${linkHover} focus-visible:outline-offset-4`}
        >
          Back to top
        </a>
      </div>
      </div>
    </footer>
  );
}
