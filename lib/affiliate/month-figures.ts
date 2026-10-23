import { payoutPeriod } from "./payouts";
import { adjustedCommissionCents } from "./refunds";

export type MonthOrder = {
  code: string;
  dryRun: boolean;
  amountCents: number | null;
  commissionCents: number;
  commissionRefundedCents: number;
  createdAt: string | null;
};

export function monthFigures(input: { code: string; period: string; orders: MonthOrder[] }) {
  const paid = input.orders.filter(
    (order) => order.code === input.code && !order.dryRun && payoutPeriod(order.createdAt) === input.period,
  );
  return {
    orders: paid.length,
    salesCents: paid.reduce((sum, order) => sum + (order.amountCents ?? 0), 0),
    earningsCents: paid.reduce(
      (sum, order) => sum + adjustedCommissionCents(order.commissionCents, order.commissionRefundedCents),
      0,
    ),
  };
}
