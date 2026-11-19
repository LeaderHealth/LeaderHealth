import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementBoardPeriod, agreementMatchesPost, agreementMonthBoard, monthCanTake, postingAgreement, postingMonthDateBounds, type AgreementBoardPost, type AgreementForPost, type MonthFillPost } from "./post-agreement";

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

function reserved(patch: Partial<MonthFillPost> = {}): MonthFillPost {
  return {
    id: "post1",
    agreementId: "agree1",
    contentStatus: "submitted",
    offerId: "",
    publishedAt: null,
    submittedAt: "2026-11-02T00:00:00.000Z",
    postingMonth: "2026-11",
    ...patch,
  };
}

test("each month of a multi-month agreement keeps its own set of posts", () => {
  const chosen = postingAgreement(
    [agreement({
      effectiveOn: "2026-11-16",
      expiresOn: "2027-01-10",
      posts: [
        { platform: "Instagram", type: "Reel", count: 2 },
        { platform: "TikTok", type: "Video", count: 2 },
      ],
    })],
    today,
    [
      reserved({ id: "a" }),
      reserved({ id: "b" }),
      reserved({ id: "c" }),
      reserved({ id: "d" }),
      reserved({ id: "e", postingMonth: "2026-12", submittedAt: "2026-11-20T00:00:00.000Z" }),
      reserved({ id: "f", contentStatus: "rejected", postingMonth: "2026-12" }),
      reserved({ id: "g", offerId: "offer1", postingMonth: "2027-01" }),
      reserved({ id: "h", publishedAt: "2026-12-04T00:00:00.000Z", postingMonth: "2026-11" }),
    ],
  );
  assert.equal(chosen?.postTotal, 4);
  assert.deepEqual(chosen?.months.map((month) => month.period), ["2026-12"]);
  const december = chosen?.months[0];
  assert.equal(december?.used, 2);
  assert.equal(monthCanTake(december, 2), true);
  assert.equal(monthCanTake(december, 3), false);
  assert.equal(postingAgreement([agreement({ effectiveOn: "2026-11-16", expiresOn: "2026-11-20" })], today)?.months.length, 0);
  const boardPost = (patch: Partial<AgreementBoardPost>): AgreementBoardPost => ({
    id: "p",
    agreementId: "agree1",
    contentStatus: "submitted",
    offerId: "",
    publicationStatus: null,
    publishedAt: null,
    submittedAt: "2026-11-02T00:00:00.000Z",
    postingMonth: "2026-11",
    reviewNote: "",
    title: "First post",
    ...patch,
  });
  const board = agreementMonthBoard({
    agreementId: "agree1",
    postTotal: 4,
    period: "2026-11",
    monthLabel: "November",
    posts: [
      boardPost({ id: "live", contentStatus: "approved", publicationStatus: "tracking_active", title: "Live" }),
      boardPost({ id: "no", contentStatus: "rejected", reviewNote: "No", title: "Rejected" }),
      boardPost({ id: "fix", contentStatus: "revision_requested", reviewNote: "Please remove the claim.", submittedAt: "2026-11-03T00:00:00.000Z" }),
      boardPost({ id: "later", postingMonth: "2026-12", submittedAt: "2026-11-04T00:00:00.000Z" }),
    ],
  });
  assert.equal(board.length, 4);
  assert.equal(board[0]?.label, "Verified");
  assert.equal(board[1]?.label, "Changes requested");
  assert.equal(board[1]?.adminNote, "Please remove the claim.");
  assert.equal(board[2]?.label, "Not started");
  assert.equal(board[2]?.href, "/affiliates/posts?compose=1");
  assert.equal(agreementBoardPeriod(["2026-12", "2027-01"], "2026-11-19"), "2026-12");
  assert.deepEqual(postingMonthDateBounds("2026-11", "2026-11-16", "2027-01-10"), { min: "2026-11-16", max: "2026-11-30" });
  assert.deepEqual(postingMonthDateBounds("2026-12", "2026-11-16", "2027-01-10"), { min: "2026-12-01", max: "2026-12-31" });
  assert.deepEqual(postingMonthDateBounds("2027-01", "2026-11-16", "2027-01-10"), { min: "2027-01-01", max: "2027-01-10" });
});
