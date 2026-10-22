"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AreaNav({
  label,
  items,
  children,
}: {
  label: string;
  items: { href: string; label: string }[];
  children?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <div className="flex flex-col gap-4 rounded-[28px] bg-white p-3 sm:p-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 xl:flex xl:flex-col">
          {items.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-center text-sm font-medium whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink xl:w-auto xl:justify-start ${
                  current ? "bg-ink text-white" : "text-ink hover:bg-background"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </nav>
  );
}
