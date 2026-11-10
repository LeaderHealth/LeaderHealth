import assert from "node:assert/strict";
import { test } from "node:test";
import { postApprovalExcerpt } from "./email";

test("the approval email keeps a short caption", () => {
  assert.equal(postApprovalExcerpt("  Paid partnership\nwith Leader Health  "), "Paid partnership with Leader Health");
  assert.equal(postApprovalExcerpt("a".repeat(140)), "a".repeat(140));
  assert.equal(postApprovalExcerpt("b".repeat(141)), `${"b".repeat(137)}...`);
});
