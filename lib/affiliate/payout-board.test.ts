import assert from "node:assert/strict";
import test from "node:test";
import { buildPayoutItems, itemsInRange, labPayoutRows, payoutCents, payoutMonths, payoutPeriodTotals, payoutReceipts, type PayoutBoardPost } from "./payout-board";

const today = "2026-11-17";

function post(overrides: Partial<PayoutBoardPost> = {}): PayoutBoardPost {
  return {
    id: "post1",
    caption: "Morning routine",
    format: "tiktok",
    campaign: "",
    publishedAt: "2026-11-08T00:00:00.000Z",
    createdAt: "2026-11-01T00:00:00.000Z",
    agreedFeeCents: null,
    viewRateCents: 200,
    engagementRateCents: 5,
    maxPayCents: null,
    trackingDays: 14,
    views: 1000,
    likes: 4,
    comments: 0,
    shares: 0,
    saves: 0,
    contentStatus: "approved",
    publicationStatus: "tracking_active",
    deliverableHoldStartedAt: null,
    deliverableRecheckedAt: null,
    deliverableForfeitedAt: null,
    ...overrides,
  };
}

test("payout items use real social, website, and paid amounts", () => {
  const items = buildPayoutItems({
    today,
    posts: [
      post(),
      post({
        id: "flat",
        caption: "Announcement",
        format: "instagram_post",
        viewRateCents: null,
        agreedFeeCents: 15000,
        views: null,
        publishedAt: "2026-09-20T00:00:00.000Z",
        contentStatus: "approved",
        publicationStatus: "tracking_active",
      }),
      post({ id: "closed", caption: "Declined", contentStatus: "rejected", publicationStatus: null, publishedAt: null }),
    ],
    payments: [
      {
        postId: "flat",
        amountCents: 15000,
        status: "paid",
        approvedAt: "2026-10-21T00:00:00.000Z",
        paidCents: 15000,
        paidAt: "2026-11-15T00:00:00.000Z",
        reference: "ACH · October",
        adjustmentCents: null,
        adjustmentReason: "",
      },
    ],
    websites: [
      {
        period: "2026-11",
        clicks: 10,
        pageViews: 2000,
        amountCents: 500,
        status: "pending",
        clickRateCents: 10,
        pageViewRateCents: 200,
        paidAt: null,
        approvedAt: null,
        reference: "",
      },
      {
        period: "2026-09",
        clicks: 0,
        pageViews: 0,
        amountCents: 0,
        status: "pending",
        clickRateCents: 10,
        pageViewRateCents: 200,
        paidAt: null,
        approvedAt: null,
        reference: "",
      },
    ],
  });
  const social = items.find((item) => item.id === "post1");
  const base = items.find((item) => item.id === "flat");
  const web = items.find((item) => item.id === "web-2026-11");
  assert.equal(social?.kind, "social");
  assert.equal(social?.status, "review");
  assert.equal(social?.amountCents, 220);
  assert.equal(base?.kind, "base");
  assert.equal(base?.status, "paid");
  assert.equal(base?.amountCents, 15000);
  assert.equal(web?.status, "review");
  assert.equal(web?.amountCents, 500);
  assert.equal(items.some((item) => item.id === "closed" || item.id === "web-2026-09"), false);
  const recent = itemsInRange(items, today, "30");
  assert.deepEqual(recent.map((item) => item.id).sort(), ["post1", "web-2026-11"]);
  const months = payoutMonths(items, today, "90");
  assert.equal(months.find((month) => month.period === "2026-09")?.base, 15000);
  assert.equal(payoutCents(items.filter((item) => item.status === "paid")), 15000);
  const receipts = payoutReceipts(items, today, "90");
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0]?.reference, "ACH · October");
  assert.equal(receipts[0]?.amountCents, 15000);
  assert.equal(payoutReceipts(items, today, "30").length, 1);
  const lab = labPayoutRows(
    [{ period: "2026-10", amountCents: 4905, conversions: 3, status: "paid", paidOn: "2026-11-15T00:00:00.000Z", approvedOn: "2026-11-03T00:00:00.000Z", reference: "ACH", terms: "15% of each completed lab order", refs: [{ id: "abc123def456", source: "Tracking link" }] }],
    today,
  );
  assert.equal(lab.items[0]?.kind, "lab");
  assert.equal(lab.items[0]?.amountCents, 4905);
  assert.equal(lab.periods[0]?.tone, "paid");
  assert.equal(lab.periods[0]?.refs[0]?.id, "abc123def456");
  const withLab = buildPayoutItems({ today, posts: [], payments: [], websites: [], labs: [{ period: "2026-10", amountCents: 4905, conversions: 3, status: "paid", paidOn: "2026-11-15T00:00:00.000Z", approvedOn: null, reference: "", terms: "15%", refs: [] }] });
  assert.equal(payoutMonths(withLab, today, "90").find((month) => month.period === "2026-10")?.lab, 4905);
  const combined = payoutPeriodTotals([...items.filter((item) => item.earnedOn.startsWith("2026-10") || item.earnedOn.startsWith("2026-11")), ...withLab]);
  const octoberTotal = combined.find((month) => month.period === "2026-10");
  assert.equal(octoberTotal?.base, 0);
  assert.equal(octoberTotal?.lab, 4905);
  assert.equal(octoberTotal?.total, 4905);
  const novemberTotal = combined.find((month) => month.period === "2026-11");
  assert.equal(novemberTotal?.social, 220);
  assert.equal(novemberTotal?.web, 500);
  assert.equal(novemberTotal?.total, 720);
});

test("the monthly posting rate shows as a base payment once earned, and a short month stays until it is earned", () => {
  const monthly = { rateCents: 30000, requiredPosts: 4, approvedAt: null, paidAt: null, reference: "" };
  const items = buildPayoutItems({
    today,
    posts: [],
    payments: [],
    websites: [],
    monthlies: [
      { ...monthly, period: "2026-10", verifiedPosts: 4, earnedCents: 30000, status: "paid", paidAt: "2026-11-05T00:00:00.000Z", reference: "ACH" },
      { ...monthly, period: "2026-11", verifiedPosts: 2, earnedCents: 0, status: "short" },
      { ...monthly, period: "2026-09", verifiedPosts: 1, earnedCents: 0, status: "short" },
    ],
  });
  const october = items.find((item) => item.id === "monthly-2026-10");
  const november = items.find((item) => item.id === "monthly-2026-11");
  assert.equal(october?.kind, "base");
  assert.equal(october?.status, "paid");
  assert.equal(october?.amountCents, 30000);
  assert.equal(november?.status, "review");
  assert.equal(november?.amountCents, 0);
  assert.match(november?.work ?? "", /2 of 4 required posts live/);
  assert.equal(items.some((item) => item.id === "monthly-2026-09"), false);
});
