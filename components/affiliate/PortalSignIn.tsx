"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PortalBrand } from "./PortalBrand";

type Role = "affiliate" | "admin";
type Method = "password" | "link" | "reset";

const fieldClass =
  "h-12 w-full rounded-full border border-[#eadfe0] bg-white pl-11 text-sm text-ink placeholder:text-[#b7a6a4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const affiliateSlides = [
  {
    id: "track",
    label: "Track",
    text: "Follow every referral from first click to a completed consult.",
  },
  {
    id: "earn",
    label: "Earn",
    text: "See paid orders and the commission you earn on each one.",
  },
  {
    id: "paid",
    label: "Get paid",
    text: "Review payouts as your commission is approved and marked paid.",
  },
] as const;

const adminSlides = [
  {
    id: "track",
    label: "Track",
    text: "See every affiliate click, paid order, and the link that brought it in.",
  },
  {
    id: "earn",
    label: "Earn",
    text: "Set commission rules and watch partner totals from paid orders.",
  },
  {
    id: "paid",
    label: "Get paid",
    text: "Approve monthly commission and mark payouts when they go out.",
  },
] as const;

export function PortalSignIn({
  role,
  ready,
  emailLinks,
  invalid,
  initialMethod,
  error,
  sent,
  errorId,
  unconfigured,
  loginAction,
  linkAction,
  resetAction,
}: {
  role: Role;
  ready: boolean;
  emailLinks: boolean;
  invalid: boolean;
  initialMethod: Method;
  error: string;
  sent: boolean;
  errorId: string;
  unconfigured: string;
  loginAction: (formData: FormData) => void | Promise<void>;
  linkAction?: (formData: FormData) => void | Promise<void>;
  resetAction?: (formData: FormData) => void | Promise<void>;
}) {
  const affiliate = role === "affiliate";
  const slides = affiliate ? affiliateSlides : adminSlides;
  const [method, setMethod] = useState<Method>(
    emailLinks && (initialMethod === "link" || initialMethod === "reset") ? initialMethod : "password",
  );
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [slide, setSlide] = useState(0);
  const linkForm = method === "link" && emailLinks && Boolean(linkAction);
  const resetForm = method === "reset" && emailLinks && Boolean(resetAction);
  const showNotice = sent && !editing && (linkForm || resetForm);
  const textLinkClass =
    "font-medium text-accent hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  const primaryButtonClass =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  const secondaryButtonClass =
    "inline-flex h-12 w-full items-center justify-center rounded-full border border-[#eadfe0] bg-white px-5 text-sm font-medium text-ink hover:border-ink/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  const quietLinkClass =
    "text-[#8d7370] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  function choose(next: Method) {
    setEditing(true);
    setMethod(next);
  }
  const describedBy = invalid ? errorId : undefined;
  const other = affiliate
    ? { href: "/admin/affiliates", label: "Sign in as admin" }
    : { href: "/affiliates", label: "Sign in as an affiliate" };

  return (
    <div className="min-h-screen bg-[#efecee] px-3 pt-28 pb-16 text-ink sm:px-4 sm:pt-32 sm:pb-20 lg:px-5 lg:pb-24">
      <div className="mx-auto grid w-full max-w-[1180px] items-stretch gap-3 lg:min-h-[calc(100vh-9rem)] lg:grid-cols-2">
        <section className="flex flex-col justify-center rounded-[28px] bg-[#fbf8f8] px-6 py-10 sm:px-10 lg:px-12">
          <PortalBrand badge={affiliate ? "Affiliates" : "Admin"} />
          <h1 className="mt-10 max-w-sm text-[2.65rem] leading-[1.02] font-medium tracking-[-0.035em] text-ink sm:text-5xl">
            {showNotice ? (
              "Check your email"
            ) : resetForm ? (
              "Reset your password"
            ) : linkForm ? (
              "Sign in with email"
            ) : affiliate ? (
              <>
                Welcome back,
                <br />
                partner.
              </>
            ) : (
              "Welcome back."
            )}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#8d7370]" role={showNotice ? "status" : undefined}>
            {showNotice && resetForm
              ? "We sent a link to choose a new password. It expires in 15 minutes and works once. Your current password keeps working until you save a new one."
              : showNotice && linkForm
                ? "We sent a one-time sign-in link. It expires in 15 minutes and works once. Your password is unchanged."
                : resetForm
                  ? affiliate
                    ? "Enter the email on your affiliate account. We'll send a link to choose a new password. It expires in 15 minutes and works once."
                    : "Enter the email on your team admin account. We'll send a link to choose a new password. It expires in 15 minutes and works once. The main admin still uses the site password."
                  : linkForm
                    ? affiliate
                      ? "Enter the email on your affiliate account. We'll send a one-time sign-in link. It expires in 15 minutes, works once, and does not change your password."
                      : "Enter the email on your team admin account. We'll send a one-time sign-in link. It expires in 15 minutes, works once, and does not change your password. The main admin still uses the site password."
                    : affiliate
                      ? "Log in to your affiliate dashboard to track referrals, commissions, and payouts."
                      : "Log in to manage affiliate accounts, tracking links, orders, and payouts."}
          </p>
          {error ? (
            <p id={errorId} role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
              {error}
            </p>
          ) : null}
          {ready ? (
            showNotice ? (
              <div className="mt-8 flex max-w-md flex-col gap-3">
                <button type="button" onClick={() => choose("password")} className={primaryButtonClass}>
                  Back to sign in
                  <ArrowIcon />
                </button>
                <button type="button" onClick={() => setEditing(true)} className={secondaryButtonClass}>
                  Send another link
                </button>
              </div>
            ) : (
            <form action={resetForm ? resetAction : linkForm ? linkAction : loginAction} className="mt-8 flex max-w-md flex-col gap-5">
              <Field label="Email" id={affiliate ? "portal-email" : "admin-email"}>
                <MailIcon />
                <input
                  id={affiliate ? "portal-email" : "admin-email"}
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete={linkForm || resetForm ? "email" : "username"}
                  placeholder="you@yourbrand.com"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  className={fieldClass}
                />
              </Field>
              {linkForm || resetForm ? null : (
                <>
                  <Field
                    label="Password"
                    id={affiliate ? "portal-password" : "password"}
                    aside={
                      emailLinks ? (
                        <button type="button" onClick={() => choose("reset")} className={`${textLinkClass} text-sm whitespace-nowrap`}>
                          Forgot password?
                        </button>
                      ) : (
                        <Link href="/contact-us" className={`${textLinkClass} text-sm whitespace-nowrap`}>
                          Forgot password?
                        </Link>
                      )
                    }
                  >
                    <PasswordControl
                      id={affiliate ? "portal-password" : "password"}
                      invalid={invalid}
                      describedBy={describedBy}
                    />
                  </Field>
                  <label className="flex items-center gap-2.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      name="remember"
                      className="size-4 rounded border-[#d9cccb] accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    />
                    Keep me signed in on this device
                  </label>
                </>
              )}
              <button type="submit" className={primaryButtonClass}>
                {resetForm ? "Email me a reset link" : linkForm ? "Email me a sign-in link" : "Log in to dashboard"}
                <ArrowIcon />
              </button>
              {linkForm || resetForm ? (
                <div className="-mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={() => choose("password")}
                    className="inline-flex items-center gap-2 font-medium text-ink hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <ArrowIcon className="rotate-180" />
                    Back to sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => choose(resetForm ? "link" : "reset")}
                    className={`${textLinkClass} whitespace-nowrap`}
                  >
                    {resetForm ? "Sign in with email" : "Reset password"}
                  </button>
                </div>
              ) : emailLinks ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-[#8d7370]">
                    <span className="h-px flex-1 bg-[#eadfe0]" />
                    or
                    <span className="h-px flex-1 bg-[#eadfe0]" />
                  </div>
                  <button type="button" onClick={() => choose("link")} className={secondaryButtonClass}>
                    Email me a sign-in link
                  </button>
                  <p className="text-center text-sm leading-5 text-[#8d7370]">
                    {affiliate
                      ? "No password needed. This does not change your password."
                      : "For team admins. This does not change your password."}
                  </p>
                </div>
              ) : null}
            </form>
            )
          ) : (
            <p className="mt-8 max-w-md text-sm leading-6 text-ink">{unconfigured}</p>
          )}
          <p className="mt-8 flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <Link href="/contact-us" className={quietLinkClass}>
              Contact support
            </Link>
            <span aria-hidden className="text-[#d9cccb]">
              ·
            </span>
            <Link
              href={other.href}
              className="font-medium text-ink underline decoration-ink underline-offset-4 hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {other.label}
            </Link>
          </p>
        </section>
        <aside className="flex min-h-[34rem] flex-col rounded-[28px] bg-[#f4c9c6] px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0">
          <h2 className="max-w-md text-[2rem] leading-[1.08] font-medium tracking-[-0.03em] text-ink sm:text-[2.35rem]">
            {affiliate
              ? "Your referrals, commissions, and payouts — all in one place."
              : "Affiliate accounts, commissions, and payouts — all in one place."}
          </h2>
          <AffiliatePhoto />
          <div className="rounded-[24px] bg-[#fbf8f8] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {slides.map((item, index) => {
                  const selected = index === slide;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSlide(index)}
                      className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        selected ? "bg-ink text-white" : "bg-[#f3eeef] text-ink hover:bg-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => setSlide((current) => (current + slides.length - 1) % slides.length)}
                  className="grid size-10 place-items-center rounded-full bg-[#f3eeef] text-ink hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <ArrowIcon className="rotate-180" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => setSlide((current) => (current + 1) % slides.length)}
                  className="grid size-10 place-items-center rounded-full bg-ink text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <ArrowIcon />
                </button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 whitespace-nowrap text-[#6d5552]">{slides[slide].text}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  aside,
  children,
}: {
  label: string;
  id: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-ink" htmlFor={id}>
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

function PasswordControl({ id, invalid, describedBy }: { id: string; invalid: boolean; describedBy?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <LockIcon />
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        required
        autoComplete="current-password"
        placeholder="Enter your password"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${fieldClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#8d7370] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </>
  );
}

function AffiliatePhoto() {
  return (
    <div className="relative my-6 aspect-[5/4] w-full shrink-0 overflow-hidden rounded-[24px]">
      <Image
        src="/images/affiliate-login.jpg"
        alt="Two people smiling while looking at a phone together"
        fill
        priority
        sizes="(min-width: 1024px) 36rem, 100vw"
        className="object-cover object-[center_30%]"
      />
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#b7a6a4]" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#b7a6a4]" fill="none" aria-hidden>
      <rect x="5" y="10.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-4 ${className}`} fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path d="M3 3.5 21 20.5M10.5 10.7a3 3 0 0 0 4.2 4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M7.2 7.4C4.7 9 2.5 12 2.5 12S6.5 18.5 12 18.5c1.5 0 2.9-.4 4.1-1M16.8 16.2C19.4 14.6 21.5 12 21.5 12S17.5 5.5 12 5.5c-.8 0-1.6.1-2.3.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
