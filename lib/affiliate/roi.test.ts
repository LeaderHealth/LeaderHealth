import assert from "node:assert/strict";
import { test } from "node:test";
import { ROI_UNASSIGNED, roiCostCents, roiFigures, roiInRange, roiSpentOn } from "./roi";

const now = Date.parse("2026-11-10T18:00:00.000Z");

test("totals net revenue and marketing cost by promo, and leaves commission out", () => {
  const report = roiFigures({
    now,
    range: "all",
    orders: [
      { promoCode: "SPRING", amountCents: 20000, refundedAmountCents: 5000, dryRun: false, createdAt: "2026-10-01T12:00:00.000Z" },
      { promoCode: "spring", amountCents: 8000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-10-02T12:00:00.000Z" },
      { promoCode: "", amountCents: 4000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-10-03T12:00:00.000Z" },
      { promoCode: "SPRING", amountCents: 9000, refundedAmountCents: 0, dryRun: true, createdAt: "2026-10-04T12:00:00.000Z" },
    ],
    costs: [
      { campaign: "spring", costCents: 3000, spentOn: "2026-10-01" },
      { campaign: "No promo code", costCents: 1000, spentOn: "2026-10-03" },
      { campaign: "video", costCents: 2500, spentOn: "2026-09-01" },
    ],
  });

  assert.deepEqual(report.rows, [
    { campaign: "SPRING", orders: 2, costCents: 3000, revenueCents: 23000, profitCents: 20000 },
    { campaign: "video", orders: 0, costCents: 2500, revenueCents: 0, profitCents: -2500 },
    { campaign: ROI_UNASSIGNED, orders: 1, costCents: 1000, revenueCents: 4000, profitCents: 3000 },
  ]);
  assert.equal(report.orders, 3);
  assert.equal(report.costCents, 6500);
  assert.equal(report.revenueCents, 27000);
  assert.equal(report.profitCents, 20500);
});

test("the date window applies to sales and costs", () => {
  const orders = [
    { promoCode: "FALL", amountCents: 10000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-11-01T12:00:00.000Z" },
    { promoCode: "FALL", amountCents: 7000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-08-01T12:00:00.000Z" },
  ];
  const costs = [
    { campaign: "FALL", costCents: 2000, spentOn: "2026-11-02" },
    { campaign: "FALL", costCents: 9000, spentOn: "2026-01-15" },
  ];

  const recent = roiFigures({ orders, costs, range: "30", now });
  assert.deepEqual(recent.rows, [{ campaign: "FALL", orders: 1, costCents: 2000, revenueCents: 10000, profitCents: 8000 }]);

  const quarter = roiFigures({ orders, costs, range: "90", now });
  assert.equal(quarter.rows[0]?.orders, 1);
  assert.equal(quarter.rows[0]?.costCents, 2000);

  assert.equal(roiInRange("2026-08-01T12:00:00.000Z", "90", now), false);
  assert.equal(roiInRange("2026-11-01T12:00:00.000Z", "30", now), true);
  assert.equal(roiInRange(null, "all", now), false);
});

test("cost amount and date must be usable before they are saved", () => {
  assert.equal(roiCostCents("1,250.50"), 125050);
  assert.equal(roiCostCents("0"), null);
  assert.equal(roiCostCents("-5"), null);
  assert.equal(roiSpentOn("2026-02-31"), null);
  assert.equal(roiSpentOn("2026-11-10"), "2026-11-10");
});
