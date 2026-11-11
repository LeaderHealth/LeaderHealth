"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function MediaPreview({ src, media, className }: { src: string; media: "photo" | "video"; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={`grid place-items-center bg-[#E8DEDC] text-[10px] text-brown ${className}`}>File</span>;
  if (media === "video") {
    return <video src={src} muted playsInline preload="metadata" onError={() => setFailed(true)} className={`pointer-events-none ${className}`} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => setFailed(true)} className={className} />
  );
}

export function MediaExpand({
  src,
  media,
  label,
  className,
  children,
}: {
  src: string;
  media: "photo" | "video";
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  function openMedia() {
    document.body.style.overflow = "hidden";
    setOpen(true);
  }

  function closeMedia() {
    document.body.style.overflow = "";
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Expand ${label}`}
        onClick={openMedia}
        className={className ?? "inline-flex shrink-0 cursor-zoom-in rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"}
      >
        {children}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8" onKeyDown={(event) => { if (event.key === "Escape") closeMedia(); }}>
              <button type="button" aria-label="Close expanded media" className="absolute inset-0 bg-ink/80" onClick={closeMedia} />
              <div role="dialog" aria-modal="true" aria-label={label} className="relative z-10 flex max-h-[90dvh] max-w-[min(100%,56rem)] items-center justify-center">
                <button
                  type="button"
                  aria-label="Close"
                  autoFocus
                  onClick={closeMedia}
                  className="absolute -top-3 right-0 grid size-9 place-items-center rounded-full bg-white text-ink shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:-right-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                </button>
                {broken ? (
                  <p className="rounded-2xl bg-white px-6 py-8 text-sm text-ink">This file was not saved with the post.</p>
                ) : media === "video" ? (
                  <video src={src} controls autoPlay playsInline onError={() => setBroken(true)} className="max-h-[85dvh] max-w-full rounded-2xl bg-black" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={label} onError={() => setBroken(true)} className="max-h-[85dvh] w-auto max-w-full rounded-2xl object-contain" />
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
