import { formatCents } from "@/lib/affiliate/format";
import { Fragment, type ReactNode } from "react";

function statusParts(note: string) {
  if (!note) return null;
  const [word, ...rest] = note.split(" ");
  if (word !== "Paid" && word !== "Approved" && word !== "Pending") return { label: note, detail: "", paid: false };
  return { label: word, detail: rest.join(" "), paid: word !== "Pending" };
}

export type EarningsMonthRow = {
  key: string;
  name: string;
  socialCents: number;
  websiteCents: number;
  labCents: number;
  adjustmentCents: number;
  totalCents: number;
  websiteLabel: string;
  labNote: string;
  action?: ReactNode;
};

export function EarningsMonth({
  title,
  rows,
  emptyLabel = "Nothing for this month.",
  nameLabel = "Affiliate",
}: {
  title: string;
  rows: EarningsMonthRow[];
  emptyLabel?: string;
  nameLabel?: string;
}) {
  return (
    <section className="min-w-0 rounded-[28px] bg-white">
      <h3 className="px-4 pt-4 text-xl">{title}</h3>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-brown">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col />
            </colgroup>
            <thead>
              <tr className="text-xs text-brown">
                <th scope="col" className="px-3 pt-3 pb-2 font-medium">{nameLabel}</th>
                <th scope="col" className="px-3 pt-3 pb-2 text-right font-medium">Social</th>
                <th scope="col" className="px-3 pt-3 pb-2 text-right font-medium">Website traffic</th>
                <th scope="col" className="px-3 pt-3 pb-2 text-right font-medium">Lab</th>
                <th scope="col" className="px-3 pt-3 pb-2 text-right font-medium">Total</th>
                <th scope="col" className="px-3 pt-3 pb-2 pl-8 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = statusParts(row.labNote);
                return (
                  <Fragment key={row.key}>
                    <tr className="border-t border-ink/10">
                      <th scope="row" className="px-3 py-4 text-left font-medium">{row.name}</th>
                      <td className="px-3 py-4 text-right tabular-nums">{formatCents(row.socialCents)}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        {formatCents(row.websiteCents)}
                        {row.websiteLabel ? <span className="mt-1 block text-xs font-normal text-brown">{row.websiteLabel}</span> : null}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums">{formatCents(row.labCents)}</td>
                      <td className="px-3 py-4 text-right font-medium tabular-nums">
                        {formatCents(row.totalCents)}
                        {row.adjustmentCents !== 0 ? (
                          <span className="mt-1 block text-xs font-normal text-brown">
                            {row.adjustmentCents > 0 ? "Bonus" : "Clawback"} {formatCents(Math.abs(row.adjustmentCents))}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 pl-8">
                        {status ? (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${status.paid ? "bg-rose text-ink" : "border border-ink/20 text-brown"}`}>
                              {status.label}
                            </span>
                            {status.detail ? <span className="text-brown">{status.detail}</span> : null}
                          </span>
                        ) : (
                          <span className="text-brown">—</span>
                        )}
                      </td>
                    </tr>
                    {row.action ? (
                      <tr>
                        <td colSpan={6} className="px-3 pb-4">
                          {row.action}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
