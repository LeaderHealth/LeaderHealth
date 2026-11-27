import { NextResponse } from "next/server";
import { campaignRoiCsv } from "@/lib/affiliate/roi-detail";
import { loadCampaignRoiDetail } from "@/lib/affiliate/roi-detail-store";
import { adminSessionActor } from "@/lib/affiliate/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await adminSessionActor();
  if (!actor) return new NextResponse("Unauthorized", { status: 401 });
  const name = new URL(request.url).searchParams.get("campaign")?.trim() ?? "";
  try {
    const detail = await loadCampaignRoiDetail(name);
    if (!detail) return new NextResponse("Not found", { status: 404 });
    const file = `${detail.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "campaign"}-roi.csv`;
    return new NextResponse(campaignRoiCsv(detail), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${file}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[affiliate] roi export failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Unavailable", { status: 503 });
  }
}
