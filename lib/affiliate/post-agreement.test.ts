import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementBoardPeriod, agreementKindFormat, agreementMatchesPost, agreementMonthBoard, agreementSlotRows, agreementSlotState, kindUsedCount, mixSentence, monthCanTake, placedSlotNumber, postIdentity, postPlaceLabel, postTypeLabel, postingAgreement, postingMonthDateBounds, type AgreementBoardPost, type AgreementForPost, type AgreementKindUse, type MonthFillPost } from "./post-agreement";

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
      boardPost({ id: "noted", contentStatus: "approved", publicationStatus: "tracking_active", title: "Noted", liveFixNote: "Remove the treatment claim.", submittedAt: "2026-11-05T00:00:00.000Z" }),
      boardPost({ id: "no", contentStatus: "rejected", reviewNote: "No", title: "Rejected" }),
      boardPost({ id: "fix", contentStatus: "revision_requested", reviewNote: "Please remove the claim.", submittedAt: "2026-11-03T00:00:00.000Z" }),
      boardPost({ id: "later", postingMonth: "2026-12", submittedAt: "2026-11-04T00:00:00.000Z" }),
    ],
  });
  assert.equal(board.length, 4);
  assert.equal(board[0]?.label, "Verified");
  assert.equal(board[1]?.label, "Changes requested");
  assert.equal(board[1]?.adminNote, "Please remove the claim.");
  assert.equal(board[2]?.label, "Live but changes requested");
  assert.equal(board[2]?.note, "Update the live post, then paste the link. It counts toward November after an admin verifies that link.");
  assert.equal(board[2]?.adminNote, "");
  assert.equal(board[2]?.actionLabel, "");
  assert.equal(board[3]?.label, "Not started");
  assert.equal(board[3]?.href, "/affiliates/posts?compose=1");
  assert.equal(agreementBoardPeriod(["2026-12", "2027-01"], "2026-11-19"), "2026-12");
  assert.deepEqual(postingMonthDateBounds("2026-11", "2026-11-16", "2027-01-10"), { min: "2026-11-16", max: "2026-11-30" });
  assert.deepEqual(postingMonthDateBounds("2026-12", "2026-11-16", "2027-01-10"), { min: "2026-12-01", max: "2026-12-31" });
  assert.deepEqual(postingMonthDateBounds("2027-01", "2026-11-16", "2027-01-10"), { min: "2027-01-01", max: "2027-01-10" });
});

test("a sent post counts toward the agreement type it matches", () => {
  const sent = (patch: Partial<AgreementKindUse>): AgreementKindUse => ({
    id: "p",
    agreementId: "agree1",
    contentStatus: "approved",
    offerId: "",
    publishedAt: null,
    submittedAt: "2026-11-02T00:00:00.000Z",
    postingMonth: "2026-11",
    format: "tiktok",
    fileCount: 1,
    agreementPlatform: "",
    agreementPostType: "",
    ...patch,
  });
  assert.equal(agreementKindFormat("TikTok", "Video"), "tiktok");
  assert.equal(agreementKindFormat("Instagram", "Carousel"), "instagram_post");
  assert.equal(agreementKindFormat("Instagram", "Story"), null);
  assert.equal(agreementKindFormat("Facebook", "Post"), "facebook_post");
  assert.equal(agreementKindFormat("Facebook", "Reel"), "facebook_reel");
  assert.equal(agreementKindFormat("Facebook", "Video"), "facebook_video");
  assert.equal(agreementKindFormat("Facebook", "Story"), null);
  assert.equal(agreementKindFormat("YouTube", "Short"), "youtube_short");
  assert.equal(agreementKindFormat("YouTube", "Video"), "youtube_video");
  const posts = [sent({ id: "video" }), sent({ id: "carousel", format: "instagram_post", fileCount: 3 })];
  assert.equal(kindUsedCount(posts, "agree1", "2026-11", "TikTok", "Video"), 1);
  assert.equal(kindUsedCount(posts, "agree1", "2026-11", "Instagram", "Carousel"), 1);
  assert.equal(kindUsedCount(posts, "agree1", "2026-11", "Instagram", "Reel"), 0);
});

test("post labels match the agreement slot and mix", () => {
  const row = (patch: Partial<AgreementBoardPost>): AgreementBoardPost => ({
    id: "post",
    agreementId: "agree1",
    contentStatus: "approved",
    offerId: "",
    publicationStatus: "tracking_active",
    publishedAt: "2026-11-04T00:00:00.000Z",
    submittedAt: "2026-11-02T00:00:00.000Z",
    postingMonth: "2026-11",
    reviewNote: "",
    title: "",
    agreementSlot: null,
    ...patch,
  });
  const rows = [row({ id: "tiktok" }), row({ id: "waiting", contentStatus: "approved", publicationStatus: "awaiting_publication", submittedAt: "2026-11-03T00:00:00.000Z" })];
  assert.equal(placedSlotNumber(rows, "agree1", "2026-11", 4, "tiktok"), 1);
  assert.equal(placedSlotNumber(rows, "agree1", "2026-11", 4, "waiting"), 2);
  assert.equal(agreementSlotState(rows[0] ?? null), "Verified");
  assert.equal(agreementSlotState(rows[1] ?? null), "Ready to publish");
  assert.equal(agreementSlotState(null), "Not posted");
  assert.equal(agreementSlotState({ contentStatus: "submitted", publicationStatus: null }), "In review");
  assert.equal(agreementSlotState({ contentStatus: "approved", publicationStatus: "verification_failed" }), "Needs a fix");
  assert.equal(agreementSlotState({ contentStatus: "approved", publicationStatus: "verification_pending" }), "Checking the link");
  assert.equal(agreementSlotState({ contentStatus: "approved", publicationStatus: "verification_pending", liveFixNote: "Remove the claim." }), "Checking the update");
  assert.equal(agreementSlotState({ contentStatus: "revision_requested", publicationStatus: null }), "Changes requested");
  const place = postPlaceLabel({ offerId: "", agreementId: "agree1", agreementSlot: null }, 1);
  const type = postTypeLabel({ agreementPlatform: "TikTok", agreementPostType: "Video", format: "tiktok", fileCount: 1 });
  assert.equal(postIdentity(place, type), "Post 1 · TikTok video");
  assert.equal(postTypeLabel({ agreementPlatform: "", agreementPostType: "", format: "youtube_short", fileCount: 1 }), "YouTube Short");
  assert.equal(postTypeLabel({ agreementPlatform: "", agreementPostType: "", format: "facebook_reel", fileCount: 1 }), "Facebook reel");
  const kinds = [
    { platform: "Instagram", type: "Reel", count: 2 },
    { platform: "TikTok", type: "Video", count: 2 },
  ];
  const tiktoks = [1, 2, 3, 4].map((day) => row({
    id: `tiktok-${day}`,
    format: "tiktok",
    fileCount: 1,
    submittedAt: `2026-11-0${day}T00:00:00.000Z`,
  }));
  const placed = agreementSlotRows(tiktoks, "agree1", "2026-11", 4, kinds);
  assert.equal(placed.length, 4);
  assert.equal(placed[0]?.post, null);
  assert.equal(placed[1]?.post, null);
  assert.equal(placed.filter((item) => agreementSlotState(item.post) === "Verified").length, 2);
  const filled = agreementSlotRows([
    row({ id: "reel-a", format: "instagram_reel" }),
    row({ id: "reel-b", format: "instagram_reel", submittedAt: "2026-11-03T00:00:00.000Z" }),
    row({ id: "video-a", format: "tiktok", submittedAt: "2026-11-04T00:00:00.000Z" }),
    row({ id: "video-b", format: "tiktok", submittedAt: "2026-11-05T00:00:00.000Z" }),
  ], "agree1", "2026-11", 4, kinds);
  assert.equal(filled.filter((item) => item.post).length, 4);
  assert.equal(mixSentence([
    { platform: "Instagram", type: "Carousel", count: 2 },
    { platform: "TikTok", type: "Video", count: 2 },
    { platform: "Instagram", type: "Story", count: 1 },
  ]), "2 Instagram carousels and 2 TikTok videos");
});
