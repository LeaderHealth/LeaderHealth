import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { affiliatePath, affiliateReferrer, resolveAffiliateAttribution } from "@/lib/affiliate/code";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateCampaign } from "@/lib/affiliate/link";
import {
  AFFILIATE_CAMPAIGN_COOKIE,
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

function requestCookie(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

function rememberAffiliate(response: NextResponse, code: string, campaign: unknown) {
  const options = affiliateCookieOptions(AFFILIATE_MAX_AGE);
  response.cookies.set(AFFILIATE_COOKIE, code, options);
  const captured = affiliateCampaign(campaign);
  if (captured) {
    response.cookies.set(AFFILIATE_CAMPAIGN_COOKIE, captured, options);
    return;
  }
  response.cookies.set(AFFILIATE_CAMPAIGN_COOKIE, "", affiliateCookieOptions(0));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const ref = Object.prototype.hasOwnProperty.call(record, "ref") ? record.ref : record.code;
  const attribution = resolveAffiliateAttribution(ref, record.utm_source, requestCookie(request, AFFILIATE_COOKIE));
  if (!attribution.update || !attribution.code) return NextResponse.json({ ok: true, tracked: false });
  const code = attribution.code;

  if (!affiliateFirebaseConfigured()) {
    const captured = NextResponse.json({ ok: true, tracked: false });
    rememberAffiliate(captured, code, record.campaign);
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
  rememberAffiliate(tracked, code, record.campaign);
  if (!VISITOR_ID.test(visitorId)) {
    visitorId = crypto.randomUUID();
    tracked.cookies.set(VISITOR_COOKIE, visitorId, affiliateCookieOptions(VISITOR_MAX_AGE));
  }

  const loggedKey = todayKey(code);
  if (jar.get(CLICK_LOG_COOKIE)?.value === loggedKey) return tracked;

  try {
    await logClick({
      code,
      path: affiliatePath(record.path),
      visitorId,
      campaign: affiliateCampaign(record.campaign),
    });
    tracked.cookies.set(CLICK_LOG_COOKIE, loggedKey, affiliateCookieOptions(CLICK_LOG_MAX_AGE));
  } catch (error) {
    console.error("[affiliate] click log failed", error instanceof Error ? error.message : "unknown");
  }
  return tracked;
}
