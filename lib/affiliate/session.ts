import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { normalizeAffiliateCode, normalizeAffiliateEmail } from "./code";
import { activeDashboardSession, createDashboardSession, type DashboardRole } from "./dashboard-sessions";
import { reportHandledAffiliateError } from "./report";

export const ADMIN_COOKIE = "lh_aff_admin";
export const PORTAL_COOKIE = "lh_aff_portal";
const SESSION_SECONDS = 60 * 60 * 12;
const REMEMBER_SECONDS = 60 * 60 * 24 * 30;
const SESSION_ID = /^[A-Za-z0-9_-]{20,80}$/;

function sessionSeconds(rememberDevice: boolean) {
  return rememberDevice ? REMEMBER_SECONDS : SESSION_SECONDS;
}

function sessionSecret() {
  return process.env.AFFILIATE_SESSION_SECRET?.trim() ?? "";
}

export function affiliateAdminConfigured() {
  return Boolean(process.env.AFFILIATE_ADMIN_PASSWORD?.trim() && sessionSecret());
}

function adminPassword() {
  return process.env.AFFILIATE_ADMIN_PASSWORD?.trim() ?? "";
}

function adminEmail() {
  return normalizeAffiliateEmail(process.env.AFFILIATE_ADMIN_EMAIL);
}

export function adminAccountEmail() {
  return adminEmail();
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function secretMatches(input: string, expected: string) {
  if (!expected || !input) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export function adminLoginConfigured() {
  return Boolean(adminPassword() && adminEmail() && sessionSecret());
}

export function adminCredentialsMatch(email: string, password: string) {
  const expectedEmail = adminEmail() ?? "";
  const givenEmail = normalizeAffiliateEmail(email) ?? "";
  const emailOk = secretMatches(givenEmail, expectedEmail);
  const passwordOk = secretMatches(password, adminPassword());
  return emailOk && passwordOk;
}

function sign(body: string) {
  return createHmac("sha256", sessionSecret()).update(body).digest("base64url");
}

function signatureMatches(body: string, signature: string) {
  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export type AdminActor = { role: "owner" } | { role: "sub"; id: string };

function sessionExpiry(expiresAt: string) {
  const expires = Number(expiresAt);
  return Number.isFinite(expires) && expires > Date.now();
}

type SessionClaims = {
  id: string;
  role: DashboardRole;
  subject: string;
  expiresAt: number;
};

function claimsValid(value: unknown): value is SessionClaims {
  if (!value || typeof value !== "object") return false;
  const claims = value as SessionClaims;
  if (claims.role !== "owner" && claims.role !== "sub" && claims.role !== "affiliate") return false;
  if (typeof claims.id !== "string" || !SESSION_ID.test(claims.id)) return false;
  if (typeof claims.subject !== "string" || !claims.subject) return false;
  if (!sessionExpiry(String(claims.expiresAt))) return false;
  if (claims.role === "sub" && !SESSION_ID.test(claims.subject)) return false;
  if (claims.role === "affiliate" && !normalizeAffiliateCode(claims.subject)) return false;
  return true;
}

function parseSessionToken(token: string | undefined): SessionClaims | null {
  if (!token || !sessionSecret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v4") return null;
  const body = `${parts[0]}.${parts[1]}`;
  if (!signatureMatches(body, parts[2])) return null;
  try {
    const parsed = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return claimsValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function browserLabel() {
  try {
    const header = (await headers()).get("user-agent") ?? "";
    return header.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 180);
  } catch {
    return "";
  }
}

async function issueSession(role: DashboardRole, subject: string, seconds: number) {
  if (!sessionSecret() || !subject) return null;
  const id = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + seconds * 1000;
  try {
    const saved = await createDashboardSession({
      id,
      role,
      subject,
      userAgent: await browserLabel(),
      expiresAt,
    });
    if (!saved) return null;
  } catch (error) {
    reportHandledAffiliateError("[affiliate] session create failed", error);
  }
  const payload = Buffer.from(JSON.stringify({ id, role, subject, expiresAt })).toString("base64url");
  const body = `v4.${payload}`;
  return `${body}.${sign(body)}`;
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function remember(name: string, token: string | null, maxAge: number) {
  if (!token) return false;
  const jar = await cookies();
  jar.set(name, token, sessionCookieOptions(maxAge));
  return true;
}

export async function adminSessionActor(): Promise<AdminActor | null> {
  const jar = await cookies();
  const claims = parseSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!claims || (claims.role !== "owner" && claims.role !== "sub")) return null;
  try {
    const session = await activeDashboardSession(claims.id);
    if (!session) return null;
    if (session.role === "owner") return { role: "owner" };
    if (session.role !== "sub") return null;
    return { role: "sub", id: session.subject };
  } catch (error) {
    console.warn("[affiliate] session read failed", error instanceof Error ? error.message : "unknown");
    if (claims.role === "owner") return { role: "owner" };
    return { role: "sub", id: claims.subject };
  }
}

export async function currentAdminSessionId() {
  const jar = await cookies();
  return parseSessionToken(jar.get(ADMIN_COOKIE)?.value)?.id ?? null;
}

export async function adminIsSignedIn() {
  return (await adminSessionActor()) != null;
}

export async function setAdminSession(rememberDevice = false) {
  const email = adminEmail();
  if (!email) return false;
  const seconds = sessionSeconds(rememberDevice);
  return remember(ADMIN_COOKIE, await issueSession("owner", email, seconds), seconds);
}

export async function setSubAdminSession(id: string, rememberDevice = false) {
  if (!SESSION_ID.test(id)) return false;
  const seconds = sessionSeconds(rememberDevice);
  return remember(ADMIN_COOKIE, await issueSession("sub", id, seconds), seconds);
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function portalAffiliateCode() {
  const jar = await cookies();
  const claims = parseSessionToken(jar.get(PORTAL_COOKIE)?.value);
  if (!claims || claims.role !== "affiliate") return null;
  try {
    const session = await activeDashboardSession(claims.id);
    if (!session || session.role !== "affiliate") return null;
    return normalizeAffiliateCode(session.subject);
  } catch (error) {
    console.warn("[affiliate] portal session read failed", error instanceof Error ? error.message : "unknown");
    return normalizeAffiliateCode(claims.subject);
  }
}

export async function setPortalSession(code: string, rememberDevice = false) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return false;
  const seconds = sessionSeconds(rememberDevice);
  return remember(PORTAL_COOKIE, await issueSession("affiliate", normalized, seconds), seconds);
}

export async function clearPortalSession() {
  const jar = await cookies();
  jar.delete(PORTAL_COOKIE);
}
