import { deliverableStatusLabel } from "@/lib/affiliate/deliverable-flow";
import { formatCents } from "@/lib/affiliate/format";
import type { DeliverableLine } from "@/lib/affiliate/deliverable-payments";

function amountOf(line: DeliverableLine) {
  if (line.status === "closed") return "Closed";
  if (line.amountCents === 0 && (line.status === "review" || line.status === "changes" || line.status === "waiting" || line.status === "measuring")) return "Calculated after the tracking period";
  if (line.status === "paid") return formatCents((line.paidCents ?? 0) + (line.adjustmentCents ?? 0));
  return formatCents(line.amountCents);
}

export function DeliverablePaymentList({ lines, showAffiliate = false }: { lines: DeliverableLine[]; showAffiliate?: boolean }) {
  if (lines.length === 0) return <p className="mt-6 text-sm text-brown">No marketing payments are on file yet.</p>;
  return (
    <ul className="mt-4 divide-y divide-rose/60">
      {lines.map((line) => (
        <li key={line.postId} className="py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 font-medium">{showAffiliate ? line.name : line.label}</p>
            <span className="inline-flex rounded-full bg-rose px-3 py-1 text-xs font-medium text-ink">
              {deliverableStatusLabel(line.status, line.adjustmentCents != null)}
            </span>
          </div>
          {showAffiliate ? <p className="mt-1 text-brown">{line.label}</p> : null}
          <p className="mt-1 text-brown">{line.detail}</p>
          <p className="mt-1">{amountOf(line)}</p>
          {line.adjustmentReason ? <p className="mt-1 text-brown">{line.adjustmentReason}</p> : null}
        </li>
      ))}
    </ul>
  );
}
