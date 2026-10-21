import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as captureAffiliateClick } from "../../app/api/affiliate/click/route";
import { embeddedCheckoutSrc, storefrontCheckoutUrl } from "../cart/storefrontCheckout";
import { assignedCampaign, type PromoCodeRow } from "../genhealth/promocodes";
import { resolveAffiliateAttribution } from "./code";
import { AFFILIATE_CAMPAIGN_COOKIE, AFFILIATE_COOKIE } from "./store";
import { affiliateTrackingPath, checkoutCampaignCandidate } from "./link";

function promo(code: string, affiliates: string[]): PromoCodeRow {
  return {
    code,
    affiliates: affiliates.map((utmSlug) => ({ affiliateId: utmSlug, utmSlug })),
    slugs: affiliates,
    mode: "Locked",
    discount: { kind: "unknown", label: "—" },
    scope: "0 products",
    productIds: [],
    usage: "0 used · Unlimited",
    validUntil: "Unlimited",
    statusLabel: "Active",
    activeInGenHealth: false,
  };
}

const codes = [promo("ZEBRA", ["abc"]), promo("ALPHA", ["abc"]), promo("OTHER", ["someone"])];

function checkoutParams(campaign: string | null) {
  return new URL(storefrontCheckoutUrl(["sku-1"], "abc", campaign), "https://leaderhealth.clinic").searchParams;
}

test("checkout sends the campaign captured from the affiliate link", () => {
  const candidate = checkoutCampaignCandidate("abc", "abc", "ZEBRA", "ALPHA");
  const campaign = assignedCampaign(codes, "abc", candidate);
  const params = checkoutParams(campaign);
  assert.equal(campaign, "ZEBRA");
  assert.equal(params.get("utm_campaign"), "ZEBRA");
  assert.equal(params.get("promo"), null);
  assert.equal(params.get("ref"), "abc");
  assert.equal(params.get("utm_source"), "abc");
  assert.equal(params.get("utm_medium"), "affiliate");
});

test("a campaign that is not an assigned promo code is not attached", () => {
  assert.equal(assignedCampaign(codes, "abc", "OTHER"), null);
  assert.equal(assignedCampaign(codes, "abc", "nope"), null);
  const params = checkoutParams(null);
  assert.equal(params.get("utm_campaign"), null);
  assert.equal(params.get("utm_source"), "abc");
});

test("affiliate-only links keep the affiliate id and omit campaign", () => {
  const fromDefaultLink = checkoutCampaignCandidate("abc", "abc", "abc", null);
  assert.equal(assignedCampaign(codes, "abc", fromDefaultLink), null);
  assert.equal(checkoutCampaignCandidate("abc", "abc", null, "ZEBRA"), null);
  const params = checkoutParams(null);
  assert.equal(params.get("ref"), "abc");
  assert.equal(params.get("utm_source"), "abc");
  assert.equal(params.get("utm_medium"), "affiliate");
  assert.equal(params.has("utm_campaign"), false);

  const frame = new URL(embeddedCheckoutSrc("sku-1", "abc", null));
  assert.equal(frame.searchParams.get("utm_source"), "abc");
  assert.equal(frame.searchParams.has("utm_campaign"), false);
  assert.equal(frame.searchParams.get("embed"), "1");
});

test("checkout does not pick the alphabetically first promo code", () => {
  assert.equal(assignedCampaign(codes, "abc", null), null);
  assert.equal(assignedCampaign(codes, "abc", ""), null);
  assert.equal(assignedCampaign(codes, "abc", "ZEBRA"), "ZEBRA");
  assert.equal(assignedCampaign(codes, "abc", "zebra"), "ZEBRA");
  assert.notEqual(checkoutParams(null).get("utm_campaign"), "ALPHA");
});

test("existing affiliate links still encode campaign the same way", () => {
  const plain = new URL(affiliateTrackingPath("abc"), "https://leaderhealth.clinic").searchParams;
  assert.equal(plain.get("utm_campaign"), "abc");
  assert.equal(plain.get("utm_source"), "abc");
  const promoLink = new URL(affiliateTrackingPath("abc", "ZEBRA"), "https://leaderhealth.clinic").searchParams;
  assert.equal(promoLink.get("utm_campaign"), "ZEBRA");
});

function cookieHeader(response: Response, name: string) {
  const header = response.headers.getSetCookie().find((item) => item.startsWith(`${name}=`));
  assert.ok(header, `missing ${name} cookie`);
  return header;
}

test("landing click stores the original campaign with the affiliate id", async () => {
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.FIRESTORE_EMULATOR_HOST;

  const saved = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "abc", path: "/", campaign: "ZEBRA" }),
    }),
  );
  assert.equal(saved.headers.getSetCookie().some((item) => item.startsWith(`${AFFILIATE_COOKIE}=abc`)), true);
  assert.match(cookieHeader(saved, AFFILIATE_CAMPAIGN_COOKIE), /^lh_aff_campaign=ZEBRA/);

  const cleared = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "abc", path: "/", campaign: null }),
    }),
  );
  assert.match(cookieHeader(cleared, AFFILIATE_COOKIE), /^lh_aff=abc/);
  assert.match(cookieHeader(cleared, AFFILIATE_CAMPAIGN_COOKIE), /Max-Age=0/i);
});

test("a different affiliate does not inherit the stored campaign", () => {
  assert.equal(checkoutCampaignCandidate("xyz", "abc", "ZEBRA", "OTHER"), "OTHER");
  assert.equal(assignedCampaign(codes, "xyz", "OTHER"), null);
  assert.equal(checkoutCampaignCandidate("xyz", null, null, "ZEBRA"), "ZEBRA");
});

test("a promo code pays only when it is locked to that affiliate", () => {
  assert.deepEqual(resolveAffiliateAttribution("abc", "xyz", null), { code: "xyz", update: true });
  assert.deepEqual(resolveAffiliateAttribution(null, "xyz", "abc"), { code: "xyz", update: true });
  assert.equal(assignedCampaign(codes, "abc", "AFFILIATE15"), null);
  const params = checkoutParams(assignedCampaign(codes, "abc", "AFFILIATE15"));
  assert.equal(params.get("utm_source"), "abc");
  assert.equal(params.get("utm_campaign"), null);
  assert.equal(params.get("promo"), null);
  const frame = new URL(embeddedCheckoutSrc("sku-1", "abc", assignedCampaign(codes, "abc", "AFFILIATE15")));
  assert.equal(frame.searchParams.get("utm_source"), "abc");
  assert.equal(frame.searchParams.get("utm_campaign"), null);
  assert.equal(frame.searchParams.get("promo"), null);
});

test("utm_source-only links resolve an affiliate id and reach checkout", () => {
  const attribution = resolveAffiliateAttribution(null, "abc", null);
  assert.deepEqual(attribution, { code: "abc", update: true });
  const params = new URL(
    storefrontCheckoutUrl(["sku-1"], attribution.code ?? undefined, null),
    "https://leaderhealth.clinic",
  ).searchParams;
  assert.equal(params.get("ref"), "abc");
  assert.equal(params.get("utm_source"), "abc");
  assert.equal(params.get("utm_medium"), "affiliate");
  assert.equal(resolveAffiliateAttribution(undefined, "  AbC ", null).code, "abc");

  const kept = resolveAffiliateAttribution("abc", "xyz", "xyz");
  const keptParams = new URL(
    storefrontCheckoutUrl(["sku-1"], kept.code ?? undefined, null),
    "https://leaderhealth.clinic",
  ).searchParams;
  assert.equal(kept.update, false);
  assert.equal(keptParams.get("ref"), "xyz");
  assert.equal(keptParams.get("utm_source"), "xyz");
});

test("existing ref links still resolve when utm_source matches", () => {
  assert.deepEqual(resolveAffiliateAttribution("abc", "abc", "older"), { code: "abc", update: true });
  assert.deepEqual(resolveAffiliateAttribution("abc", null, null), { code: "abc", update: true });
  assert.deepEqual(resolveAffiliateAttribution("abc", "not an id", "older"), { code: "abc", update: true });
});

test("conflicting ref and utm_source do not replace stored attribution", () => {
  assert.deepEqual(resolveAffiliateAttribution("abc", "xyz", "xyz"), { code: "xyz", update: false });
  assert.deepEqual(resolveAffiliateAttribution("abc", "xyz", "abc"), { code: "abc", update: false });
  assert.deepEqual(resolveAffiliateAttribution("abc", "xyz", "older"), { code: "older", update: false });
  assert.deepEqual(resolveAffiliateAttribution("abc", "xyz", null), { code: "xyz", update: true });
  assert.deepEqual(resolveAffiliateAttribution(null, "xyz", "abc"), { code: "xyz", update: true });
  assert.deepEqual(resolveAffiliateAttribution(undefined, "abc", "abc"), { code: "abc", update: true });
});

test("invalid affiliate ids are not saved and checkout keeps the stored id", () => {
  assert.deepEqual(resolveAffiliateAttribution("no", "bad id", null), { code: null, update: false });
  assert.deepEqual(resolveAffiliateAttribution("@@@", undefined, "abc"), { code: "abc", update: false });
  assert.deepEqual(resolveAffiliateAttribution(undefined, undefined, "abc"), { code: "abc", update: false });
});

test("utm_source-only capture stores the affiliate cookie", async () => {
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.FIRESTORE_EMULATOR_HOST;

  const saved = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: null, utm_source: "abc", path: "/", campaign: "ZEBRA" }),
    }),
  );
  assert.match(cookieHeader(saved, AFFILIATE_COOKIE), /^lh_aff=abc/);
  assert.match(cookieHeader(saved, AFFILIATE_CAMPAIGN_COOKIE), /^lh_aff_campaign=ZEBRA/);

  const ignored = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "lh_aff=abc" },
      body: JSON.stringify({ ref: "xyz", utm_source: "other", path: "/" }),
    }),
  );
  assert.equal(ignored.headers.getSetCookie().some((item) => item.startsWith(`${AFFILIATE_COOKIE}=`)), false);

  const replaced = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "lh_aff=abc" },
      body: JSON.stringify({ ref: null, utm_source: "xyz", path: "/" }),
    }),
  );
  assert.match(cookieHeader(replaced, AFFILIATE_COOKIE), /^lh_aff=xyz/);

  const invalid = await captureAffiliateClick(
    new Request("http://localhost/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: "no", utm_source: "bad id", path: "/" }),
    }),
  );
  assert.equal(invalid.headers.getSetCookie().length, 0);
});
