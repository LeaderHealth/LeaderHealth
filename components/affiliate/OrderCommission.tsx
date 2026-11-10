import { formatCents, formatCommissionRate } from "@/lib/affiliate/format";
import type { AffiliateOrderView } from "@/lib/affiliate/order-view";
import { adjustedCommissionCents, refundStatusLabel } from "@/lib/affiliate/refunds";

export function OrderCommission({ conversion }: { conversion: AffiliateOrderView }) {
  const adjusted = adjustedCommissionCents(conversion.commissionCents, conversion.commissionRefundedCents);
  const label = refundStatusLabel(conversion.refundStatus);
  if (!label) {
    return (
      <>
        <div>{formatCents(conversion.commissionCents)}</div>
        <div className="mt-1 text-brown">{formatCommissionRate(conversion)}</div>
      </>
    );
  }
  return (
    <>
      <div>{formatCents(adjusted)}</div>
      <div className="mt-1 text-brown">Original {formatCents(conversion.commissionCents)}</div>
      <div className="mt-1 text-brown">
        {label}
        {conversion.refundedAmountCents > 0 ? ` · ${formatCents(conversion.refundedAmountCents)}` : ""}
      </div>
      <div className="mt-1 text-brown">{formatCommissionRate(conversion)}</div>
    </>
  );
}
