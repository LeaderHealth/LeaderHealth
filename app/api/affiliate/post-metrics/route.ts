import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { refreshDueMetrics } from "@/lib/affiliate/post-review";

export const runtime = "nodejs";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim() ?? "";
  const header = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim() ?? "";
  if (!token || !expected) return false;
  const actual = createHash("sha256").update(token).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actual, wanted);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    const updated = await refreshDueMetrics(undefined, 40);
    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error("[affiliate] post metrics cron failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not refresh post metrics." }, { status: 502 });
  }
}
