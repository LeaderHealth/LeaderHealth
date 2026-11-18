import assert from "node:assert/strict";
import { test } from "node:test";
import { blankCampaignRecord } from "./campaign-record";
import { campaignListRows, campaignPostState } from "./campaign-list";

function record(patch: Partial<ReturnType<typeof blankCampaignRecord>>) {
  return { ...blankCampaignRecord("Holiday TRT push"), status: "sent" as const, postsRequired: 2, baseAmountCents: 15000, baseMode: "post" as const, startsOn: "2026-11-15", endsOn: "2026-12-31", platforms: ["Instagram"], contentTypes: ["Reel"], assignedCodes: ["aa", "bb"], ...patch };
}

test("campaign list counts joined affiliates, verified posts, and base pay", () => {
  assert.equal(campaignPostState({ contentStatus: "approved", publicationStatus: "tracking_active" }), "verified");
  assert.equal(campaignPostState({ contentStatus: "submitted", publicationStatus: null }), "pending");
  const rows = campaignListRows({
    today: "2026-11-16",
    records: [record({})],
    affiliates: [
      { code: "aa", name: "Angie" },
      { code: "bb", name: "Affiliate B" },
    ],
    posts: [
      { id: "1", code: "aa", campaign: "Holiday TRT push", contentStatus: "approved", publicationStatus: "tracking_active", createdAt: "2026-11-16T00:00:00.000Z" },
      { id: "2", code: "aa", campaign: "Holiday TRT push", contentStatus: "submitted", publicationStatus: null, createdAt: "2026-11-17T00:00:00.000Z" },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.status, "active");
  assert.equal(rows[0]?.affiliateLine, "1 of 2 joined");
  assert.equal(rows[0]?.progress, "1 of 2");
  assert.equal(rows[0]?.budgetLabel, "$150");
  assert.equal(rows[0]?.pending, 1);
  assert.equal(rows[0]?.stats[3]?.value, "$0");
  assert.equal(rows[0]?.affiliates[0]?.state, "progress");
  assert.equal(rows[0]?.affiliates[1]?.state, "invited");
  assert.equal(rows[0]?.dates, "Nov 15 – Dec 31, 2026");
});

test("a draft stays a draft and a finished window is completed", () => {
  const rows = campaignListRows({
    today: "2026-11-16",
    records: [
      record({ name: "Spring energy", status: "draft", assignedCodes: ["aa"] }),
      record({ name: "Fall wellness", postsRequired: 1, endsOn: "2026-10-30", assignedCodes: ["aa"], baseAmountCents: 10000 }),
    ],
    affiliates: [{ code: "aa", name: "Angie" }],
    posts: [{ id: "9", code: "aa", campaign: "Fall wellness", contentStatus: "approved", publicationStatus: "tracking_active", createdAt: "2026-10-02T00:00:00.000Z" }],
  });
  assert.equal(rows.find((row) => row.name === "Spring energy")?.status, "draft");
  assert.equal(rows.find((row) => row.name === "Fall wellness")?.status, "completed");
  assert.equal(rows.find((row) => row.name === "Fall wellness")?.budgetLabel, "$100");
});

test("accepting a campaign counts as joined and declining does not", () => {
  const rows = campaignListRows({
    today: "2026-11-16",
    records: [record({ responses: [{ code: "aa", status: "accepted" }, { code: "bb", status: "declined" }] })],
    affiliates: [
      { code: "aa", name: "Angie" },
      { code: "bb", name: "Affiliate B" },
    ],
    posts: [],
  });
  assert.equal(rows[0]?.affiliateLine, "1 of 2 joined");
  assert.equal(rows[0]?.status, "active");
  assert.equal(rows[0]?.budgetLabel, "$150");
  assert.equal(rows[0]?.affiliates[0]?.state, "progress");
  assert.equal(rows[0]?.affiliates[1]?.state, "declined");
});
