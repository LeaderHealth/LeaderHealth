import Link from "next/link";

const linkClass =
  "font-medium text-ink underline underline-offset-4 hover:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function PortalLegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${className}`}>
      <Link href="/affiliates/privacy" className={linkClass}>
        Affiliate Privacy Policy
      </Link>
      <span aria-hidden className="text-[#d9cccb]">
        ·
      </span>
      <Link href="/affiliates/terms" className={linkClass}>
        Affiliate Terms of Service
      </Link>
    </p>
  );
}
