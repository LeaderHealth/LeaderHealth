const rows = [
  {
    label: "Monthly price",
    values: ["$49–$229", "$50–$349+", "$50–$500+", "$40–$600+"],
  },
  {
    label: "Price ceiling",
    values: ["$229 max", "—", "—", "—"],
  },
  {
    label: "Baseline labs included",
    values: ["Yes", "Varies", "Varies", "Varies"],
  },
  {
    label: "1-on-1 clinician consult",
    values: ["Every plan", "Varies", "Varies", "Varies"],
  },
  {
    label: "Hidden fees",
    values: ["None", "Varies", "Varies", "Varies"],
  },
  {
    label: "Easy cancellation",
    values: ["Yes", "Varies", "Varies", "Varies"],
  },
];

const brands = ["Leader Health", "Maximus", "Hone Health", "Hims"];

export function PriceCompare() {
  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-4xl md:text-5xl">
          Same medicine. Lower cost ceiling.{" "}
          <span className="font-serif-italic text-accent">No surprises.</span>
        </h2>
        <div className="mt-10 overflow-x-auto rounded-[28px] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="px-5 py-4 font-medium text-taupe" />
                {brands.map((brand) => (
                  <th key={brand} className="px-5 py-4 font-medium">
                    {brand}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-ink/5 last:border-0">
                  <th className="px-5 py-4 font-medium text-taupe">{row.label}</th>
                  {row.values.map((value, i) => (
                    <td
                      key={brands[i]}
                      className={`px-5 py-4 ${i === 0 ? "font-medium text-ink" : "text-brown"}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
