import Image from "next/image";
import Link from "next/link";

export function PortalBrand({ badge }: { badge: string }) {
  return (
    <Link
      href="/"
      className="inline-flex w-fit items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <Image
        src="/images/leaderhealth-logo.png"
        alt="Leader Health"
        width={1024}
        height={70}
        priority
        className="h-auto w-[168px] sm:w-[196px]"
      />
      <span className="rounded-full bg-[#f6d5d8] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-accent uppercase">
        {badge}
      </span>
    </Link>
  );
}
