import assert from "node:assert/strict";
import { test } from "node:test";
import { websiteReportMonths } from "./website-report";

const code = "k7mq2n4p";

test("website reports count tracking links and promo codes separately", () => {
  const months = websiteReportMonths({
    code,
    now: new Date("2026-03-15T00:00:00.000Z"),
    visits: [
      { code, createdAt: "2026-03-02T00:00:00.000Z", promoCode: null },
      { code, createdAt: "2026-03-03T00:00:00.000Z", promoCode: null },
      { code, createdAt: "2026-03-04T00:00:00.000Z", promoCode: "TEST10" },
      { code, createdAt: "2026-03-05T00:00:00.000Z", promoCode: "test10" },
      { code: "other-affiliate", createdAt: "2026-03-05T00:00:00.000Z", promoCode: "TEST10" },
    ],
    orders: [
      { code, createdAt: "2026-03-06T00:00:00.000Z", promoCode: null, dryRun: false },
      { code, createdAt: "2026-03-07T00:00:00.000Z", promoCode: "TEST10", dryRun: false },
      { code, createdAt: "2026-03-08T00:00:00.000Z", promoCode: "TEST10", dryRun: true },
      { code, createdAt: "2026-04-01T00:00:00.000Z", promoCode: "TEST21", dryRun: false },
    ],
  });
  const march = months.find((month) => month.month === "2026-03");
  const april = months.find((month) => month.month === "2026-04");
  assert.ok(march);
  assert.equal(march.trackingVisits, 2);
  assert.equal(march.trackingOrders, 1);
  assert.equal(march.promoVisits, 2);
  assert.equal(march.promoOrders, 1);
  assert.deepEqual(march.promos, [{ code: "TEST10", visits: 2, orders: 1 }]);
  assert.equal(april?.promoOrders, 1);
  assert.equal(april?.promos[0]?.code, "TEST21");
  assert.equal("commissionCents" in march, false);
});

test("a website report with no visits still has the current month", () => {
  const months = websiteReportMonths({
    code,
    visits: [],
    orders: [],
    now: new Date("2026-11-09T00:00:00.000Z"),
  });
  assert.equal(months.length, 1);
  assert.equal(months[0]?.month, "2026-11");
  assert.equal(months[0]?.trackingVisits, 0);
  assert.equal(months[0]?.promoOrders, 0);
});
