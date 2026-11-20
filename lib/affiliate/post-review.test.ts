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
  captionHasDisclosure,
  captionIssue,
  contentStatusLabel,
  instagramCheckCopy,
  instagramLinkChecks,
  instagramPostUrl,
  matchInstagramPost,
  manualReportDue,
  metricsAreStale,
  nextContentStatus,
  postMetricFields,
  proposedPublishDate,
  publicationAfterApproval,
  revisionOnResubmit,
  verificationFailureNote,
} from "./post-review";

const code = "qhwax57x";
const link = "https://leaderhealth.clinic/?ref=qhwax57x&utm_source=qhwax57x&utm_medium=affiliate";

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
  assert.equal(publicationAfterApproval("submitted"), "awaiting_publication");
  assert.equal(publicationAfterApproval("approved"), null);
  assert.equal(canPasteLiveUrl("approved", "awaiting_publication"), true);
  assert.equal(canPasteLiveUrl("approved", "verification_failed"), true);
  assert.equal(canPasteLiveUrl("approved", "tracking_active"), false);
  assert.equal(canPasteLiveUrl("submitted", null), false);
  assert.equal(contentStatusLabel("submitted"), "In review");
  assert.equal(contentStatusLabel("revision_requested"), "Needs changes");
  assert.equal(contentStatusLabel("withdrawn"), "Withdrawn");
  assert.equal(contentStatusLabel("draft"), "Draft");
  const missingLink = verificationFailureNote("missing_link");
  assert.equal(instagramLinkChecks("tracking_active", "").every((item) => item.state === "pass"), true);
  assert.equal(instagramLinkChecks("verification_failed", missingLink).at(-1)?.state, "fail");
  assert.equal(instagramCheckCopy("verification_failed", missingLink).headline, "We couldn't find your tracking link in this post");
  assert.equal(instagramLinkChecks("verification_failed", verificationFailureNote("not_connected")).length, 0);
});

test("an Instagram post or reel link is accepted", () => {
  assert.equal(instagramPostUrl("https://www.instagram.com/p/AbC123_de/"), "https://www.instagram.com/p/AbC123_de/");
  assert.equal(instagramPostUrl("https://instagram.com/reel/AbC123_de/?igsh=1"), "https://www.instagram.com/reel/AbC123_de/");
  assert.equal(instagramPostUrl("http://www.instagram.com/p/AbC123_de/"), null);
  assert.equal(instagramPostUrl("https://www.instagram.com/stories/leader/1234567890/"), null);
  assert.equal(instagramPostUrl("https://example.com/p/AbC123_de/"), null);
});

test("a caption needs the disclosure line and the tracking link", () => {
  const caption = `${DISCLOSURE_LINE}\n${link}`;
  assert.equal(captionHasDisclosure(`  paid partnership with leader health  `), true);
  assert.equal(captionHasDisclosure("Thanks for watching"), false);
  assert.equal(captionIssue(caption, code), null);
  assert.equal(captionIssue("Paid partnership with Leader Health", code), "link");
  assert.equal(captionIssue(link, code), "disclosure");
});

test("a matched Instagram caption stores engagement and not pay", () => {
  const match = matchInstagramPost("https://www.instagram.com/reel/AbC123_de/", code, [
    {
      id: "17890000000000001",
      permalink: "https://www.instagram.com/p/AbC123_de/",
      caption: `${DISCLOSURE_LINE} ${link}`,
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
