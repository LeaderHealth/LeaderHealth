export function IllustrationNote({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const color = tone === "dark" ? "text-[#331110]/60" : "text-[#f7f3f4]";

  return (
    <p className={`mx-auto mt-4 max-w-[252px] text-center font-geist text-[16px] leading-snug italic ${color} ${className ?? ""}`}>
      Illustration only. Actual medication and label may vary.
    </p>
  );
}
