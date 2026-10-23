import assert from "node:assert/strict";
import test from "node:test";
import { approvableCents, type PayoutRecord } from "./payouts";

const paid: PayoutRecord = {
  id: "paid-1",
  code: "88h4dcji",
  period: "2026-09",
  status: "paid",
  earnedCents: 4905,
  approvedAt: "2026-09-30T00:00:00.000Z",
  paidCents: 4905,
  paidAt: "2026-10-01T00:00:00.000Z",
  reference: "external",
};

test("a negative balance holds a later month until the deficit is recovered", () => {
  const orders = [
    { code: "88h4dcji", commissionCents: 4905, commissionRefundedCents: 4905, dryRun: false, createdAt: "2026-09-16T12:00:00.000Z" },
    { code: "88h4dcji", commissionCents: 2000, commissionRefundedCents: 0, dryRun: false, createdAt: "2026-10-04T12:00:00.000Z" },
  ];
  assert.equal(approvableCents({ orders, payouts: [paid], code: "88h4dcji", period: "2026-10" }), 0);
  const recovered = [
    orders[0],
    { code: "88h4dcji", commissionCents: 6000, commissionRefundedCents: 0, dryRun: false, createdAt: "2026-10-04T12:00:00.000Z" },
  ];
  assert.equal(approvableCents({ orders: recovered, payouts: [paid], code: "88h4dcji", period: "2026-10" }), 1095);
  assert.equal(approvableCents({ orders: recovered, payouts: [paid], code: "88h4dcji", period: "2026-09" }), 0);
});
