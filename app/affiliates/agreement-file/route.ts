import { NextResponse } from "next/server";
import { AgreementError, loadAffiliateAgreement, readAgreementFile } from "@/lib/affiliate/agreements";
import { portalAffiliateCode } from "@/lib/affiliate/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const code = await portalAffiliateCode();
  if (!code) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(request.url).searchParams.get("agreement")?.trim() ?? "";
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const agreement = await loadAffiliateAgreement(id);
    if (!agreement?.filePath || agreement.code !== code) return new NextResponse("Not found", { status: 404 });
    const file = await readAgreementFile(agreement.filePath);
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "content-disposition": 'inline; filename="agreement.pdf"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AgreementError) return new NextResponse("Not found", { status: 404 });
    console.error("[affiliate] agreement file failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Unavailable", { status: 503 });
  }
}
