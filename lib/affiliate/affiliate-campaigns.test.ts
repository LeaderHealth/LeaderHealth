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
