export type AccountEarningOrder = {
  code: string;
  dryRun: boolean;
  commissionCents: number;
};

export function accountColumnTotals(input: {
  code: string;
  clicks: number;
  orders: AccountEarningOrder[];
  unpaidOrders: number | null;
  paidOutCents: number | null;
}) {
  const paid = input.orders.filter((order) => order.code === input.code && !order.dryRun);
  const earned = paid.reduce((sum, order) => sum + Math.max(0, Math.round(order.commissionCents)), 0);
  return {
    visitors: input.clicks,
    paidOrders: paid.length,
    unpaidOrders: input.unpaidOrders,
    earnedCents: earned,
    unpaidEarnings: input.paidOutCents == null ? null : Math.max(0, earned - input.paidOutCents),
    paidEarnings: input.paidOutCents,
  };
}
