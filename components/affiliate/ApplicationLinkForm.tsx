"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_COMMISSION_PERCENT, type CommissionMode } from "@/lib/affiliate/code";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60";
const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60";

const modes: { id: CommissionMode; title: string; detail: string }[] = [
  { id: "default", title: "Standard", detail: `${DEFAULT_COMMISSION_PERCENT}% of each order, the default rate` },
  { id: "percent", title: "Custom rate", detail: "Set a different percentage" },
  { id: "fixed", title: "Flat fee", detail: "A fixed dollar amount per order" },
];

type CreatedLink = {
  url: string;
  token: string;
  commissionLabel: string;
};

function percentValue(value: string) {
  const percent = Number(value);
  if (!value.trim() || !Number.isFinite(percent)) return null;
  return percent;
}

function moneyLabel(value: string) {
  const dollars = Number(value);
  if (!value.trim() || !Number.isFinite(dollars)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}

function recipientEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email) return "";
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-sm font-medium text-white" aria-hidden="true">
      {n}
    </span>
  );
}

export function ApplicationLinkForm({
  createLink,
  sendLink,
}: {
  createLink: (formData: FormData) => Promise<{ url: string; token: string; commissionLabel: string } | { error: string }>;
  sendLink: (formData: FormData) => Promise<{ sent: true } | { error: string }>;
}) {
  const emailHintId = useId();
  const shareTitleRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState<CommissionMode>("default");
  const [percent, setPercent] = useState(String(DEFAULT_COMMISSION_PERCENT));
  const [fixed, setFixed] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (created) shareTitleRef.current?.focus();
  }, [created]);

  const customPercent = percentValue(percent);
  const fixedAmount = moneyLabel(fixed);
  const rate = mode === "fixed" ? fixedAmount : mode === "percent" ? (customPercent == null ? null : `${customPercent}%`) : `${DEFAULT_COMMISSION_PERCENT}%`;
  const rateTail = mode === "fixed" ? "on each completed order" : "of each completed order";

  if (created) {
    return (
      <div className="mt-8">
        <h3 ref={shareTitleRef} tabIndex={-1} className="text-2xl outline-none">
          Share this link
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-taupe">
          The rate is locked at {created.commissionLabel}. Copy the link, or email it.
        </p>
        <div className="mt-5 rounded-[28px] bg-background px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <StepBadge n={1} />
            <h4 className="text-base font-semibold">Link</h4>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={created.url}
              aria-label="Application link"
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-12 w-full min-w-0 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created.url);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
              className={buttonClass}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <form
          className="mt-4 rounded-[28px] bg-background px-4 py-5 sm:px-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextEmail = recipientEmail(email);
            if (!nextEmail) {
              setSentTo("");
              setSendError("Check the email address.");
              return;
            }
            setSending(true);
            setSendError("");
            const body = new FormData();
            body.set("email", nextEmail);
            body.set("link", created.token);
            const result = await sendLink(body);
            setSending(false);
            if ("sent" in result) {
              setSentTo(nextEmail);
              return;
            }
            setSentTo("");
            setSendError(result.error);
          }}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StepBadge n={2} />
            <h4 className="text-base font-semibold">Email it</h4>
            <span className="text-sm font-normal text-taupe">Optional</span>
          </div>
          <label className="mt-4 block text-sm font-medium text-ink" htmlFor="application-link-send-email">
            Recipient email
            <input
              id="application-link-send-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSentTo("");
                setSendError("");
              }}
              className="mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </label>
          <p className="mt-2 text-sm text-taupe">One click sends this link. Leave it blank if you only want to copy it.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className={buttonClass} disabled={sending || !email.trim()}>
              {sending ? "Sending…" : "Email link"}
            </button>
            {sentTo ? (
              <p role="status" className="text-sm text-ink">
                Sent to {sentTo}.
              </p>
            ) : null}
          </div>
          {sendError ? (
            <p role="alert" className="mt-3 text-sm text-ink">
              {sendError}
            </p>
          ) : null}
        </form>
        <button
          type="button"
          className={`${quietButtonClass} mt-5`}
          onClick={() => {
            setCreated(null);
            setCopied(false);
            setSentTo("");
            setSendError("");
            setError("");
          }}
        >
          Create another link
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextEmail = recipientEmail(email);
        if (nextEmail == null) {
          setError("Check the email address.");
          return;
        }
        setPending(true);
        setError("");
        const body = new FormData(event.currentTarget);
        const result = await createLink(body);
        setPending(false);
        if ("url" in result) {
          setEmail(nextEmail);
          setCreated({ url: result.url, token: result.token, commissionLabel: result.commissionLabel });
          return;
        }
        setError(result.error);
      }}
    >
      <div className="rounded-[28px] bg-background px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <StepBadge n={1} />
          <h3 className="text-base font-semibold">Commission</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Commission">
          {modes.map((option) => {
            const selected = mode === option.id;
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-white px-4 py-4 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${
                  selected ? "border-ink" : "border-ink/10 hover:border-ink/25"
                }`}
              >
                <input
                  type="radio"
                  name="commissionMode"
                  value={option.id}
                  checked={mode === option.id}
                  onChange={() => setMode(option.id)}
                  className="sr-only"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{option.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-taupe">{option.detail}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-accent" : "border-ink/25"}`}
                >
                  {selected ? <span className="size-2.5 rounded-full bg-accent" /> : null}
                </span>
              </label>
            );
          })}
        </div>
        {mode === "percent" ? (
          <label className="mt-4 block text-sm font-medium text-ink" htmlFor="application-link-percent">
            Percent
            <input
              id="application-link-percent"
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              required
              inputMode="decimal"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              className="mt-2 w-full min-h-12 max-w-xs rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </label>
        ) : null}
        {mode === "fixed" ? (
          <label className="mt-4 block text-sm font-medium text-ink" htmlFor="application-link-fixed">
            Amount per order
            <input
              id="application-link-fixed"
              name="commissionFixed"
              type="number"
              min={0}
              max={10000}
              step="0.01"
              required
              inputMode="decimal"
              placeholder="25.00"
              value={fixed}
              onChange={(event) => setFixed(event.target.value)}
              className="mt-2 w-full min-h-12 max-w-xs rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </label>
        ) : null}
        <div className="mt-5 border-t border-ink/10 pt-4">
          {rate ? (
            <p className="flex flex-wrap items-baseline gap-x-2 text-ink">
              <span className="text-sm text-taupe">Affiliate earns</span>
              <span className="text-3xl font-semibold leading-none tracking-tight">{rate}</span>
              <span className="text-sm text-taupe">{rateTail}</span>
            </p>
          ) : (
            <p className="text-sm text-taupe">{mode === "fixed" ? "Enter an amount to set the rate." : "Enter a percentage to set the rate."}</p>
          )}
        </div>
      </div>
      <div className="rounded-[28px] bg-background px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StepBadge n={2} />
          <h3 className="text-base font-semibold">Who&apos;s it for?</h3>
          <span className="text-sm font-normal text-taupe">Optional</span>
        </div>
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="application-link-email">
          Recipient email
          <input
            id="application-link-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            aria-describedby={emailHintId}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full min-h-12 rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-normal text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </label>
        <p id={emailHintId} className="mt-2 text-sm text-taupe">
          Lets you email the link in one click. Leave blank to just copy it.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "Creating…" : "Create link"}
        </button>
        <p className="text-sm text-taupe">You&apos;ll share it on the next step.</p>
      </div>
    </form>
  );
}
