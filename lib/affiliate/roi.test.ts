import assert from "node:assert/strict";
import { test } from "node:test";
import { ROI_UNASSIGNED, affiliateRoiRows, campaignAffiliateRanks, campaignDirectoryName, campaignSocialTotals, marketingCostNote, ordersWithinCampaignPeriod, roiCostCents, roiFigures, roiInRange, roiSpentOn } from "./roi";

const now = Date.parse("2026-11-10T18:00:00.000Z");

test("a cost note is trimmed, kept to 80 characters, and free of control characters", () => {
  assert.equal(marketingCostNote(undefined), "");
  assert.equal(marketingCostNote(null), "");
  assert.equal(marketingCostNote("  Instagram   ads  "), "Instagram ads");
  assert.equal(marketingCostNote("Ads\u0000\nfee"), "Ads fee");
  assert.equal(marketingCostNote("x".repeat(80))?.length, 80);
  assert.equal(marketingCostNote("x".repeat(81)), null);
});

test("a cost date can be capped at today", () => {
  assert.equal(roiSpentOn("2026-11-27", "2026-11-27"), "2026-11-27");
  assert.equal(roiSpentOn("2026-11-28", "2026-11-27"), null);
  assert.equal(roiSpentOn("2026-11-28"), "2026-11-28");
});

test("cost adds commission after refunds and campaign post fees inside the range", () => {
  const report = roiFigures({
    now,
    range: "30",
    orders: [
      { promoCode: "FALL", amountCents: 10000, refundedAmountCents: 0, commissionCents: 1000, commissionRefundedCents: 400, dryRun: false, createdAt: "2026-11-01T12:00:00.000Z" },
      { promoCode: "FALL", amountCents: 10000, refundedAmountCents: 0, commissionCents: 1000, dryRun: true, createdAt: "2026-11-01T12:00:00.000Z" },
    ],
    costs: [{ campaign: "FALL", costCents: 2000, spentOn: "2026-11-02" }],
    postPay: [
      { campaign: "fall", amountCents: 1500, approvedAt: "2026-11-03T12:00:00.000Z" },
      { campaign: "FALL", amountCents: 9000, approvedAt: "2026-01-03T12:00:00.000Z" },
      { campaign: "", amountCents: 9000, approvedAt: "2026-11-03T12:00:00.000Z" },
    ],
  });
  assert.deepEqual(report.rows, [{ campaign: "FALL", orders: 1, costCents: 4100, revenueCents: 10000, profitCents: 5900 }]);
});

test("affiliate ROI weighs each affiliate's pay against their sales", () => {
  const base = { promoCode: "", refundedAmountCents: 0, dryRun: false, createdAt: "2026-11-01T12:00:00.000Z" };
  const rows = affiliateRoiRows({
    now,
    range: "30",
    names: new Map([["aa", "Angie"]]),
    orders: [
      { ...base, code: "aa", amountCents: 10000, commissionCents: 1000, commissionRefundedCents: 0 },
      { ...base, code: "AA", amountCents: 5000, refundedAmountCents: 5000, commissionCents: 500, commissionRefundedCents: 500 },
      { ...base, code: "bb", amountCents: 2000, commissionCents: 200 },
      { ...base, code: "cc", amountCents: 9000, dryRun: true },
      { ...base, code: "", amountCents: 9000 },
      { ...base, code: "dd", amountCents: 9000, createdAt: "2026-01-01T12:00:00.000Z" },
    ],
    postPay: [
      { code: "bb", campaign: "", amountCents: 5000, approvedAt: "2026-11-02T12:00:00.000Z" },
      { code: "ee", campaign: "Fall", amountCents: 0, approvedAt: "2026-11-02T12:00:00.000Z" },
    ],
  });
  assert.deepEqual(
    rows.map((row) => [row.code, row.name, row.orders, row.costCents, row.revenueCents, row.profitCents]),
    [
      ["aa", "Angie", 1, 1000, 10000, 9000],
      ["bb", "bb", 1, 5200, 2000, -3200],
    ],
  );
  assert.equal(rows[0].outside.revenueCents, 10000);
  assert.equal(rows[0].campaigns.orders, 0);
});

test("affiliate ROI splits campaign work from everything else", () => {
  const base = { refundedAmountCents: 0, dryRun: false, code: "aa" };
  const [row] = affiliateRoiRows({
    now,
    range: "all",
    windows: [{ name: "Fall", startsOn: "2026-10-01", endsOn: "2026-10-31" }],
    orders: [
      { ...base, promoCode: "fall", amountCents: 10000, commissionCents: 1000, createdAt: "2026-10-10T12:00:00.000Z" },
      { ...base, promoCode: "Fall", amountCents: 4000, commissionCents: 400, createdAt: "2026-11-05T12:00:00.000Z" },
      { ...base, promoCode: "", amountCents: 3000, commissionCents: 300, createdAt: "2026-11-05T12:00:00.000Z" },
    ],
    postPay: [
      { code: "aa", campaign: "Fall", amountCents: 2000, approvedAt: "2026-10-12T12:00:00.000Z" },
      { code: "aa", campaign: "", amountCents: 500, approvedAt: "2026-10-12T12:00:00.000Z" },
    ],
  });
  assert.deepEqual(row.campaigns, { orders: 1, costCents: 3000, revenueCents: 10000, profitCents: 7000 });
  assert.deepEqual(row.outside, { orders: 2, costCents: 1200, revenueCents: 7000, profitCents: 5800 });
  assert.equal(row.profitCents, 12800);
});

test("totals net revenue and marketing cost by promo", () => {
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

test("a saved campaign stays on the list before it has spend or sales", () => {
  const report = roiFigures({
    now,
    range: "30",
    orders: [],
    costs: [{ campaign: "spring", costCents: 2500, spentOn: "2026-01-01" }],
    campaigns: ["Spring", "spring", "Launch"],
  });

  assert.deepEqual(report.rows, [
    { campaign: "Launch", orders: 0, costCents: 0, revenueCents: 0, profitCents: 0 },
    { campaign: "Spring", orders: 0, costCents: 0, revenueCents: 0, profitCents: 0 },
  ]);
  assert.equal(campaignDirectoryName("  Spring sale "), "Spring sale");
  assert.equal(campaignDirectoryName("No promo code"), null);
  assert.equal(campaignDirectoryName(""), null);
});

test("affiliates rank by the stats they gained for a campaign", () => {
  const boards = campaignAffiliateRanks({
    now,
    range: "30",
    names: new Map([
      ["aaa", "Ada"],
      ["bbb", "Bea"],
    ]),
    posts: [
      { code: "bbb", campaign: "Launch", postedOn: "2026-11-02", views: 40, engagements: 4 },
      { code: "aaa", campaign: "launch", postedOn: "2026-11-03", views: 100, engagements: 8 },
      { code: "aaa", campaign: "Launch", postedOn: "2026-08-01", views: 900, engagements: 90 },
      { code: "aaa", campaign: "", postedOn: "2026-11-03", views: 50, engagements: 5 },
    ],
    orders: [
      { code: "bbb", promoCode: "Launch", amountCents: 5000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-11-04T12:00:00.000Z" },
      { code: "aaa", promoCode: "", amountCents: 32700, refundedAmountCents: 0, dryRun: false, createdAt: "2026-11-05T12:00:00.000Z" },
      { code: "bbb", promoCode: "Launch", amountCents: 9000, refundedAmountCents: 0, dryRun: true, createdAt: "2026-11-04T12:00:00.000Z" },
    ],
  });

  assert.deepEqual(
    boards.map((board) => ({ campaign: board.campaign, ranks: board.affiliates.map((affiliate) => [affiliate.rank, affiliate.name, affiliate.views, affiliate.orders]) })),
    [
      {
        campaign: "Launch",
        ranks: [
          [1, "Ada", 100, 0],
          [2, "Bea", 40, 1],
        ],
      },
      { campaign: ROI_UNASSIGNED, ranks: [[1, "Ada", 0, 1]] },
    ],
  );
});

test("an order outside the campaign dates does not change that campaign's revenue", () => {
  const report = roiFigures({
    now,
    range: "all",
    windows: [{ name: "Launch", startsOn: "2026-11-01", endsOn: "2026-11-30" }],
    orders: [
      { promoCode: "Launch", amountCents: 2000, refundedAmountCents: 0, commissionCents: 200, dryRun: false, createdAt: "2026-11-04T12:00:00.000Z" },
      { promoCode: "Launch", amountCents: 9000, refundedAmountCents: 0, commissionCents: 900, dryRun: false, createdAt: "2026-10-01T12:00:00.000Z" },
      { promoCode: "Launch", amountCents: 4000, refundedAmountCents: 4000, commissionCents: 400, commissionRefundedCents: 400, dryRun: false, createdAt: "2026-11-05T12:00:00.000Z" },
    ],
    costs: [
      { campaign: "Launch", costCents: 500, spentOn: "2026-11-02" },
      { campaign: "Launch", costCents: 8000, spentOn: "2026-10-02" },
    ],
    postPay: [
      { campaign: "Launch", amountCents: 300, approvedAt: "2026-11-06T12:00:00.000Z" },
      { campaign: "Launch", amountCents: 7000, approvedAt: "2026-10-06T12:00:00.000Z" },
    ],
  });
  assert.deepEqual(report.rows, [{ campaign: "Launch", orders: 1, costCents: 1000, revenueCents: 2000, profitCents: 1000 }]);
});

test("orders count only inside the campaign dates", () => {
  const windows = [{ name: "Launch", startsOn: "2026-11-01", endsOn: "2026-11-30" }];
  const orders = [
    { promoCode: "Launch", dryRun: false, createdAt: "2026-11-04T12:00:00.000Z" },
    { promoCode: "Launch", dryRun: false, createdAt: "2026-10-01T12:00:00.000Z" },
    { promoCode: "Launch", dryRun: true, createdAt: "2026-11-04T12:00:00.000Z" },
    { promoCode: "", dryRun: false, createdAt: "2026-11-05T12:00:00.000Z" },
  ];

  const counts = ordersWithinCampaignPeriod(orders, windows, "all", now);
  assert.equal(counts.get("launch"), 1);
  assert.equal(counts.get(ROI_UNASSIGNED.toLowerCase()), 1);

  const open = ordersWithinCampaignPeriod(orders, [{ name: "Launch", startsOn: "", endsOn: "" }], "all", now);
  assert.equal(open.get("launch"), 2);

  const ranks = campaignAffiliateRanks({
    now,
    range: "all",
    windows,
    names: new Map([["aaa", "Ada"]]),
    posts: [],
    orders: [
      { code: "aaa", promoCode: "Launch", amountCents: 1000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-10-01T12:00:00.000Z" },
      { code: "aaa", promoCode: "Launch", amountCents: 2000, refundedAmountCents: 0, dryRun: false, createdAt: "2026-11-04T12:00:00.000Z" },
    ],
  });
  assert.equal(ranks[0]?.campaign, "Launch");
  assert.equal(ranks[0]?.affiliates[0]?.orders, 1);
  assert.equal(ranks[0]?.affiliates[0]?.revenueCents, 2000);
});

test("campaign post stats stay with that campaign and inside the range", () => {
  const totals = campaignSocialTotals(
    [
      { campaign: "Launch", postedOn: "2026-11-01", views: 100, engagements: 12 },
      { campaign: "launch", postedOn: "2026-11-02", views: 40, engagements: 3 },
      { campaign: "Launch", postedOn: "2026-08-01", views: 999, engagements: 80 },
      { campaign: "", postedOn: "2026-11-01", views: 50, engagements: 5 },
      { campaign: "No promo code", postedOn: "2026-11-01", views: 20, engagements: 2 },
    ],
    "30",
    now,
  );
  assert.deepEqual(totals, [{ campaign: "Launch", views: 140, engagements: 15 }]);
});

test("cost amount and date must be usable before they are saved", () => {
  assert.equal(roiCostCents("1,250.50"), 125050);
  assert.equal(roiCostCents("0"), null);
  assert.equal(roiCostCents("-5"), null);
  assert.equal(roiSpentOn("2026-02-31"), null);
  assert.equal(roiSpentOn("2026-11-10"), "2026-11-10");
});
