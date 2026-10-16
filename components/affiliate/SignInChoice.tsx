import Link from "next/link";

const roles = [
  { id: "affiliate", label: "Affiliate", href: "/affiliates" },
  { id: "admin", label: "Admin", href: "/admin/affiliates" },
] as const;

export function SignInChoice({ role }: { role: (typeof roles)[number]["id"] }) {
  return (
    <div className="mt-10">
      <p id="sign-in-role-label" className="text-sm font-medium text-ink">
        I am signing in as
      </p>
      <div role="group" aria-labelledby="sign-in-role-label" className="mt-3 inline-flex rounded-full border border-ink/15 bg-white p-1">
        {roles.map((item) => {
          const selected = item.id === role;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                selected ? "bg-ink text-white" : "text-ink hover:bg-background"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
