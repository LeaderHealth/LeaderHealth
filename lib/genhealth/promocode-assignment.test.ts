import assert from "node:assert/strict";
import { test } from "node:test";
import {
  creditedAffiliate,
  personalAffiliateForCode,
  personalPromoForAffiliate,
  promoRemovalPatch,
  promoRowsForAffiliate,
  type PromoCodeRow,
} from "./promocodes";

function promo(code: string, mode: PromoCodeRow["mode"], slugs = ["holder"]): PromoCodeRow {
  return {
    code,
    affiliates: slugs.map((utmSlug) => ({ affiliateId: utmSlug, utmSlug })),
    slugs,
    mode,
    discount: { kind: "percent", label: "15%" },
    scope: "1 product",
    productIds: ["product"],
    usage: "0 used · Unlimited",
    validUntil: "Unlimited",
    statusLabel: "Active",
    activeInGenHealth: false,
  };
}

test("a personal locked code pays that affiliate and a shared code does not", () => {
  const personal = promo("CLINIC15", "Locked");
  const shared = promo("AFFILIATE15", "Shared");
  const many = promo("GROUP15", "Locked", ["holder", "other"]);
  const active = new Set(["holder"]);
  assert.equal(personalAffiliateForCode(personal, active), "holder");
  assert.equal(personalAffiliateForCode(shared, active), null);
  assert.equal(personalAffiliateForCode(many, active), null);
  assert.equal(personalAffiliateForCode(personal, new Set(["other"])), null);
  assert.equal(personalPromoForAffiliate([personal, shared, many], "holder")?.code, "CLINIC15");
  assert.deepEqual(
    promoRowsForAffiliate([personal, shared, many], "holder").map((item) => item.code),
    ["CLINIC15"],
  );
  assert.equal(creditedAffiliate("holder", "other"), "holder");
  assert.equal(creditedAffiliate(null, "other"), "other");
  assert.equal(creditedAffiliate(null, null), "");
});

test("a deactivated code is not the affiliate's code", () => {
  const live = promo("CLINIC15", "Locked");
  const deactivated = promo("OLD15", "Locked");
  deactivated.statusLabel = "Inactive";
  assert.deepEqual(
    promoRowsForAffiliate([live, deactivated], "holder").map((item) => item.code),
    ["CLINIC15"],
  );
  assert.equal(personalPromoForAffiliate([deactivated], "holder"), null);
});
test("removing one person from a shared code does not lock the people who remain", () => {
  const kept = [
    { affiliateId: "a", utmSlug: "angie-trimix" },
    { affiliateId: "b", utmSlug: "shalaka-testcode" },
  ];
  const patch = promoRemovalPatch(kept);
  assert.equal(patch?.assignmentType, undefined);
  assert.deepEqual(patch?.affiliates, [
    { affiliateId: "a", utmSlug: "angie-trimix" },
    { affiliateId: "b", utmSlug: "shalaka-testcode" },
  ]);
  assert.deepEqual(promoRemovalPatch([]), {
    assignmentType: "locked",
    affiliates: [],
    utmSlug: null,
    affiliateId: null,
  });
  assert.deepEqual(promoRemovalPatch([{ affiliateId: "a", utmSlug: "88h4dcji" }]), {
    assignmentType: "locked",
    affiliates: [{ affiliateId: "a", utmSlug: "88h4dcji" }],
    utmSlug: "88h4dcji",
    affiliateId: "a",
  });
});

test("an affiliate's code is the one locked only to them", () => {
  const first = promo("ALPHA", "Locked", ["partner"]);
  const second = promo("ZEBRA", "Locked", ["partner"]);
  const shared = promo("GROUP", "Shared", ["partner", "other"]);
  assert.deepEqual(
    promoRowsForAffiliate([second, shared, first], "partner").map((item) => item.code),
    ["ALPHA", "ZEBRA"],
  );
  assert.equal(personalPromoForAffiliate([second, shared, first], "partner")?.code, "ALPHA");
  assert.equal(promoRowsForAffiliate([shared], "partner").length, 0);
});
