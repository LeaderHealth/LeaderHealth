import { adjustedCommissionCents } from "./refunds";

export type AccountEarningOrder = {
  code: string;
  dryRun: boolean;
  commissionCents: number;
  commissionRefundedCents?: number;
};

export function accountColumnTotals(input: {
  code: string;
  clicks: number;
  orders: AccountEarningOrder[];
  unpaidOrders: number | null;
  paidOutCents: number | null;
}) {
  const paid = input.orders.filter((order) => order.code === input.code && !order.dryRun);
  const earned = paid.reduce(
    (sum, order) => sum + adjustedCommissionCents(order.commissionCents, order.commissionRefundedCents ?? 0),
    0,
  );
  const refunded = paid.reduce((sum, order) => sum + Math.max(0, Math.round(order.commissionRefundedCents ?? 0)), 0);
  const balance = input.paidOutCents == null ? null : earned - input.paidOutCents;
  return {
    visitors: input.clicks,
    paidOrders: paid.length,
    unpaidOrders: input.unpaidOrders,
    earnedCents: earned,
    unpaidEarnings: balance == null ? null : refunded > 0 ? balance : Math.max(0, balance),
    paidEarnings: input.paidOutCents,
  };
}
