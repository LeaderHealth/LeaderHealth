import assert from "node:assert/strict";
import { test } from "node:test";
import { idsForLab, labs } from "@/lib/content/products";
import { adminHasFullAccess } from "./session";
import {
  approvalDecision,
  canReleaseDeliverablePayment,
  deliverableLines,
  markPaidDecision,
  marketingTotals,
} from "./deliverable-payments";
import { deliverableAdjustmentCents, deliverablePhase } from "./deliverable-flow";
import { manualReportDue, viewPayCents, viewWindowEnded } from "./manual-checkpoint";
import { commissionForRecordedOrder } from "./order-kind";

const labId = idsForLab(labs[0])[0];
const now = Date.parse("2026-11-13T16:00:00.000Z");

function post(overrides: Record<string, unknown>) {
  return {
    id: "livepost01",
    code: "abc",
    contentStatus: "approved",
    publicationStatus: "tracking_active",
    agreedFeeCents: 5000,
    format: "instagram_post",
    publishedAt: "2026-11-01T16:00:00.000Z",
    deliverableHoldStartedAt: "2026-11-01T16:00:00.000Z",
    deliverableRecheckedAt: null,
    deliverableForfeitedAt: null,
    ...overrides,
  };
}

test("a live post stays on hold for 14 days and is earned only after a re-check", () => {
  const lines = deliverableLines(
    {
      affiliates: [{ code: "abc", name: "Ada" }],
      posts: [
        post({}),
        post({ id: "waitpost01", publicationStatus: "awaiting_publication", deliverableHoldStartedAt: null, publishedAt: null }),
        post({ id: "ready00001", deliverableHoldStartedAt: "2026-10-01T16:00:00.000Z", deliverableRecheckedAt: "2026-10-16T16:00:00.000Z" }),
        post({ id: "ended00001", deliverableHoldStartedAt: "2026-10-01T16:00:00.000Z" }),
        post({ id: "lostpost01", deliverableForfeitedAt: "2026-11-02T16:00:00.000Z" }),
        post({ id: "sentpost01", contentStatus: "submitted", publicationStatus: null, deliverableHoldStartedAt: null, publishedAt: null }),
        post({ id: "droppost01", contentStatus: "rejected", publicationStatus: null, deliverableHoldStartedAt: null, publishedAt: null }),
      ],
      payments: [],
    },
    now,
  );
  const byId = new Map(lines.map((line) => [line.postId, line.status]));
  assert.equal(byId.get("livepost01"), "hold");
  assert.equal(byId.get("waitpost01"), "waiting");
  assert.equal(byId.get("ready00001"), "pending");
  assert.equal(byId.get("ended00001"), "recheck");
  assert.equal(byId.get("lostpost01"), "forfeited");
  assert.equal(byId.get("sentpost01"), "review");
  assert.equal(byId.get("droppost01"), "closed");
  const totals = marketingTotals(lines);
  assert.equal(totals.pendingCents, 5000);
  assert.equal(totals.heldCents, 10000);
  assert.equal(lines.find((line) => line.postId === "livepost01")?.label, "Instagram post");
});

test("a second approval does not create another payment", () => {
  const earned = post({ agreedFeeCents: 2500, deliverableHoldStartedAt: "2026-10-01T00:00:00.000Z", deliverableRecheckedAt: "2026-10-20T00:00:00.000Z", format: null });
  assert.equal(approvalDecision(earned, null, now), "create");
  assert.equal(approvalDecision(earned, { postId: "livepost01" }, now), "exists");
  assert.equal(approvalDecision(post({}), null, now), "hold");
  const lines = deliverableLines(
    {
      affiliates: [{ code: "abc", name: "Ada" }],
      posts: [earned],
      payments: [
        {
          postId: "livepost01",
          code: "abc",
          amountCents: 2500,
          status: "approved",
          approvedAt: "2026-11-01T00:00:00.000Z",
          paidCents: null,
          paidAt: null,
          reference: "",
          adjustmentCents: null,
          adjustmentReason: "",
        },
      ],
    },
    now,
  );
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.status, "approved");
});

test("a declined post closes the deliverable and a draft is omitted", () => {
  assert.equal(
    deliverablePhase(
      {
        contentStatus: "withdrawn",
        publicationStatus: null,
        agreedFeeCents: 5000,
        viewRateCents: null,
        maxPayCents: null,
        trackingDays: null,
        views: null,
        publishedAt: null,
        deliverableHoldStartedAt: null,
        deliverableRecheckedAt: null,
        deliverableForfeitedAt: null,
      },
      now,
    ),
    "closed",
  );
  assert.equal(
    deliverablePhase(
      {
        contentStatus: "draft",
        publicationStatus: null,
        agreedFeeCents: 5000,
        viewRateCents: null,
        maxPayCents: null,
        trackingDays: null,
        views: null,
        publishedAt: null,
        deliverableHoldStartedAt: null,
        deliverableRecheckedAt: null,
        deliverableForfeitedAt: null,
      },
      now,
    ),
    null,
  );
});

test("1,500 views at $10 per 1,000 views is $15, a $12 maximum pays $12, and pay waits for the locked period", () => {
  assert.equal(viewPayCents(1500, 1000), 1500);
  assert.equal(viewPayCents(1500, 1000, 1200), 1200);
  assert.equal(viewPayCents(1500, 1000, 2000), 1500);
  assert.equal(viewPayCents(0, 1000), 0);
  assert.equal(viewPayCents(1.5, 1000), null);
  const early = post({
    agreedFeeCents: null,
    viewRateCents: 1000,
    views: 1500,
    publishedAt: "2026-11-01T16:00:00.000Z",
    deliverableHoldStartedAt: null,
  });
  assert.equal(viewWindowEnded(early.publishedAt, now), false);
  assert.equal(approvalDecision(early, null, now), "window");
  const waitingOnCounts = post({
    id: "countpost1",
    agreedFeeCents: null,
    viewRateCents: 1000,
    views: null,
    publishedAt: "2026-10-01T16:00:00.000Z",
    deliverableHoldStartedAt: null,
  });
  assert.equal(approvalDecision(waitingOnCounts, null, now), "window");
  const ready = post({
    id: "ratepost01",
    agreedFeeCents: null,
    viewRateCents: 1000,
    maxPayCents: 1200,
    trackingDays: 14,
    views: 1500,
    publishedAt: "2026-10-01T16:00:00.000Z",
    deliverableHoldStartedAt: null,
  });
  assert.equal(approvalDecision(ready, null, now), "create");
  assert.equal(
    manualReportDue(
      {
        publicationStatus: "tracking_active",
        publishedAt: ready.publishedAt,
        metricsRecordedAt: null,
        metricsSource: null,
        connected: false,
      },
      now,
    ),
    true,
  );
  const lines = deliverableLines(
    { affiliates: [{ code: "abc", name: "Ada" }], posts: [early, waitingOnCounts, ready], payments: [] },
    now,
  );
  assert.equal(lines.find((line) => line.postId === "livepost01")?.status, "measuring");
  assert.equal(lines.find((line) => line.postId === "livepost01")?.amountCents, 0);
  assert.equal(lines.find((line) => line.postId === "ratepost01")?.status, "pending");
  assert.equal(lines.find((line) => line.postId === "ratepost01")?.amountCents, 1200);
  const short = post({
    id: "short00001",
    agreedFeeCents: null,
    viewRateCents: 1000,
    trackingDays: 14,
    views: 1500,
    publishedAt: "2026-11-01T16:00:00.000Z",
    deliverableHoldStartedAt: null,
  });
  assert.equal(viewWindowEnded(short.publishedAt, now, 14), false);
  assert.equal(approvalDecision(short, null, now), "window");
  assert.equal(
    manualReportDue(
      {
        publicationStatus: "tracking_active",
        publishedAt: ready.publishedAt,
        metricsRecordedAt: new Date(Date.parse(ready.publishedAt) + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metricsSource: "manual",
        connected: false,
        trackingDays: 14,
      },
      now,
    ),
    false,
  );
  const legacy = post({ views: 1500, viewRateCents: null });
  assert.equal(approvalDecision(legacy, null, now), "hold");
});

test("an adjustment is a non-zero dollar amount", () => {
  assert.equal(deliverableAdjustmentCents("25"), 2500);
  assert.equal(deliverableAdjustmentCents("-10.50"), -1050);
  assert.equal(deliverableAdjustmentCents("0"), null);
  assert.equal(deliverableAdjustmentCents("nope"), null);
});

test("mark paid fails unless the payment is approved", () => {
  assert.equal(markPaidDecision(null), "status");
  assert.equal(markPaidDecision({ status: "pending" }), "status");
  assert.equal(markPaidDecision({ status: "paid" }), "status");
  assert.equal(markPaidDecision({ status: "approved" }), "pay");
});

test("a sub admin cannot approve or mark paid", () => {
  assert.equal(canReleaseDeliverablePayment("sub"), false);
  assert.equal(canReleaseDeliverablePayment("admin"), true);
  assert.equal(canReleaseDeliverablePayment("owner"), true);
  assert.equal(adminHasFullAccess({ role: "sub", id: "sub-admin-id-1234567890" }), false);
  assert.equal(adminHasFullAccess({ role: "admin", id: "full-admin-id-123456789" }), true);
  assert.equal(adminHasFullAccess({ role: "owner" }), true);
});

test("treatment orders store zero commission and lab orders follow the flag", () => {
  const shared = { mode: "percent" as const, percent: 15, fixedCents: 0, amountCents: 10000 };
  assert.equal(commissionForRecordedOrder({ ...shared, productIds: ["treatment-product"], labCommissionsEnabled: true }).commissionCents, 0);
  assert.equal(commissionForRecordedOrder({ ...shared, productIds: ["treatment-product"], labCommissionsEnabled: true }).orderKind, "treatment");
  assert.equal(commissionForRecordedOrder({ ...shared, productIds: [], labCommissionsEnabled: true }).commissionCents, 0);
  const labOff = commissionForRecordedOrder({ ...shared, productIds: [labId], labCommissionsEnabled: false });
  assert.equal(labOff.orderKind, "lab");
  assert.equal(labOff.commissionCents, 0);
  assert.equal(commissionForRecordedOrder({ ...shared, productIds: [labId], labCommissionsEnabled: true }).commissionCents, 1500);
  assert.equal(
    commissionForRecordedOrder({
      productIds: [labId],
      mode: "fixed",
      percent: 15,
      fixedCents: 4000,
      amountCents: 10000,
      labCommissionsEnabled: true,
    }).commissionCents,
    4000,
  );
  assert.equal(
    commissionForRecordedOrder({
      ...shared,
      productIds: [labId, "treatment-product"],
      labCommissionsEnabled: true,
    }).orderKind,
    "treatment",
  );
});
