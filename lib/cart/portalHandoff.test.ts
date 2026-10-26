import assert from "node:assert/strict";
import { test } from "node:test";
import { portalHandoffUrl } from "./portalHandoff";

test("accepts the patient portal", () => {
  assert.equal(
    portalHandoffUrl("https://myportal.leaderhealth.clinic/magic?token=abc#done"),
    "https://myportal.leaderhealth.clinic/magic?token=abc#done",
  );
});

test("rejects other hosts and unsafe urls", () => {
  assert.equal(portalHandoffUrl("https://gen-health.app/magic?token=abc"), null);
  assert.equal(portalHandoffUrl("https://leaderhealth.clinic/checkout?product=1"), null);
  assert.equal(portalHandoffUrl("http://myportal.leaderhealth.clinic/login"), null);
  assert.equal(portalHandoffUrl("https://user:pass@myportal.leaderhealth.clinic/login"), null);
  assert.equal(portalHandoffUrl(""), null);
  assert.equal(portalHandoffUrl(null), null);
});
