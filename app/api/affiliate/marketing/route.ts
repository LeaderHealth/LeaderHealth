import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recordMarketingEvent } from "@/lib/affiliate/marketing-events";
import { AFFILIATE_COOKIE, VISITOR_COOKIE } from "@/lib/affiliate/store";

export const runtime = "nodejs";

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true, tracked: false });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const kind = record.kind === "impression" || record.kind === "page_view" ? record.kind : null;
  const jar = await cookies();
  const code = jar.get(AFFILIATE_COOKIE)?.value ?? "";
  const visitorId = jar.get(VISITOR_COOKIE)?.value ?? "";
  if (!kind || !code || !VISITOR_ID.test(visitorId)) return NextResponse.json({ ok: true, tracked: false });
  try {
    await recordMarketingEvent({
      code,
      visitorId,
      kind,
      path: record.path,
      placement: record.placement,
      userAgent: request.headers.get("user-agent") ?? "",
    });
  } catch (error) {
    console.error("[affiliate] marketing event failed", error instanceof Error ? error.message : "unknown");
  }
  return NextResponse.json({ ok: true, tracked: true });
}
