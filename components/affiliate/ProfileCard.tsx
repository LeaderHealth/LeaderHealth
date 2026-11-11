"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PasswordInput } from "@/components/affiliate/PasswordInput";
import type { PasswordChangeState } from "@/app/affiliates/actions";

function ChangePasswordForm({
  action,
}: {
  action: (previous: PasswordChangeState, formData: FormData) => Promise<PasswordChangeState>;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [result, submitPassword, pending] = useActionState(action, null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.querySelector<HTMLElement>("input")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, input")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:w-auto md:px-6 xl:w-full"
      >
        Change password
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close change password" className="lh-popup-backdrop absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="lh-popup-panel relative w-full max-w-sm rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)]"
              >
                <h2 id={titleId} className="text-2xl">
                  Change password
                </h2>
                <form key={result?.status === "saved" ? "saved" : "edit"} action={submitPassword} className="mt-6 space-y-3">
                  {result?.status === "saved" ? (
                    <p role="status" className="rounded-2xl bg-rose px-3 py-2 text-sm text-ink">
                      Your password is saved.
                    </p>
                  ) : null}
                  {result && result.status !== "saved" ? (
                    <p role="alert" className="rounded-2xl bg-rose px-3 py-2 text-sm text-ink">
                      {PASSWORD_MESSAGES[result.status]}
                    </p>
                  ) : null}
                  <label className="block text-sm font-medium text-ink" htmlFor="current-password">
                    Current password
                    <PasswordInput id="current-password" name="current" required autoComplete="current-password" minLength={8} maxLength={128} />
                  </label>
                  <label className="block text-sm font-medium text-ink" htmlFor="new-password">
                    New password
                    <PasswordInput id="new-password" name="password" required autoComplete="new-password" minLength={8} maxLength={128} placeholder="8 or more characters" />
                  </label>
                  <div className="flex flex-wrap gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
                    >
                      Save password
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const letters = initials(name);
  if (!src || failed) {
    return (
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-rose text-sm font-medium text-ink" aria-hidden="true">
        {letters}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={44}
      height={44}
      unoptimized
      className="size-11 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

const PASSWORD_MESSAGES: Record<Exclude<NonNullable<PasswordChangeState>["status"], "saved">, string> = {
  current: "That current password didn't match.",
  weak: "Use a password of 8–128 characters.",
  unavailable: "Password change is unavailable right now.",
};

export function ProfileCard({
  name,
  email,
  role,
  avatarUrl,
  signOut,
  changePassword,
}: {
  name: string;
  email: string;
  role: "Admin" | "Main admin" | "Sub admin" | "Affiliate";
  avatarUrl: string | null;
  signOut: () => Promise<void>;
  changePassword?: (previous: PasswordChangeState, formData: FormData) => Promise<PasswordChangeState>;
}) {
  return (
    <section aria-label="Your account" className="rounded-[28px] bg-white p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-stretch">
        <div className="flex min-w-0 items-center gap-3 xl:min-w-max">
          <Avatar name={name} src={avatarUrl} />
          <div className="min-w-0 xl:min-w-max">
            <p className="break-words text-sm font-medium leading-5 text-ink">{name}</p>
            <p className="mt-1 break-all text-sm leading-5 text-brown">{email}</p>
            <p className="mt-2">
              <span className="inline-flex rounded-full bg-rose px-3 py-1 text-xs font-medium text-ink">{role}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:shrink-0">
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:w-auto md:px-6 xl:w-full"
            >
              Sign out
            </button>
          </form>
          {changePassword ? <ChangePasswordForm action={changePassword} /> : null}
        </div>
      </div>
    </section>
  );
}
