import Link from "next/link";

const links = [
  { href: "/admin/affiliates/records", label: "Event log" },
  { href: "/admin/affiliates/compliance", label: "Flag content" },
];

export function ComplianceRecordLinks({ current }: { current: "records" | "compliance" }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Compliance records">
      {links.map((item) => {
        const on = item.href.endsWith(`/${current}`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium ${on ? "bg-ink text-white" : "border border-ink/20 bg-white text-ink hover:bg-background"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
