"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import type { AreaNavItem } from "./AreaNav";
import { Subnav } from "./Subnav";
import { TabPanel } from "./SlidingTabs";

export type DashboardGroup = {
  paths: string[];
  items: AreaNavItem[];
  note?: { href: string; label: string };
};

function SectionRow({ group, hidden = false }: { group: DashboardGroup; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none ${hidden ? "-mb-4 grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
    >
      <div className="-m-1 min-h-0 overflow-hidden p-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Subnav key={group.paths.join("|")} label="Section" items={group.items} />
          {group.note ? (
            <Link href={group.note.href} className="text-sm font-medium text-ink underline underline-offset-4">
              {group.note.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FadingSectionRow({ group }: { group: DashboardGroup }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inProfile = pathname === "/admin/affiliates/accounts" && Boolean(searchParams.get("code"));
  return <SectionRow group={group} hidden={inProfile} />;
}

function SectionPanel({ groupId, pathname, children }: { groupId: string; pathname: string; children: ReactNode }) {
  const [stored, setStored] = useState({ groupId, panelKey: pathname, path: pathname });
  if (stored.groupId !== groupId) setStored({ groupId, panelKey: stored.panelKey, path: pathname });
  else if (groupId && stored.path !== pathname) setStored({ groupId, panelKey: pathname, path: pathname });
  return (
    <TabPanel tabKey={stored.panelKey} sync className="min-w-0">
      {children}
    </TabPanel>
  );
}

export function DashboardSections({ groups, children }: { groups: DashboardGroup[]; children: ReactNode }) {
  const pathname = usePathname();
  const group = groups.find((item) => item.paths.includes(pathname));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {group && group.items.length > 0 ? (
        <Suspense fallback={<SectionRow group={group} />}>
          <FadingSectionRow group={group} />
        </Suspense>
      ) : null}
      <SectionPanel groupId={group?.paths[0] ?? ""} pathname={pathname}>
        {children}
      </SectionPanel>
    </div>
  );
}
