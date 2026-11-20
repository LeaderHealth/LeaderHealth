import assert from "node:assert/strict";
import { test } from "node:test";
import { approvableCents } from "./payouts";
import { marketingReportFields } from "./marketing";
import { campaignReports, rememberedFacebookPosts, samePublishedPost, selectCampaignPosts, selectTikTokUpdate, type SocialPost } from "./social-match";

const code = "k7mq2n4p";

function post(overrides: Partial<SocialPost> & Pick<SocialPost, "id">): SocialPost {
  return {
    network: "instagram",
    accountId: "ig1",
    accountName: "Ada",
    caption: "",
    links: [],
    permalink: `https://www.instagram.com/p/${overrides.id}/`,
    createdAt: "2026-03-15T00:00:00.000Z",
    impressions: 10,
    reach: 8,
    likes: 3,
    comments: 1,
    shares: 2,
    saves: 4,
    ...overrides,
  };
}

test("a caption with the tracking link matches and a caption without it does not", () => {
  const kept = selectCampaignPosts(
    [
      post({ id: "linked", caption: "See leaderhealth.clinic/?ref=k7mq2n4p", network: "facebook", accountId: "page" }),
      post({ id: "plain", caption: "Morning walk", network: "tiktok", accountId: "tok", permalink: "https://www.tiktok.com/@a/video/1" }),
      post({ id: "source", links: ["https://leaderhealth.clinic/?utm_source=k7mq2n4p"], network: "tiktok", accountId: "tok" }),
    ],
    code,
    [],
  );
  assert.deepEqual(
    kept.map((item) => item.id),
    ["linked", "source"],
  );
});

test("a permalink equal to a submitted proof URL matches and a different URL does not", () => {
  const kept = selectCampaignPosts(
    [
      post({ id: "proof", permalink: "https://www.instagram.com/reel/ABC/" }),
      post({ id: "other", permalink: "https://www.instagram.com/p/OTHER/" }),
    ],
    code,
    ["https://instagram.com/reel/ABC?igsh=1"],
  );
  assert.deepEqual(
    kept.map((item) => item.id),
    ["proof"],
  );
});

test("one media id that matches both checks is counted once", () => {
  const shared = post({
    id: "same",
    caption: "https://leaderhealth.clinic/?ref=k7mq2n4p",
    permalink: "https://www.instagram.com/p/SAME/",
    impressions: 100,
    reach: 80,
    likes: 7,
    comments: 2,
    shares: 1,
    saves: 3,
  });
  const reports = campaignReports({
    code,
    posts: [shared, { ...shared }],
    proofUrls: ["https://www.instagram.com/p/SAME"],
    accounts: [{ network: "instagram", accountId: "ig1", accountName: "Ada" }],
    monthsByAccount: new Map([["instagram:ig1", ["2026-03"]]]),
  });
  assert.equal(reports.length, 1);
  assert.equal(reports[0]?.impressions, 100);
  assert.equal(reports[0]?.reach, 80);
  assert.equal(reports[0]?.likes, 7);
  assert.equal(reports[0]?.comments, 2);
  assert.equal(reports[0]?.shares, 1);
  assert.equal(reports[0]?.saves, 3);
});

test("three tracking-link posts plus one submitted URL are four posts", () => {
  const linked = [1, 2, 3].map((number) =>
    post({
      id: `l${number}`,
      caption: "https://leaderhealth.clinic/?utm_source=k7mq2n4p",
      permalink: `https://www.instagram.com/p/L${number}/`,
    }),
  );
  const submitted = post({ id: "u1", caption: "Check out my new routine! Link in bio.", permalink: "https://www.instagram.com/p/U1/" });
  const kept = selectCampaignPosts(
    [...linked, submitted, { ...linked[0] }],
    code,
    ["https://www.instagram.com/p/U1", "https://www.instagram.com/p/L1/"],
  );
  assert.equal(kept.length, 4);
});

test("a link-in-bio caption is skipped until that post URL is submitted", () => {
  const bio = post({ id: "bio", caption: "Check out my new routine! Link in bio." });
  assert.equal(selectCampaignPosts([bio], code, []).length, 0);
  assert.equal(selectCampaignPosts([bio], code, ["https://www.instagram.com/p/bio/"]).length, 1);
});

test("a Facebook post and a TikTok post in March stay in two sections", () => {
  const reports = campaignReports({
    code,
    posts: [
      post({
        id: "fb",
        network: "facebook",
        accountId: "page",
        accountName: "Page",
        caption: "https://leaderhealth.clinic/?ref=k7mq2n4p",
        impressions: 5,
        reach: 4,
        likes: 1,
        comments: 0,
        shares: 0,
        saves: 0,
      }),
      post({
        id: "tt",
        network: "tiktok",
        accountId: "tok",
        accountName: "Tok",
        links: ["https://leaderhealth.clinic/?ref=k7mq2n4p"],
        permalink: "https://www.tiktok.com/@a/video/1",
        impressions: 9,
        reach: 0,
        likes: 2,
        comments: 1,
        shares: 1,
        saves: 0,
      }),
    ],
    proofUrls: [],
    accounts: [
      { network: "facebook", accountId: "page", accountName: "Page" },
      { network: "tiktok", accountId: "tok", accountName: "Tok" },
    ],
    monthsByAccount: new Map([
      ["facebook:page", ["2026-03"]],
      ["tiktok:tok", ["2026-03"]],
    ]),
  });
  assert.equal(reports.length, 2);
  assert.equal(reports.find((item) => item.network === "facebook")?.impressions, 5);
  assert.equal(reports.find((item) => item.network === "tiktok")?.impressions, 9);
  assert.equal(reports.every((item) => item.spendCents === 0), true);
  const combined = reports.reduce((sum, item) => sum + item.impressions, 0);
  assert.notEqual(reports[0]?.impressions, combined);
});

test("a synced report has no commission and does not change the amount owed", () => {
  const report = marketingReportFields({
    code,
    month: "2026-03",
    network: "instagram",
    accountId: "ig1",
    accountName: "Ada",
    impressions: 10,
    reach: 8,
    likes: 3,
    comments: 1,
    shares: 2,
    saves: 4,
  });
  assert.ok(report);
  assert.equal(report.spendCents, 0);
  assert.equal("commissionCents" in report, false);
  assert.equal("engagement" in report, false);
  assert.equal(approvableCents({ orders: [], payouts: [], code: report.code, period: report.month }), 0);
});

test("a saved TikTok video id updates metrics without a matching permalink", () => {
  const video = post({
    id: "7123456789012345678",
    network: "tiktok",
    accountId: "tok",
    permalink: "https://www.tiktok.com/@a/video/7999999999999999999",
    impressions: 90,
  });
  const match = selectTikTokUpdate({
    videoId: "7123456789012345678",
    postUrl: "https://www.tiktok.com/@a/video/7123456789012345678",
    videos: [video],
  });
  assert.equal(match?.videoId, "7123456789012345678");
  assert.equal(match?.video.impressions, 90);
});

test("the first TikTok permalink match writes the video id", () => {
  const video = post({
    id: "7123456789012345678",
    network: "tiktok",
    accountId: "tok",
    permalink: "https://www.tiktok.com/@leader/video/7123456789012345678",
    impressions: 12,
  });
  const match = selectTikTokUpdate({
    videoId: null,
    postUrl: "https://www.tiktok.com/@leader/video/7123456789012345678/?is_from_webapp=1",
    videos: [video],
  });
  assert.equal(match?.videoId, video.id);
  assert.equal(match?.video.impressions, 12);
});

test("a saved Facebook post stays in the monthly totals after its permalink changes", () => {
  const saved = post({
    id: "111_222",
    network: "facebook",
    accountId: "111",
    accountName: "Page",
    permalink: "https://www.facebook.com/111/posts/222",
    impressions: 40,
    createdAt: "2026-03-15T00:00:00.000Z",
  });
  const refreshed = { ...saved, permalink: "https://www.facebook.com/111/posts/changed", impressions: 55 };
  const posts = rememberedFacebookPosts({
    saved: [saved],
    refreshed: [refreshed],
    feed: [],
    code,
    proofUrls: [saved.permalink],
  });
  assert.equal(posts[0]?.id, "111_222");
  assert.equal(posts[0]?.impressions, 55);
  const dropped = campaignReports({
    code,
    posts,
    proofUrls: [saved.permalink],
    accounts: [{ network: "facebook", accountId: "111", accountName: "Page" }],
    monthsByAccount: new Map([["facebook:111", ["2026-03"]]]),
  });
  assert.equal(dropped[0]?.impressions, 0);
  const kept = campaignReports({
    code,
    posts,
    proofUrls: [],
    accounts: [{ network: "facebook", accountId: "111", accountName: "Page" }],
    monthsByAccount: new Map([["facebook:111", ["2026-03"]]]),
    alreadyMatched: true,
  });
  assert.equal(kept[0]?.impressions, 55);
});

test("a pasted TikTok link matches the share URL from video.list", () => {
  const pasted = "https://www.tiktok.com/@leader/video/1234567890123456789/?is_from_webapp=1";
  const share = "https://tiktok.com/@leader/video/1234567890123456789";
  assert.equal(samePublishedPost(pasted, share), true);
  assert.equal(samePublishedPost(pasted, "https://www.tiktok.com/@leader/video/9999999999999999999"), false);
  assert.equal(samePublishedPost(null, share), false);
});
