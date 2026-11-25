"use client";

import Link from "next/link";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

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

const ease = "duration-[140ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";
const tabFocus = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";
const TAB_SWITCH = "lh-tab-switch";

function markTabSwitch() {
  try {
    sessionStorage.setItem(TAB_SWITCH, String(Date.now()));
  } catch {
    /* storage can be blocked */
  }
}

export function beginSectionSwitch(href: string) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  markTabSwitch();
  window.dispatchEvent(new CustomEvent(TAB_SWITCH, { detail: href }));
}

function motionReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TabPanel({
  tabKey,
  className = "",
  children,
}: {
  tabKey: string;
  sync?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const probeRef = useRef<HTMLDivElement>(null);
  const shownKey = useRef(tabKey);
  const promoting = useRef(false);
  const [shown, setShown] = useState({ key: tabKey, node: children });
  const [shift, setShift] = useState(false);
  const arriving = tabKey !== shown.key;
  useLayoutEffect(() => {
    if (promoting.current) return;
    const probe = probeRef.current;
    if (probe?.querySelector("[data-section-pending]")) return;
    if (tabKey === shownKey.current) {
      const nextNode = children;
      queueMicrotask(() => {
        setShown((current) => (current.key !== tabKey || current.node === nextNode ? current : { key: tabKey, node: nextNode }));
      });
      return;
    }
    const reduce = motionReduced();
    const nextKey = tabKey;
    const nextNode = children;
    promoting.current = true;
    queueMicrotask(() => {
      promoting.current = false;
      shownKey.current = nextKey;
      setShown({ key: nextKey, node: nextNode });
      if (reduce) return;
      setShift(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShift(false));
      });
    });
  }, [tabKey, children]);
  const motion = shift
    ? "translate-y-1 transition-none"
    : "translate-y-0 transition-transform duration-[120ms] ease-out motion-reduce:transition-none";
  return (
    <>
      <div className={`${className} ${motion}`.trim()}>{arriving ? shown.node : children}</div>
      {arriving ? (
        <div ref={probeRef} className="hidden" aria-hidden inert>
          {children}
        </div>
      ) : null}
    </>
  );
}

export function SlidingTabs({
  label,
  items,
  variant = "pills",
}: {
  label: string;
  items: SlidingTabItem[];
  variant?: "pills" | "track" | "outline" | "segment";
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const [frames, setFrames] = useState<Record<string, Box>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [travel, setTravel] = useState<string | null>(null);
  const layoutKey = items.map((item) => `${item.id}:${item.label}:${item.note ?? ""}:${item.badge ?? ""}:${item.disabled ? 1 : 0}`).join("|");
  const active = items.find((item) => item.current && !item.disabled);
  if (travel && active?.id === travel) setTravel(null);
  const shownId = travel ?? active?.id;
  const activeBox = shownId ? frames[shownId] : undefined;

  function follow(event: MouseEvent<HTMLAnchorElement>, item: SlidingTabItem) {
    if (!item.href || item.id === shownId) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (motionReduced()) return;
    markTabSwitch();
    window.dispatchEvent(new CustomEvent(TAB_SWITCH, { detail: item.href }));
    setTravel(item.id);
  }
  const ready = Object.keys(frames).length > 0;
  const segment = variant === "segment";
  const motion = segment ? "duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" : ease;
  const prefetchKey = items.map((item) => (item.href && !item.disabled ? item.href : "")).join("|");
  useEffect(() => {
    for (const href of prefetchKey.split("|")) {
      if (href) router.prefetch(href, { kind: PrefetchKind.FULL });
    }
  }, [prefetchKey, router]);

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
      role={items.some((item) => item.href) ? undefined : "tablist"}
      className={
        segment
          ? "relative flex w-fit max-w-full gap-1 self-start rounded-full bg-[#F7F3F2] p-1"
          : variant === "track"
            ? "relative flex w-fit max-w-full flex-wrap self-start rounded-full bg-white p-1.5 shadow-[0_1px_2px_rgba(51,19,15,0.06)]"
            : "relative flex flex-wrap gap-2"
      }
    >
      {activeBox ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 left-0 rounded-full bg-ink transition-[transform,width,height] ${motion} ${variant === "track" || segment ? "z-0" : "z-10"}`}
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
              : ready
                ? "bg-transparent"
                : item.id === shownId
                  ? "bg-ink"
                  : "bg-transparent";
        const className = `relative z-[1] inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-center font-medium whitespace-nowrap transition-colors ${motion} ${tabFocus} ${
          segment ? "h-9 px-3.5 text-sm" : variant === "track" ? "h-[46px] px-5 text-base" : variant === "outline" ? "h-9 border px-3.5 text-[13px]" : "min-h-11 px-4 text-sm"
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
              role="tab"
              aria-selected={item.current}
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
            prefetch
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
