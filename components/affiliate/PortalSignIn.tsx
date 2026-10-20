"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

type Role = "affiliate" | "admin";
type Method = "password" | "link";

const fieldClass =
  "h-12 w-full rounded-full border border-[#eadfe0] bg-white pl-11 text-sm text-ink placeholder:text-[#b7a6a4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const affiliateSlides = [
  {
    id: "track",
    label: "Track",
    text: "Follow every referral from first click to completed consult, with your own trackable link.",
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
    text: "Set commission rules and watch each partner's totals update from paid orders.",
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
}) {
  const affiliate = role === "affiliate";
  const slides = affiliate ? affiliateSlides : adminSlides;
  const [method, setMethod] = useState<Method>(affiliate && emailLinks && initialMethod === "link" ? "link" : "password");
  const [email, setEmail] = useState("");
  const [slide, setSlide] = useState(0);
  const linkForm = method === "link" && emailLinks && linkAction;
  const describedBy = invalid ? errorId : undefined;
  const supportLabel = affiliate ? "Contact affiliate support" : "Contact support";
  const other = affiliate
    ? { href: "/admin/affiliates", label: "Admin sign-in" }
    : { href: "/affiliates", label: "Affiliate sign-in" };

  return (
    <div className="min-h-screen bg-[#efecee] px-3 pt-28 pb-16 text-ink sm:px-4 sm:pt-32 sm:pb-20 lg:px-5 lg:pb-24">
      <div className="mx-auto grid w-full max-w-[1180px] items-stretch gap-3 lg:min-h-[calc(100vh-9rem)] lg:grid-cols-2">
        <section className="flex flex-col justify-center rounded-[28px] bg-[#fbf8f8] px-6 py-10 sm:px-10 lg:px-12">
          <Brand badge={affiliate ? "Affiliates" : "Admin"} />
          <h1 className="mt-10 max-w-sm text-[2.65rem] leading-[1.02] font-medium tracking-[-0.035em] text-ink sm:text-5xl">
            {affiliate ? (
              <>
                Welcome back,
                <br />
                partner.
              </>
            ) : (
              "Welcome back."
            )}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#8d7370]">
            {linkForm
              ? "We'll email a one-time sign-in link to the address on your affiliate account. It expires in 15 minutes and works once."
              : affiliate
                ? "Log in to your affiliate dashboard to track referrals, commissions, and payouts."
                : "Log in to manage affiliate accounts, tracking links, orders, and payouts."}
          </p>
          {error ? (
            <p id={errorId} role="alert" className="mt-6 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
              {error}
            </p>
          ) : null}
          {sent && linkForm ? (
            <p role="status" className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm text-ink">
              Check your email for a sign-in link. It expires in 15 minutes and works once.
            </p>
          ) : null}
          {ready ? (
            <form action={linkForm ? linkAction : loginAction} className="mt-8 flex max-w-md flex-col gap-5">
              <Field label="Email" id={affiliate ? "portal-email" : "admin-email"}>
                <MailIcon />
                <input
                  id={affiliate ? "portal-email" : "admin-email"}
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete={linkForm ? "email" : "username"}
                  placeholder="you@yourbrand.com"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  className={fieldClass}
                />
              </Field>
              {linkForm ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMethod("password")}
                    className="text-sm text-accent hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Sign in with password
                  </button>
                </div>
              ) : (
                <Field
                  label="Password"
                  id={affiliate ? "portal-password" : "password"}
                  aside={
                    emailLinks ? (
                      <button
                        type="button"
                        onClick={() => setMethod("link")}
                        className="text-sm text-accent hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Forgot password?
                      </button>
                    ) : (
                      <Link
                        href="/contact-us"
                        className="text-sm text-accent hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
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
              )}
              {linkForm ? null : (
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="remember"
                    className="size-4 rounded border-[#d9cccb] accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                  Keep me signed in on this device
                </label>
              )}
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {linkForm ? "Email me a sign-in link" : "Log in to dashboard"}
                <ArrowIcon />
              </button>
            </form>
          ) : (
            <p className="mt-8 max-w-md text-sm leading-6 text-ink">{unconfigured}</p>
          )}
          <p className="mt-8 text-center text-sm text-[#8d7370]">
            Trouble logging in?{" "}
            <Link
              href="/contact-us"
              className="text-accent hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {supportLabel}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm">
            <Link
              href={other.href}
              className="text-[#8d7370] underline decoration-[#8d7370]/40 underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
          <PortalMark />
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
            <p className="mt-4 max-w-md text-sm leading-6 text-[#6d5552]">{slides[slide].text}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Brand({ badge }: { badge: string }) {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
      <PlusMark />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">Leader Health</span>
      <span className="rounded-full bg-[#f6d5d8] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
        {badge}
      </span>
    </Link>
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

function PortalMark() {
  return (
    <div className="flex flex-1 items-center justify-center py-6">
      <svg viewBox="0 0 460 280" className="w-full max-w-[420px]" aria-hidden>
        <rect x="28" y="214" width="390" height="12" rx="6" fill="#321110" />
        <path d="M72 214V128c0-58 46-104 104-104s104 46 104 104v86" fill="#e23d4d" />
        <path d="M112 214V136c0-36 28-64 64-64s64 28 64 64v78" fill="#f7f1f2" />
        <circle cx="318" cy="78" r="68" fill="#321110" />
        <circle cx="318" cy="78" r="38" fill="#f08a96" />
        <path d="M286 214a72 72 0 0 1 72-72v72z" fill="#e4dcc8" />
      </svg>
    </div>
  );
}

function PlusMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-accent" aria-hidden>
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
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
