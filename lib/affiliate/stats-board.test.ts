import assert from "node:assert/strict";
import test from "node:test";
import { axisCount, contentPosts, daySpan, percentChange, postsIn, saleDaysIn, saleHistory, salesTotals, trafficIn, type SaleDayCount, type SalePeriodRefs, type StatsBoardPost } from "./stats-board";

const posts: StatsBoardPost[] = [
  { id: "a", title: "Labs", platform: "instagram", kind: "Reel", campaign: "Holiday", agreementLabel: "", postedOn: "2026-11-16", views: 100, likes: 10, comments: 2, shares: 1, saves: 1 },
  { id: "b", title: "Morning", platform: "tiktok", kind: "Video", campaign: "", agreementLabel: "Post 1 · TikTok video", postedOn: "2026-11-10", views: 50, likes: 5, comments: 0, shares: 0, saves: 0 },
  { id: "c", title: "Older", platform: "instagram", kind: "Post", campaign: "", agreementLabel: "", postedOn: "2026-10-01", views: 999, likes: 9, comments: 0, shares: 0, saves: 0 },
  { id: "d", title: "Page", platform: "facebook", kind: "Post", campaign: "", agreementLabel: "", postedOn: "2026-11-12", views: 20, likes: 1, comments: 0, shares: 0, saves: 0 },
  { id: "e", title: "Watch", platform: "youtube", kind: "Video", campaign: "", agreementLabel: "", postedOn: "2026-11-12", views: 30, likes: 2, comments: 0, shares: 0, saves: 0 },
];

test("a stats range keeps this window and the matching posts", () => {
  const days = daySpan("2026-11-16", 7);
  assert.equal(days[0], "2026-11-10");
  assert.equal(days.at(-1), "2026-11-16");
  assert.equal(days.length, 7);
  const current = postsIn(posts, days);
  assert.deepEqual(current.map((post) => post.id), ["a", "b", "d", "e"]);
  assert.deepEqual(postsIn(posts, days, "tiktok").map((post) => post.id), ["b"]);
  assert.deepEqual(postsIn(posts, days, "facebook").map((post) => post.id), ["d"]);
  assert.deepEqual(postsIn(posts, days, "youtube").map((post) => post.id), ["e"]);
  assert.deepEqual(contentPosts(posts, days, "campaign").map((post) => post.id), ["a"]);
  assert.deepEqual(contentPosts(posts, days, "independent").map((post) => post.id), ["b", "d", "e"]);
  assert.equal(percentChange(110, 100), 10);
  assert.equal(percentChange(0, 0), 0);
});

test("lab sales keep paid orders inside the range", () => {
  const days: SaleDayCount[] = [
    { day: "2026-11-16", commissioned: true, orders: 1, commissionCents: 1800 },
    { day: "2026-11-12", commissioned: true, orders: 1, commissionCents: 800 },
    { day: "2026-11-14", commissioned: false, orders: 1, commissionCents: 0 },
    { day: "2026-10-01", commissioned: true, orders: 1, commissionCents: 500 },
  ];
  const periods: SalePeriodRefs[] = [
    { period: "2026-11", commissioned: true, orders: 2, commissionCents: 2600, refs: ["one", "two"] },
    { period: "2026-11", commissioned: false, orders: 1, commissionCents: 0, refs: ["plain"] },
    { period: "2026-10", commissioned: true, orders: 1, commissionCents: 500, refs: ["old"] },
  ];
  const span = daySpan("2026-11-16", 7);
  const current = saleDaysIn(days, span);
  assert.deepEqual(salesTotals(current), { orders: 2, commissionCents: 2600 });
  assert.deepEqual(salesTotals(saleDaysIn(days, span, false)), { orders: 1, commissionCents: 0 });
  assert.deepEqual(saleHistory(periods, days, span), [{ period: "2026-11", orders: 2, commissionCents: 2600, refs: ["one", "two"] }]);
  assert.deepEqual(saleHistory(periods, days, span, false), [{ period: "2026-11", orders: 1, commissionCents: 0, refs: ["plain"] }]);
  assert.deepEqual(saleHistory(periods, days, daySpan("2026-11-16", 3)), [{ period: "2026-11", orders: 1, commissionCents: 1800, refs: [] }]);
});

test("chart axis keeps a half step when the peak is 1", () => {
  assert.equal(axisCount(1), "1");
  assert.equal(axisCount(0.5), "0.5");
  assert.equal(axisCount(0), "0");
});

test("website traffic ignores days outside the range", () => {
  const days = daySpan("2026-11-16", 7);
  assert.deepEqual(
    trafficIn(
      [
        { day: "2026-11-16", clicks: 4, pageViews: 20 },
        { day: "2026-10-01", clicks: 9, pageViews: 90 },
      ],
      days,
    ),
    { clicks: 4, pageViews: 20 },
  );
});
