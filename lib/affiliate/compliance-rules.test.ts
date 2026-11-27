import assert from "node:assert/strict";
import { test } from "node:test";
import { approvableCents } from "./payouts";
import {
  complianceEventFields,
  complianceEventMutation,
  youtubeVideoId,
} from "./compliance-rules";

test("compliance events are created once and do not carry a payout", () => {
  const event = complianceEventFields({
    actor: "admin@example.com",
    action: "flag-opened",
    code: "abc123",
    detail: "Missing sponsorship disclosure",
  });
  assert.ok(event);
  assert.equal(complianceEventMutation(), "create");
  assert.deepEqual(Object.keys(event).sort(), ["action", "actor", "code", "detail"]);
  assert.equal("commissionCents" in event, false);
  assert.equal(approvableCents({ orders: [], payouts: [], code: "abc123", period: "2026-11" }), 0);
});

test("a YouTube proof URL stores the video id and does not call an API", () => {
  const id = "abcDEFghi_1";
  assert.equal(youtubeVideoId(`https://www.youtube.com/watch?v=${id}`), id);
  assert.equal(youtubeVideoId(`https://youtu.be/${id}?si=share`), id);
  assert.equal(youtubeVideoId(`https://youtube.com/shorts/${id}`), id);
  assert.equal(youtubeVideoId("https://www.instagram.com/reel/abcDEFghi_1/"), null);
  assert.equal(youtubeVideoId("https://youtu.be/short"), null);
});
