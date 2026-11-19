"use client";

import { usePathname } from "next/navigation";
import { navItemCurrent, type AreaNavItem } from "./AreaNav";
import { SlidingTabs } from "./SlidingTabs";

export function Subnav({ label, items }: { label: string; items: AreaNavItem[] }) {
  const pathname = usePathname();
  if (items.length === 0) return null;

  return (
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
  );
}
