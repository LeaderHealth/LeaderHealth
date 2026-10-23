import assert from "node:assert/strict";
import { test } from "node:test";
import { monthFigures } from "./month-figures";
import { previousPayoutPeriod } from "./payouts";

const orders = [
  {
    code: "athlete",
    dryRun: false,
    amountCents: 10000,
    commissionCents: 1500,
    commissionRefundedCents: 500,
    createdAt: "2026-09-15T12:00:00.000Z",
  },
  {
    code: "athlete",
    dryRun: true,
    amountCents: 8000,
    commissionCents: 1200,
    commissionRefundedCents: 0,
    createdAt: "2026-09-20T12:00:00.000Z",
  },
  {
    code: "other",
    dryRun: false,
    amountCents: 4000,
    commissionCents: 600,
    commissionRefundedCents: 0,
    createdAt: "2026-09-18T12:00:00.000Z",
  },
  {
    code: "athlete",
    dryRun: false,
    amountCents: 2000,
    commissionCents: 300,
    commissionRefundedCents: 0,
    createdAt: "2026-10-02T12:00:00.000Z",
  },
  {
    code: "athlete",
    dryRun: false,
    amountCents: 500,
    commissionCents: 75,
    commissionRefundedCents: 0,
    createdAt: null,
  },
];

test("month figures keep the prior month and subtract refunded commission", () => {
  assert.deepEqual(monthFigures({ code: "athlete", period: "2026-09", orders }), {
    orders: 1,
    salesCents: 10000,
    earningsCents: 1000,
  });
  assert.deepEqual(monthFigures({ code: "athlete", period: "2026-10", orders }), {
    orders: 1,
    salesCents: 2000,
    earningsCents: 300,
  });
});

test("the previous payout month rolls from January into December", () => {
  assert.equal(previousPayoutPeriod("2026-10"), "2026-09");
  assert.equal(previousPayoutPeriod("2026-01"), "2025-12");
  assert.equal(previousPayoutPeriod("2026-13"), null);
});
