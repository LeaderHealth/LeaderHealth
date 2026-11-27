import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { deliverTrafficSpikeNotices } from "@/lib/affiliate/traffic-spike-mail";

export const runtime = "nodejs";

function cronSecret() {
  return process.env.CRON_SECRET?.trim() ?? "";
}

function authorized(request: Request) {
  const expected = cronSecret();
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
    const sent = await deliverTrafficSpikeNotices();
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error("[affiliate] traffic spike notice failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: "Could not send the traffic spike email." }, { status: 502 });
  }
}
