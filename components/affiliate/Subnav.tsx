"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItemCurrent, type AreaNavItem } from "./AreaNav";
import { beginSectionSwitch, SlidingTabs } from "./SlidingTabs";

const focusRing = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";

export function Subnav({ label, items }: { label: string; items: AreaNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;
  const current = items.find((item) => navItemCurrent(pathname, item)) ?? items[0];

  return (
    <div className="w-full min-w-0">
      <div className="hidden min-[1100px]:block">
        <SlidingTabs
          variant="track"
          label={label}
          items={items.map((item) => ({
            id: item.href,
            label: item.label,
            href: item.disabled ? undefined : item.href,
            badge: item.badge,
            disabled: item.disabled,
            hint: item.hint,
            current: navItemCurrent(pathname, item),
          }))}
        />
      </div>
      <TabletTabs label={label} items={items} pathname={pathname} />
      <SectionMenu label={label} items={items} current={current} pathname={pathname} />
    </div>
  );
}

function TabletTabs({ label, items, pathname }: { label: string; items: AreaNavItem[]; pathname: string }) {
  return (
    <nav role="tablist" aria-label={label} className="hidden w-full gap-0.5 rounded-full bg-white p-[5px] min-[600px]:flex min-[1100px]:hidden">
      {items.map((item) => {
        const selected = navItemCurrent(pathname, item);
        const className = `flex h-12 flex-auto items-center justify-center gap-2 rounded-full px-2 text-center text-sm font-medium whitespace-nowrap min-[760px]:px-3 ${focusRing} ${
          item.disabled ? "cursor-not-allowed text-[#6B5A57]" : selected ? "bg-[#33130F] text-white hover:bg-[#33130F]" : "text-[#2A1714] hover:bg-[#F5F0EF]"
        }`;
        const content = (
          <>
            <span>{item.label}</span>
            {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
          </>
        );
        if (item.disabled) {
          return (
            <span key={item.href} aria-disabled="true" title={item.hint} className={className}>
              {content}
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            role="tab"
            aria-selected={selected}
            aria-current={selected ? "page" : undefined}
            title={item.hint}
            className={className}
            onClick={() => beginSectionSwitch(item.href)}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

function SectionMenu({ label, items, current, pathname }: { label: string; items: AreaNavItem[]; current: AreaNavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={rootRef} className="relative min-[600px]:hidden">
      <button
        type="button"
        className={`flex h-[52px] w-full items-center justify-between rounded-2xl border border-[#CDBDBA] bg-white px-[18px] text-left ${focusRing}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 flex-col items-start gap-px">
          <span className="text-[11px] text-[#6B5A57]">{label}</span>
          <span className="truncate text-[15px] font-semibold text-[#2A1714]">{current.label}</span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          className={`shrink-0 text-[#6B5A57] transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 5.25 7 9.75l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div role="listbox" aria-label={label} className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 flex flex-col rounded-2xl border border-[#CDBDBA] bg-white p-1.5 shadow-[0_10px_30px_rgba(51,19,15,0.14)]">
          {items.map((item) => {
            const selected = item.href === current.href;
            const className = `flex h-12 items-center justify-between gap-3 rounded-xl px-3.5 text-left text-[15px] text-[#2A1714] ${focusRing} ${
              selected ? "bg-[#F5F0EF] font-semibold" : "bg-transparent font-normal hover:bg-[#F5F0EF]"
            } ${item.disabled ? "cursor-not-allowed text-[#6B5A57]" : ""}`;
            const content = (
              <>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{item.label}</span>
                  {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
                </span>
                <span className="text-[#33130F]">{selected ? "✓" : ""}</span>
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
                onClick={() => {
                  beginSectionSwitch(item.href);
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
