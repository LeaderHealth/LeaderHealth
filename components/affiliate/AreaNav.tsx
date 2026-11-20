"use client";

import Link from "next/link";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
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
  children,
}: {
  label: string;
  items: AreaNavItem[];
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [travel, setTravel] = useState<string | null>(null);
  const currentHref = items.find((item) => !item.disabled && navItemCurrent(pathname, item))?.href ?? null;
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
      <div className="flex flex-col gap-4 rounded-[28px] bg-white p-3 sm:p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 xl:flex xl:flex-col">
          {items.map((item) => {
            const current = shown === item.href;
            const className = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-center text-sm font-medium whitespace-nowrap transition-colors duration-[140ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none xl:w-auto xl:justify-between ${
              item.disabled ? "cursor-not-allowed text-brown" : current ? "bg-ink text-white" : "text-ink hover:bg-background"
            }`;
            if (item.disabled) {
              return (
                <span key={item.href} aria-disabled="true" title={item.hint} className={className}>
                  <span>{item.label}</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={current ? "page" : undefined}
                className={className}
                onClick={(event) => follow(event, item)}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </nav>
  );
}
