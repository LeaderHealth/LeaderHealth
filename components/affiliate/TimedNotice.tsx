"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const TONE = {
  ok: "bg-[#DDF0E4] text-[#1D6340]",
  warn: "bg-[#FBE3DF] text-[#9B2C1F]",
  plain: "bg-white text-ink",
  warm: "bg-[#FBF6EC] text-[#2A1714]",
};

export function TimedNotice({
  message,
  tone = "ok",
  ms = 6000,
  query,
  onDismiss,
  children,
  className = "",
}: {
  message: string;
  tone?: keyof typeof TONE;
  ms?: number;
  query?: string;
  onDismiss?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [seen, setSeen] = useState(message);
  const dismissRef = useRef(onDismiss);
  if (message !== seen) {
    setSeen(message);
    setHidden(false);
  }

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message || hidden) return;
    const id = window.setTimeout(() => {
      setHidden(true);
      clearQuery(query);
      dismissRef.current?.();
    }, ms);
    return () => window.clearTimeout(id);
  }, [message, hidden, ms, query]);

  if (!message || hidden) return null;

  function close() {
    setHidden(true);
    clearQuery(query);
    dismissRef.current?.();
  }

  return (
    <div role={tone === "warn" ? "alert" : "status"} className={`flex items-start gap-3 rounded-[14px] px-4 py-3 text-[15px] font-medium ${TONE[tone]} ${className}`}>
      <span className="min-w-0 flex-1">{children ?? message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={close}
        className="grid size-8 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function clearQuery(query: string | undefined) {
  if (!query || typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(query)) return;
  url.searchParams.delete(query);
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
