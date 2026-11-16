import assert from "node:assert/strict";
import { test } from "node:test";
import { CampaignRecordError, campaignRecordDetails } from "./campaign-record";

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
