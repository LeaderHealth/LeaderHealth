"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { setAffiliateActiveAction, setAffiliatePasswordAction } from "@/app/admin/affiliates/actions";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const actionClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function AccountActions({
  code,
  name,
  active,
  layout = "inline",
}: {
  code: string;
  name: string;
  active: boolean;
  layout?: "inline" | "stack";
}) {
  const titleId = useId();
  const passwordButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (!passwordOpen) return;
    passwordRef.current?.focus();
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPasswordOpen(false);
        passwordButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>("button, input")];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !root.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [passwordOpen]);

  function closePassword() {
    setPasswordOpen(false);
    passwordButtonRef.current?.focus();
  }

  return (
    <>
      <div
        className={layout === "stack" ? "flex flex-col gap-2" : "grid grid-cols-1 gap-2 min-[420px]:grid-cols-2"}
        role="group"
        aria-label={`Actions for ${name}`}
      >
        <form action={setAffiliateActiveAction} className="min-w-0">
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="active" value={active ? "false" : "true"} />
          <button type="submit" className={`${actionClass} w-full`}>
            {active ? "Deactivate" : "Activate"}
          </button>
        </form>
        <button
          ref={passwordButtonRef}
          type="button"
          onClick={() => setPasswordOpen(true)}
          className={`${actionClass} w-full`}
        >
          Set password
        </button>
      </div>
      {passwordOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close password dialog" className="absolute inset-0 bg-ink/40" onClick={closePassword} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-md rounded-[28px] bg-white p-8 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  Set password
                </h2>
                <p className="mt-2 text-sm text-brown">Choose a portal password for {name}. Use 8–128 characters.</p>
                <form action={setAffiliatePasswordAction} className="mt-6">
                  <input type="hidden" name="code" value={code} />
                  <label className="block text-sm font-medium text-ink" htmlFor={`portal-password-${code}`}>
                    Password
                    <input
                      ref={passwordRef}
                      id={`portal-password-${code}`}
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder="8 or more characters"
                      className={fieldClass}
                    />
                  </label>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="submit" className={buttonClass}>
                      Save password
                    </button>
                    <button
                      type="button"
                      onClick={closePassword}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
