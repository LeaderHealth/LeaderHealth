"use client";

export function CookiePreferencesButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button type="button" className={["cky-banner-element", className].filter(Boolean).join(" ")}>
      {label}
    </button>
  );
}
