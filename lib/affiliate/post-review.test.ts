import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DISCLOSURE_LINE,
  METRICS_STALE_MS,
  MANUAL_REPORT_MS,
  PostReviewError,
  REPORT_WINDOW_MS,
  appendContentRevision,
  assignedCampaignName,
  campaignChangeAllowed,
  canPasteLiveUrl,
  keepsPublishedOnNote,
  liveFixFollowUp,
  BRAND_TAG,
  captionHasBrandTag,
  captionHasDisclosure,
  captionIssue,
  contentStatusLabel,
  instagramCheckCopy,
  instagramLinkChecks,
  instagramPostUrl,
  matchInstagramPost,
  storedMediaMatchesLink,
  manualReportDue,
  metricsAreStale,
  nextContentStatus,
  postMetricFields,
  proposedPublishDate,
  publicationAfterApproval,
  formatReviewNote,
  adminRequestLog,
  nextAdminRequests,
  reviewableStatus,
  revisionOnResubmit,
  verificationFailureNote,
} from "./post-review";

const code = "qhwax57x";
const link = "https://leaderhealth.clinic/?ref=qhwax57x&utm_source=qhwax57x&utm_medium=affiliate";

test("a note keeps the break before a saved reply", () => {
  assert.equal(
    formatReviewNote("not good\n\nPlease remove the treatment claim. We can’t make treatment claims in affiliate posts."),
    "not good\n\nPlease remove the treatment claim. We can’t make treatment claims in affiliate posts.",
  );
  assert.equal(
    formatReviewNote("not goodPlease remove the treatment claim. We can’t make treatment claims in affiliate posts."),
    "not good\n\nPlease remove the treatment claim. We can’t make treatment claims in affiliate posts.",
  );
});

test("each admin request stays in the log", () => {
  const first = nextAdminRequests([], "", null, "", { note: "yhfgvhy", at: "2026-11-27T22:00:00.000Z", by: "help@myleaderhealth.com" });
  assert.deepEqual(first, [{ note: "yhfgvhy", at: "2026-11-27T22:00:00.000Z", by: "help@myleaderhealth.com" }]);
  const second = nextAdminRequests(first, "yhfgvhy", "2026-11-27T22:00:00.000Z", "help@myleaderhealth.com", {
    note: "Please remove the treatment claim.",
    at: "2026-11-27T22:30:00.000Z",
    by: "help@myleaderhealth.com",
  });
  assert.equal(second.length, 2);
  assert.equal(second[0]?.note, "yhfgvhy");
  assert.equal(second[1]?.note, "Please remove the treatment claim.");
  const open = adminRequestLog([], "yhfgvhy", "2026-11-27T22:00:00.000Z", "help@myleaderhealth.com");
  assert.equal(open.length, 1);
  assert.equal(adminRequestLog(second, "Please remove the treatment claim.", "2026-11-27T22:30:00.000Z", "help@myleaderhealth.com").length, 2);
});

test("content review moves only from the allowed status", () => {
  assert.equal(nextContentStatus("submitted", "approve"), "approved");
  assert.equal(nextContentStatus("submitted", "request"), "revision_requested");
  assert.equal(nextContentStatus("submitted", "reject"), "rejected");
  assert.equal(nextContentStatus("revision_requested", "revise"), "submitted");
  assert.equal(nextContentStatus("submitted", "revise"), "submitted");
  assert.equal(nextContentStatus("withdrawn", "revise"), null);
  assert.equal(nextContentStatus("approved", "approve"), null);
  assert.equal(nextContentStatus("rejected", "revise"), null);
  assert.equal(nextContentStatus("revision_requested", "approve"), null);
  assert.equal(reviewableStatus("approved", "request"), true);
  assert.equal(reviewableStatus("approved", "reject"), true);
  assert.equal(reviewableStatus("approved", "approve"), false);
  assert.equal(reviewableStatus("rejected", "request"), false);
  assert.equal(reviewableStatus("withdrawn", "reject"), false);
  assert.equal(publicationAfterApproval("submitted"), "awaiting_publication");
  assert.equal(publicationAfterApproval("approved"), null);
  assert.equal(canPasteLiveUrl("approved", "awaiting_publication"), true);
  assert.equal(canPasteLiveUrl("approved", "verification_failed"), true);
  assert.equal(canPasteLiveUrl("approved", "tracking_active"), false);
  assert.equal(canPasteLiveUrl("submitted", null), false);
  assert.equal(keepsPublishedOnNote("approved", "tracking_active"), true);
  assert.equal(keepsPublishedOnNote("approved", "verification_failed"), true);
  assert.equal(keepsPublishedOnNote("approved", "verification_pending"), true);
  assert.equal(keepsPublishedOnNote("approved", "awaiting_publication"), false);
  assert.equal(keepsPublishedOnNote("submitted", null), false);
  assert.deepEqual(liveFixFollowUp("verification_pending", "Remove the claim."), { publicationStatus: "tracking_active" });
  assert.deepEqual(liveFixFollowUp("verification_failed", "Remove the claim."), { publicationStatus: "tracking_active" });
  assert.deepEqual(liveFixFollowUp("tracking_active", "Remove the claim."), {});
  assert.deepEqual(liveFixFollowUp("verification_pending", ""), {});
  assert.equal(storedMediaMatchesLink(null, "https://www.instagram.com/p/OLDPOST/"), true);
  assert.equal(storedMediaMatchesLink("https://www.instagram.com/reel/NEWPOST/", "https://www.instagram.com/reel/NEWPOST/"), true);
  assert.equal(storedMediaMatchesLink("https://www.instagram.com/p/NEWPOST/", "https://www.instagram.com/p/OLDPOST/"), false);
  assert.equal(contentStatusLabel("submitted"), "In review");
  assert.equal(contentStatusLabel("revision_requested"), "Changes requested");
  assert.equal(contentStatusLabel("withdrawn"), "Withdrawn");
  assert.equal(contentStatusLabel("draft"), "Draft");
  const missingTag = verificationFailureNote("missing_tag");
  assert.equal(instagramLinkChecks("tracking_active", "").every((item) => item.state === "pass"), true);
  assert.equal(instagramLinkChecks("verification_failed", missingTag).at(-1)?.state, "fail");
  assert.equal(instagramCheckCopy("verification_failed", missingTag).headline, "The caption needs @myleaderhealth");
  assert.equal(instagramLinkChecks("verification_failed", verificationFailureNote("not_connected")).length, 0);
});

test("an Instagram post or reel link is accepted", () => {
  assert.equal(instagramPostUrl("https://www.instagram.com/p/AbC123_de/"), "https://www.instagram.com/p/AbC123_de/");
  assert.equal(instagramPostUrl("https://instagram.com/reel/AbC123_de/?igsh=1"), "https://www.instagram.com/reel/AbC123_de/");
  assert.equal(instagramPostUrl("http://www.instagram.com/p/AbC123_de/"), null);
  assert.equal(instagramPostUrl("https://www.instagram.com/stories/leader/1234567890/"), null);
  assert.equal(instagramPostUrl("https://example.com/p/AbC123_de/"), null);
});

test("a caption tracks with the brand tag, and the sponsorship line and tracking link are optional", () => {
  const caption = `${BRAND_TAG}`;
  assert.equal(captionHasDisclosure(`  paid partnership with leader health  `), true);
  assert.equal(captionHasDisclosure("Thanks for watching"), false);
  assert.equal(captionHasBrandTag("Tag @MyLeaderHealth in the caption"), true);
  assert.equal(captionHasBrandTag("Thanks for watching"), false);
  assert.equal(captionIssue(caption), null);
  assert.equal(captionIssue(`${DISCLOSURE_LINE}\n${link}`), "tag");
  assert.equal(captionIssue(`${DISCLOSURE_LINE}\n${BRAND_TAG}`), null);
});

test("a matched Instagram caption stores engagement and not pay", () => {
  const match = matchInstagramPost("https://www.instagram.com/reel/AbC123_de/", code, [
    {
      id: "17890000000000001",
      permalink: "https://www.instagram.com/p/AbC123_de/",
      caption: BRAND_TAG,
      likes: 4,
      comments: 1,
      shares: null,
      saves: 0,
      reach: 20,
      views: null,
    },
  ]);
  assert.equal(match.ok, true);
  if (!match.ok) return;
  const fields = postMetricFields(match.metrics);
  assert.deepEqual(fields, { likes: 4, comments: 1, shares: null, saves: 0, reach: 20, views: null });
  const keys = Object.keys(fields);
  for (const blocked of ["commissionMode", "commissionPercent", "commissionFixedCents", "approvableCents", "earnedCents", "paidCents"]) {
    assert.equal(keys.includes(blocked), false);
  }
  assert.equal(
    matchInstagramPost("https://www.instagram.com/p/Missing01/", code, []).ok,
    false,
  );
  const untagged = matchInstagramPost("https://www.instagram.com/reel/AbC123_de/", code, [
    {
      id: "17890000000000001",
      permalink: "https://www.instagram.com/reel/AbC123_de/",
      caption: `${DISCLOSURE_LINE} ${link}`,
      likes: 0,
      comments: 0,
      shares: null,
      saves: null,
      reach: null,
      views: null,
    },
  ]);
  assert.equal(untagged.ok, false);
  if (!untagged.ok) assert.equal(untagged.reason, "missing_tag");
});

test("metrics older than six hours are due for a refresh", () => {
  const now = Date.parse("2026-11-10T18:00:00.000Z");
  assert.equal(metricsAreStale(null, now), true);
  assert.equal(metricsAreStale(new Date(now - METRICS_STALE_MS).toISOString(), now), true);
  assert.equal(metricsAreStale(new Date(now - METRICS_STALE_MS + 1000).toISOString(), now), false);
});

test("a manual report stays open until the current checkpoint is saved", () => {
  const publishedAt = "2026-11-01T12:00:00.000Z";
  const published = Date.parse(publishedAt);
  const day7 = published + MANUAL_REPORT_MS;
  const day30 = published + REPORT_WINDOW_MS;
  const base = {
    publicationStatus: "tracking_active" as const,
    publishedAt,
    metricsRecordedAt: null,
    metricsSource: null,
    connected: false,
  };
  assert.equal(manualReportDue(base, day7), true);
  assert.equal(manualReportDue(base, day7 - 1), false);
  assert.equal(manualReportDue(base, day30), true);
  assert.equal(manualReportDue(base, day30 + 1), true);
  assert.equal(manualReportDue({ ...base, connected: true }, day7), false);
  assert.equal(manualReportDue({ ...base, metricsSource: "automatic" }, day7), false);
  const savedAt = new Date(day7).toISOString();
  const saved = { ...base, metricsSource: "manual" as const, metricsRecordedAt: savedAt };
  assert.equal(manualReportDue(saved, day7), false);
  assert.equal(manualReportDue(saved, day7 + MANUAL_REPORT_MS), true);
  const late = { ...base, metricsSource: "manual" as const, metricsRecordedAt: new Date(day30 - MANUAL_REPORT_MS).toISOString() };
  assert.equal(manualReportDue(late, day30), false);
});

test("a post can use only an assigned campaign", () => {
  assert.equal(assignedCampaignName("", ["Launch"]), "");
  assert.equal(assignedCampaignName(" launch ", ["Launch"]), "Launch");
  assert.throws(() => assignedCampaignName("Other", ["Launch"]), (error) => error instanceof PostReviewError && error.code === "campaign");
  assert.throws(() => assignedCampaignName("No promo code", ["Launch"]), (error) => error instanceof PostReviewError && error.code === "campaign");
});

test("approved posts cannot change the campaign", () => {
  assert.equal(campaignChangeAllowed("draft"), true);
  assert.equal(campaignChangeAllowed("submitted"), true);
  assert.equal(campaignChangeAllowed("revision_requested"), true);
  assert.equal(campaignChangeAllowed("approved"), false);
  assert.equal(campaignChangeAllowed("rejected"), false);
  assert.equal(campaignChangeAllowed("withdrawn"), false);
});

test("a blank proposed publishing date stays blank until submit requires one", () => {
  assert.equal(proposedPublishDate(""), "");
  assert.equal(proposedPublishDate(null), "");
  assert.equal(proposedPublishDate("2026-11-16"), "2026-11-16");
  assert.throws(() => proposedPublishDate("11/16/2026"), (error) => error instanceof PostReviewError && error.code === "date");
});

test("a resubmit keeps the previous review note", () => {
  assert.equal(revisionOnResubmit(null), null);
  assert.equal(revisionOnResubmit({ contentStatus: "draft", version: 1, reviewNote: "Add the disclosure.", reviewedAt: "2026-11-01T00:00:00.000Z" }), null);
  const entry = revisionOnResubmit({ contentStatus: "revision_requested", version: 1, reviewNote: "Add the disclosure.", reviewedAt: "2026-11-01T00:00:00.000Z" });
  assert.equal(entry?.reviewNote, "Add the disclosure.");
  const next = appendContentRevision([], entry ?? { version: 1, reviewNote: "", reviewedAt: null });
  assert.equal(next.length, 1);
  assert.equal(next[0]?.reviewNote, "Add the disclosure.");
  const capped = appendContentRevision(
    Array.from({ length: 20 }, (_, index) => ({ version: index + 1, reviewNote: "n", reviewedAt: null })),
    { version: 21, reviewNote: "last", reviewedAt: null },
  );
  assert.equal(capped.length, 20);
  assert.equal(capped.at(-1)?.reviewNote, "last");
  assert.equal(capped[0]?.version, 2);
});
