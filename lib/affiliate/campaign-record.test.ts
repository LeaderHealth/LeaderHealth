import assert from "node:assert/strict";
import { test } from "node:test";
import { CampaignRecordError, campaignRecordDetails, campaignStepError, readCampaignFlow } from "./campaign-record";

test("campaign details keep dates and assigned affiliates", () => {
  const details = campaignRecordDetails({
    description: "  Spring push  ",
    startsOn: "2026-11-01",
    endsOn: "2026-11-30",
    goals: "Reach new visitors",
    assignedCodes: ["88H4DCJI", "88h4dcji", "not a code"],
  });
  assert.equal(details.description, "Spring push");
  assert.equal(details.startsOn, "2026-11-01");
  assert.equal(details.endsOn, "2026-11-30");
  assert.deepEqual(details.assignedCodes, ["88h4dcji"]);
  assert.throws(
    () => campaignRecordDetails({ description: "", startsOn: "2026-12-01", endsOn: "2026-11-01", goals: "", assignedCodes: [] }),
    (error) => error instanceof CampaignRecordError,
  );
  assert.throws(
    () => campaignRecordDetails({ description: "", startsOn: "11/01/2026", endsOn: "", goals: "", assignedCodes: [] }),
    (error) => error instanceof CampaignRecordError,
  );
});

const ready = {
  mode: "sent" as const,
  name: "Holiday TRT push",
  description: "Share the holiday offer.",
  goals: "",
  startsOn: "2026-11-15",
  endsOn: "2026-12-31",
  platforms: ["Instagram"],
  contentTypes: ["Reel"],
  posts: "2",
  guidelines: "Show the consult, not a before-and-after.",
  disclosure: "Paid partnership with Leader Health",
  linkInstructions: "Tag @myleaderhealth in the caption so the post can track.",
  baseMode: "post",
  amount: "150",
  performancePay: false,
  affiliates: [{ code: "88h4dcji", amount: "150" }],
};

test("campaign send requires each step before it stores a brief", () => {
  assert.equal(campaignStepError(0, { ...ready, name: "" }), "Add a campaign name.");
  assert.equal(campaignStepError(0, { ...ready, platforms: [] }), "Pick at least one platform.");
  assert.equal(campaignStepError(1, { ...ready, posts: "0" }), "Posts required must be 1 or more.");
  assert.equal(campaignStepError(2, { ...ready, amount: "0" }), "Enter a base payment, like 150.");
  assert.equal(campaignStepError(3, { ...ready, affiliates: [] }), "Invite at least one affiliate.");
  const saved = readCampaignFlow(ready);
  assert.ok(!("error" in saved));
  if ("error" in saved) return;
  assert.equal(saved.name, "Holiday TRT push");
  assert.equal(saved.brief.status, "sent");
  assert.equal(saved.brief.baseAmountCents, 15000);
  assert.equal(saved.brief.baseMode, "campaign");
  assert.equal(saved.brief.performancePay, false);
  assert.equal(saved.brief.postsRequired, 2);
  assert.deepEqual(saved.brief.assignedCodes, ["88h4dcji"]);
  assert.deepEqual(saved.brief.affiliatePay, []);
  const custom = readCampaignFlow({ ...ready, affiliates: [{ code: "88h4dcji", amount: "200" }, { code: "88h4dckk", amount: "150" }] });
  assert.ok(!("error" in custom));
  if ("error" in custom) return;
  assert.deepEqual(custom.brief.affiliatePay, [{ code: "88h4dcji", amountCents: 20000 }]);
  const emptyDraft = readCampaignFlow({ ...ready, mode: "draft", name: "Draft push", description: "", affiliates: [] });
  assert.deepEqual(emptyDraft, { error: "Invite at least one affiliate." });
  const draft = readCampaignFlow({ ...ready, mode: "draft", name: "Draft push", description: "" });
  assert.ok(!("error" in draft));
  if ("error" in draft) return;
  assert.equal(draft.brief.status, "draft");
  assert.deepEqual(draft.brief.assignedCodes, ["88h4dcji"]);
  const withPerformance = readCampaignFlow({ ...ready, performancePay: true });
  assert.ok(!("error" in withPerformance));
  if ("error" in withPerformance) return;
  assert.equal(withPerformance.brief.performancePay, true);
});
