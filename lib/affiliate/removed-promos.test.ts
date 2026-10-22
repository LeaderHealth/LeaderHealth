import assert from "node:assert/strict";
import { test } from "node:test";
import { removedPromoRows } from "./removed-promos";

test("removed promo rows keep sales and clicks after the code leaves the active list", () => {
  const rows = removedPromoRows(
    ["LIVE"],
    [
      { promoCode: "OLD", affiliateCode: "angie", amountCents: 32700, commissionCents: 4905 },
      { promoCode: "old", affiliateCode: "shalaka", amountCents: null, commissionCents: 0 },
      { promoCode: "LIVE", affiliateCode: "angie", amountCents: 1000, commissionCents: 150, dryRun: false },
      { promoCode: "SKIP", affiliateCode: "angie", amountCents: 1000, commissionCents: 150, dryRun: true },
    ],
    [
      { campaign: "OLD", affiliateCode: "angie" },
      { campaign: "angie", affiliateCode: "angie" },
      { campaign: "LIVE", affiliateCode: "angie" },
    ],
  );

  assert.deepEqual(rows, [
    {
      code: "OLD",
      affiliateCodes: ["angie", "shalaka"],
      orders: 2,
      salesCents: 32700,
      commissionCents: 4905,
      clicks: 1,
    },
  ]);
});
