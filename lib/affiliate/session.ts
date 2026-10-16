import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { normalizeAffiliateCode, normalizeAffiliateEmail } from "./code";

export const ADMIN_COOKIE = "lh_aff_admin";
export const PORTAL_COOKIE = "lh_aff_portal";
const SESSION_SECONDS = 60 * 60 * 12;

export function affiliateAdminConfigured() {
  return Boolean(process.env.AFFILIATE_ADMIN_PASSWORD?.trim());
}

function adminPassword() {
  return process.env.AFFILIATE_ADMIN_PASSWORD?.trim() ?? "";
}

function adminEmail() {
  return normalizeAffiliateEmail(process.env.AFFILIATE_ADMIN_EMAIL);
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function secretMatches(input: string, expected: string) {
  if (!expected || !input) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export function adminLoginConfigured() {
  return Boolean(adminPassword() && adminEmail());
}

export function adminCredentialsMatch(email: string, password: string) {
  const expectedEmail = adminEmail() ?? "";
  const givenEmail = normalizeAffiliateEmail(email) ?? "";
  const emailOk = secretMatches(givenEmail, expectedEmail);
  const passwordOk = secretMatches(password, adminPassword());
  return emailOk && passwordOk;
}

function sign(body: string) {
  return createHmac("sha256", adminPassword()).update(body).digest("base64url");
}

function signatureMatches(body: string, signature: string) {
  const expected = sign(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createAdminSessionToken() {
  const body = `v1.${Date.now() + SESSION_SECONDS * 1000}`;
  return `${body}.${sign(body)}`;
}

export function adminSessionValid(token: string | undefined) {
  if (!token || !affiliateAdminConfigured()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresAt, signature] = parts;
  if (version !== "v1") return false;
  const body = `${version}.${expiresAt}`;
  if (!signatureMatches(body, signature)) return false;
  const expires = Number(expiresAt);
  return Number.isFinite(expires) && expires > Date.now();
}

export function createPortalSessionToken(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateAdminConfigured()) return null;
  const body = `v1.${normalized}.${Date.now() + SESSION_SECONDS * 1000}`;
  return `${body}.${sign(body)}`;
}

export function portalSessionCode(token: string | undefined) {
  if (!token || !affiliateAdminConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [version, code, expiresAt, signature] = parts;
  if (version !== "v1") return null;
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;
  const body = `${version}.${normalized}.${expiresAt}`;
  if (!signatureMatches(body, signature)) return null;
  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;
  return normalized;
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

export async function adminIsSignedIn() {
  const jar = await cookies();
  return adminSessionValid(jar.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminSessionToken(), sessionCookieOptions());
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function portalAffiliateCode() {
  const jar = await cookies();
  return portalSessionCode(jar.get(PORTAL_COOKIE)?.value);
}

export async function setPortalSession(code: string) {
  const token = createPortalSessionToken(code);
  if (!token) return false;
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, token, sessionCookieOptions());
  return true;
}

export async function clearPortalSession() {
  const jar = await cookies();
  jar.delete(PORTAL_COOKIE);
}
