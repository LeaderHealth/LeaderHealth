"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AreaNavItem } from "./AreaNav";
import { Subnav } from "./Subnav";

export type DashboardGroup = {
  paths: string[];
  items: AreaNavItem[];
  note?: { href: string; label: string };
};

export function DashboardSections({ groups, children }: { groups: DashboardGroup[]; children: ReactNode }) {
  const pathname = usePathname();
  const group = groups.find((item) => item.paths.includes(pathname));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {group && group.items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Subnav label="Section" items={group.items} />
          {group.note ? (
            <Link href={group.note.href} className="text-sm font-medium text-ink underline underline-offset-4">
              {group.note.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
