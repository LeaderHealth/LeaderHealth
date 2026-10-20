"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type AffiliatePromoDetail = {
  code: string;
  mode: string;
  discount: string;
  scope: string;
  usage: string;
  validUntil: string;
  status: "Active" | "Inactive" | "Expired";
};

const actionClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const closeClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function statusClass(status: AffiliatePromoDetail["status"]) {
  if (status === "Active") return "bg-rose text-ink";
  return "border border-ink/30 text-brown";
}

function Status({ status }: { status: AffiliatePromoDetail["status"] }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusClass(status)}`}>
      {status}
    </span>
  );
}

export function AffiliatePromoCodes({
  name,
  code,
  promos,
  unavailable,
}: {
  name: string;
  code: string;
  promos: AffiliatePromoDetail[];
  unavailable: boolean;
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    const root = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button")].filter((item) => !item.hasAttribute("disabled"));
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

  if (unavailable) return <span className="text-brown">Unavailable</span>;

  const countLabel = promos.length === 1 ? "1 promo code" : `${promos.length} promo codes`;

  return (
    <div>
      {promos.length === 0 ? (
        <span className="text-brown">None</span>
      ) : (
        <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={actionClass}>
          View
        </button>
      )}
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close promo codes" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-5xl flex-col rounded-[28px] bg-white p-4 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Promo codes
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {name} · {code} · {countLabel}
                </p>
                <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                  {promos.length === 0 ? (
                    <p className="text-sm text-brown">No promo codes are assigned to this affiliate.</p>
                  ) : (
                    <>
                      <ul className="xl:hidden">
                        {promos.map((promo) => (
                          <li key={promo.code} className="border-t border-ink/10 py-5 first:border-t-0 first:pt-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 break-all font-medium">{promo.code}</div>
                              <Status status={promo.status} />
                            </div>
                            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm leading-6">
                              <div>
                                <dt className="text-xs text-brown">Mode</dt>
                                <dd className="mt-1">{promo.mode}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-brown">Discount</dt>
                                <dd className="mt-1 break-words">{promo.discount}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-brown">Scope</dt>
                                <dd className="mt-1 break-words">{promo.scope}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-brown">Usage</dt>
                                <dd className="mt-1 break-words">{promo.usage}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-xs text-brown">Valid until</dt>
                                <dd className="mt-1 break-words">{promo.validUntil}</dd>
                              </div>
                            </dl>
                          </li>
                        ))}
                      </ul>
                      <table className="hidden w-full table-fixed border-collapse text-left text-sm leading-6 xl:table">
                        <caption className="sr-only">Promo codes assigned to {name}</caption>
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[12%]" />
                          <col className="w-[16%]" />
                          <col className="w-[14%]" />
                          <col className="w-[14%]" />
                          <col className="w-[14%]" />
                          <col className="w-[12%]" />
                        </colgroup>
                        <thead className="text-brown">
                          <tr>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Code</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Mode</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Discount</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Scope</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Usage</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Valid until</th>
                            <th scope="col" className="px-3 py-3 align-bottom font-medium leading-snug">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promos.map((promo) => (
                            <tr key={promo.code} className="border-t border-rose/60">
                              <td className="break-all px-3 py-4 align-top font-medium">{promo.code}</td>
                              <td className="px-3 py-4 align-top">{promo.mode}</td>
                              <td className="break-words px-3 py-4 align-top">{promo.discount}</td>
                              <td className="break-words px-3 py-4 align-top">{promo.scope}</td>
                              <td className="break-words px-3 py-4 align-top">{promo.usage}</td>
                              <td className="break-words px-3 py-4 align-top">{promo.validUntil}</td>
                              <td className="px-3 py-4 align-top">
                                <Status status={promo.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
                <div className="mt-6">
                  <button type="button" onClick={() => setOpen(false)} className={closeClass}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
