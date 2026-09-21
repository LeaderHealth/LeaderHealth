import { NextResponse } from "next/server";
import { ALLOW_LIVE_NMI_CHARGES } from "@/lib/nmi/flags";
import { nmiPublicConfig } from "@/lib/nmi/env";

export const runtime = "nodejs";

export async function GET() {
  const { tokenizationKey, gatewayBaseUrl } = nmiPublicConfig();
  return NextResponse.json(
    {
      configured: Boolean(tokenizationKey),
      tokenizationKey,
      gatewayBaseUrl,
      chargesEnabled: ALLOW_LIVE_NMI_CHARGES,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
