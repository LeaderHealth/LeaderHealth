"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore, type ReactNode } from "react";

type Role = "affiliate" | "admin";
type Method = "password" | "link" | "reset";
type View = "signin" | "forgot" | "sent";
type Choice = "link" | "reset";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33130F]";

function fieldClass(invalid: boolean) {
  return `h-14 w-full rounded-[14px] border bg-white px-4 text-base text-[#2A1714] placeholder:text-[#B3A5A2] ${focusRing} ${invalid ? "border-[#9B2C1F]" : "border-[#CDBDBA]"}`;
}

const primaryButtonClass = `inline-flex h-14 w-full items-center justify-center rounded-full bg-[#33130F] px-5 text-base font-medium text-white hover:bg-[#4A1E19] ${focusRing}`;
const secondaryButtonClass = `inline-flex h-14 w-full items-center justify-center rounded-full border border-[#CDBDBA] bg-white px-5 text-base font-medium text-[#33130F] hover:bg-[#F5F0EF] ${focusRing}`;
const textLinkClass = `font-medium text-[#33130F] underline underline-offset-4 hover:text-[#5A2A24] ${focusRing}`;

function emailLooksValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function subscribeStoredEmail(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function readStoredEmail(key: string) {
  return window.sessionStorage.getItem(key) ?? "";
}

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
  nextPath = "",
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
  nextPath?: string;
  loginAction: (formData: FormData) => void | Promise<void>;
  linkAction?: (formData: FormData) => void | Promise<void>;
  resetAction?: (formData: FormData) => void | Promise<void>;
}) {
  const affiliate = role === "affiliate";
  const canLink = emailLinks && Boolean(linkAction);
  const canReset = emailLinks && Boolean(resetAction);
  const recovery = canLink || canReset;
  const startingChoice: Choice = initialMethod === "reset" && canReset ? "reset" : "link";
  const [view, setView] = useState<View>(sent && recovery ? "sent" : !sent && recovery && invalid && initialMethod !== "password" ? "forgot" : "signin");
  const [choice, setChoice] = useState<Choice>(startingChoice);
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState("");
  const emailKey = affiliate ? "lh-portal-email-affiliate" : "lh-portal-email-admin";
  const storedEmail = useSyncExternalStore(subscribeStoredEmail, () => readStoredEmail(emailKey), () => "");
  const [draftEmail, setDraftEmail] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState(emailKey);
  if (draftKey !== emailKey) {
    setDraftKey(emailKey);
    setDraftEmail(null);
  }
  const email = draftEmail ?? storedEmail;
  const activeChoice: Choice = choice === "reset" && canReset ? "reset" : canLink ? "link" : "reset";
  const recoveryAction = activeChoice === "reset" ? resetAction : linkAction;
  const describedBy = invalid ? errorId : undefined;
  const other = affiliate
    ? { href: "/admin/affiliates", prompt: "Leader Health team?", label: "Admin sign in" }
    : { href: "/affiliates", prompt: "Affiliate?", label: "Affiliate sign in" };

  function updateEmail(value: string) {
    setDraftEmail(value);
    setNote("");
    window.sessionStorage.setItem(emailKey, value);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F0EF] text-[#2A1714] min-[1100px]:flex-row">
      <section
        aria-label="Leader Health"
        className="relative flex flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_20%_15%,#F7F3F5_0%,#E7E0D0_48%,#DBD4BD_100%)] px-6 pt-24 pb-5 text-[#331110] min-[765px]:px-10 min-[765px]:pt-32 min-[765px]:pb-10 min-[1100px]:min-h-dvh min-[1100px]:flex-1 min-[1100px]:basis-[560px] min-[1100px]:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[140px] -bottom-[160px] size-[380px] rounded-full border border-[rgba(51,17,16,0.12)] shadow-[0_0_0_48px_rgba(51,17,16,0.04),0_0_0_96px_rgba(51,17,16,0.03)] min-[1100px]:-right-[180px] min-[1100px]:-bottom-[180px] min-[1100px]:size-[560px] min-[1100px]:shadow-[0_0_0_64px_rgba(51,17,16,0.04),0_0_0_128px_rgba(51,17,16,0.03)]"
        />
        <div className="relative flex flex-col justify-center gap-3 min-[765px]:gap-4 min-[1100px]:flex-1">
          <div className="flex items-center gap-2">
            <Image
              src="/images/lh-logo-brown.png"
              alt="Leader Health"
              width={1024}
              height={70}
              priority
              className="h-[15px] w-auto min-[765px]:h-[18px]"
            />
            <span className="rounded-full bg-[#331110] px-[9px] py-[3px] text-[11px] font-semibold tracking-[0.1em] text-[#F7F3F5]">
              {affiliate ? "AFFILIATES" : "ADMIN"}
            </span>
          </div>
          <p className="max-w-[16em] text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-balance min-[765px]:text-[40px] min-[1100px]:max-w-[12em] min-[1100px]:text-5xl">
            {affiliate ? "Share Leader Health. Track every visit, post and payout." : "Run the affiliate program in one place."}
          </p>
        </div>
        <span className="relative mt-4 text-[13px] text-[#331110]/70 min-[765px]:mt-8 min-[1100px]:absolute min-[1100px]:bottom-24 min-[1100px]:left-12 min-[1100px]:mt-0">© 2026 Leader Health</span>
      </section>

      <section aria-label={affiliate ? "Welcome back, partner" : "Admin sign in"} className="flex flex-1 items-start justify-center bg-white px-6 pt-6 pb-28 min-[765px]:px-12 min-[765px]:py-12 min-[1100px]:basis-[560px] min-[1100px]:items-center min-[1100px]:p-12">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          {ready ? (
            view === "sent" && recoveryAction ? (
              <SentView
                affiliate={affiliate}
                email={email}
                onEmail={updateEmail}
                choice={activeChoice}
                onChoice={(next) => setChoice(next)}
                canLink={canLink}
                canReset={canReset}
                action={recoveryAction}
                invalid={invalid}
                describedBy={describedBy}
                onBack={() => {
                  setNote("");
                  setView("signin");
                }}
              />
            ) : view === "forgot" && recoveryAction ? (
              <ForgotView
                affiliate={affiliate}
                email={email}
                onEmail={updateEmail}
                choice={activeChoice}
                onChoice={(next) => setChoice(next)}
                canLink={canLink}
                canReset={canReset}
                action={recoveryAction}
                invalid={invalid}
                describedBy={describedBy}
                error={error}
                errorId={errorId}
                note={note}
                onBack={() => {
                  setNote("");
                  setView("signin");
                }}
              />
            ) : (
              <SignInView
                affiliate={affiliate}
                email={email}
                onEmail={updateEmail}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                loginAction={loginAction}
                nextPath={nextPath}
                linkAction={canLink ? linkAction : undefined}
                canReset={canReset}
                invalid={invalid}
                describedBy={describedBy}
                error={error}
                errorId={errorId}
                note={note}
                onNeedEmail={() => setNote("Enter your email first, then we'll send the link.")}
                onForgot={() => {
                  setNote("");
                  setChoice(canReset && !canLink ? "reset" : "link");
                  setView("forgot");
                }}
              />
            )
          ) : (
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl leading-tight font-medium tracking-[-0.01em] min-[765px]:text-4xl">{affiliate ? "Welcome back, partner" : "Admin sign in"}</h1>
              <p className="text-base leading-normal text-[#4A3A37]">{unconfigured}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[#F0E8E6] pt-6 text-sm text-[#4A3A37]">
            <span>
              {other.prompt}{" "}
              <Link href={other.href} className={textLinkClass}>
                {other.label}
              </Link>
            </span>
            <span className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
              <Link href="/affiliates/privacy" className={`text-[#6B5A57] hover:text-[#33130F] ${focusRing}`}>
                Privacy Policy
              </Link>
              <Link href="/affiliates/terms" className={`text-[#6B5A57] hover:text-[#33130F] ${focusRing}`}>
                Terms of Service
              </Link>
              <a href="mailto:help@myleaderhealth.com" className={`text-[#6B5A57] hover:text-[#33130F] ${focusRing}`}>
                Contact support
              </a>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Alert({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="rounded-[14px] bg-[#FBE3DF] px-4 py-3 text-[15px] text-[#9B2C1F]">
      {children}
    </p>
  );
}

function EmailField({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  describedBy,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid: boolean;
  describedBy?: string;
  autoComplete: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-semibold">
        Email
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={fieldClass(invalid)}
      />
    </div>
  );
}

function SignInView({
  affiliate,
  email,
  onEmail,
  showPassword,
  onTogglePassword,
  loginAction,
  nextPath = "",
  linkAction,
  canReset,
  invalid,
  describedBy,
  error,
  errorId,
  note,
  onNeedEmail,
  onForgot,
}: {
  affiliate: boolean;
  email: string;
  onEmail: (value: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  loginAction: (formData: FormData) => void | Promise<void>;
  nextPath?: string;
  linkAction?: (formData: FormData) => void | Promise<void>;
  canReset: boolean;
  invalid: boolean;
  describedBy?: string;
  error: string;
  errorId: string;
  note: string;
  onNeedEmail: () => void;
  onForgot: () => void;
}) {
  const passwordId = affiliate ? "portal-password" : "password";
  return (
    <form action={loginAction} className="flex flex-col gap-5 min-[765px]:gap-8">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-medium tracking-[-0.01em] min-[765px]:text-4xl">{affiliate ? "Welcome back, partner" : "Admin sign in"}</h1>
        <p className="text-base leading-normal text-[#4A3A37]">
          {affiliate ? "Sign in to see your posts, stats and payouts." : "Manage affiliates, content, stats and payouts."}
        </p>
      </div>
      {error ? <Alert id={errorId}>{error}</Alert> : note ? <Alert>{note}</Alert> : null}
      <div className="flex flex-col gap-4 min-[765px]:gap-6">
        <EmailField
          id={affiliate ? "portal-email" : "admin-email"}
          value={email}
          onChange={onEmail}
          placeholder={affiliate ? "you@yourbrand.com" : "you@myleaderhealth.com"}
          invalid={invalid}
          describedBy={describedBy}
          autoComplete="username"
        />
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={passwordId} className="text-[15px] font-semibold">
              Password
            </label>
            {canReset || linkAction ? (
              <button type="button" onClick={onForgot} className={`text-sm text-[#B0303A] underline ${focusRing}`}>
                Forgot password?
              </button>
            ) : (
              <Link href="/contact-us" className={`text-sm text-[#B0303A] underline ${focusRing}`}>
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
              className={`${fieldClass(invalid)} pr-16`}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls={passwordId}
              className={`absolute top-1.5 right-1.5 h-11 rounded-xl px-3 text-sm font-medium text-[#33130F] ${focusRing}`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <label className="flex min-h-6 items-center gap-2.5 text-[15px] text-[#4A3A37]">
          <input
            type="checkbox"
            name="remember"
            className={`size-[18px] accent-[#33130F] ${focusRing}`}
          />
          Keep me signed in on this device
        </label>
      </div>
      <div className="flex flex-col gap-4">
        <button type="submit" className={primaryButtonClass}>
          {affiliate ? "Log in to dashboard" : "Sign in"}
        </button>
        {linkAction ? (
          <>
            <div className="flex items-center gap-4 text-sm text-[#8A7A77]">
              <span className="h-px flex-1 bg-[#E8DEDC]" />
              or
              <span className="h-px flex-1 bg-[#E8DEDC]" />
            </div>
            <button
              type="submit"
              formAction={linkAction}
              formNoValidate
              onClick={(event) => {
                if (!emailLooksValid(email)) {
                  event.preventDefault();
                  onNeedEmail();
                }
              }}
              className={secondaryButtonClass}
            >
              Email me a sign-in link
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

function ForgotView({
  affiliate,
  email,
  onEmail,
  choice,
  onChoice,
  canLink,
  canReset,
  action,
  invalid,
  describedBy,
  error,
  errorId,
  note,
  onBack,
}: {
  affiliate: boolean;
  email: string;
  onEmail: (value: string) => void;
  choice: Choice;
  onChoice: (choice: Choice) => void;
  canLink: boolean;
  canReset: boolean;
  action: (formData: FormData) => void | Promise<void>;
  invalid: boolean;
  describedBy?: string;
  error: string;
  errorId: string;
  note: string;
  onBack: () => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-medium tracking-[-0.01em] min-[765px]:text-4xl">Forgot your password?</h1>
        <p className="text-base leading-normal text-[#4A3A37]">
          {affiliate
            ? "Choose how you want to get back in. Either way, we'll email you a link. It expires in 15 minutes and works once."
            : "Choose how you want to get back in. Either way, we'll email you a link. It expires in 15 minutes and works once. The main admin still uses the site password."}
        </p>
      </div>
      {error ? <Alert id={errorId}>{error}</Alert> : note ? <Alert>{note}</Alert> : null}
      <div className="flex flex-col gap-5">
        <EmailField
          id={affiliate ? "portal-recovery-email" : "admin-recovery-email"}
          value={email}
          onChange={onEmail}
          placeholder="Your account email"
          invalid={invalid}
          describedBy={describedBy}
          autoComplete="email"
        />
        {canLink && canReset ? (
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-semibold">How do you want to get back in?</legend>
            <RecoveryOption
              checked={choice === "link"}
              onChange={() => onChoice("link")}
              title="Email me a sign-in link"
              detail="Sign in right away with a one-time link. Your password stays the same."
            />
            <RecoveryOption
              checked={choice === "reset"}
              onChange={() => onChoice("reset")}
              title="Reset my password"
              detail="Get a link to choose a new password, then sign in with it."
            />
          </fieldset>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-3">
        <button type="submit" className={primaryButtonClass}>
          {choice === "reset" ? "Email me a reset link" : "Email me a sign-in link"}
        </button>
        <button type="button" onClick={onBack} className={`py-1 text-sm font-medium text-[#33130F] ${focusRing}`}>
          ← Back to sign in
        </button>
      </div>
    </form>
  );
}

function SentView({
  affiliate,
  email,
  onEmail,
  choice,
  onChoice,
  canLink,
  canReset,
  action,
  invalid,
  describedBy,
  onBack,
}: {
  affiliate: boolean;
  email: string;
  onEmail: (value: string) => void;
  choice: Choice;
  onChoice: (choice: Choice) => void;
  canLink: boolean;
  canReset: boolean;
  action: (formData: FormData) => void | Promise<void>;
  invalid: boolean;
  describedBy?: string;
  onBack: () => void;
}) {
  const sentMessage =
    choice === "reset"
      ? affiliate
        ? "We sent a link to choose a new password. It expires in 15 minutes and works once. Your current password keeps working until you save a new one."
        : "We sent a link to choose a new password. It expires in 15 minutes and works once. Your current password keeps working until you save a new one. The main admin still uses the site password."
      : affiliate
        ? "We sent a one-time sign-in link. It expires in 15 minutes and works once. Your password is unchanged."
        : "We sent a one-time sign-in link. It expires in 15 minutes and works once. Your password is unchanged. The main admin still uses the site password.";
  const other = choice === "reset" ? "link" : "reset";
  const otherAvailable = other === "link" ? canLink : canReset;
  return (
    <form action={action} className="flex flex-col gap-7">
      <span aria-hidden className="grid size-14 place-items-center rounded-full bg-[#DDF0E4] text-2xl text-[#1D6340]">
        ✉
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-medium tracking-[-0.01em] min-[765px]:text-4xl">Check your email</h1>
        <p role="status" className="text-base leading-normal text-[#4A3A37]">
          {sentMessage}
        </p>
        <p className="text-sm leading-normal text-[#6B5A57]">The link works once and expires in 15 minutes. Check spam if it is not there in a few minutes.</p>
      </div>
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <EmailField
          id={affiliate ? "portal-sent-email" : "admin-sent-email"}
          value={email}
          onChange={onEmail}
          placeholder="Your account email"
          invalid={invalid}
          describedBy={describedBy}
          autoComplete="email"
        />
      )}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onBack} className={primaryButtonClass}>
          Back to sign in
        </button>
        <button type="submit" className={secondaryButtonClass}>
          Resend email
        </button>
        {otherAvailable ? (
          <button
            type="button"
            onClick={() => onChoice(other)}
            className={`self-center py-1.5 text-sm text-[#33130F] underline ${focusRing}`}
          >
            {other === "link" ? "Send a sign-in link instead" : "Reset my password instead"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function RecoveryOption({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 ${checked ? "border-2 border-[#33130F] bg-[#F5F0EF]" : "border border-[#CDBDBA] bg-white"}`}>
      <input
        type="radio"
        name="recovery"
        checked={checked}
        onChange={onChange}
        className={`mt-0.5 size-5 flex-none accent-[#33130F] ${focusRing}`}
      />
      <span className="flex flex-col gap-1">
        <span className="text-base font-semibold">{title}</span>
        <span className="text-sm leading-snug text-[#4A3A37]">{detail}</span>
      </span>
    </label>
  );
}
