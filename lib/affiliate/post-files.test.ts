import assert from "node:assert/strict";
import test from "node:test";
import { postUploadIssue, postUploadKind } from "./post-files";

test("a reel or saved TikTok video is accepted from an mp4 or mov, including when the browser omits the type", () => {
  assert.equal(postUploadKind({ type: "", name: "summer-reel.mp4" })?.contentType, "video/mp4");
  assert.equal(postUploadKind({ type: "application/octet-stream", name: "clip.MOV" })?.contentType, "video/quicktime");
  assert.equal(postUploadKind({ type: "video/mp4", name: "reel.m4v" })?.video, true);
  assert.equal(postUploadKind({ type: "video/x-m4v", name: "tiktok-video" })?.contentType, "video/mp4");
  assert.equal(postUploadKind({ type: "application/mp4", name: "TikTok_7123.mp4" })?.contentType, "video/mp4");
  assert.equal(postUploadIssue({ type: "", name: "TikTok_7123.mp4", size: 180 * 1024 * 1024 }), "");
  assert.match(postUploadIssue({ type: "video/mp4", name: "TikTok_7123.mp4", size: 201 * 1024 * 1024 }), /200 MB/);
  assert.equal(postUploadKind({ type: "", name: "notes.txt" }), null);
});
