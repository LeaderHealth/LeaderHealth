import assert from "node:assert/strict";
import { test } from "node:test";
import { periodReferralSummaries, toAffiliateOrder, weeklySaleLine } from "./order-view";

const orderId = "ord_48ed6c335e9719fef64960ca";

test("affiliate order view drops the treatment name and the Gen Health order id", () => {
  const previous = process.env.AFFILIATE_SESSION_SECRET;
  delete process.env.AFFILIATE_SESSION_SECRET;
  try {
    const source = {
      orderId,
      productName: "Semaglutide",
      amountCents: 15900,
      commissionMode: "percent" as const,
      commissionPercent: 15,
      commissionFixedCents: 0,
      commissionCents: 2385,
      commissionRefundedCents: 0,
      refundedAmountCents: 0,
      refundStatus: "none" as const,
      dryRun: false,
      createdAt: "2026-10-21T15:00:00.000Z",
    };
    const view = toAffiliateOrder(source);

    assert.equal("productName" in view, false);
    assert.equal("orderId" in view, false);
    assert.notEqual(view.ref, orderId);
    assert.equal(view.ref.includes(orderId), false);
    assert.equal(view.ref.length, 12);
    assert.equal(view.amountCents, 15900);
    assert.equal(view.commissionCents, 2385);
  } finally {
    if (previous == null) delete process.env.AFFILIATE_SESSION_SECRET;
    else process.env.AFFILIATE_SESSION_SECRET = previous;
  }
});

test("a session secret changes the display ref and still hides the order id", () => {
  const previous = process.env.AFFILIATE_SESSION_SECRET;
  delete process.env.AFFILIATE_SESSION_SECRET;
  const plain = toAffiliateOrder({
    orderId,
    amountCents: 1000,
    commissionMode: "fixed",
    commissionPercent: 0,
    commissionFixedCents: 500,
    commissionCents: 500,
    commissionRefundedCents: 0,
    refundedAmountCents: 0,
    refundStatus: "none",
    dryRun: false,
    createdAt: null,
  }).ref;
  process.env.AFFILIATE_SESSION_SECRET = "test-secret";
  try {
    const hidden = toAffiliateOrder({
      orderId,
      amountCents: 1000,
      commissionMode: "fixed",
      commissionPercent: 0,
      commissionFixedCents: 500,
      commissionCents: 500,
      commissionRefundedCents: 0,
      refundedAmountCents: 0,
      refundStatus: "none",
      dryRun: false,
      createdAt: null,
    }).ref;
    assert.notEqual(hidden, plain);
    assert.notEqual(hidden, orderId);
  } finally {
    if (previous == null) delete process.env.AFFILIATE_SESSION_SECRET;
    else process.env.AFFILIATE_SESSION_SECRET = previous;
  }
});

test("period summaries collapse a month and hide order details", () => {
  const orders = [
    {
      code: "abc",
      dryRun: false,
      amountCents: 10000,
      refundedAmountCents: 0,
      commissionCents: 1500,
      commissionRefundedCents: 0,
      createdAt: "2026-10-21T15:00:00.000Z",
      productName: "Semaglutide",
      orderId,
    },
    {
      code: "abc",
      dryRun: false,
      amountCents: 5000,
      refundedAmountCents: 1000,
      commissionCents: 750,
      commissionRefundedCents: 150,
      createdAt: "2026-10-02T00:00:00.000Z",
      productName: "Tirzepatide",
      orderId: "ord_other",
    },
    {
      code: "abc",
      dryRun: true,
      amountCents: 8000,
      refundedAmountCents: 0,
      commissionCents: 800,
      commissionRefundedCents: 0,
      createdAt: "2026-10-11T00:00:00.000Z",
    },
    {
      code: "abc",
      dryRun: false,
      amountCents: 2000,
      refundedAmountCents: 2000,
      commissionCents: 300,
      commissionRefundedCents: 300,
      createdAt: "2026-10-15T00:00:00.000Z",
    },
    {
      code: "zzz",
      dryRun: false,
      amountCents: 4000,
      refundedAmountCents: 0,
      commissionCents: 400,
      commissionRefundedCents: 0,
      createdAt: "2026-11-01T00:00:00.000Z",
    },
  ];
  const rows = periodReferralSummaries(orders);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { period: "2026-11", code: "zzz", conversions: 1, commissionCents: 400 });
  assert.deepEqual(rows[1], { period: "2026-10", code: "abc", conversions: 2, commissionCents: 2100 });
  for (const row of rows) {
    assert.equal("productName" in row, false);
    assert.equal("orderId" in row, false);
    assert.equal("createdAt" in row, false);
    assert.equal("amountCents" in row, false);
  }
});

test("weekly sale lines name the date, amount, and commission only", () => {
  const line = weeklySaleLine({
    amountCents: 10000,
    commissionCents: 1500,
    createdAt: "2026-10-21T15:00:00.000Z",
  });
  assert.equal(line, "Oct 21, 2026: $100.00 sale, $15.00 commission");
  assert.equal(line.includes(orderId), false);
  assert.equal(/semaglutide/i.test(line), false);
});
