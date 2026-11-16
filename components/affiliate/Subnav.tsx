"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemCurrent, type AreaNavItem } from "./AreaNav";

export function Subnav({ label, items }: { label: string; items: AreaNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const current = navItemCurrent(pathname, item);
        const className = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-center text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none ${
          item.disabled ? "cursor-not-allowed text-brown" : current ? "bg-ink text-white" : "bg-white text-ink hover:bg-background"
        }`;
        if (item.disabled) {
          return (
            <span key={item.href} aria-disabled="true" title={item.hint} className={className}>
              {item.label}
            </span>
          );
        }
        return (
          <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={className}>
            <span>{item.label}</span>
            {item.badge ? <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-ink">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
