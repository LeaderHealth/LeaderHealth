import assert from "node:assert/strict";
import { test } from "node:test";
import { accountColumnTotals } from "./account-figures";

const orders = [
  { code: "88h4dcji", dryRun: false, commissionCents: 4905 },
  { code: "88h4dcji", dryRun: true, commissionCents: 4905 },
  { code: "shalaka-testcode", dryRun: false, commissionCents: 1000 },
];

test("account columns use paid order records and subtract payouts already sent", () => {
  const totals = accountColumnTotals({
    code: "88h4dcji",
    clicks: 3,
    orders,
    unpaidOrders: 0,
    paidOutCents: 0,
  });
  assert.deepEqual(totals, {
    visitors: 3,
    paidOrders: 1,
    unpaidOrders: 0,
    earnedCents: 4905,
    unpaidEarnings: 4905,
    paidEarnings: 0,
  });
});

test("paid earnings reduce unpaid earnings and cannot make them negative", () => {
  const settled = accountColumnTotals({
    code: "88h4dcji",
    clicks: 3,
    orders,
    unpaidOrders: 1,
    paidOutCents: 4905,
  });
  assert.equal(settled.unpaidEarnings, 0);
  assert.equal(settled.paidEarnings, 4905);
  const overpaid = accountColumnTotals({
    code: "88h4dcji",
    clicks: 3,
    orders,
    unpaidOrders: 0,
    paidOutCents: 6000,
  });
  assert.equal(overpaid.unpaidEarnings, 0);
});

test("missing payout records leave earnings blank", () => {
  const totals = accountColumnTotals({
    code: "shalaka-testcode",
    clicks: 2,
    orders,
    unpaidOrders: null,
    paidOutCents: null,
  });
  assert.equal(totals.paidOrders, 1);
  assert.equal(totals.unpaidOrders, null);
  assert.equal(totals.unpaidEarnings, null);
  assert.equal(totals.paidEarnings, null);
});
