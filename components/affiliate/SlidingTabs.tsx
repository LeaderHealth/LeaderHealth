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

const ease = "duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";
const tabFocus = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";
const TAB_SWITCH = "lh-tab-switch";

function markTabSwitch() {
  try {
    sessionStorage.setItem(TAB_SWITCH, String(Date.now()));
  } catch {
    /* storage can be blocked */
  }
}

function freshTabSwitch() {
  try {
    const stamp = Number(sessionStorage.getItem(TAB_SWITCH) || 0);
    return stamp > 0 && Date.now() - stamp < 1500;
  } catch {
    return false;
  }
}

function clearTabSwitch() {
  try {
    sessionStorage.removeItem(TAB_SWITCH);
  } catch {
    /* storage can be blocked */
  }
}

function motionReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pathOf(href: string) {
  const path = href.split("#")[0]?.split("?")[0] ?? href;
  if (!path.startsWith("http")) return path;
  try {
    return new URL(path).pathname;
  } catch {
    return path;
  }
}

function switchAge() {
  try {
    const stamp = Number(sessionStorage.getItem(TAB_SWITCH) || 0);
    return stamp > 0 ? Date.now() - stamp : 0;
  } catch {
    return 0;
  }
}

const PANEL_TRANSITION = "opacity 220ms ease-out, transform 220ms ease-out";

export function TabPanel({
  tabKey,
  sync = false,
  className = "",
  children,
}: {
  tabKey: string;
  sync?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const waitingFor = useRef<string | null>(null);
  const fromRoute = useRef(false);
  const [shown, setShown] = useState(tabKey);
  const [visible, setVisible] = useState(true);
  if (tabKey !== shown) {
    setShown(tabKey);
    if (typeof window === "undefined" || !motionReduced()) setVisible(false);
  }
  useLayoutEffect(() => {
    if (!freshTabSwitch() || motionReduced()) return;
    fromRoute.current = true;
    const panel = panelRef.current;
    if (panel) {
      panel.style.transition = "none";
      panel.style.opacity = "0";
      panel.style.transform = "translateY(6px)";
    }
    queueMicrotask(() => setVisible(false));
  }, []);
  useEffect(() => {
    if (!sync) return;
    const onSwitch = (event: Event) => {
      if (motionReduced()) return;
      const target = pathOf((event as CustomEvent<string>).detail || "");
      if (!target || target === tabKey) return;
      waitingFor.current = target;
      setVisible(false);
    };
    window.addEventListener(TAB_SWITCH, onSwitch);
    return () => window.removeEventListener(TAB_SWITCH, onSwitch);
  }, [sync, tabKey]);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (visible) {
      panel.style.minHeight = "";
      return;
    }
    if (!panel.style.minHeight && panel.offsetHeight > 0) panel.style.minHeight = `${panel.offsetHeight}px`;
    // Drop the outgoing section to the hidden pose in the same frame as the
    // pill, then let the incoming section fade once it is actually here.
    panel.style.transition = "none";
    void panel.offsetHeight;
    panel.style.transition = PANEL_TRANSITION;
  }, [visible, shown]);
  useEffect(() => {
    if (visible) return;
    const panel = panelRef.current;
    let timeout = 0;
    let settled = false;
    const reveal = (wait: number) => {
      if (settled) return;
      settled = true;
      timeout = window.setTimeout(() => {
        waitingFor.current = null;
        fromRoute.current = false;
        clearTabSwitch();
        setVisible(true);
      }, wait);
    };
    const arm = () => {
      if (settled) return;
      if (panel?.querySelector("[data-section-pending]")) return;
      const target = waitingFor.current;
      if (target && target !== tabKey) return;
      const elapsed = target || fromRoute.current ? switchAge() : null;
      reveal(elapsed == null ? 120 : Math.max(0, 120 - elapsed));
    };
    arm();
    const safety = window.setTimeout(() => reveal(0), 2000);
    const observer = panel ? new MutationObserver(arm) : null;
    if (panel && observer) observer.observe(panel, { childList: true, subtree: true });
    return () => {
      observer?.disconnect();
      window.clearTimeout(timeout);
      window.clearTimeout(safety);
    };
  }, [visible, shown, tabKey]);
  return (
    <div
      ref={panelRef}
      inert={visible ? undefined : true}
      className={`${className} motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-[6px] opacity-0"}`.trim()}
      style={{ transition: PANEL_TRANSITION }}
    >
      {children}
    </div>
  );
}

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
        variant === "track"
          ? "relative flex w-fit max-w-full flex-wrap self-start rounded-full bg-white p-1.5 shadow-[0_1px_2px_rgba(51,19,15,0.06)]"
          : "relative flex flex-wrap gap-2"
      }
    >
      {activeBox ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 left-0 rounded-full bg-ink transition-[transform,width,height] ${ease} ${variant === "track" ? "z-0" : "z-10"}`}
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
        const className = `relative z-[1] inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-center font-medium whitespace-nowrap transition-colors ${ease} ${tabFocus} ${
          variant === "track" ? "h-[46px] px-5 text-base" : variant === "outline" ? "h-9 border px-3.5 text-[13px]" : "min-h-11 px-4 text-sm"
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
