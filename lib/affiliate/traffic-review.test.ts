import assert from "node:assert/strict";
import { test } from "node:test";
import { findClickSpike, trafficReview, type TrafficEvent } from "./traffic-review";

function click(createdAt: string, patch: Partial<TrafficEvent> = {}): TrafficEvent {
  return { code: "aa", kind: "click", payable: true, createdAt, ...patch };
}

test("a quiet month is not flagged and one crowded hour is", () => {
  const flat = Array.from({ length: 8 }, (_, index) => `2026-11-0${index + 1}T12:00:00.000Z`);
  assert.equal(findClickSpike(flat), null);
  const spike = [...flat, ...Array.from({ length: 50 }, () => "2026-11-12T15:10:00.000Z")];
  assert.deepEqual(findClickSpike(spike), { hour: "2026-11-12T15", count: 50 });
  assert.equal(findClickSpike(Array.from({ length: 12 }, () => "2026-11-12T15:10:00.000Z")), null);
});

test("traffic review follows the monthly steps", () => {
  const events = [
    click("2026-11-02T12:00:00.000Z"),
    click("2026-11-12T15:00:00.000Z", { excluded: true }),
    { code: "aa", kind: "page_view" as const, payable: true, createdAt: "2026-11-03T12:00:00.000Z" },
    { code: "aa", kind: "impression" as const, payable: true, createdAt: "2026-11-03T12:00:00.000Z" },
  ];
  const open = trafficReview({
    period: "2026-11",
    today: "2026-11-16",
    affiliates: [{ code: "aa", name: "Angie" }],
    events,
    keeps: [],
  });
  assert.equal(open.rows[0]?.status, "clear");
  assert.equal(open.rows[0]?.clicks, 1);
  assert.equal(open.rows[0]?.pageViews, 1);
  assert.equal(open.rows[0]?.excluded, 1);
  assert.equal(open.steps[1]?.tone, "done");
  assert.equal(open.days.length, 16);

  const flaggedEvents = [...events, ...Array.from({ length: 50 }, () => click("2026-11-12T15:20:00.000Z"))];
  const flagged = trafficReview({
    period: "2026-11",
    today: "2026-11-16",
    affiliates: [{ code: "aa", name: "Angie" }],
    events: flaggedEvents,
    keeps: [],
  });
  assert.equal(flagged.rows[0]?.status, "flagged");
  assert.equal(flagged.rows[0]?.spikeCount, 50);
  assert.equal(flagged.steps[1]?.tone, "current");
  assert.equal(flagged.days[11]?.parts[0]?.flagged, true);

  const kept = trafficReview({
    period: "2026-11",
    today: "2026-11-16",
    affiliates: [{ code: "aa", name: "Angie" }],
    events: flaggedEvents,
    keeps: [{ code: "aa", hour: "2026-11-12T15" }],
  });
  assert.equal(kept.rows[0]?.status, "clear");
});
