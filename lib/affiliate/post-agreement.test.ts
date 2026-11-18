import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementMatchesPost, postingAgreement, type AgreementForPost } from "./post-agreement";

const today = "2026-11-17";

function agreement(patch: Partial<AgreementForPost> = {}): AgreementForPost {
  return {
    id: "agree1",
    code: "abc123",
    status: "signed",
    current: true,
    effectiveOn: "2026-11-01",
    expiresOn: "2026-12-31",
    deliverables: [{ description: "Four posts" }],
    ...patch,
  };
}

test("a post uses the affiliate’s current signed agreement", () => {
  const chosen = postingAgreement(
    [agreement({ id: "old", current: false, status: "ended" }), agreement()],
    today,
  );
  assert.equal(chosen?.id, "agree1");
  assert.equal(chosen?.label, "Four posts · Nov 1, 2026 – Dec 31, 2026");
  assert.equal(agreementMatchesPost(agreement(), "abc123", "agree1", today), true);
  assert.equal(agreementMatchesPost(agreement(), "other", "agree1", today), false);
  assert.equal(agreementMatchesPost(agreement({ status: "draft" }), "abc123", "agree1", today), false);
  assert.equal(agreementMatchesPost(agreement({ expiresOn: "2026-11-01" }), "abc123", "agree1", today), false);
  assert.equal(postingAgreement([agreement({ status: "awaiting_signature" })], today), null);
});
