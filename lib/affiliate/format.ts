import type { CommissionMode } from "@/lib/affiliate/code";
import { formatPrice } from "@/lib/genhealth/types";

export function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

export function formatCommissionRate(input: {
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
}) {
  if (input.commissionMode === "fixed") return formatCents(input.commissionFixedCents);
  return `${input.commissionPercent}%`;
}

export function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
