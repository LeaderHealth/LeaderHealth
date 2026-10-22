import assert from "node:assert/strict";
import { test } from "node:test";
import { instantInWeek, previousUtcWeek } from "./week";

test("previous week runs Monday through Sunday in UTC", () => {
  const week = previousUtcWeek(new Date("2026-10-22T15:00:00.000Z"));
  assert.equal(week.id, "2026-10-12");
  assert.equal(week.start.toISOString(), "2026-10-12T00:00:00.000Z");
  assert.equal(week.end.toISOString(), "2026-10-19T00:00:00.000Z");
  assert.equal(week.label, "Oct 12–Oct 18, 2026");
  assert.equal(instantInWeek("2026-10-18T23:00:00.000Z", week), true);
  assert.equal(instantInWeek("2026-10-19T00:00:00.000Z", week), false);
});
