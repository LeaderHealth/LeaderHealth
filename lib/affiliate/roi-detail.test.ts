import assert from "node:assert/strict";
import { test } from "node:test";
import { blankCampaignRecord } from "./campaign-record";
import { campaignAdvice, campaignPhase, campaignRoiCsv, campaignRoiDetail, formatRoi, roiPercent } from "./roi-detail";

const record = {
  ...blankCampaignRecord("Fall wellness"),
  startsOn: "2026-09-15",
  endsOn: "2026-10-15",
  assignedCodes: ["aa", "bb"],
  postsRequired: 2,
};

const order = (patch: Partial<{ code: string; promoCode: string; amountCents: number; refundedAmountCents: number; dryRun: boolean; createdAt: string }>) => ({
  code: "aa",
  promoCode: "Fall wellness",
  amountCents: 10000,
  refundedAmountCents: 0,
  dryRun: false,
  createdAt: "2026-10-01T12:00:00.000Z",
  ...patch,
});

test("a campaign detail counts sales inside its dates and its recorded costs", () => {
  const detail = campaignRoiDetail({
    record,
    today: "2026-11-01",
    names: new Map([["aa", "Angie"]]),
    orders: [
      order({}),
      order({ code: "bb", amountCents: 5000, refundedAmountCents: 5000 }),
      order({ createdAt: "2026-11-01T12:00:00.000Z" }),
      order({ promoCode: "Other" }),
      order({ dryRun: true }),
    ],
    costs: [
      { campaign: "fall wellness", costCents: 4000, spentOn: "2026-09-20" },
      { campaign: "Other", costCents: 9999, spentOn: "2026-09-20" },
    ],
    posts: [
      { code: "aa", campaign: "Fall wellness", contentStatus: "approved", publicationStatus: "tracking_active", views: 1200, engagements: 80 },
      { code: "bb", campaign: "Fall wellness", contentStatus: "submitted", publicationStatus: null, views: 999, engagements: 9 },
    ],
  });
  assert.equal(detail.phase, "ended");
  assert.equal(detail.orders, 1);
  assert.equal(detail.salesCents, 10000);
  assert.equal(detail.refundedCents, 5000);
  assert.equal(detail.costCents, 4000);
  assert.equal(detail.netCents, 6000);
  assert.equal(detail.roiPct, 150);
  assert.equal(detail.views, 1200);
  assert.equal(detail.verified, 1);
  assert.equal(detail.required, 4);
  assert.equal(detail.affiliates[0].name, "Angie");
  assert.equal(detail.affiliates[0].salesCents, 10000);
});

test("a 30-day range drops an order and a cost outside that range", () => {
  const detail = campaignRoiDetail({
    record,
    today: "2026-11-10",
    now: Date.parse("2026-11-10T18:00:00.000Z"),
    range: "30",
    orders: [
      order({ createdAt: "2026-10-01T12:00:00.000Z" }),
      order({ amountCents: 2500, createdAt: "2026-10-12T12:00:00.000Z" }),
    ],
    costs: [
      { campaign: "Fall wellness", costCents: 4000, spentOn: "2026-09-20" },
      { campaign: "Fall wellness", costCents: 500, spentOn: "2026-10-12" },
    ],
    posts: [],
    postPay: [
      { campaign: "Fall wellness", amountCents: 900, approvedAt: "2026-09-21T12:00:00.000Z" },
      { campaign: "Fall wellness", amountCents: 100, approvedAt: "2026-10-12T12:00:00.000Z" },
    ],
  });
  assert.equal(detail.orders, 1);
  assert.equal(detail.salesCents, 2500);
  assert.equal(detail.marketingCents, 500);
  assert.equal(detail.affiliatePayCents, 100);
  assert.equal(detail.costCents, 600);
});

test("advice points to the next useful action", () => {
  const base = campaignRoiDetail({ record, orders: [order({})], costs: [{ campaign: "Fall wellness", costCents: 4000, spentOn: "2026-09-20" }], posts: [], names: new Map([["aa", "Angie"]]), today: "2026-11-01" });
  assert.equal(campaignAdvice(base), "Paid off at +150.0%. Angie brought in 100% of sales. Invite the same affiliates to your next campaign.");
  assert.match(campaignAdvice({ ...base, costCents: 0 }), /Add this campaign’s costs/);
  assert.match(campaignAdvice({ ...base, phase: "running" }), /4 of 4 required posts/);
  assert.match(campaignAdvice({ ...base, orders: 0, views: 50 }), /views but no orders/);
  assert.match(campaignAdvice({ ...base, roiPct: -20 }), /Lost money at −20\.0%/);
  assert.match(campaignAdvice({ ...base, affiliates: [] }), /Assign affiliates/);
});

test("ROI needs a cost and shows a signed percent", () => {
  assert.equal(roiPercent(1000, 0), null);
  assert.equal(formatRoi(null), "—");
  assert.equal(formatRoi(roiPercent(500, 1000)), "−50.0%");
  assert.equal(formatRoi(roiPercent(1500, 1000)), "+50.0%");
});

test("a running campaign reports its day", () => {
  assert.deepEqual(campaignPhase({ startsOn: "2026-11-25", endsOn: "2026-12-31" }, "2026-11-27"), { phase: "running", day: 3, days: 37 });
  assert.equal(campaignPhase({ startsOn: "2026-12-01", endsOn: "" }, "2026-11-27").phase, "upcoming");
  assert.equal(campaignPhase({ startsOn: "", endsOn: "" }, "2026-11-27").phase, "open");
});

test("costs keep their note and recorder, newest first, and export safely", () => {
  const detail = campaignRoiDetail({
    record,
    orders: [],
    costs: [
      { id: "a1", campaign: "Fall wellness", costCents: 1000, spentOn: "2026-09-16", note: "Flyers", recordedBy: "help@myleaderhealth.com" },
      { id: "b2", campaign: "Fall wellness", costCents: 2000, spentOn: "2026-10-01", note: "=SUM(A1)", recordedBy: "" },
    ],
    posts: [],
    today: "2026-11-01",
  });
  assert.deepEqual(
    detail.costs.map((cost) => [cost.id, cost.note, cost.recordedBy]),
    [
      ["b2", "=SUM(A1)", ""],
      ["a1", "Flyers", "help@myleaderhealth.com"],
    ],
  );
  const csv = campaignRoiCsv(detail);
  assert.match(csv, /Spent on,What for,Recorded by,Cost/);
  assert.match(csv, /2026-10-01,'=SUM\(A1\),,20\.00/);
  assert.match(csv, /2026-09-16,Flyers,help@myleaderhealth\.com,10\.00/);
});

test("affiliate pay counts commissions after refunds and campaign post fees", () => {
  const detail = campaignRoiDetail({
    record,
    orders: [
      { ...order({}), commissionCents: 1000, commissionRefundedCents: 250 },
      { ...order({ promoCode: "Other" }), commissionCents: 9999 },
      { ...order({ createdAt: "2026-11-01T12:00:00.000Z" }), commissionCents: 9999 },
    ],
    costs: [{ campaign: "Fall wellness", costCents: 4000, spentOn: "2026-09-20" }],
    posts: [],
    postPay: [
      { campaign: "fall wellness", amountCents: 2500, approvedAt: "2026-10-02T00:00:00.000Z" },
      { campaign: "Other", amountCents: 9999, approvedAt: "2026-10-02T00:00:00.000Z" },
    ],
    today: "2026-11-01",
  });
  assert.equal(detail.affiliatePayCents, 3250);
  assert.equal(detail.marketingCents, 4000);
  assert.equal(detail.costCents, 7250);
  assert.equal(detail.netCents, 2750);
  assert.match(campaignRoiCsv(detail), /Affiliate pay,32\.50\nMarketing costs,40\.00\nCost,72\.50/);

  const empty = campaignRoiDetail({ record, orders: [], costs: [], posts: [], today: "2026-11-01" });
  assert.equal(empty.affiliatePayCents, 0);
  assert.equal(empty.marketingCents, 0);
});

test("the export keeps spreadsheet formulas out", () => {
  const detail = campaignRoiDetail({ record: { ...record, name: "=cmd" }, orders: [], costs: [], posts: [], today: "2026-11-01" });
  const csv = campaignRoiCsv(detail);
  assert.match(csv, /^Campaign,'=cmd/);
  assert.match(csv, /Profit,0\.00/);
});
