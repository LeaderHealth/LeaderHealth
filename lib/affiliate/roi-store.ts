import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { CampaignRecordError, campaignRecordDetails, type MarketingCampaignRecord } from "./campaign-record";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { publishDateValue } from "./format";
import {
  campaignDirectoryName,
  roiCostCents,
  roiFigures,
  roiSpentOn,
  type RoiCost,
  type RoiOrder,
  type RoiRange,
  type RoiReport,
} from "./roi";

export class RoiStoreError extends Error {
  code: "campaign" | "choose" | "amount" | "date" | "when" | "unavailable";

  constructor(code: RoiStoreError["code"], message: string) {
    super(message);
    this.name = "RoiStoreError";
    this.code = code;
  }
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asTimestamp(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function orderFrom(data: DocumentData): RoiOrder {
  return {
    promoCode: typeof data.promoCode === "string" ? data.promoCode : "",
    amountCents: typeof data.amountCents === "number" ? data.amountCents : null,
    refundedAmountCents: asNumber(data.refundedAmountCents),
    dryRun: data.dryRun === true,
    createdAt: asTimestamp(data.createdAt),
  };
}

function costFrom(data: DocumentData): RoiCost {
  return {
    campaign: typeof data.campaign === "string" ? data.campaign : "",
    costCents: asNumber(data.costCents),
    spentOn: typeof data.spentOn === "string" ? data.spentOn : null,
  };
}

function requireRoiDb() {
  if (!affiliateFirebaseConfigured()) {
    throw new RoiStoreError("unavailable", "Firestore is not configured.");
  }
  return affiliateFirestore();
}

function storedText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function storedCodes(value: unknown) {
  if (!Array.isArray(value)) return [];
  const codes: string[] = [];
  for (const item of value) {
    const code = normalizeAffiliateCode(item);
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

function recordFrom(data: DocumentData | undefined): MarketingCampaignRecord | null {
  const name = campaignDirectoryName(data?.name);
  if (!name) return null;
  return {
    name,
    description: storedText(data?.description),
    startsOn: publishDateValue(data?.startsOn) ?? "",
    endsOn: publishDateValue(data?.endsOn) ?? "",
    goals: storedText(data?.goals),
    assignedCodes: storedCodes(data?.assignedCodes),
  };
}

export async function loadMarketingCampaignRecords() {
  const snap = await requireRoiDb().collection("marketingCampaigns").get();
  const records = new Map<string, MarketingCampaignRecord>();
  for (const doc of snap.docs) {
    const record = recordFrom(doc.data());
    if (record) records.set(record.name.toLowerCase(), record);
  }
  return [...records.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export async function loadMarketingCampaigns() {
  const records = await loadMarketingCampaignRecords();
  return records.map((record) => record.name);
}

export async function saveMarketingCampaign(input: {
  name: unknown;
  description?: unknown;
  startsOn?: unknown;
  endsOn?: unknown;
  goals?: unknown;
  assignedCodes?: unknown;
}) {
  const name = campaignDirectoryName(input.name);
  if (!name) throw new RoiStoreError("campaign", "Enter a campaign name.");
  const details =
    input.description !== undefined ||
    input.startsOn !== undefined ||
    input.endsOn !== undefined ||
    input.goals !== undefined ||
    input.assignedCodes !== undefined;
  let fields: ReturnType<typeof campaignRecordDetails> | null = null;
  if (details) {
    try {
      fields = campaignRecordDetails({
        description: input.description ?? "",
        startsOn: input.startsOn ?? "",
        endsOn: input.endsOn ?? "",
        goals: input.goals ?? "",
        assignedCodes: input.assignedCodes ?? [],
      });
    } catch (error) {
      if (error instanceof CampaignRecordError) throw new RoiStoreError("when", "Enter campaign dates as YYYY-MM-DD, with the end on or after the start.");
      throw error;
    }
  }
  const db = requireRoiDb();
  const ref = db.collection("marketingCampaigns").doc(name.toLowerCase());
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists && !fields) return "exists" as const;
    if (snap.exists && fields) {
      tx.set(ref, { name, ...fields }, { merge: true });
      return "updated" as const;
    }
    tx.set(ref, { name, createdAt: new Date(), ...(fields ?? {}) });
    return "created" as const;
  });
}

export async function loadRoiReport(range: RoiRange, now = Date.now()): Promise<RoiReport> {
  const db = requireRoiDb();
  const [ordersSnap, costsSnap, campaigns] = await Promise.all([
    db.collection("conversions").get(),
    db.collection("marketingCosts").get(),
    loadMarketingCampaigns(),
  ]);
  return roiFigures({
    range,
    now,
    campaigns,
    orders: ordersSnap.docs.map((doc) => orderFrom(doc.data())),
    costs: costsSnap.docs.map((doc) => costFrom(doc.data())),
  });
}

export async function saveMarketingCost(input: { campaign: unknown; amount: unknown; spentOn: unknown }) {
  const name = campaignDirectoryName(input.campaign);
  if (!name) throw new RoiStoreError("campaign", "Enter a campaign name.");
  const campaign = (await loadMarketingCampaigns()).find((item) => item.toLowerCase() === name.toLowerCase());
  if (!campaign) throw new RoiStoreError("choose", "Choose a campaign.");
  const costCents = roiCostCents(input.amount);
  if (costCents == null) throw new RoiStoreError("amount", "Enter a cost greater than zero.");
  const spentOn = roiSpentOn(input.spentOn);
  if (!spentOn) throw new RoiStoreError("date", "Enter the date the money was spent.");

  await requireRoiDb().collection("marketingCosts").add({
    campaign,
    costCents,
    spentOn,
    createdAt: new Date(),
  });
}
