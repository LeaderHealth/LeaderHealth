"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MarketingAccountSections, WebsiteReportSection } from "@/components/affiliate/MarketingSections";
import { TrackedPosts, type TrackedPostCard } from "@/components/affiliate/TrackedPosts";
import type { SocialNetwork } from "@/lib/affiliate/marketing";
import type { WebsiteMonthReport } from "@/lib/affiliate/website-report";

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-ink/20 bg-white px-4 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type ReportSection = {
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  months: {
    month: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  }[];
};

export function AccountReports({
  name,
  code,
  unavailable,
  months,
  sections,
  tracked,
}: {
  name: string;
  code: string;
  unavailable: boolean;
  months: WebsiteMonthReport[];
  sections: ReportSection[];
  tracked: TrackedPostCard[];
}) {
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = dialogRef.current;
    root?.querySelector<HTMLElement>("button, a")?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll<HTMLElement>("button, a")];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      event.stopPropagation();
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={actionClass}>
        Marketing reports
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
              <button type="button" aria-label={`Close marketing reports for ${name}`} className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[min(40rem,calc(100dvh-2rem))] w-full max-w-3xl flex-col rounded-[28px] bg-white p-4 text-ink shadow-[0_24px_80px_rgba(51,17,16,0.22)] sm:p-8"
              >
                <h2 id={titleId} className="text-2xl">
                  Marketing reports
                </h2>
                <p className="mt-2 break-all text-sm text-brown">
                  {name} · {code}
                </p>
                <p className="mt-2 text-sm text-brown">These figures do not change commission or payouts.</p>
                <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
                  {unavailable ? <p className="text-sm text-ink">Marketing reports are unavailable right now.</p> : null}
                  {unavailable ? null : (
                    <>
                      <WebsiteReportSection months={months} />
                      <MarketingAccountSections sections={sections} />
                      <TrackedPosts posts={tracked} />
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Close
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
