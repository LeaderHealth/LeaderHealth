"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { assignPromoCodeAction, unassignPromoCodeAction } from "@/app/admin/affiliates/actions";
import type { PromoAffiliate, PromoCodeRow } from "@/lib/genhealth/promocodes";

const fieldClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export type AssignableAffiliate = {
  code: string;
  name: string;
};

function sameSlug(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function AssignPromoCode({
  code,
  mode,
  affiliates,
  accounts,
  className = "",
}: {
  code: string;
  mode: PromoCodeRow["mode"];
  affiliates: PromoAffiliate[];
  accounts: AssignableAffiliate[];
  className?: string;
}) {
  const titleId = useId();
  const selectId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const [open, setOpen] = useState(false);
  const [affiliate, setAffiliate] = useState("");

  function openDialog() {
    const matches = accounts.filter((account) => affiliates.some((item) => sameSlug(item.utmSlug, account.code)));
    setAffiliate(matches.length === 1 ? matches[0].code : "");
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    (selectRef.current ?? dialogRef.current?.querySelector<HTMLElement>("button"))?.focus();
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), select")];
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
  }, [open]);

  const selected = accounts.find((account) => account.code === affiliate);
  const assigned = Boolean(selected && affiliates.some((item) => sameSlug(item.utmSlug, selected.code)));
  const holders = affiliates.map((item) => {
    const account = accounts.find((entry) => sameSlug(entry.code, item.utmSlug));
    return account ? `${account.name} (${account.code})` : item.utmSlug;
  });
  const replaces = mode === "Locked" && !assigned && holders.length > 0;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openDialog}
        className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
      >
        Assign
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close assign dialog" className="absolute inset-0 bg-ink/40" onClick={closeDialog} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-md rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="break-all text-2xl">
                  Assign {code}
                </h2>
                <p className="mt-2 text-sm text-brown">Choose the affiliate who should use this Gen Health promo code.</p>
                <p className="mt-4 break-words text-sm text-ink">
                  {holders.length === 0 ? "Available. This code is not assigned yet." : `Assigned to ${holders.join(", ")}.`}
                </p>
                {accounts.length === 0 ? (
                  <p className="mt-6 text-sm text-ink">No affiliates yet.</p>
                ) : (
                  <label className="mt-6 block text-sm font-medium text-ink" htmlFor={selectId}>
                    Affiliate
                    <select
                      ref={selectRef}
                      id={selectId}
                      value={affiliate}
                      onChange={(event) => setAffiliate(event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Choose an affiliate</option>
                      {accounts.map((account) => (
                        <option key={account.code} value={account.code}>
                          {account.name} ({account.code})
                          {affiliates.some((item) => sameSlug(item.utmSlug, account.code)) ? " — assigned" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {replaces ? (
                  <p className="mt-4 text-sm text-ink">This code is locked. Assigning it here replaces the current affiliate.</p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  {assigned && selected ? (
                    <form action={unassignPromoCodeAction}>
                      <input type="hidden" name="code" value={code} />
                      <input type="hidden" name="affiliate" value={selected.code} />
                      <button type="submit" className={buttonClass}>
                        Remove
                      </button>
                    </form>
                  ) : (
                    <form action={assignPromoCodeAction}>
                      <input type="hidden" name="code" value={code} />
                      <input type="hidden" name="affiliate" value={affiliate} />
                      <button type="submit" className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-40`} disabled={!affiliate}>
                        Assign
                      </button>
                    </form>
                  )}
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
