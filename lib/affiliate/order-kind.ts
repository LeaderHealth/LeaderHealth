import { canonicalLabProductId, idsForLab, labs } from "@/lib/content/products";
import { LAB_COMMISSIONS_ENABLED, commissionForOrder, type CommissionMode } from "./code";

const labProductIds = new Set(labs.flatMap((lab) => idsForLab(lab)));

export type OrderKind = "lab" | "treatment";

export function orderKindFromProductIds(ids: readonly string[]): OrderKind {
  const known = ids.map((id) => id.trim()).filter(Boolean);
  if (known.length === 0) return "treatment";
  const lab = known.every((id) => labProductIds.has(id) || labProductIds.has(canonicalLabProductId(id)));
  return lab ? "lab" : "treatment";
}

export function commissionForRecordedOrder(input: {
  productIds: readonly string[];
  mode: CommissionMode;
  percent: number;
  fixedCents: number;
  amountCents: number | null;
  labCommissionsEnabled?: boolean;
}) {
  const orderKind = orderKindFromProductIds(input.productIds);
  const enabled = input.labCommissionsEnabled ?? LAB_COMMISSIONS_ENABLED;
  if (orderKind !== "lab" || !enabled) return { orderKind, commissionCents: 0 };
  return {
    orderKind,
    commissionCents: commissionForOrder({
      mode: input.mode,
      percent: input.percent,
      fixedCents: input.fixedCents,
      amountCents: input.amountCents,
    }),
  };
}
