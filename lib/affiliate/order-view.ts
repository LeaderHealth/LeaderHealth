import { createHash } from "node:crypto";
import { payoutPeriod } from "./payouts";
import { adjustedCommissionCents, remainingSalesCents } from "./refunds";

export type AffiliateOrderView = {
  ref: string;
};

type AffiliateOrderSource = {
  orderId: string;
};

function orderDisplayRef(orderId: string) {
  const secret = process.env.AFFILIATE_SESSION_SECRET?.trim() ?? "";
  const digest = createHash("sha256").update(`${secret}:${orderId}`).digest("base64url");
  const ref = digest.slice(0, 12);
  return ref === orderId ? digest.slice(12, 24) : ref;
}

export function toAffiliateOrder(conversion: AffiliateOrderSource): AffiliateOrderView {
  return {
    ref: orderDisplayRef(conversion.orderId),
  };
}

export type PeriodReferralSummary = {
  period: string;
  code: string;
  conversions: number;
  commissionCents: number;
};

export type PeriodReferralSource = {
  code: string;
  dryRun: boolean;
  amountCents: number | null;
  refundedAmountCents: number;
  commissionCents: number;
  commissionRefundedCents: number;
  createdAt: string | null;
  orderKind?: "lab" | "treatment";
};

export type AdminOrderSource = PeriodReferralSource & {
  orderId: string;
  productName: string;
  promoCode?: string | null;
};

export type AdminOrderDetail = {
  period: string;
  code: string;
  orderId: string;
  productName: string;
  createdAt: string;
  orderKind: "lab" | "treatment";
  saleCents: number;
  commissionCents: number;
  promoCode: string;
};

export function adminOrderDetails(orders: AdminOrderSource[]): AdminOrderDetail[] {
  const lines: AdminOrderDetail[] = [];
  for (const order of orders) {
    if (order.dryRun || !order.orderId || !order.productName) continue;
    const saleCents = remainingSalesCents(order.amountCents, order.refundedAmountCents);
    if (saleCents <= 0) continue;
    const period = payoutPeriod(order.createdAt);
    if (!period || !order.createdAt) continue;
    lines.push({
      period,
      code: order.code,
      orderId: order.orderId,
      productName: order.productName,
      createdAt: order.createdAt,
      orderKind: order.orderKind === "lab" ? "lab" : "treatment",
      saleCents,
      commissionCents: order.orderKind === "lab" ? adjustedCommissionCents(order.commissionCents, order.commissionRefundedCents) : 0,
      promoCode: order.promoCode?.trim() ?? "",
    });
  }
  return lines.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.code.localeCompare(right.code));
}

export function periodReferralSummaries(orders: PeriodReferralSource[]): PeriodReferralSummary[] {
  const groups = new Map<string, PeriodReferralSummary>();
  for (const order of orders) {
    if (order.dryRun) continue;
    if (remainingSalesCents(order.amountCents, order.refundedAmountCents) <= 0) continue;
    const period = payoutPeriod(order.createdAt);
    if (!period) continue;
    const key = `${period}\u0000${order.code}`;
    const current = groups.get(key) ?? { period, code: order.code, conversions: 0, commissionCents: 0 };
    current.conversions += 1;
    if (order.orderKind === "lab") {
      current.commissionCents += adjustedCommissionCents(order.commissionCents, order.commissionRefundedCents);
    }
    groups.set(key, current);
  }
  return [...groups.values()].sort((left, right) => right.period.localeCompare(left.period) || left.code.localeCompare(right.code));
}

export function weeklySaleLine(sale: { createdAt: string | null }) {
  const when = sale.createdAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(sale.createdAt))
    : "Unknown date";
  return `${when}: 1 conversion`;
}
