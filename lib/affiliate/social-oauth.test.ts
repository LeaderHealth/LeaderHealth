import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { instagramAuthorizeUrl, metaAuthorizeUrl, openTikTokVerifier, readSocialState, sealTikTokVerifier, signSocialState, tiktokAuthorizeUrl, tiktokCodeChallenge, tiktokCodeVerifier, youtubeAuthorizeUrl } from "./social-oauth";

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

test("youtube login asks Google for read-only channel access", () => {
  process.env.GOOGLE_CLIENT_ID = "google-client";
  process.env.NEXT_PUBLIC_SITE_URL = "https://leaderhealth.example";
  process.env.AFFILIATE_SESSION_SECRET = "youtube-test-secret";
  const now = 1_700_000_000_000;
  const state = signSocialState({ code: "88h4dcji", network: "youtube", now });
  assert.ok(state);
  assert.deepEqual(readSocialState(state, now), { code: "88h4dcji", network: "youtube" });
  const url = new URL(youtubeAuthorizeUrl(state));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), "google-client");
  assert.equal(url.searchParams.get("redirect_uri"), "https://leaderhealth.example/api/affiliate/social/youtube/callback");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), "https://www.googleapis.com/auth/youtube.readonly");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("state"), state);
});

test("instagram login opens Instagram and Facebook login stays on Facebook", () => {
  process.env.INSTAGRAM_APP_ID = "instagram-app";
  process.env.INSTAGRAM_REDIRECT_URI = "https://leaderhealth.clinic/api/affiliate/social/meta/callback";
  process.env.FACEBOOK_APP_ID = "facebook-app";
  process.env.AFFILIATE_SESSION_SECRET = "instagram-test-secret";
  const now = 1_700_000_000_000;
  const state = signSocialState({ code: "88h4dcji", network: "instagram", now });
  assert.ok(state);
  const instagram = new URL(instagramAuthorizeUrl(state));
  assert.equal(instagram.origin + instagram.pathname, "https://www.instagram.com/oauth/authorize");
  assert.equal(instagram.searchParams.get("client_id"), "instagram-app");
  assert.equal(instagram.searchParams.get("enable_fb_login"), "0");
  assert.equal(instagram.searchParams.get("force_authentication"), "1");
  assert.equal(instagram.searchParams.get("scope"), "instagram_business_basic,instagram_business_manage_insights");
  assert.equal(instagram.searchParams.get("redirect_uri"), "https://leaderhealth.clinic/api/affiliate/social/meta/callback");
  assert.equal(instagram.searchParams.has("config_id"), false);
  const facebook = new URL(metaAuthorizeUrl("facebook-state"));
  assert.equal(facebook.origin + facebook.pathname, "https://www.facebook.com/v21.0/dialog/oauth");
  assert.equal(facebook.searchParams.get("client_id"), "facebook-app");
  assert.equal(facebook.searchParams.get("scope"), "public_profile");
  assert.equal(facebook.searchParams.has("config_id"), false);
});
