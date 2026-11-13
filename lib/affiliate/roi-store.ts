import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import {
  roiCampaignName,
  roiCostCents,
  roiFigures,
  roiSpentOn,
  type RoiCost,
  type RoiOrder,
  type RoiRange,
  type RoiReport,
} from "./roi";

export class RoiStoreError extends Error {
  code: "campaign" | "amount" | "date" | "unavailable";

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

export async function loadRoiReport(range: RoiRange, now = Date.now()): Promise<RoiReport> {
  if (!affiliateFirebaseConfigured()) {
    throw new RoiStoreError("unavailable", "Firestore is not configured.");
  }
  const db = affiliateFirestore();
  const [ordersSnap, costsSnap] = await Promise.all([
    db.collection("conversions").get(),
    db.collection("marketingCosts").get(),
  ]);
  return roiFigures({
    range,
    now,
    orders: ordersSnap.docs.map((doc) => orderFrom(doc.data())),
    costs: costsSnap.docs.map((doc) => costFrom(doc.data())),
  });
}

export async function saveMarketingCost(input: { campaign: unknown; amount: unknown; spentOn: unknown }) {
  if (!affiliateFirebaseConfigured()) {
    throw new RoiStoreError("unavailable", "Firestore is not configured.");
  }
  const campaign = roiCampaignName(input.campaign);
  if (!campaign) throw new RoiStoreError("campaign", "Enter a campaign name.");
  const costCents = roiCostCents(input.amount);
  if (costCents == null) throw new RoiStoreError("amount", "Enter a cost greater than zero.");
  const spentOn = roiSpentOn(input.spentOn);
  if (!spentOn) throw new RoiStoreError("date", "Enter the date the money was spent.");

  await affiliateFirestore().collection("marketingCosts").add({
    campaign,
    costCents,
    spentOn,
    createdAt: new Date(),
  });
}
