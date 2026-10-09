import Link from "next/link";
import { GET_STARTED_URL } from "@/lib/content/site";

type Variant = "light" | "accent";
type Size = "sm" | "md";

type Props = {
  href?: string;
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHoverButton({
  href = GET_STARTED_URL,
  children = "Get Started",
  variant = "light",
  size = "md",
  className = "",
}: Props) {
  const sizes = {
    sm: "h-8 min-w-[5.5rem] px-4 text-[13px] font-medium",
    md: "h-[47px] min-w-[9.5rem] px-[26px] text-base font-semibold",
  }[size];

  const icon = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  }[size];

  const palette =
    variant === "accent"
      ? "bg-[#e43d4e] text-white"
      : "bg-white text-ink transition-[background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#331110] hover:text-[#F7F3F5] focus-visible:bg-[#331110] focus-visible:text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none";

  const ease = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const hoverEase = "duration-[400ms] ease-out motion-reduce:transition-none";

  const cls = `group relative inline-flex items-center justify-center overflow-hidden rounded-[39px] text-center leading-none ${variant === "accent" ? ease : ""} ${sizes} ${palette} ${className}`;

  const content =
    variant === "light" ? (
      <>
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#331110] transition-transform ${hoverEase} group-hover:scale-[36] group-focus-visible:scale-[36] motion-reduce:scale-100!`}
        />
        <span
          className={`relative z-10 whitespace-nowrap transition-transform ${hoverEase} group-hover:-translate-x-[15px] group-focus-visible:-translate-x-[15px] motion-reduce:translate-x-0!`}
        >
          {children}
        </span>
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform ${hoverEase} group-hover:translate-x-[calc(100%-35px)] group-focus-visible:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full!`}
        >
          →
        </span>
      </>
    ) : (
      <>
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#32120E] transition-transform ${hoverEase} group-hover:scale-[56] group-focus-visible:scale-[56] motion-reduce:scale-100!`}
        />
        <span className="relative z-10 inline-flex items-center justify-center">
          <span className="leading-none">{children}</span>
          <span
            aria-hidden
            className={`grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] ${ease} group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100`}
          >
            <span className="min-w-0 overflow-hidden">
              <ArrowIcon className={`${icon} ml-2`} />
            </span>
          </span>
        </span>
      </>
    );

  if (href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) {
    const newTab = href.startsWith("http") && href !== GET_STARTED_URL;
    return (
      <a href={href} className={cls} target={newTab ? "_blank" : undefined} rel={newTab ? "noreferrer" : undefined}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
