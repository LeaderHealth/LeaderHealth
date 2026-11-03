import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
import { assets, site } from "@/lib/content/site";

const imageSize = { width: 8103, height: 554 } as const;

export function NavLogoFilter() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
      <filter id="lh-logo-outline" x="-8%" y="-80%" width="116%" height="260%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.15" result="dilated" />
        <feComposite in="dilated" in2="SourceAlpha" operator="out" result="outline" />
        <feFlood floodColor="white" result="flood" />
        <feComposite in="flood" in2="outline" operator="in" />
      </filter>
    </svg>
  );
}

export function NavLogo({
  className,
  imageClassName,
  onClick,
}: {
  className?: string;
  imageClassName: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const fade =
    "transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  return (
    <Link href="/" onClick={onClick} className={`group/logo ${className ?? ""}`}>
      <span className="relative block">
        <Image
          src={assets.logo}
          alt={site.name}
          {...imageSize}
          priority
          className={`${imageClassName} brightness-0 invert ${fade} [@media(hover:hover)]:group-hover/logo:opacity-0 group-focus-visible/logo:opacity-0`}
          style={{ height: "auto" }}
        />
        <Image
          src={assets.logo}
          alt=""
          {...imageSize}
          aria-hidden
          className={`${imageClassName} pointer-events-none absolute top-0 left-0 opacity-0 ${fade} [@media(hover:hover)]:group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100`}
          style={{ height: "auto", filter: "url(#lh-logo-outline)" }}
        />
      </span>
    </Link>
  );
}
