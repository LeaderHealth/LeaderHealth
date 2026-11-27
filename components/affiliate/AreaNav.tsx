"use client";

import Link from "next/link";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { beginSectionSwitch } from "./SlidingTabs";

export type AreaNavItem = {
  href: string;
  label: string;
  badge?: number;
  disabled?: boolean;
  hint?: string;
  active?: string[];
};

export function navItemCurrent(pathname: string, item: { href: string; active?: string[] }) {
  return pathname === item.href || Boolean(item.active?.includes(pathname));
}

export function AreaNav({
  label,
  items,
  origins,
  children,
}: {
  label: string;
  items: AreaNavItem[];
  origins?: Record<string, string>;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const from = useSearchParams().get("from");
  const router = useRouter();
  const [travel, setTravel] = useState<string | null>(null);
  const navPath = (from && origins?.[from]) || pathname;
  const currentHref = items.find((item) => !item.disabled && navItemCurrent(navPath, item))?.href ?? null;
  if (travel && travel === currentHref) setTravel(null);
  const shown = travel ?? currentHref;
  const prefetchKey = items.map((item) => (item.disabled ? "" : item.href)).join("|");

  useEffect(() => {
    for (const href of prefetchKey.split("|")) {
      if (href) router.prefetch(href, { kind: PrefetchKind.FULL });
    }
  }, [prefetchKey, router]);

  function follow(event: MouseEvent<HTMLAnchorElement>, item: AreaNavItem) {
    if (item.href === shown) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    beginSectionSwitch(item.href);
    setTravel(item.href);
  }

  return (
    <nav aria-label={label}>
      <MenuSwitch label={label} items={items} shown={shown} pathname={pathname} onFollow={follow} />
      <div className="hidden flex-col gap-4 rounded-[28px] bg-white p-3 sm:p-4 xl:flex">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <NavLink key={item.href} item={item} current={shown === item.href} onFollow={follow} />
          ))}
        </div>
        {children}
      </div>
    </nav>
  );
}

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function NavLink({
  item,
  current,
  onFollow,
}: {
  item: AreaNavItem;
  current: boolean;
  onFollow: (event: MouseEvent<HTMLAnchorElement>, item: AreaNavItem) => void;
}) {
  const className = `inline-flex min-h-11 w-auto items-center justify-between gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-[140ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${focusRing} ${
    item.disabled ? "cursor-not-allowed text-brown" : current ? "bg-ink text-white" : "text-ink hover:bg-background"
  }`;
  const content = (
    <span className="flex min-w-0 items-center gap-2">
      <span>{item.label}</span>
      {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
    </span>
  );
  if (item.disabled) {
    return (
      <span aria-disabled="true" title={item.hint} className={className}>
        {content}
      </span>
    );
  }
  return (
    <Link href={item.href} prefetch aria-current={current ? "page" : undefined} className={className} onClick={(event) => onFollow(event, item)}>
      {content}
    </Link>
  );
}

function MenuSwitch({
  label,
  items,
  shown,
  pathname,
  onFollow,
}: {
  label: string;
  items: AreaNavItem[];
  shown: string | null;
  pathname: string;
  onFollow: (event: MouseEvent<HTMLAnchorElement>, item: AreaNavItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = items.find((item) => item.href === shown) ?? items[0];
  if (openPath !== pathname) {
    setOpenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div ref={rootRef} className="relative xl:hidden">
      <button
        type="button"
        className={`flex h-12 w-full items-center justify-between rounded-full bg-white pr-5 pl-5 text-base font-medium text-ink shadow-[0_1px_2px_rgba(51,19,15,0.06)] ${focusRing}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{current.label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 5.25 7 9.75l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 flex flex-col gap-1 rounded-[24px] bg-white p-2 shadow-[0_16px_40px_rgba(51,19,15,0.16)]">
          {items.map((item) => {
            const selected = item.href === current.href;
            const className = `flex h-11 items-center justify-between gap-3 rounded-full px-4 text-sm font-medium ${focusRing} ${
              item.disabled ? "cursor-not-allowed text-brown" : selected ? "bg-ink text-white" : "text-ink hover:bg-background"
            }`;
            const content = (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
              </>
            );
            if (item.disabled) {
              return (
                <span key={item.href} role="option" aria-selected={selected} aria-disabled="true" title={item.hint} className={className}>
                  {content}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                role="option"
                aria-selected={selected}
                className={className}
                onClick={(event) => {
                  onFollow(event, item);
                  setOpen(false);
                }}
              >
                {content}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
