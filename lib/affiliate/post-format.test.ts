import assert from "node:assert/strict";
import test from "node:test";
import { filesMatchFormat, formatUploadIssue, liveLinkFor, tiktokPostUrl } from "./post-format";

test("each content type accepts its own file and published link", () => {
  assert.equal(formatUploadIssue("instagram_post", { type: "image/jpeg", name: "cover.jpg", size: 200_000 }), "");
  assert.equal(formatUploadIssue("instagram_post", { type: "video/mp4", name: "clip.mp4", size: 20_000_000 }), "");
  assert.match(formatUploadIssue("instagram_post", { type: "video/mp4", name: "clip.mp4", size: 201 * 1024 * 1024 }), /200 MB/);
  assert.equal(formatUploadIssue("instagram_reel", { type: "video/mp4", name: "reel.mp4", size: 20_000_000 }), "");
  assert.match(formatUploadIssue("tiktok", { type: "image/png", name: "still.png", size: 200_000 }), /TikTok/);
  assert.equal(formatUploadIssue("tiktok", { type: "", name: "TikTok_7123.mp4", size: 180 * 1024 * 1024 }), "");
  assert.equal(filesMatchFormat("instagram_post", [{ contentType: "image/jpeg" }, { contentType: "video/mp4" }]), true);
  assert.equal(filesMatchFormat("instagram_post", [{ contentType: "video/mp4" }]), true);
  assert.equal(filesMatchFormat("instagram_reel", [{ contentType: "video/mp4" }]), true);
  assert.equal(filesMatchFormat("tiktok", [{ contentType: "video/mp4" }, { contentType: "video/mp4" }]), false);
  assert.equal(tiktokPostUrl("https://www.tiktok.com/@leader/video/7123456789012345678?is_from_webapp=1"), "https://www.tiktok.com/@leader/video/7123456789012345678/");
  assert.equal(tiktokPostUrl("https://vm.tiktok.com/ZSabcd12/"), "https://vm.tiktok.com/ZSabcd12/");
  assert.equal(tiktokPostUrl("https://www.instagram.com/reel/AbC123_de/"), null);
  assert.equal(liveLinkFor("instagram_post", "https://www.instagram.com/p/AbC123_de/"), "https://www.instagram.com/p/AbC123_de/");
  assert.equal(liveLinkFor("instagram_post", "https://www.instagram.com/reel/AbC123_de/"), null);
  assert.equal(liveLinkFor("instagram_reel", "https://instagram.com/reel/AbC123_de/"), "https://www.instagram.com/reel/AbC123_de/");
  assert.equal(liveLinkFor("tiktok", "https://www.tiktok.com/@leader/video/7123456789012345678"), "https://www.tiktok.com/@leader/video/7123456789012345678/");
});
