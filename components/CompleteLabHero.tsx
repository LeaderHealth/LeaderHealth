"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { HsaFsaBadge } from "@/components/HsaFsaBadge";
import { cartLineId, parsePriceAmount, type CartItem } from "@/lib/cart/types";
import { labs } from "@/lib/content/products";

const genderNote = "*Select gender assigned at birth for the uniquely aligned biomarkers";

const legalCopy =
  "If you live in NY, NJ, or RI, and your address is serviceable, we will offer a mobile phlebotomy option for an additional $99 for traditional blood draws (venous). If you do not qualify for the mobile phlebotomy option, our at-home hormone kit is available for NJ and RI. If there are any issues due to this, we will gladly refund your money and will help with any questions or steps you have along the way. Our prescription services are available in all 50 states.";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-1.5 h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BenefitIcon({ children }: { children: ReactNode }) {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] text-[#991A29]"
      style={{ background: "rgba(228, 58, 78, 0.43)" }}
    >
      {children}
    </span>
  );
}

function GenderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex h-10 flex-1 items-center justify-center rounded-full bg-[#DF4452] font-sans text-[13px] font-medium tracking-[0.04em] text-[#F7F3F5] transition-colors duration-500 ease-[cubic-bezier(0.44,0,0.56,1)] hover:bg-[#32120E] hover:text-white"
    >
      <span className="inline-flex items-center justify-center">
        <span>{label}</span>
        <span
          aria-hidden
          className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-500 ease-[cubic-bezier(0.44,0,0.56,1)] group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100"
        >
          <span className="min-w-0 overflow-hidden">
            <ArrowIcon />
          </span>
        </span>
      </span>
    </button>
  );
}

function Stars() {
  return (
    <div className="flex gap-1 text-white" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-[14px] w-[14px]" fill="currentColor">
          <path d="m10 1.8 2.2 4.7 5.1.6-3.8 3.5 1 5.1L10 13.2 5.5 15.7l1-5.1L2.7 7.1l5.1-.6L10 1.8Z" />
        </svg>
      ))}
    </div>
  );
}

function ReadMore() {
  const [open, setOpen] = useState(false);
  const preview = legalCopy.slice(0, 160);
  return (
    <p className="w-full max-w-[391px] font-sans text-[11px] font-normal leading-[1.35]">
      <span className="block font-sans text-[12px] font-medium text-[#E4505B]">{genderNote}</span>
      <span className="mt-2 block text-[#331110]">
        {open ? legalCopy : `${preview}... `}
        <button type="button" className="underline" onClick={() => setOpen((value) => !value)}>
          {open ? "Read less" : "Read more"}
        </button>
      </span>
    </p>
  );
}

function PhonePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={457}
      height={931}
      priority
      className="h-auto w-[250px] shrink-0 drop-shadow-[0_24px_50px_rgba(80,40,36,0.18)] sm:w-[280px] lg:h-[610px] lg:w-auto"
    />
  );
}

export function CompleteLabHero({
  slug,
  image,
  price,
  name = "Complete Panel",
  biomarkers = "64 biomarkers",
  phoneSrc = "/images/complete-lab-phone.png",
  phoneAlt = "Phone showing the Complete Panel annual baseline, with 64 core biomarkers and a View Results button",
  description = "Energy, mood, and sex drive all rely on hormonal balance. This lab panel analyzes 64 key biomarkers, providing a streamlined assessment of your hormone health.",
}: {
  slug: string;
  image: string;
  price: string;
  name?: string;
  biomarkers?: string;
  phoneSrc?: string;
  phoneAlt?: string;
  description?: string;
}) {
  const { addItem } = useCart();

  function start(gender: "Men" | "Women") {
    const item: CartItem = {
      id: cartLineId(slug, gender),
      slug,
      name,
      variant: `For ${gender}`,
      href: `/labs/${slug}`,
      image,
      priceLabel: price,
      amount: parsePriceAmount(price),
      quantity: 1,
      clientProductId: labs.find((lab) => lab.slug === slug)?.clientProductIds?.[gender],
    };
    addItem(item);
  }

  return (
    <section
      className="flex items-center justify-center px-4 py-28 lg:h-[904px] lg:px-10 lg:py-0"
      style={{
        background:
          "linear-gradient(307deg, rgb(243, 218, 218) 0%, rgb(238, 208, 210) 16%, rgb(222, 211, 189) 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <PhonePreview src={phoneSrc} alt={phoneAlt} />

        <div
          className="relative flex h-auto w-[340px] flex-col overflow-hidden rounded-[20px] px-[22px] pb-5 pt-6 lg:h-[610px] lg:w-[458px] lg:px-[34px] lg:pb-6 lg:pt-8"
          style={{ background: "rgba(116, 13, 19, 0.18)" }}
        >
          <div
            className="absolute right-4 top-4 flex h-[56px] w-[120px] flex-col items-center justify-center rounded-[11px] lg:right-[28px] lg:top-[28px] lg:h-[65px]"
            style={{
              background: "rgba(249, 249, 249, 0.65)",
              boxShadow: "0px 1px 8px rgba(0, 0, 0, 0.25)",
            }}
          >
            <p className="font-sans text-[18px] font-semibold leading-[1.2] text-[#321110] lg:text-[25px]">{price}</p>
            <p className="font-sans text-[12px] font-normal leading-[1.2] text-[#E4505B]">{biomarkers}</p>
          </div>

          <Stars />
          <p className="mt-4 font-sans text-[13px] font-medium uppercase leading-[1.2] tracking-[0.03em] text-[#E4505B]">
            Diagnostic labs
          </p>
          <h1 className="mt-2 font-sans text-[20px] font-medium leading-[1.2] tracking-normal text-[#331110] lg:w-[392px] lg:text-[28px]">
            {name}
          </h1>
          <p className="mt-2 font-sans text-[11px] font-normal leading-[1.2] tracking-normal text-justify text-[rgba(84,40,39,0.85)] lg:w-[391px] lg:text-[15px]">
            {description}
          </p>

          <ul className="mt-5 space-y-3">
            <li className="flex items-center gap-3 font-sans text-[14px] font-normal leading-[1.2] text-[#321110] lg:text-[16px]">
              <BenefitIcon>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M12 8v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </BenefitIcon>
              30-minute clinician consultation included
            </li>
            <li className="flex items-center gap-3 font-sans text-[14px] font-normal leading-[1.2] text-[#321110] lg:text-[16px]">
              <BenefitIcon>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
                  <path
                    d="m5.5 12.2 4.2 4.2L18.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </BenefitIcon>
              <HsaFsaBadge tone="onLight" />
            </li>
          </ul>

          <div className="mt-5 flex items-center gap-3">
            <p className="shrink-0 font-sans text-[11px] font-medium uppercase leading-[1.2] tracking-[0.04em] text-[#E4505B] lg:text-[12px]">
              Get complete labs started for
            </p>
            <span className="h-px flex-1 bg-[#32120E]/35" />
          </div>

          <div className="mt-3 flex gap-3">
            <GenderButton label="FOR MEN" onClick={() => start("Men")} />
            <GenderButton label="FOR WOMEN" onClick={() => start("Women")} />
          </div>

          <div className="mt-3">
            <ReadMore />
          </div>
        </div>
      </div>
    </section>
  );
}
