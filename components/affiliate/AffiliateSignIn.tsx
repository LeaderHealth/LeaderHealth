"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/affiliate/PasswordInput";

type Method = "password" | "link";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "mt-auto inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const panelClass =
  "mt-6 flex min-h-[22.5rem] w-full max-w-md flex-col gap-5 rounded-[28px] border border-ink/15 bg-white p-8";

const switchClass =
  "w-fit text-sm text-ink underline decoration-ink/40 underline-offset-4 hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function AffiliateSignIn({
  emailLinks,
  invalid,
  initialMethod,
  loginAction,
  linkAction,
}: {
  emailLinks: boolean;
  invalid: boolean;
  initialMethod: Method;
  loginAction: (formData: FormData) => void | Promise<void>;
  linkAction: (formData: FormData) => void | Promise<void>;
}) {
  const [method, setMethod] = useState<Method>(emailLinks && initialMethod === "link" ? "link" : "password");
  const [email, setEmail] = useState("");
  const describedBy = invalid ? "affiliate-portal-error" : undefined;

  return (
    <div className="mt-6">
      {method === "link" ? (
        <form action={linkAction} aria-labelledby="affiliate-link-title" className={panelClass}>
          <h2 id="affiliate-link-title" className="text-2xl text-ink">
            Email me a link
          </h2>
          <p className="text-sm text-taupe">We will send a one-time link to the email on your affiliate account.</p>
          <EmailField email={email} onEmail={setEmail} invalid={invalid} describedBy={describedBy} id="portal-link-email" />
          <button type="submit" className={buttonClass}>
            Send link
          </button>
          <button type="button" className={switchClass} onClick={() => setMethod("password")}>
            Sign in with email and password
          </button>
        </form>
      ) : (
        <form action={loginAction} aria-labelledby="affiliate-password-title" className={panelClass}>
          <h2 id="affiliate-password-title" className="text-2xl text-ink">
            Sign in
          </h2>
          <EmailField email={email} onEmail={setEmail} invalid={invalid} describedBy={describedBy} id="portal-email" />
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="portal-password">
              Password
            </label>
            <PasswordInput
              id="portal-password"
              name="password"
              required
              autoComplete="current-password"
              aria-invalid={invalid || undefined}
              aria-describedby={describedBy}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Sign in
          </button>
          {emailLinks ? (
            <button type="button" className={switchClass} onClick={() => setMethod("link")}>
              Email me a sign-in link
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}

function EmailField({
  id,
  email,
  onEmail,
  invalid,
  describedBy,
}: {
  id: string;
  email: string;
  onEmail: (value: string) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink" htmlFor={id}>
        Email
      </label>
      <input
        id={id}
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        autoComplete={id === "portal-email" ? "username" : "email"}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={fieldClass}
      />
    </div>
  );
}
