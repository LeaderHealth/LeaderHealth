import { NextResponse } from "next/server";
import { nmiTokenizationKeyFromGenHealth } from "@/lib/genhealth/payment-session";
import { ALLOW_LIVE_NMI_CHARGES } from "@/lib/nmi/flags";
import { nmiPublicConfig } from "@/lib/nmi/env";

export const runtime = "nodejs";

export async function GET() {
  const local = nmiPublicConfig();
  let tokenizationKey = "";
  try {
    tokenizationKey = await nmiTokenizationKeyFromGenHealth();
  } catch (error) {
    console.error("[checkout] payment processor config failed", error instanceof Error ? error.message : "unknown");
  }
  if (!tokenizationKey && ALLOW_LIVE_NMI_CHARGES) tokenizationKey = local.tokenizationKey;
  return NextResponse.json(
    {
      configured: Boolean(tokenizationKey),
      tokenizationKey,
      gatewayBaseUrl: local.gatewayBaseUrl,
      chargesEnabled: Boolean(tokenizationKey),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
