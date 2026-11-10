import assert from "node:assert/strict";
import { test } from "node:test";
import { approvableCents } from "./payouts";
import {
  advertisingEfficiencyCents,
  costPerMilleCents,
  marketingReportFields,
  visitsInMonth,
} from "./marketing";

test("a marketing report stores totals and not a commission", () => {
  const report = marketingReportFields({
    code: "abc123",
    month: "2026-11",
    network: "instagram",
    accountId: "ig1",
    accountName: "Ada",
    impressions: "0",
    reach: "40",
    likes: "1",
    comments: "2",
    shares: "3",
    saves: "4",
  });
  assert.ok(report);
  assert.equal(report.spendCents, 0);
  assert.equal("commissionCents" in report, false);
  assert.equal("earnedCents" in report, false);
  assert.equal("engagement" in report, false);
  assert.equal(costPerMilleCents(report.spendCents, report.impressions), null);
  assert.equal(advertisingEfficiencyCents(report.spendCents, 0), null);
  assert.equal(
    approvableCents({
      orders: [],
      payouts: [],
      code: report.code,
      period: report.month,
    }),
    0,
  );
});

test("CPM and efficiency use impressions and visits as the divisor", () => {
  assert.equal(costPerMilleCents(5000, 1000), 5000);
  assert.equal(advertisingEfficiencyCents(5000, 4), 1250);
  assert.equal(visitsInMonth(["2026-11-02T00:00:00.000Z", "2026-10-02T00:00:00.000Z", null], "2026-11"), 1);
});
