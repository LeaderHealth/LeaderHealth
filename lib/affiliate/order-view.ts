import { createHash } from "node:crypto";
import type { CommissionMode } from "./code";
import type { RefundStatus } from "./refunds";

export type AffiliateOrderView = {
  ref: string;
  amountCents: number | null;
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
  commissionCents: number;
  commissionRefundedCents: number;
  refundedAmountCents: number;
  refundStatus: RefundStatus;
  dryRun: boolean;
  createdAt: string | null;
};

type AffiliateOrderSource = {
  orderId: string;
  amountCents: number | null;
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
  commissionCents: number;
  commissionRefundedCents: number;
  refundedAmountCents: number;
  refundStatus: RefundStatus;
  dryRun: boolean;
  createdAt: string | null;
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
    amountCents: conversion.amountCents,
    commissionMode: conversion.commissionMode,
    commissionPercent: conversion.commissionPercent,
    commissionFixedCents: conversion.commissionFixedCents,
    commissionCents: conversion.commissionCents,
    commissionRefundedCents: conversion.commissionRefundedCents,
    refundedAmountCents: conversion.refundedAmountCents,
    refundStatus: conversion.refundStatus,
    dryRun: conversion.dryRun,
    createdAt: conversion.createdAt,
  };
}

export function weeklySaleLine(sale: { amountCents: number | null; commissionCents: number; createdAt: string | null }) {
  const when = sale.createdAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(sale.createdAt))
    : "Unknown date";
  const amount = sale.amountCents == null ? "—" : usd(sale.amountCents);
  return `${when}: ${amount} sale, ${usd(sale.commissionCents)} commission`;
}

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
