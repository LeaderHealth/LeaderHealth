import { SlidingTabs } from "./SlidingTabs";

const links = [
  { href: "/admin/affiliates/records", label: "Event log" },
  { href: "/admin/affiliates/compliance", label: "Flag content" },
];

export function ComplianceRecordLinks({ current }: { current: "records" | "compliance" }) {
  return (
    <div className="mt-4">
      <SlidingTabs
        label="Compliance records"
        items={links.map((item) => ({
          id: item.href,
          label: item.label,
          href: item.href,
          current: item.href.endsWith(`/${current}`),
        }))}
      />
    </div>
  );
}
