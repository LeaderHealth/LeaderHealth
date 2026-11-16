import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { openTikTokVerifier, sealTikTokVerifier, tiktokAuthorizeUrl, tiktokCodeChallenge, tiktokCodeVerifier } from "./social-oauth";

test("tiktok login sends a hex S256 code challenge and keeps the verifier", () => {
  const verifier = tiktokCodeVerifier();
  assert.match(verifier, /^[A-Za-z0-9\-._~]{43,128}$/);
  const challenge = tiktokCodeChallenge(verifier);
  assert.equal(challenge, createHash("sha256").update(verifier).digest("hex"));
  const url = new URL(tiktokAuthorizeUrl("state-token", verifier));
  assert.equal(url.origin + url.pathname, "https://www.tiktok.com/v2/auth/authorize/");
  assert.equal(url.searchParams.get("code_challenge"), challenge);
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.has("code_verifier"), false);

  process.env.AFFILIATE_SESSION_SECRET = "pkce-test-secret";
  const now = 1_700_000_000_000;
  const sealed = sealTikTokVerifier(verifier, now);
  assert.ok(sealed);
  assert.equal(sealed.includes(verifier), false);
  assert.equal(openTikTokVerifier(sealed, now), verifier);
  assert.equal(openTikTokVerifier(sealed, now + 11 * 60 * 1000), null);
  assert.equal(openTikTokVerifier(`${sealed}x`, now), null);
});
