export function IllustrationNote({
  className,
  tone = "light",
  compact = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const color = tone === "dark" ? "text-[#331110]/55" : "text-[#f7f3f4]";

  return (
    <p
      className={`mx-auto text-center font-geist italic ${
        compact
          ? "max-w-[220px] text-[12px] leading-[1.35]"
          : "mt-4 max-w-[252px] text-[16px] leading-snug"
      } ${color} ${className ?? ""}`}
    >
      Illustration only. Actual medication and label may vary.
    </p>
  );
}
