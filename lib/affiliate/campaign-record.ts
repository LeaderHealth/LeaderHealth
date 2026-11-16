import { normalizeAffiliateCode } from "./code";
import { publishDateValue } from "./format";

export type MarketingCampaignRecord = {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
  goals: string;
  assignedCodes: string[];
};

export class CampaignRecordError extends Error {
  code: "when";

  constructor() {
    super("when");
    this.name = "CampaignRecordError";
    this.code = "when";
  }
}

const TEXT_LIMIT = 500;

function text(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, TEXT_LIMIT);
}

function day(value: unknown) {
  if (value == null || (typeof value === "string" && value.trim() === "")) return "";
  const date = publishDateValue(value);
  if (!date) throw new CampaignRecordError();
  return date;
}

export function campaignRecordDetails(input: {
  description: unknown;
  startsOn: unknown;
  endsOn: unknown;
  goals: unknown;
  assignedCodes: unknown;
}) {
  const startsOn = day(input.startsOn);
  const endsOn = day(input.endsOn);
  if (startsOn && endsOn && endsOn < startsOn) throw new CampaignRecordError();
  const raw = Array.isArray(input.assignedCodes) ? input.assignedCodes : [];
  const assignedCodes: string[] = [];
  for (const item of raw) {
    const code = normalizeAffiliateCode(item);
    if (code && !assignedCodes.includes(code)) assignedCodes.push(code);
    if (assignedCodes.length >= 200) break;
  }
  return { description: text(input.description), startsOn, endsOn, goals: text(input.goals), assignedCodes };
}

export function blankCampaignRecord(name: string): MarketingCampaignRecord {
  return { name, description: "", startsOn: "", endsOn: "", goals: "", assignedCodes: [] };
}
