import assert from "node:assert/strict";
import { test } from "node:test";
import { conversionLabel, dailyAffiliateStats, earningsPerClickCents } from "./stats";

test("groups visits, pages, and paid orders by day", () => {
  const rows = dailyAffiliateStats(
    [
      { path: "/", referrer: "https://example.com/", createdAt: "2026-10-21T15:00:00.000Z" },
      { path: "/shop", referrer: "", createdAt: "2026-10-21T18:00:00.000Z" },
      { path: "/", referrer: null, createdAt: "2026-10-20T12:00:00.000Z" },
    ],
    [
      { createdAt: "2026-10-21T20:00:00.000Z", commissionCents: 3000, dryRun: false },
      { createdAt: "2026-10-21T21:00:00.000Z", commissionCents: 5000, dryRun: true },
    ],
  );

  assert.deepEqual(rows, [
    {
      date: "2026-10-21",
      visits: 2,
      referringPages: ["https://example.com/", "Direct"],
      landingPages: ["/", "/shop"],
      orders: 1,
      commissionCents: 3000,
    },
    {
      date: "2026-10-20",
      visits: 1,
      referringPages: [],
      landingPages: ["/"],
      orders: 0,
      commissionCents: 0,
    },
  ]);
  assert.equal(conversionLabel(1, 2), "50%");
  assert.equal(earningsPerClickCents(3000, 2), 1500);
});

test("leaves conversion blank when a paid order has no visits", () => {
  const [row] = dailyAffiliateStats([], [{ createdAt: "2026-09-16T12:00:00.000Z", commissionCents: 4905, dryRun: false }]);
  assert.equal(row.orders, 1);
  assert.equal(row.visits, 0);
  assert.equal(conversionLabel(row.orders, row.visits), "—");
  assert.equal(earningsPerClickCents(row.commissionCents, row.visits), null);
});
