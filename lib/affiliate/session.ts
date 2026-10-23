import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { normalizeAffiliateCode, normalizeAffiliateEmail } from "./code";
import { activeDashboardSession, createDashboardSession, type DashboardRole } from "./dashboard-sessions";

export const ADMIN_COOKIE = "lh_aff_admin";
export const PORTAL_COOKIE = "lh_aff_portal";
const SESSION_SECONDS = 60 * 60 * 12;
const SESSION_ID = /^[A-Za-z0-9_-]{20,80}$/;

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

function parseSessionToken(token: string | undefined) {
  if (!token || !sessionSecret()) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, id, expiresAt, signature] = parts;
  if (version !== "v3" || !SESSION_ID.test(id)) return null;
  const body = `${version}.${id}.${expiresAt}`;
  if (!signatureMatches(body, signature) || !sessionExpiry(expiresAt)) return null;
  return id;
}

async function browserLabel() {
  try {
    const header = (await headers()).get("user-agent") ?? "";
    return header.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 180);
  } catch {
    return "";
  }
}

async function issueSession(role: DashboardRole, subject: string) {
  if (!sessionSecret() || !subject) return null;
  const id = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
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
    console.error("[affiliate] session create failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
  const body = `v3.${id}.${expiresAt}`;
  return `${body}.${sign(body)}`;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

async function remember(name: string, token: string | null) {
  if (!token) return false;
  const jar = await cookies();
  jar.set(name, token, sessionCookieOptions());
  return true;
}

export async function adminSessionActor(): Promise<AdminActor | null> {
  const jar = await cookies();
  const id = parseSessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!id) return null;
  let session;
  try {
    session = await activeDashboardSession(id);
  } catch (error) {
    console.error("[affiliate] session read failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
  if (!session) return null;
  if (session.role === "owner") return { role: "owner" };
  if (session.role !== "sub") return null;
  return { role: "sub", id: session.subject };
}

export async function currentAdminSessionId() {
  const jar = await cookies();
  return parseSessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export async function adminIsSignedIn() {
  return (await adminSessionActor()) != null;
}

export async function setAdminSession() {
  const email = adminEmail();
  if (!email) return false;
  return remember(ADMIN_COOKIE, await issueSession("owner", email));
}

export async function setSubAdminSession(id: string) {
  if (!SESSION_ID.test(id)) return false;
  return remember(ADMIN_COOKIE, await issueSession("sub", id));
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function portalAffiliateCode() {
  const jar = await cookies();
  const id = parseSessionToken(jar.get(PORTAL_COOKIE)?.value);
  if (!id) return null;
  try {
    const session = await activeDashboardSession(id);
    if (!session || session.role !== "affiliate") return null;
    return normalizeAffiliateCode(session.subject);
  } catch (error) {
    console.error("[affiliate] portal session read failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
}

export async function setPortalSession(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return false;
  return remember(PORTAL_COOKIE, await issueSession("affiliate", normalized));
}

export async function clearPortalSession() {
  const jar = await cookies();
  jar.delete(PORTAL_COOKIE);
}
