"use client";

import { forwardRef, useState } from "react";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className = "", id, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative mt-2 block">
      <input
        ref={ref}
        id={id}
        {...props}
        type={visible ? "text" : "password"}
        className={`min-h-11 w-full rounded-full border border-ink/40 bg-background py-3 pr-12 pl-4 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-brown hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  );
});

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
      <path
        d="M3 3.5 21 20.5M10.5 10.7a3 3 0 0 0 4.2 4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7.2 7.4C4.7 9 2.5 12 2.5 12S6.5 18.5 12 18.5c1.5 0 2.9-.4 4.1-1M16.8 16.2C19.4 14.6 21.5 12 21.5 12S17.5 5.5 12 5.5c-.8 0-1.6.1-2.3.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
