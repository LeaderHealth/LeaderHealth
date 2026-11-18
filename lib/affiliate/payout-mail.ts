import { affiliateEmailConfigured, sendPayoutApprovedEmail, sendPayoutSentEmail } from "./email";
import { getAffiliate } from "./store";

export async function notifyAffiliatePayout(input: {
  code: string;
  stage: "approved" | "sent";
  label: string;
  amountCents: number;
  reference?: string;
}) {
  if (!affiliateEmailConfigured() || !Number.isInteger(input.amountCents) || input.amountCents < 0) return;
  const affiliate = await getAffiliate(input.code).catch(() => null);
  if (!affiliate?.email) return;
  try {
    if (input.stage === "sent") await sendPayoutSentEmail(affiliate.email, input.label, input.amountCents, input.reference ?? "");
    else await sendPayoutApprovedEmail(affiliate.email, input.label, input.amountCents);
  } catch (error) {
    console.error("[affiliate] payout email failed", error instanceof Error ? error.message : "unknown");
  }
}
