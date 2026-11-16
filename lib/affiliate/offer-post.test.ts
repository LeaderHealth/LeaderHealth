import assert from "node:assert/strict";
import test from "node:test";
import { formatForOfferKind, lockedOfferFee, lockedPayTerms, offerPostTaken, offerSlideBounds, postSourceLabel } from "./offer-post";

test("offer kind maps onto the existing post formats", () => {
  assert.equal(formatForOfferKind("tiktok"), "tiktok");
  assert.equal(formatForOfferKind("instagram_reel"), "instagram_reel");
  assert.equal(formatForOfferKind("instagram_post"), "instagram_post");
  assert.equal(formatForOfferKind("instagram_carousel"), "instagram_post");
  assert.equal(formatForOfferKind("instagram_story"), "instagram_post");
  assert.equal(formatForOfferKind("youtube"), null);
});

test("carousel needs at least two files and a story stays one file", () => {
  assert.deepEqual(offerSlideBounds("instagram_carousel"), { min: 2, max: 20 });
  assert.deepEqual(offerSlideBounds("instagram_story"), { min: 1, max: 1 });
});

test("a locked rate, maximum, and period are not replaced and one open post claims an offer", () => {
  assert.equal(lockedOfferFee(1500, 3000), 1500);
  assert.equal(lockedOfferFee(null, 3000), 3000);
  assert.deepEqual(
    lockedPayTerms(
      { viewRateCents: 1000, maxPayCents: 1200, trackingDays: 14 },
      { viewRateCents: 3000, maxPayCents: null, trackingDays: 45 },
    ),
    { viewRateCents: 1000, maxPayCents: 1200, trackingDays: 14 },
  );
  assert.deepEqual(
    lockedPayTerms(
      { viewRateCents: null, maxPayCents: null, trackingDays: null },
      { viewRateCents: 3000, maxPayCents: 5000, trackingDays: 30 },
    ),
    { viewRateCents: 3000, maxPayCents: 5000, trackingDays: 30 },
  );
  const posts = [
    { id: "a", offerId: "offer", contentStatus: "submitted" },
    { id: "b", offerId: "offer", contentStatus: "withdrawn" },
  ];
  assert.equal(offerPostTaken(posts, "offer", "new"), true);
  assert.equal(offerPostTaken(posts, "offer", "a"), false);
  assert.equal(offerPostTaken([{ id: "b", offerId: "offer", contentStatus: "rejected" }], "offer", "new"), false);
  assert.equal(postSourceLabel("offer"), "Marketing offer");
  assert.equal(postSourceLabel(""), "Independent");
});
