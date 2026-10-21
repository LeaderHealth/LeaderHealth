import assert from "node:assert/strict";
import { test } from "node:test";
import { savedPromosStillAssigned } from "./savedPromos";

test("drops saved promo codes Gen Health no longer assigns", () => {
  assert.deepEqual(savedPromosStillAssigned(["AFFILIATE15", "CLINIC15", "gone"], ["clinic15"]), ["clinic15"]);
});

test("clears saved promo codes when Gen Health assigns none", () => {
  assert.deepEqual(savedPromosStillAssigned(["AFFILIATE15"], []), []);
});
