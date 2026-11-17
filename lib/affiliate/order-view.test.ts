import assert from "node:assert/strict";
import { test } from "node:test";
import { adminOrderDetails, periodReferralSummaries, toAffiliateOrder, weeklySaleLine } from "./order-view";

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

    const serialized = JSON.stringify(view);
    assert.equal("productName" in view, false);
    assert.equal("orderId" in view, false);
    assert.equal("amountCents" in view, false);
    assert.equal("commissionCents" in view, false);
    assert.equal("commissionPercent" in view, false);
    assert.equal("createdAt" in view, false);
    assert.notEqual(view.ref, orderId);
    assert.equal(view.ref.includes(orderId), false);
    assert.equal(view.ref.length, 12);
    assert.equal(serialized.includes("Semaglutide"), false);
    assert.equal(serialized.includes(orderId), false);
  } finally {
    if (previous == null) delete process.env.AFFILIATE_SESSION_SECRET;
    else process.env.AFFILIATE_SESSION_SECRET = previous;
  }
});

test("a session secret changes the display ref and still hides the order id", () => {
  const previous = process.env.AFFILIATE_SESSION_SECRET;
  delete process.env.AFFILIATE_SESSION_SECRET;
  const plain = toAffiliateOrder({ orderId }).ref;
  process.env.AFFILIATE_SESSION_SECRET = "test-secret";
  try {
    const hidden = toAffiliateOrder({ orderId }).ref;
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
      orderKind: "lab" as const,
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
      orderKind: "lab" as const,
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
      orderKind: "lab" as const,
    },
    {
      code: "abc",
      dryRun: false,
      amountCents: 32700,
      refundedAmountCents: 0,
      commissionCents: 4905,
      commissionRefundedCents: 0,
      createdAt: "2026-10-08T00:00:00.000Z",
      productName: "Complete Lab",
      orderId: "ord_lab_secret",
      orderKind: "treatment" as const,
    },
  ];
  const rows = periodReferralSummaries(orders);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { period: "2026-11", code: "zzz", conversions: 1, commissionCents: 400 });
  assert.deepEqual(rows[1], { period: "2026-10", code: "abc", conversions: 3, commissionCents: 2100 });
  const serialized = JSON.stringify(rows);
  for (const row of rows) {
    assert.equal("productName" in row, false);
    assert.equal("orderId" in row, false);
    assert.equal("createdAt" in row, false);
    assert.equal("amountCents" in row, false);
  }
  assert.equal(serialized.includes("Semaglutide"), false);
  assert.equal(serialized.includes("Tirzepatide"), false);
  assert.equal(serialized.includes("Complete Lab"), false);
  assert.equal(serialized.includes(orderId), false);
  assert.equal(serialized.includes("ord_other"), false);
  assert.equal(serialized.includes("ord_lab_secret"), false);
});

test("admin order lines keep the product, sale, and order id", () => {
  const lines = adminOrderDetails([
    {
      code: "abc",
      dryRun: false,
      amountCents: 15900,
      refundedAmountCents: 0,
      commissionCents: 0,
      commissionRefundedCents: 0,
      createdAt: "2026-09-14T15:00:00.000Z",
      orderKind: "treatment",
      orderId,
      productName: "Semaglutide",
      promoCode: "ANGIE10",
    },
    {
      code: "abc",
      dryRun: true,
      amountCents: 8000,
      refundedAmountCents: 0,
      commissionCents: 800,
      commissionRefundedCents: 0,
      createdAt: "2026-09-11T00:00:00.000Z",
      orderKind: "lab",
      orderId: "ord_dry",
      productName: "Hidden Panel",
    },
  ]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].productName, "Semaglutide");
  assert.equal(lines[0].orderId, orderId);
  assert.equal(lines[0].saleCents, 15900);
  assert.equal(lines[0].orderKind, "treatment");
  assert.equal(lines[0].commissionCents, 0);
  assert.equal(lines[0].promoCode, "ANGIE10");
});

test("weekly lines name the date and a conversion count", () => {
  const line = weeklySaleLine({
    createdAt: "2026-10-21T15:00:00.000Z",
  });
  assert.equal(line, "Oct 21, 2026: 1 conversion");
  assert.equal(line.includes("$"), false);
  assert.equal(line.includes(orderId), false);
  assert.equal(/semaglutide/i.test(line), false);
});
