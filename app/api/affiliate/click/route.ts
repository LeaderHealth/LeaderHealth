import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { affiliatePath, normalizeAffiliateCode } from "@/lib/affiliate/code";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_MAX_AGE,
  CLICK_LOG_COOKIE,
  CLICK_LOG_MAX_AGE,
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
  affiliateCookieOptions,
  getAffiliate,
  logClick,
} from "@/lib/affiliate/store";

export const runtime = "nodejs";

const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function todayKey(code: string) {
  return `${code}:${new Date().toISOString().slice(0, 10)}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const code = normalizeAffiliateCode(record.code);
  if (!code) return NextResponse.json({ ok: true, tracked: false });

  if (!affiliateFirebaseConfigured()) {
    const captured = NextResponse.json({ ok: true, tracked: false });
    captured.cookies.set(AFFILIATE_COOKIE, code, affiliateCookieOptions(AFFILIATE_MAX_AGE));
    return captured;
  }

  let affiliate = null;
  try {
    affiliate = await getAffiliate(code);
  } catch (error) {
    console.error("[affiliate] click lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: true, tracked: false });
  }
  if (!affiliate?.active) return NextResponse.json({ ok: true, tracked: false });

  const jar = await cookies();
  let visitorId = jar.get(VISITOR_COOKIE)?.value ?? "";
  const tracked = NextResponse.json({ ok: true, tracked: true });
  tracked.cookies.set(AFFILIATE_COOKIE, code, affiliateCookieOptions(AFFILIATE_MAX_AGE));
  if (!VISITOR_ID.test(visitorId)) {
    visitorId = crypto.randomUUID();
    tracked.cookies.set(VISITOR_COOKIE, visitorId, affiliateCookieOptions(VISITOR_MAX_AGE));
  }

  const loggedKey = todayKey(code);
  if (jar.get(CLICK_LOG_COOKIE)?.value === loggedKey) return tracked;

  try {
    await logClick({ code, path: affiliatePath(record.path), visitorId });
    tracked.cookies.set(CLICK_LOG_COOKIE, loggedKey, affiliateCookieOptions(CLICK_LOG_MAX_AGE));
  } catch (error) {
    console.error("[affiliate] click log failed", error instanceof Error ? error.message : "unknown");
  }
  return tracked;
}
