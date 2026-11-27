import assert from "node:assert/strict";
import test from "node:test";
import { engagementPayCents, socialPayCents } from "./manual-checkpoint";
import { marketingEventId, marketingPayPath, marketingVisitorAllowed, shouldRecordMarketingEvent } from "./marketing-path";
import { defaultPaymentRates, marketingPayoutParts, rateFor, socialMonthCents, standingViewRateCents, websiteMonthAmount, websitePayCents, type PaymentRates } from "./payment-rates";

test("social pay adds engagements and the maximum caps the combined amount", () => {
  assert.equal(
    socialPayCents({
      views: 10000,
      viewRateCents: 200,
      likes: 200,
      comments: 50,
      shares: 150,
      saves: 100,
      engagementRateCents: 5,
      maxPayCents: null,
    }),
    4500,
  );
  assert.equal(
    socialPayCents({
      views: 10000,
      viewRateCents: 200,
      likes: 200,
      comments: 50,
      shares: 150,
      saves: 100,
      engagementRateCents: 5,
      maxPayCents: 3000,
    }),
    3000,
  );
  assert.equal(engagementPayCents(4, 5), 20);
  assert.equal(socialPayCents({ views: null, viewRateCents: 200, likes: null, engagementRateCents: 5 }), 0);
});

test("unpaid social pay waits until the tracking window ends", () => {
  const post = {
    id: "p1",
    publishedAt: "2026-11-01T00:00:00.000Z",
    viewRateCents: 200,
    engagementRateCents: 0,
    views: 1000,
    trackingDays: 30,
  };
  const inside = socialMonthCents({ period: "2026-11", now: Date.parse("2026-11-15T00:00:00.000Z"), posts: [post], payments: [] });
  assert.equal(inside.socialCents, 0);
  const after = socialMonthCents({ period: "2026-11", now: Date.parse("2026-12-02T00:00:00.000Z"), posts: [post], payments: [] });
  assert.equal(after.socialCents, 200);
  const payment = { postId: "p1", amountCents: 200, approvedAt: "2026-12-02T00:00:00.000Z", paidAt: "2026-12-05T00:00:00.000Z", adjustmentCents: 25 };
  const publishMonth = socialMonthCents({ period: "2026-11", now: Date.parse("2026-12-06T00:00:00.000Z"), posts: [post], payments: [payment] });
  const approvalMonth = socialMonthCents({ period: "2026-12", now: Date.parse("2026-12-06T00:00:00.000Z"), posts: [post], payments: [payment] });
  assert.equal(publishMonth.socialCents, 0);
  assert.equal(approvalMonth.socialCents, 200);
  assert.equal(approvalMonth.adjustmentCents, 25);
});

test("an affiliate payout adds social performance and base pay", () => {
  const payout = marketingPayoutParts({
    socialCents: 220,
    adjustmentCents: 50,
    baseCents: 300,
    socialNote: "2 posts this month",
    baseNote: "Posting rate $3.00 · 4 of 4 posts live",
  });
  assert.equal(payout.socialAndBaseCents, 570);
  assert.deepEqual(
    payout.parts.map((part) => part.kind),
    ["Social performance", "Base pay"],
  );
  assert.equal(payout.parts[0]?.amountCents, 270);
  assert.equal(payout.parts[1]?.amountCents, 300);
  const empty = marketingPayoutParts({ socialCents: 0, adjustmentCents: 0, baseCents: 0, socialNote: "Views and engagements", baseNote: "No monthly posting rate this month" });
  assert.equal(empty.socialAndBaseCents, 0);
  assert.equal(empty.parts.length, 2);
});

test("a disabled engagement category locks a zero rate", () => {
  const defaults = defaultPaymentRates();
  assert.equal(defaults.views.rateCents, 200);
  assert.equal(defaults.engagements.rateCents, 5);
  assert.equal(defaults.engagements.enabled, true);
  const rates = defaultPaymentRates();
  rates.engagements.enabled = false;
  rates.engagements.rateCents = 5;
  rates.overrides.engagements = { angie: 9 };
  assert.equal(rateFor(rates, "engagements"), 0);
  rates.engagements.enabled = true;
  assert.equal(rateFor(rates, "engagements"), 5);
});

test("the marketing path allowlist keeps public pages and drops private ones", () => {
  assert.equal(marketingPayPath("/shop-all-products?ref=angie"), "/shop-all-products");
  assert.equal(marketingPayPath("/products/peptide"), "/products/peptide");
  assert.equal(marketingPayPath("/articles/sleep"), "/articles/sleep");
  assert.equal(marketingPayPath("/labs/panel"), "/labs/panel");
  assert.equal(marketingPayPath("/aboutus"), "/aboutus");
  assert.equal(marketingPayPath("/"), "/");
  assert.equal(marketingPayPath("/checkout"), null);
  assert.equal(marketingPayPath("/checkout/success"), null);
  assert.equal(marketingPayPath("/admin"), null);
  assert.equal(marketingPayPath("/affiliates/overview"), null);
  assert.equal(marketingPayPath("/api/affiliate/click"), null);
  assert.equal(marketingPayPath("shop"), null);
  assert.equal(marketingPayPath("/nope"), null);
  assert.equal(marketingVisitorAllowed("Mozilla/5.0 (compatible; browser)"), true);
  assert.equal(marketingVisitorAllowed("curl/8.0"), false);
  assert.equal(marketingVisitorAllowed(""), false);
});

test("one marketing event is recorded per visitor, kind, and day", () => {
  const first = marketingEventId({ code: "angie", visitorId: "visitor", kind: "click", path: "/shop-all-products", day: "2026-11-01" });
  const again = marketingEventId({ code: "angie", visitorId: "visitor", kind: "click", path: "/shop-all-products", day: "2026-11-01" });
  const page = marketingEventId({ code: "angie", visitorId: "visitor", kind: "page_view", path: "/aboutus", day: "2026-11-01" });
  assert.equal(first, again);
  assert.notEqual(first, page);
  assert.equal(shouldRecordMarketingEvent({ alreadyRecorded: true, kind: "click", clickRecorded: false }), false);
  assert.equal(shouldRecordMarketingEvent({ alreadyRecorded: false, kind: "page_view", clickRecorded: true }), false);
  assert.equal(shouldRecordMarketingEvent({ alreadyRecorded: false, kind: "page_view", clickRecorded: false }), true);
});

test("an approved website payout keeps its amount after a later rate change", () => {
  const rates: PaymentRates = defaultPaymentRates();
  rates.clicks.enabled = true;
  rates.clicks.rateCents = 900;
  const live = websiteMonthAmount({
    events: [{ code: "angie", kind: "click", payable: true, createdAt: "2026-11-02T12:00:00.000Z" }],
    code: "angie",
    period: "2026-11",
    rates,
    snapshot: null,
  });
  assert.equal(live.amountCents, 900);
  assert.equal(live.frozen, false);
  const frozen = websiteMonthAmount({
    events: [{ code: "angie", kind: "click", payable: true, createdAt: "2026-11-02T12:00:00.000Z" }],
    code: "angie",
    period: "2026-11",
    rates,
    snapshot: {
      impressions: 0,
      clicks: 1,
      pageViews: 0,
      impressionRateCents: 0,
      clickRateCents: 100,
      pageViewRateCents: 0,
      amountCents: 100,
      status: "approved",
    },
  });
  assert.equal(frozen.amountCents, 100);
  assert.equal(frozen.clickRateCents, 100);
  assert.equal(frozen.frozen, true);
  const before = websiteMonthAmount({
    events: [{ code: "angie", kind: "click", payable: false, createdAt: "2026-11-02T12:00:00.000Z" }],
    code: "angie",
    period: "2026-11",
    rates,
    snapshot: null,
  });
  assert.equal(before.clicks, 0);
  const removed = websiteMonthAmount({
    events: [{ code: "angie", kind: "click", payable: true, excluded: true, createdAt: "2026-11-02T12:00:00.000Z" }],
    code: "angie",
    period: "2026-11",
    rates,
    snapshot: null,
  });
  assert.equal(removed.clicks, 0);
  assert.equal(before.amountCents, 0);
  assert.equal(
    websiteMonthAmount({
      events: [
        { code: "angie", kind: "impression", payable: true, createdAt: "2026-11-02T12:00:00.000Z" },
        { code: "angie", kind: "click", payable: true, createdAt: "2026-11-02T12:00:00.000Z" },
        { code: "angie", kind: "page_view", payable: true, createdAt: "2026-11-03T12:00:00.000Z" },
      ],
      code: "angie",
      period: "2026-11",
      rates: defaultPaymentRates(),
      snapshot: null,
    }).amountCents,
    10,
  );
  assert.equal(
    websitePayCents({ impressions: 50_000, clicks: 300, pageViews: 2_000, impressionRateCents: 500, clickRateCents: 10, pageViewRateCents: 200 }),
    3400,
  );
});

test("social and website rates are the same for every affiliate", () => {
  const rates = defaultPaymentRates();
  rates.overrides.views = { angie: 150 };
  rates.overrides.clicks = { angie: 25 };
  assert.equal(standingViewRateCents(rates), 200);
  assert.equal(rateFor(rates, "clicks"), 10);
  assert.equal(standingViewRateCents({ ...rates, views: { enabled: false, rateCents: 200 } }), null);
});
