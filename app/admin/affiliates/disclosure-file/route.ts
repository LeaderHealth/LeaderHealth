import { NextResponse } from "next/server";
import { DisclosureError, loadDisclosureProof, readDisclosureScreenshot } from "@/lib/affiliate/disclosures";
import { adminSessionActor } from "@/lib/affiliate/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await adminSessionActor();
  if (!actor) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(request.url).searchParams.get("proof")?.trim() ?? "";
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const proof = await loadDisclosureProof(id);
    if (!proof?.screenshotPath) return new NextResponse("Not found", { status: 404 });
    const file = await readDisclosureScreenshot(proof.screenshotPath);
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DisclosureError) return new NextResponse("Not found", { status: 404 });
    console.error("[affiliate] disclosure file failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Unavailable", { status: 503 });
  }
}
