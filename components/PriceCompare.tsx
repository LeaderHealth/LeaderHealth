import Image from "next/image";

type Cell = string | "yes" | "no";

const competitors = ["Maximus", "Hone Health", "Hims"];

const rows: { label: string; leader: Cell; others: Cell[] }[] = [
  {
    label: "Monthly price",
    leader: "$49–$229",
    others: ["$50–$349+", "$50–$500+", "$40–$600+"],
  },
  {
    label: "Price ceiling",
    leader: "$229 max",
    others: ["no", "no", "no"],
  },
  {
    label: "Baseline labs included",
    leader: "yes",
    others: ["yes", "yes", "no"],
  },
  {
    label: "1-on-1 clinician consult",
    leader: "Every plan",
    others: ["yes", "no", "no"],
  },
  {
    label: "Hidden fees",
    leader: "None",
    others: ["Varies", "Varies", "Varies"],
  },
  {
    label: "Easy Cancellation",
    leader: "yes",
    others: ["yes", "yes", "yes"],
  },
];

function ComparisonText({ value }: { value: string }) {
  const dash = value.indexOf("–");
  if (dash === -1) return value;
  return (
    <>
      {value.slice(0, dash + 1)}
      <wbr />
      {value.slice(dash + 1)}
    </>
  );
}

function Mark({ value, onDark = false }: { value: Cell; onDark?: boolean }) {
  if (value === "yes" || value === "no") {
    const isYes = value === "yes";
    return (
      <span
        className={`mx-auto grid h-5 w-5 shrink-0 place-items-center rounded-full border sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 ${
          onDark ? "border-white/75 text-white" : "border-[#d9d9d9] text-[#8d8d8d]"
        }`}
      >
        {isYes ? (
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5" aria-hidden>
            <path d="M3.4 8.2 6.3 11.1 12.6 4.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3" aria-hidden>
            <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </span>
    );
  }
  return (
    <span
      className={`block max-w-full text-balance text-center font-semibold leading-tight tracking-[-0.02em] ${
        onDark
          ? "text-[13px] text-white sm:text-[16px] md:text-[20px] lg:text-[24px]"
          : "text-[11px] text-[#2a2a2a] sm:text-[13px] md:text-[17px] lg:text-[22px]"
      }`}
    >
      <ComparisonText value={value} />
    </span>
  );
}

export function PriceCompare() {
  return (
    <section className="bg-[linear-gradient(180deg,#f7f0e8_0%,#ead9c4_100%)] px-3 py-12 sm:px-5 sm:py-16 lg:px-6 lg:py-20">
      <div className="mx-auto w-full min-w-0 max-w-[1080px]">
        <h2 className="text-balance px-2 text-center text-[28px] leading-tight font-semibold text-ink sm:text-[34px] lg:text-[40px]">
          Same medicine. Lower cost ceiling. No surprises.
        </h2>

        <div className="mt-8 sm:mt-12 lg:mt-16">
          <div className="py-10 sm:py-14 lg:px-2 lg:py-20">
            <div className="rounded-[22px] bg-white px-1.5 py-2 shadow-[0_16px_48px_rgba(74,52,32,0.08)] sm:rounded-[28px] sm:px-3 md:rounded-[32px] md:px-4 md:py-2.5 lg:rounded-[36px] lg:px-8 lg:py-3">
              <div className="price-compare-grid relative grid items-stretch">
                <div
                  aria-hidden
                  className="price-compare-leader pointer-events-none absolute -top-8 -bottom-8 z-0 rounded-[22px] bg-[linear-gradient(180deg,#c45d66_0%,#a44650_16%,#7a333c_40%,#4c2028_68%,#2a1016_100%)] shadow-[0_18px_36px_rgba(36,12,16,0.26)] sm:-top-10 sm:-bottom-10 sm:rounded-[28px] md:-top-12 md:-bottom-12 lg:-top-[4.75rem] lg:-bottom-[4.75rem] lg:rounded-[36px]"
                />

                <div className="relative z-10 min-h-16 border-b border-[#eceae8] md:min-h-20 lg:min-h-[88px]" />
                <div className="relative z-10 flex min-h-16 items-center justify-center px-1.5 md:min-h-20 md:px-3 lg:min-h-[88px] lg:px-5">
                  <Image
                    src="/images/lh-logo-white.png"
                    alt="LEADERHEALTH"
                    width={1024}
                    height={70}
                    className="h-auto w-full object-contain"
                    style={{
                      width: "100%",
                      height: "auto",
                      WebkitMaskImage: "url(/images/lh-logo-white.png)",
                      maskImage: "url(/images/lh-logo-white.png)",
                      WebkitMaskSize: "100% 100%",
                      maskSize: "100% 100%",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      maskMode: "luminance",
                    }}
                  />
                </div>
                {competitors.map((brand) => (
                  <div key={brand} className="relative z-10 flex min-h-16 min-w-0 items-center justify-center border-b border-[#eceae8] px-0.5 text-center text-[10px] leading-tight font-normal text-balance text-[#a39e99] sm:text-xs md:min-h-20 md:px-2 md:text-[15px] lg:min-h-[88px] lg:px-4 lg:text-[17px]">
                    {brand}
                  </div>
                ))}

                {rows.map((row, i) => {
                  const last = i === rows.length - 1;
                  const rule = last ? "" : "border-b border-[#eceae8]";
                  return (
                    <div key={row.label} className="contents">
                      <div className={`relative z-10 flex min-h-14 min-w-0 items-center px-1.5 text-[11px] leading-tight text-[#9a9590] sm:px-2 sm:text-xs md:min-h-[80px] md:px-3 md:text-sm lg:min-h-[92px] lg:px-4 lg:text-[15px] ${rule}`}>
                        {row.label}
                      </div>
                      <div className="relative z-10 flex min-h-14 min-w-0 items-center justify-center px-1 text-white md:min-h-[80px] md:px-2 lg:min-h-[92px] lg:px-3">
                        <Mark value={row.leader} onDark />
                      </div>
                      {row.others.map((value, j) => (
                        <div
                          key={competitors[j]}
                          className={`relative z-10 flex min-h-14 min-w-0 items-center justify-center px-0.5 md:min-h-[80px] md:px-2 lg:min-h-[92px] lg:px-4 ${rule}`}
                        >
                          <Mark value={value} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
