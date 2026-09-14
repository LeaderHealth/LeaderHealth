import Link from "next/link";
import { GET_STARTED_URL } from "@/lib/content/site";

type Props = {
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  variant?: "light" | "dark" | "outline";
  className?: string;
};

export function Button({
  href = GET_STARTED_URL,
  external,
  children,
  variant = "light",
  className = "",
}: Props) {
  const styles = {
    light:
      "bg-white text-ink hover:bg-rose",
    dark: "bg-ink text-white hover:bg-brown",
    outline: "border border-ink/20 text-ink hover:bg-white",
  }[variant];

  const cls = `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${styles} ${className}`;

  if (external || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("tel")) {
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
