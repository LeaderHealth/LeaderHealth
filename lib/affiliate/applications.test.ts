import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationCommission, applicationLinkPromo, promoAvailableForNewLink } from "./applications";

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

test("a blank promo choice stores no code, and only an active unassigned code can be reserved", () => {
  assert.equal(applicationLinkPromo("later", "WELLNESS20"), "");
  assert.equal(applicationLinkPromo("", ""), "");
  assert.equal(applicationLinkPromo("assign", "  "), null);
  assert.equal(applicationLinkPromo("assign", "WELLNESS20"), "WELLNESS20");
  assert.equal(promoAvailableForNewLink({ statusLabel: "Active", affiliates: [{ utmSlug: "" }] }), true);
  assert.equal(promoAvailableForNewLink({ statusLabel: "Active", affiliates: [] }), true);
  assert.equal(promoAvailableForNewLink({ statusLabel: "Inactive", affiliates: [] }), false);
  assert.equal(promoAvailableForNewLink({ statusLabel: "Expired", affiliates: [] }), false);
  assert.equal(promoAvailableForNewLink({ statusLabel: "Active", affiliates: [{ utmSlug: "angie" }] }), false);
  assert.equal(promoAvailableForNewLink(null), false);
});
