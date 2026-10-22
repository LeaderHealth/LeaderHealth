export type RefundStatus = "none" | "partial" | "full";

export type RefundObservation = {
  key: string;
  amountCents: number;
  cumulative: boolean;
  full?: boolean;
};

export type RecordedRefund = {
  key: string;
  refundedAmountCents: number;
  commissionCents: number;
  cumulative?: boolean;
};

export type PlannedRefund = {
  key: string;
  refundedAmountCents: number;
  commissionCents: number;
  full: boolean;
  cumulative: boolean;
};

function whole(value: number) {
  return Math.max(0, Math.round(value));
}

export function adjustedCommissionCents(originalCommissionCents: number, commissionRefundedCents: number) {
  return Math.max(0, whole(originalCommissionCents) - whole(commissionRefundedCents));
}

export function commissionRefundTarget(input: {
  originalAmountCents: number | null;
  originalCommissionCents: number;
  refundedAmountCents: number;
  full: boolean;
}) {
  const commission = whole(input.originalCommissionCents);
  if (commission === 0) return 0;
  const refunded = whole(input.refundedAmountCents);
  if (input.full) return commission;
  if (input.originalAmountCents == null || input.originalAmountCents <= 0 || refunded <= 0) return 0;
  if (refunded >= input.originalAmountCents) return commission;
  return Math.min(commission, Math.round((commission * refunded) / input.originalAmountCents));
}

export function refundStatusOf(input: {
  originalAmountCents: number | null;
  originalCommissionCents: number;
  refundedAmountCents: number;
  commissionRefundedCents: number;
}): RefundStatus {
  const commission = whole(input.originalCommissionCents);
  const refundedCommission = whole(input.commissionRefundedCents);
  const refundedAmount = whole(input.refundedAmountCents);
  if (refundedCommission <= 0 && refundedAmount <= 0) return "none";
  if (refundedCommission >= commission && commission > 0) return "full";
  if (input.originalAmountCents != null && input.originalAmountCents > 0 && refundedAmount >= input.originalAmountCents) return "full";
  return "partial";
}

export function refundStatusLabel(status: RefundStatus) {
  if (status === "full") return "Full refund";
  if (status === "partial") return "Partial refund";
  return "";
}

function appliedRefundedAmount(recorded: readonly RecordedRefund[]) {
  const discrete = recorded.filter((refund) => !refund.cumulative && !refund.key.startsWith("cumulative:") && refund.key !== "status:full");
  const cumulative = recorded.filter((refund) => refund.cumulative || refund.key.startsWith("cumulative:") || refund.key === "status:full");
  const discreteSum = discrete.reduce((sum, refund) => sum + whole(refund.refundedAmountCents), 0);
  const cumulativeMax = cumulative.reduce((max, refund) => Math.max(max, whole(refund.refundedAmountCents)), 0);
  return Math.max(discreteSum, cumulativeMax);
}

export function planRefundAdjustments(input: {
  originalAmountCents: number | null;
  originalCommissionCents: number;
  recorded: readonly RecordedRefund[];
  incoming: readonly RefundObservation[];
}): PlannedRefund[] {
  const seen = new Set(input.recorded.map((refund) => refund.key));
  let deducted = input.recorded.reduce((sum, refund) => sum + whole(refund.commissionCents), 0);
  let refunded = appliedRefundedAmount(input.recorded);
  const discrete = input.incoming.filter((refund) => !refund.cumulative);
  const incoming = discrete.length > 0 ? discrete : input.incoming.filter((refund) => refund.cumulative);
  const ordered = [...incoming].sort((left, right) => left.amountCents - right.amountCents || left.key.localeCompare(right.key));
  const plans: PlannedRefund[] = [];

  for (const refund of ordered) {
    if (!refund.key || seen.has(refund.key)) continue;
    seen.add(refund.key);
    const amount = whole(refund.amountCents);
    const nextRefunded = refund.cumulative ? Math.max(refunded, amount) : refunded + amount;
    if (nextRefunded < refunded) continue;
    const completesOrder =
      refund.full === true || (input.originalAmountCents != null && input.originalAmountCents > 0 && nextRefunded >= input.originalAmountCents);
    const target = commissionRefundTarget({
      originalAmountCents: input.originalAmountCents,
      originalCommissionCents: input.originalCommissionCents,
      refundedAmountCents: nextRefunded,
      full: completesOrder,
    });
    const delta = target - deducted;
    refunded = nextRefunded;
    if (delta <= 0) continue;
    deducted += delta;
    plans.push({
      key: refund.key,
      refundedAmountCents: refund.cumulative ? nextRefunded : amount,
      commissionCents: delta,
      full: target >= whole(input.originalCommissionCents) && whole(input.originalCommissionCents) > 0,
      cumulative: refund.cumulative,
    });
  }

  return plans;
}

export function refundObservations(order: {
  amountCents: number | null;
  refundedAmountCents: number | null;
  refunds: readonly { id: string; amountCents: number }[];
  fullyRefunded: boolean;
}): RefundObservation[] {
  if (order.refunds.length > 0) {
    return order.refunds.map((refund) => ({
      key: refund.id,
      amountCents: refund.amountCents,
      cumulative: false,
    }));
  }
  if (order.fullyRefunded) {
    const amount = order.refundedAmountCents ?? order.amountCents ?? 0;
    return [{ key: amount > 0 ? `cumulative:${amount}` : "status:full", amountCents: amount, cumulative: true, full: true }];
  }
  if (order.refundedAmountCents != null && order.refundedAmountCents > 0) {
    return [{ key: `cumulative:${order.refundedAmountCents}`, amountCents: order.refundedAmountCents, cumulative: true }];
  }
  return [];
}

export function adjustmentDocId(orderId: string, key: string) {
  const safe = (value: string) => value.replace(/[^A-Za-z0-9:_-]/g, "_").slice(0, 200);
  return `${safe(orderId)}__${safe(key)}`;
}

export function totalRefundedAmount(recorded: readonly RecordedRefund[]) {
  return appliedRefundedAmount(recorded);
}
