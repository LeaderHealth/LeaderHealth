import assert from "node:assert/strict";
import test from "node:test";
import { affiliateCampaignBoard } from "./affiliate-campaigns";
import { blankCampaignRecord } from "./campaign-record";

function record(patch: Partial<ReturnType<typeof blankCampaignRecord>>) {
  return {
    ...blankCampaignRecord("Holiday TRT push"),
    status: "sent" as const,
    description: "Share the first consult.",
    postsRequired: 2,
    baseAmountCents: 15000,
    baseMode: "post" as const,
    endsOn: "2026-12-31",
    platforms: ["Instagram"],
    contentTypes: ["Reel"],
    guidelines: "No treatment claims.",
    assignedCodes: ["aa"],
    ...patch,
  };
}

test("an assigned campaign starts as an invitation and moves when the affiliate answers", () => {
  const invited = affiliateCampaignBoard({ today: "2026-11-16", code: "aa", records: [record({})], posts: [] });
  assert.equal(invited.newCount, 1);
  assert.equal(invited.invites[0]?.total, "$150");
  assert.equal(invited.invites[0]?.terms, "$150 for the campaign · total");
  assert.equal(invited.invites[0]?.content, "2 Instagram reels");

  const accepted = affiliateCampaignBoard({
    today: "2026-11-16",
    code: "aa",
    records: [record({ responses: [{ code: "aa", status: "accepted" }] })],
    posts: [],
  });
  assert.equal(accepted.invites.length, 0);
  assert.equal(accepted.active[0]?.status, "In progress");
  assert.equal(accepted.active[0]?.posts.length, 2);
  assert.equal(accepted.active[0]?.posts[0]?.actionLabel, "Submit content");

  const declined = affiliateCampaignBoard({
    today: "2026-11-16",
    code: "aa",
    records: [record({ responses: [{ code: "aa", status: "declined" }] })],
    posts: [],
  });
  assert.equal(declined.past[0]?.label, "Declined");
  assert.equal(declined.active.length, 0);
});

test("a note on a live post keeps it published and asks for the updated link", () => {
  const board = affiliateCampaignBoard({
    today: "2026-11-16",
    code: "aa",
    records: [record({ responses: [{ code: "aa", status: "accepted" }] })],
    posts: [{
      id: "post-1",
      campaign: "Holiday TRT push",
      caption: "Live post",
      contentStatus: "approved",
      publicationStatus: "tracking_active",
      format: "instagram_reel",
      reviewNote: "Please tag @myleaderhealth.",
      liveFixNote: "Please tag @myleaderhealth.",
      hasFile: true,
      createdAt: "2026-11-10T00:00:00.000Z",
    }],
  });
  const slot = board.active[0]?.posts.find((post) => post.postId === "post-1");
  assert.equal(slot?.label, "Live but changes requested");
  assert.equal(slot?.action, "link");
  assert.equal(slot?.note, "Please tag @myleaderhealth.");
  const checking = affiliateCampaignBoard({
    today: "2026-11-16",
    code: "aa",
    records: [record({ responses: [{ code: "aa", status: "accepted" }] })],
    posts: [{
      id: "post-2",
      campaign: "Holiday TRT push",
      caption: "Updated link",
      contentStatus: "approved",
      publicationStatus: "verification_pending",
      format: "instagram_reel",
      reviewNote: "Please remove the treatment claim.",
      liveFixNote: "Please remove the treatment claim.",
      hasFile: true,
      createdAt: "2026-11-10T00:00:00.000Z",
    }],
  });
  const waiting = checking.active[0]?.posts.find((post) => post.postId === "post-2");
  assert.equal(waiting?.label, "Waiting for a check");
  assert.equal(waiting?.action, "");
  assert.equal(waiting?.note, "An admin is confirming the change. If more changes are needed, you’ll paste the link again.");
});
