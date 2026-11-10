"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AreaNav({
  label,
  items,
  children,
  fill = false,
}: {
  label: string;
  items: { href: string; label: string; badge?: number }[];
  children?: ReactNode;
  fill?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={fill ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <div className={`flex flex-col gap-4 rounded-[28px] bg-white p-3 sm:p-4 ${fill ? "min-h-full flex-1" : ""}`}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 xl:flex xl:flex-col">
          {items.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-center text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none xl:w-auto xl:justify-between ${
                  current ? "bg-ink text-white" : "text-ink hover:bg-background"
                }`}
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
