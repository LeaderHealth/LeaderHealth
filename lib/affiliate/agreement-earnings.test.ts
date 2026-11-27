import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementCutMonths, agreementMonthEarning, agreementMonthPeriods, agreementPostMonth, postingMonthsOverlap, type AgreementForEarning, type PostForEarning } from "./agreement-earnings";
test("a post counts toward one month, and a later publish month wins", () => {
  assert.equal(earn([agreement()], four, "2026-12").verifiedPosts, 0);
  assert.equal(earn([agreement()], four, "2026-12").status, "short");
  const moved = [post({ publishedAt: "2026-12-02T00:00:00.000Z", submittedAt: "2026-11-28T00:00:00.000Z" })];
  assert.equal(earn([agreement()], moved, "2026-11").verifiedPosts, 0);
  assert.equal(earn([agreement()], moved, "2026-12").verifiedPosts, 1);
  assert.equal(earn([agreement()], [post({ publishedAt: "2026-11-30T23:59:59.000Z" })], "2026-12").verifiedPosts, 0);
});

test("posts filed for a later month stay in that month until they go live", () => {
  const filed = post({ publicationStatus: null, publishedAt: null, submittedAt: "2026-11-20T00:00:00.000Z", postingMonth: "2026-12" });
  assert.equal(agreementPostMonth(filed), "2026-12");
  assert.equal(earn([agreement()], [filed, filed, filed, filed], "2026-11").verifiedPosts, 0);
  assert.equal(earn([agreement()], [filed, filed, filed, filed], "2026-12").status, "short");
  const live = mix({ publishedAt: "2026-12-04T00:00:00.000Z", submittedAt: "2026-11-20T00:00:00.000Z", postingMonth: "2026-12" });
  assert.equal(earn([agreement()], live, "2026-12").status, "earned");
  assert.equal(earn([agreement()], live, "2026-11").verifiedPosts, 0);
  assert.equal(agreementPostMonth(post({ publishedAt: "2026-11-21T00:00:00.000Z", postingMonth: "2026-12" })), "2026-11");
});

test("a new agreement cannot cover a month another agreement already covers", () => {
  const existing = agreement({ id: "old", expiresOn: "2026-11-30" });
  assert.equal(postingMonthsOverlap([existing], { effectiveOn: "2026-11-16", expiresOn: "2026-12-31" }), false);
  assert.equal(postingMonthsOverlap([agreement({ id: "old", expiresOn: "2026-12-31" })], { effectiveOn: "2026-12-01", expiresOn: "2027-01-31" }), true);
  assert.equal(postingMonthsOverlap([existing], { id: "old", effectiveOn: "2026-11-01", expiresOn: "2026-11-30" }), false);
  assert.equal(postingMonthsOverlap([existing], { effectiveOn: "2026-12-01", expiresOn: "2026-12-31" }), false);
  assert.equal(postingMonthsOverlap([agreement({ id: "old", expiresOn: "2027-01-05" })], { effectiveOn: "2027-01-06", expiresOn: "2027-01-31" }), false);
  assert.equal(postingMonthsOverlap([agreement({ status: "ended", endedAt: "2026-10-15T00:00:00.000Z" })], { effectiveOn: "2026-11-01", expiresOn: "2026-11-30" }), false);
});

test("only a month covered from the 1st through the last day is a posting month", () => {
  assert.deepEqual(agreementMonthPeriods("2026-11-01", "2027-01-05"), ["2026-11", "2026-12"]);
  assert.deepEqual(agreementMonthPeriods("2026-11-16", "2027-01-31"), ["2026-12", "2027-01"]);
  assert.deepEqual(agreementMonthPeriods("2026-11-01", "2027-01-31"), ["2026-11", "2026-12", "2027-01"]);
  assert.deepEqual(agreementMonthPeriods("2026-11-16", "2026-11-20"), []);
  assert.deepEqual(agreementCutMonths("2026-11-01", "2027-01-05"), [{ period: "2027-01", edge: "end", date: "2027-01-05" }]);
  assert.deepEqual(agreementCutMonths("2026-11-16", "2027-01-31"), [{ period: "2026-11", edge: "start", date: "2026-11-16" }]);
  assert.equal(earn([agreement({ expiresOn: "2027-01-05" })], four, "2027-01").status, "none");
  assert.equal(earn([agreement({ effectiveOn: "2026-11-16", expiresOn: "2027-01-31" })], four, "2026-11").status, "none");
  assert.equal(earn([agreement({ effectiveOn: "2026-11-16", expiresOn: "2026-11-20" })], four).status, "none");
  const december = mix({ publishedAt: "2026-12-04T00:00:00.000Z" });
  assert.equal(earn([agreement({ effectiveOn: "2026-11-16", expiresOn: "2027-01-31" })], december, "2026-12").status, "earned");
});

function agreement(patch: Partial<AgreementForEarning> = {}): AgreementForEarning {
  return {
    id: "agree1",
    code: "abc123",
    status: "signed",
    current: true,
    effectiveOn: "2026-11-01",
    expiresOn: "2026-12-31",
    monthlyCents: 30000,
    posts: [
      { platform: "Instagram", type: "Reel", count: 2 },
      { platform: "TikTok", type: "Video", count: 2 },
    ],
    signedAt: "2026-10-28T12:00:00.000Z",
    endedAt: null,
    ...patch,
  };
}

function post(patch: Partial<PostForEarning> = {}): PostForEarning {
  return {
    code: "abc123",
    agreementId: "agree1",
    publicationStatus: "tracking_active",
    publishedAt: "2026-11-10T15:00:00.000Z",
    submittedAt: "2026-11-08T15:00:00.000Z",
    format: "instagram_reel",
    fileCount: 1,
    ...patch,
  };
}

function mix(patch: Partial<PostForEarning> = {}) {
  return [post(patch), post(patch), post({ ...patch, format: "tiktok" }), post({ ...patch, format: "tiktok" })];
}

const four = mix();
const earn = (agreements: AgreementForEarning[], posts: PostForEarning[], period = "2026-11") =>
  agreementMonthEarning({ agreements, posts, code: "abc123", period });

test("all required posts live earns the full monthly rate", () => {
  const result = earn([agreement()], four);
  assert.equal(result.status, "earned");
  assert.equal(result.earnedCents, 30000);
  assert.equal(result.verifiedPosts, 4);
  assert.equal(result.requiredPosts, 4);
});

test("extra posts of one kind do not fill another kind", () => {
  const tiktoks = [post({ format: "tiktok" }), post({ format: "tiktok" }), post({ format: "tiktok" }), post({ format: "tiktok" })];
  const result = earn([agreement()], tiktoks);
  assert.equal(result.status, "short");
  assert.equal(result.earnedCents, 0);
  assert.equal(result.verifiedPosts, 2);
  assert.equal(result.requiredPosts, 4);
});

test("a live post with a change request does not count until an admin verifies the new link", () => {
  const result = earn([agreement()], [...four.slice(0, 3), post({ format: "tiktok", liveFixNote: "Remove the treatment claim." })]);
  assert.equal(result.status, "short");
  assert.equal(result.earnedCents, 0);
  assert.equal(result.verifiedPosts, 3);
});

test("one post short earns nothing", () => {
  const result = earn([agreement()], four.slice(1));
  assert.equal(result.status, "short");
  assert.equal(result.earnedCents, 0);
  assert.equal(result.verifiedPosts, 3);
});

test("posts from another agreement, month, affiliate, or not live don't count", () => {
  const result = earn([agreement()], [
    post(),
    post({ agreementId: "other" }),
    post({ publishedAt: "2026-10-30T15:00:00.000Z" }),
    post({ code: "zzz999" }),
    post({ publicationStatus: "awaiting_publication" }),
  ]);
  assert.equal(result.verifiedPosts, 1);
  assert.equal(result.earnedCents, 0);
});

test("an expired or ended agreement earns nothing for later months", () => {
  assert.equal(earn([agreement({ expiresOn: "2026-10-31" })], four).status, "none");
  assert.equal(earn([agreement({ status: "ended", endedAt: "2026-10-15T00:00:00.000Z" })], four).status, "none");
  assert.equal(earn([agreement({ status: "ended", endedAt: "2026-11-20T00:00:00.000Z" })], four).status, "none");
  assert.equal(earn([agreement({ status: "ended", endedAt: "2026-11-30T00:00:00.000Z" })], four).status, "earned");
  assert.equal(earn([agreement({ effectiveOn: "2026-12-01" })], four).status, "none");
});

test("draft or unsigned agreements earn nothing", () => {
  assert.equal(earn([agreement({ status: "draft" })], four).status, "none");
  assert.equal(earn([agreement({ status: "awaiting_signature" })], four).status, "none");
});

test("an approved or paid snapshot wins over the live count", () => {
  const result = agreementMonthEarning({
    agreements: [agreement()],
    posts: [],
    code: "abc123",
    period: "2026-11",
    snapshot: { agreementId: "agree1", rateCents: 25000, requiredPosts: 4, verifiedPosts: 4, amountCents: 25000, status: "paid" },
  });
  assert.equal(result.status, "paid");
  assert.equal(result.earnedCents, 25000);
});
