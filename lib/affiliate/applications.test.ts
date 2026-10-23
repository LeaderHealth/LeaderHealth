import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationCommission } from "./applications";

test("an application link keeps the commission chosen before it is sent", () => {
  assert.deepEqual(
    applicationCommission({ commissionMode: "default", commissionPercent: "", commissionFixed: "" }),
    { commissionMode: "default", commissionPercent: 15, commissionFixedCents: 0 },
  );
  assert.deepEqual(
    applicationCommission({ commissionMode: "percent", commissionPercent: "12.5", commissionFixed: "" }),
    { commissionMode: "percent", commissionPercent: 12.5, commissionFixedCents: 0 },
  );
  assert.deepEqual(
    applicationCommission({ commissionMode: "fixed", commissionPercent: "", commissionFixed: "25.00" }),
    { commissionMode: "fixed", commissionPercent: 0, commissionFixedCents: 2500 },
  );
  assert.equal(applicationCommission({ commissionMode: "percent", commissionPercent: "150", commissionFixed: "" }), null);
});
