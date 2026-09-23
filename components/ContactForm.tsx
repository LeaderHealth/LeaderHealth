"use client";

import { FormEvent, useMemo, useState } from "react";
import { site } from "@/lib/content/site";

const fieldClass =
  "mt-2 w-full rounded-2xl border-0 bg-[#f3d4d2] px-4 py-3.5 text-sm text-ink placeholder:text-[#9a6f6c] outline-none disabled:opacity-70";

type SendStatus = "idle" | "loading" | "success" | "error";

const emptyFields = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [fields, setFields] = useState(emptyFields);
  const [status, setStatus] = useState<SendStatus>("idle");

  const complete = useMemo(
    () => Object.values(fields).every((value) => value.trim().length > 0),
    [fields],
  );

  const busy = status === "loading" || status === "success";

  function update(field: keyof typeof emptyFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    if (status === "error" || status === "success") setStatus("idle");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!complete || status === "loading" || status === "success") return;

    setStatus("loading");
    try {
      const body = `Name: ${fields.name.trim()}\nEmail: ${fields.email.trim()}\n\n${fields.message.trim()}`;
      const href = `mailto:${site.email}?subject=${encodeURIComponent(fields.subject.trim())}&body=${encodeURIComponent(body)}`;
      if (href.length > 1800) {
        throw new Error("Message is too long to send from this form.");
      }
      await wait(800);
      setStatus("success");
      window.location.assign(href);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] bg-[linear-gradient(165deg,#7a3336_0%,#4a181c_55%,#321112_100%)] p-8 text-white shadow-lg shadow-ink/10 md:p-10"
    >
      <div className="flex justify-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1a0c0c]">
          <HeadsetIcon />
        </span>
      </div>
      <h3 className="mt-5 text-center text-[22px] leading-snug">
        We&apos;d love to help! Let us know how
      </h3>

      <label className="mt-8 block text-[13px]">
        Full Name <span className="text-[#f2c6c3]">*</span>
        <input
          required
          name="name"
          autoComplete="name"
          placeholder="Enter your full name"
          value={fields.name}
          disabled={busy}
          onChange={(e) => update("name", e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-[13px]">
        Email Address <span className="text-[#f2c6c3]">*</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Your@email.com"
          value={fields.email}
          disabled={busy}
          onChange={(e) => update("email", e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-[13px]">
        Subject Of Interest <span className="text-[#f2c6c3]">*</span>
        <input
          required
          name="subject"
          placeholder="Summary of what we can help with"
          value={fields.subject}
          disabled={busy}
          onChange={(e) => update("subject", e.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="mt-5 block text-[13px]">
        How may we assist you? <span className="text-[#f2c6c3]">*</span>
        <textarea
          required
          name="message"
          rows={5}
          placeholder="Full details of your inquiry so we can better assist you"
          value={fields.message}
          disabled={busy}
          onChange={(e) => update("message", e.target.value)}
          className={`${fieldClass} resize-y`}
        />
      </label>

      <SendMessageButton status={status} disabled={!complete} />
    </form>
  );
}

function SendMessageButton({
  status,
  disabled,
}: {
  status: SendStatus;
  disabled: boolean;
}) {
  const visual: SendStatus | "disabled" =
    status === "idle" && disabled ? "disabled" : status;

  const styles: Record<typeof visual, string> = {
    idle: "bg-[#581e24] text-white hover:bg-[#6e262e] active:bg-[#4a191e]",
    loading: "cursor-wait bg-[#581e24] text-white shadow-[0_12px_24px_rgba(232,84,40,0.48)]",
    disabled: "cursor-not-allowed bg-[#321618] text-white/35",
    success: "bg-[#b4232e] text-white shadow-[0_12px_24px_rgba(90,170,55,0.38)]",
    error: "bg-[#d3222a] text-white shadow-[0_12px_24px_rgba(220,40,40,0.5)]",
  };

  const label =
    visual === "success"
      ? "Thank you"
      : visual === "error"
        ? "Something went wrong"
        : "Send Your Message";

  return (
    <button
      type="submit"
      disabled={visual === "disabled" || visual === "loading" || visual === "success"}
      aria-busy={visual === "loading"}
      aria-live="polite"
      className={`mt-8 flex h-12 w-full items-center justify-center rounded-full text-sm transition-[background-color,box-shadow,color] duration-200 disabled:opacity-100 ${styles[visual]}`}
    >
      {visual === "loading" ? <Spinner /> : label}
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M12 4a8 8 0 0 1 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden>
      <path
        d="M4.5 12.5v-1A7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 7.5 7.5v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="3" y="11.5" width="4.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="16.5" y="11.5" width="4.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M21 16.5v1.2A3.3 3.3 0 0 1 17.7 21H13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="20.2" r="1.3" fill="currentColor" />
    </svg>
  );
}
