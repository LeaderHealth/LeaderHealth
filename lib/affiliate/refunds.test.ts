import assert from "node:assert/strict";
import { test } from "node:test";
import { accountColumnTotals } from "./account-figures";
import { adjustedCommissionCents, commissionRefundTarget, planRefundAdjustments } from "./refunds";

test("a full refund deducts the entire commission", () => {
  assert.equal(
    commissionRefundTarget({
      originalAmountCents: 32700,
      originalCommissionCents: 4905,
      refundedAmountCents: 32700,
      full: true,
    }),
    4905,
  );
  const [plan] = planRefundAdjustments({
    originalAmountCents: 32700,
    originalCommissionCents: 4905,
    recorded: [],
    incoming: [{ key: "status:full", amountCents: 32700, cumulative: true, full: true }],
  });
  assert.equal(plan.commissionCents, 4905);
  assert.equal(plan.full, true);
  assert.equal(adjustedCommissionCents(4905, plan.commissionCents), 0);
});

test("a partial refund deducts a proportional commission", () => {
  assert.equal(
    commissionRefundTarget({
      originalAmountCents: 32700,
      originalCommissionCents: 4905,
      refundedAmountCents: 16350,
      full: false,
    }),
    Math.round((4905 * 16350) / 32700),
  );
});

test("a fixed commission uses the same proportion of the original order", () => {
  assert.equal(
    commissionRefundTarget({
      originalAmountCents: 20000,
      originalCommissionCents: 5000,
      refundedAmountCents: 5000,
      full: false,
    }),
    1250,
  );
});

test("two partial refunds add up and a repeated key is deducted once", () => {
  const first = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: [],
    incoming: [{ key: "refund-a", amountCents: 4000, cumulative: false }],
  });
  assert.equal(first.length, 1);
  const second = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: first.map((plan) => ({ ...plan, cumulative: false })),
    incoming: [
      { key: "refund-a", amountCents: 4000, cumulative: false },
      { key: "refund-b", amountCents: 6000, cumulative: false },
    ],
  });
  assert.equal(second.length, 1);
  assert.equal(second[0].key, "refund-b");
  assert.equal(first[0].commissionCents + second[0].commissionCents, 1500);
  const repeated = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: [...first, ...second].map((plan) => ({ ...plan, cumulative: false })),
    incoming: [
      { key: "refund-a", amountCents: 4000, cumulative: false },
      { key: "refund-b", amountCents: 6000, cumulative: false },
    ],
  });
  assert.deepEqual(repeated, []);
});

test("a cumulative refund only deducts the increase", () => {
  const first = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: [],
    incoming: [{ key: "cumulative:4000", amountCents: 4000, cumulative: true }],
  });
  const second = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: first,
    incoming: [{ key: "cumulative:7000", amountCents: 7000, cumulative: true }],
  });
  assert.equal(second.length, 1);
  assert.equal(second[0].commissionCents, Math.round((1500 * 7000) / 10000) - first[0].commissionCents);
  const same = planRefundAdjustments({
    originalAmountCents: 10000,
    originalCommissionCents: 1500,
    recorded: [...first, ...second],
    incoming: [{ key: "cumulative:7000", amountCents: 7000, cumulative: true }],
  });
  assert.deepEqual(same, []);
});

test("a partial refund is skipped when the original amount is missing", () => {
  assert.equal(
    commissionRefundTarget({
      originalAmountCents: null,
      originalCommissionCents: 4905,
      refundedAmountCents: 1000,
      full: false,
    }),
    0,
  );
  assert.equal(
    commissionRefundTarget({
      originalAmountCents: null,
      originalCommissionCents: 4905,
      refundedAmountCents: 0,
      full: true,
    }),
    4905,
  );
});

test("a refund can make unpaid earnings negative and a later commission reduces it", () => {
  const refunded = accountColumnTotals({
    code: "88h4dcji",
    clicks: 1,
    orders: [{ code: "88h4dcji", dryRun: false, commissionCents: 4905, commissionRefundedCents: 4905 }],
    unpaidOrders: 0,
    paidOutCents: 4905,
  });
  assert.equal(refunded.earnedCents, 0);
  assert.equal(refunded.unpaidEarnings, -4905);
  const recovered = accountColumnTotals({
    code: "88h4dcji",
    clicks: 1,
    orders: [
      { code: "88h4dcji", dryRun: false, commissionCents: 4905, commissionRefundedCents: 4905 },
      { code: "88h4dcji", dryRun: false, commissionCents: 2000, commissionRefundedCents: 0 },
    ],
    unpaidOrders: 0,
    paidOutCents: 4905,
  });
  assert.equal(recovered.unpaidEarnings, -2905);
});
