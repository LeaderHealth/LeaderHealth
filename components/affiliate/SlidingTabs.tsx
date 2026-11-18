"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";

type Box = { x: number; y: number; w: number; h: number };

export type SlidingTabItem = {
  id: string;
  label: string;
  href?: string;
  badge?: number;
  note?: string;
  disabled?: boolean;
  hint?: string;
  current: boolean;
  onSelect?: () => void;
};

const ease = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
const SLIDE_MS = 500;

export function SlidingTabs({
  label,
  items,
  variant = "pills",
}: {
  label: string;
  items: SlidingTabItem[];
  variant?: "pills" | "track" | "outline";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const pending = useRef<number | null>(null);
  const [frames, setFrames] = useState<Record<string, Box>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [travel, setTravel] = useState<string | null>(null);
  const layoutKey = items.map((item) => `${item.id}:${item.label}:${item.note ?? ""}:${item.badge ?? ""}:${item.disabled ? 1 : 0}`).join("|");
  const active = items.find((item) => item.current && !item.disabled);
  const shownId = travel ?? active?.id;
  const activeBox = shownId ? frames[shownId] : undefined;

  useEffect(() => {
    if (travel && active?.id === travel) setTravel(null);
  }, [travel, active?.id]);

  useEffect(() => {
    return () => {
      if (pending.current != null) window.clearTimeout(pending.current);
    };
  }, []);

  function follow(event: MouseEvent<HTMLAnchorElement>, item: SlidingTabItem) {
    if (!item.href || item.id === shownId) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    setTravel(item.id);
    if (pending.current != null) window.clearTimeout(pending.current);
    const href = item.href;
    pending.current = window.setTimeout(() => {
      pending.current = null;
      router.push(href);
    }, SLIDE_MS);
  }
  const ready = Object.keys(frames).length > 0;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const rootBox = root.getBoundingClientRect();
      const next: Record<string, Box> = {};
      for (const [id, node] of nodes.current) {
        const box = node.getBoundingClientRect();
        next[id] = {
          x: box.left - rootBox.left + root.scrollLeft,
          y: box.top - rootBox.top + root.scrollTop,
          w: box.width,
          h: box.height,
        };
      }
      setFrames(next);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    for (const node of nodes.current.values()) observer.observe(node);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [layoutKey]);

  return (
    <nav
      ref={rootRef}
      aria-label={label}
      className={
        variant === "track"
          ? "relative flex w-fit max-w-full flex-wrap gap-1.5 self-start rounded-full bg-white p-1.5"
          : "relative flex flex-wrap gap-2"
      }
    >
      {activeBox ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 left-0 z-10 rounded-full bg-ink transition-[transform,width,height] ${ease}`}
          style={{ width: activeBox.w, height: activeBox.h, transform: `translate(${activeBox.x}px, ${activeBox.y}px)` }}
        />
      ) : null}
      {items.map((item) => {
        const raised = hover === item.id && item.id !== shownId && !item.disabled;
        const background =
          variant === "outline"
            ? raised
              ? "border-[#CDBDBA] bg-background"
              : "border-[#CDBDBA] bg-white"
            : variant === "pills"
              ? raised
                ? "bg-rose"
                : "bg-white"
              : raised
                ? "bg-rose"
                : ready
                  ? "bg-transparent"
                  : item.id === shownId
                    ? "bg-ink"
                    : "bg-white";
        const className = `relative inline-flex items-center justify-center gap-2 rounded-full text-center font-medium whitespace-nowrap transition-colors ${ease} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          variant === "track" ? "h-[42px] px-[18px] text-[15px]" : variant === "outline" ? "h-9 border px-3.5 text-[13px]" : "min-h-11 px-4 text-sm"
        } ${background} ${
          item.disabled ? "cursor-not-allowed text-brown" : item.id === shownId ? "text-white" : "text-ink"
        }`;
        const content = (
          <span className="relative z-20 inline-flex items-center gap-2">
            <span>{item.label}</span>
            {item.note ? <span className="opacity-75">{item.note}</span> : null}
            {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
          </span>
        );
        const ref = (node: HTMLElement | null) => {
          if (node) nodes.current.set(item.id, node);
          else nodes.current.delete(item.id);
        };
        if (item.disabled || !item.href) {
          if (!item.onSelect || item.disabled) {
            return (
              <span key={item.id} ref={ref} aria-disabled="true" title={item.hint} className={className}>
                {content}
              </span>
            );
          }
          return (
            <button
              key={item.id}
              ref={ref}
              type="button"
              aria-current={item.current ? "page" : undefined}
              className={className}
              onClick={item.onSelect}
              onMouseEnter={() => setHover(item.id)}
              onMouseLeave={() => setHover((value) => (value === item.id ? null : value))}
            >
              {content}
            </button>
          );
        }
        return (
          <Link
            key={item.id}
            ref={ref}
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            title={item.hint}
            className={className}
            onClick={(event) => follow(event, item)}
            onMouseEnter={() => setHover(item.id)}
            onMouseLeave={() => setHover((value) => (value === item.id ? null : value))}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
