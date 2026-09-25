import { tickerItems } from "@/lib/content/site";

const icons = [
  ChatIcon,
  BanIcon,
  BoxIcon,
  PlusIcon,
];

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M5 16.5V8.8A2.8 2.8 0 0 1 7.8 6h8.4A2.8 2.8 0 0 1 19 8.8v4.4A2.8 2.8 0 0 1 16.2 16H9l-4 3.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 17.5 17 6.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d="M4.8 8.2 12 4.8l7.2 3.4V16L12 19.4 4.8 16V8.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 19.4V12M4.8 8.2 12 12l7.2-3.8" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TickerSequence({ hidden = false }: { hidden?: boolean }) {
  const items = [...tickerItems, ...tickerItems, ...tickerItems];
  return (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((item, i) => {
        const Icon = icons[i % icons.length];
        return (
          <span key={item + i} className="flex items-center gap-3 whitespace-nowrap">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-white">
              <Icon />
            </span>
            {item}
          </span>
        );
      })}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden bg-ticker py-3.5 text-white">
      <div className="marquee-track flex w-max text-[15px]">
        <TickerSequence />
        <TickerSequence hidden />
      </div>
    </div>
  );
}
