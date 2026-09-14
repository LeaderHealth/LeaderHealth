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

function Mark({ value, onDark = false }: { value: Cell; onDark?: boolean }) {
  if (value === "yes") {
    return (
      <span
        className={`mx-auto grid h-5 w-5 place-items-center rounded-full border text-[11px] ${
          onDark ? "border-white/80" : "border-ink/40"
        }`}
      >
        ✓
      </span>
    );
  }
  if (value === "no") {
    return (
      <span
        className={`mx-auto grid h-5 w-5 place-items-center rounded-full border text-[11px] ${
          onDark ? "border-white/30 text-white/50" : "border-ink/20 text-ink/40"
        }`}
      >
        ×
      </span>
    );
  }
  return <span className="block text-center">{value}</span>;
}

export function PriceCompare() {
  return (
    <section className="bg-[linear-gradient(180deg,#f7f0e8_0%,#ead9c4_100%)] px-6 py-20">
      <div className="mx-auto max-w-[840px]">
        <h2 className="text-center text-[34px] leading-tight text-ink md:text-[40px]">
          Same medicine. Lower cost ceiling. No surprises.
        </h2>

        <div className="mt-12 overflow-x-auto">
          <div className="min-w-[680px] rounded-[28px] bg-white px-3 py-4 shadow-sm md:px-5">
            <div className="grid grid-cols-[minmax(140px,1.15fr)_minmax(110px,0.95fr)_repeat(3,minmax(90px,1fr))] items-stretch">
              <div />
              <div className="rounded-t-[24px] bg-gradient-to-b from-[#7a3336] to-[#3a1818] px-2 py-5 text-center text-[10px] font-medium tracking-[0.12em] text-white">
                LEADER+HEALTH
              </div>
              {competitors.map((brand) => (
                <div key={brand} className="px-2 py-5 text-center text-[13px] text-taupe">
                  {brand}
                </div>
              ))}

              {rows.map((row, i) => {
                const last = i === rows.length - 1;
                return (
                  <div key={row.label} className="contents">
                    <div className="flex items-center px-3 py-4 text-[13px] text-taupe">{row.label}</div>
                    <div
                      className={`flex items-center justify-center bg-gradient-to-b from-[#5c282a] to-[#2a1010] px-2 py-4 text-[13px] font-medium text-white ${
                        last ? "rounded-b-[24px]" : ""
                      }`}
                    >
                      <Mark value={row.leader} onDark />
                    </div>
                    {row.others.map((value, j) => (
                      <div
                        key={competitors[j]}
                        className="flex items-center justify-center border-t border-ink/8 px-2 py-4 text-[13px] text-brown"
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
    </section>
  );
}
