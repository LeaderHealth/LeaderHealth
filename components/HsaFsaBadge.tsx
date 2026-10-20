export const HSA_FSA_LABEL = "HSA/FSA accepted";

const accessibleName = "Health Savings Account and Flexible Spending Account cards accepted";

const tones = {
  onDark: "bg-[#F7F3F5] text-[#331110]",
  onLight: "bg-[#331110] text-[#F7F3F5]",
} as const;

export function HsaFsaBadge({ tone = "onDark" }: { tone?: keyof typeof tones }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold leading-none ${tones[tone]}`}
      aria-label={accessibleName}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {HSA_FSA_LABEL}
    </span>
  );
}
