import { normalizeAffiliateCode } from "./code";
import { publishDateValue } from "./format";

export const CAMPAIGN_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook"] as const;
export const CAMPAIGN_CONTENT_TYPES = ["Reel", "Video", "Image post", "Carousel", "Story"] as const;
export const DEFAULT_CAMPAIGN_DISCLOSURE = "Paid partnership with Leader Health";
export const DEFAULT_CAMPAIGN_LINK_INSTRUCTIONS = "Optional. The post tracks when the caption tags @myleaderhealth. A tracking link in the caption is not required.";

export type CampaignBaseMode = "post" | "campaign";
export type CampaignStatus = "draft" | "sent";

export type CampaignAffiliatePay = {
  code: string;
  amountCents: number;
};

export type CampaignResponseStatus = "accepted" | "declined";

export type CampaignResponse = {
  code: string;
  status: CampaignResponseStatus;
};

export type MarketingCampaignRecord = {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
  goals: string;
  assignedCodes: string[];
  status: CampaignStatus;
  platforms: string[];
  contentTypes: string[];
  postsRequired: number;
  guidelines: string;
  disclosure: string;
  linkInstructions: string;
  baseMode: CampaignBaseMode;
  baseAmountCents: number;
  performancePay: boolean;
  affiliatePay: CampaignAffiliatePay[];
  responses: CampaignResponse[];
};

export type CampaignFlowInput = {
  mode: "draft" | "sent";
  name: unknown;
  description: unknown;
  goals: unknown;
  startsOn: unknown;
  endsOn: unknown;
  platforms: unknown;
  contentTypes: unknown;
  posts: unknown;
  guidelines: unknown;
  disclosure: unknown;
  linkInstructions: unknown;
  baseMode: unknown;
  amount: unknown;
  performancePay: unknown;
  affiliates: unknown;
};

export type CampaignBrief = {
  description: string;
  startsOn: string;
  endsOn: string;
  goals: string;
  assignedCodes: string[];
  status: CampaignStatus;
  platforms: string[];
  contentTypes: string[];
  postsRequired: number;
  guidelines: string;
  disclosure: string;
  linkInstructions: string;
  baseMode: CampaignBaseMode;
  baseAmountCents: number;
  performancePay: boolean;
  affiliatePay: CampaignAffiliatePay[];
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
  return {
    name,
    description: "",
    startsOn: "",
    endsOn: "",
    goals: "",
    assignedCodes: [],
    status: "sent",
    platforms: [],
    contentTypes: [],
    postsRequired: 0,
    guidelines: "",
    disclosure: "",
    linkInstructions: "",
    baseMode: "campaign",
    baseAmountCents: 0,
    performancePay: false,
    affiliatePay: [],
    responses: [],
  };
}

const CAMPAIGN_NAME = /^[A-Za-z0-9][A-Za-z0-9 '&.,-]{0,59}$/;

function campaignName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.toLowerCase() === "no promo code" || !CAMPAIGN_NAME.test(name)) return null;
  return name;
}

function picked(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  const items: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && allowed.includes(item) && !items.includes(item)) items.push(item);
  }
  return items;
}

function postsCount(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(raw)) return 0;
  return Math.min(100, Number(raw));
}

function paymentCents(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,]/g, "") : "";
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars <= 0 || dollars > 100000) return null;
  return Math.round(dollars * 100);
}

function optionalDay(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return "";
  return publishDateValue(value);
}

function affiliateRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  const rows: { code: string; amount: unknown }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const code = normalizeAffiliateCode((item as { code?: unknown }).code);
    if (!code || rows.some((row) => row.code === code)) continue;
    rows.push({ code, amount: (item as { amount?: unknown }).amount });
    if (rows.length >= 200) break;
  }
  return rows;
}

export function campaignStepError(step: number, input: CampaignFlowInput) {
  const name = campaignName(input.name);
  const rawName = typeof input.name === "string" ? input.name.trim() : "";
  const startsOn = optionalDay(input.startsOn);
  const endsOn = optionalDay(input.endsOn);
  const posts = postsCount(input.posts);
  const amount = paymentCents(input.amount);
  const rows = affiliateRows(input.affiliates);
  if (step === 0) {
    if (!name) return rawName ? "Enter a campaign name of up to 60 letters, numbers, spaces, or & ' . , -." : "Add a campaign name.";
    if (!text(input.description)) return "Add a description.";
    if (startsOn == null || endsOn == null || !startsOn || !endsOn) return "Add start and end dates.";
    if (endsOn < startsOn) return "Enter campaign dates as YYYY-MM-DD, with the end on or after the start.";
    if (picked(input.platforms, CAMPAIGN_PLATFORMS).length === 0) return "Pick at least one platform.";
    return "";
  }
  if (step === 1) {
    if (picked(input.contentTypes, CAMPAIGN_CONTENT_TYPES).length === 0) return "Pick at least one content type.";
    if (posts < 1) return "Posts required must be 1 or more.";
    if (!text(input.guidelines)) return "Add guidelines so affiliates know what to make.";
    if (!text(input.disclosure)) return "Add the required FTC disclosure.";
    if (!text(input.linkInstructions)) return "Add tracking link instructions.";
    return "";
  }
  if (step === 2) return amount == null ? "Enter a base payment, like 150." : "";
  if (step === 3) {
    if (rows.length === 0) return "Invite at least one affiliate.";
    if (rows.some((row) => paymentCents(row.amount) == null)) return "Check each affiliate’s payment.";
    return "";
  }
  return "";
}

export function readCampaignFlow(input: CampaignFlowInput): { name: string; brief: CampaignBrief } | { error: string } {
  const name = campaignName(input.name);
  const rawName = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { error: rawName ? "Enter a campaign name of up to 60 letters, numbers, spaces, or & ' . , -." : "Add a campaign name." };
  const startsOn = optionalDay(input.startsOn);
  const endsOn = optionalDay(input.endsOn);
  if (startsOn == null || endsOn == null || (startsOn && endsOn && endsOn < startsOn)) {
    return { error: "Enter campaign dates as YYYY-MM-DD, with the end on or after the start." };
  }
  if (input.mode === "sent") {
    for (let step = 0; step < 4; step += 1) {
      const error = campaignStepError(step, input);
      if (error) return { error };
    }
  } else if (affiliateRows(input.affiliates).length === 0) {
    return { error: "Invite at least one affiliate." };
  }
  const rows = affiliateRows(input.affiliates);
  const amount = paymentCents(input.amount);
  const affiliatePay: CampaignAffiliatePay[] = [];
  for (const row of rows) {
    const cents = paymentCents(row.amount);
    if (cents != null && cents !== amount) affiliatePay.push({ code: row.code, amountCents: cents });
  }
  return {
    name,
    brief: {
      description: text(input.description),
      startsOn: startsOn ?? "",
      endsOn: endsOn ?? "",
      goals: text(input.goals),
      assignedCodes: rows.map((row) => row.code),
      status: input.mode === "draft" ? "draft" : "sent",
      platforms: picked(input.platforms, CAMPAIGN_PLATFORMS),
      contentTypes: picked(input.contentTypes, CAMPAIGN_CONTENT_TYPES),
      postsRequired: postsCount(input.posts),
      guidelines: text(input.guidelines),
      disclosure: text(input.disclosure),
      linkInstructions: text(input.linkInstructions),
      baseMode: "campaign",
      baseAmountCents: amount ?? 0,
      performancePay: input.performancePay === true,
      affiliatePay,
    },
  };
}

export function visibleAssignedCampaigns(records: MarketingCampaignRecord[], code: string) {
  return records.filter((record) => record.status !== "draft" && record.assignedCodes.includes(code));
}

export function campaignAnswer(record: MarketingCampaignRecord, code: string): CampaignResponseStatus | null {
  return record.responses.find((row) => row.code === code)?.status ?? null;
}

export function affiliateCanAttachCampaign(record: MarketingCampaignRecord, code: string, hasPost: boolean) {
  if (record.status === "draft" || !record.assignedCodes.includes(code)) return false;
  const answer = campaignAnswer(record, code);
  if (answer === "declined") return false;
  return answer === "accepted" || hasPost;
}
