import assert from "node:assert/strict";
import { test } from "node:test";
import { approvableCents } from "./payouts";
import {
  complianceEventFields,
  complianceEventMutation,
  flagAfter,
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

test("a flag moves from open to a requested correction and then resolved", () => {
  assert.equal(flagAfter("open", "request"), "correction_requested");
  assert.equal(flagAfter("correction_requested", "reply"), "correction_requested");
  assert.equal(flagAfter("correction_requested", "resolve"), "resolved");
  assert.equal(flagAfter("resolved", "request"), null);
  assert.equal(flagAfter("open", "reply"), null);
});
