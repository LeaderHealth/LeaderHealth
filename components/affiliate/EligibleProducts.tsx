"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 bg-white px-4 text-sm font-medium text-ink hover:bg-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function EligibleProducts({
  code,
  products,
}: {
  code: string;
  products: { category: string; items: { id: string; name: string }[] }[];
}) {
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const productCount = products.reduce((sum, group) => sum + group.items.length, 0);
  const productLabel = `${productCount} ${productCount === 1 ? "product" : "products"}`;

  function closeDialog() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
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
      const nodes = [...root.querySelectorAll<HTMLElement>("button:not([disabled])")];
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

  if (productCount === 0) {
    return <p className="text-sm text-brown">No eligible products.</p>;
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>
        Eligible products
        <span className="ml-2 font-normal text-brown">{productLabel}</span>
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label="Close eligible products" className="absolute inset-0 bg-ink/40" onClick={closeDialog} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-2xl flex-col rounded-[28px] bg-white p-6 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Eligible products
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {code} · {productLabel}
                </p>
                <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full table-fixed border-collapse text-left text-sm leading-6">
                    <caption className="sr-only">Eligible products for {code}</caption>
                    <colgroup>
                      <col className="w-[38%]" />
                      <col className="w-[62%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-white text-brown">
                      <tr>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Category
                        </th>
                        <th scope="col" className="px-3 py-3 font-medium">
                          Product
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((group) =>
                        group.items.map((product, index) => (
                          <tr key={product.id} className="border-t border-rose/60">
                            {index === 0 ? (
                              <th
                                scope="rowgroup"
                                rowSpan={group.items.length}
                                className="break-words bg-background px-3 py-3 align-top font-medium text-brown"
                              >
                                {group.category}
                              </th>
                            ) : null}
                            <td className="break-words px-3 py-3 align-top">{product.name}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <button type="button" onClick={closeDialog} className={secondaryButtonClass}>
                    Close
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
