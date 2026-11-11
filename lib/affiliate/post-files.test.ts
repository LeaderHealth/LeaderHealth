import assert from "node:assert/strict";
import test from "node:test";
import { postUploadIssue, postUploadKind } from "./post-files.ts";

test("a reel is accepted from an mp4 or mov, including when the browser omits the type", () => {
  assert.equal(postUploadKind({ type: "", name: "summer-reel.mp4" })?.contentType, "video/mp4");
  assert.equal(postUploadKind({ type: "application/octet-stream", name: "clip.MOV" })?.contentType, "video/quicktime");
  assert.equal(postUploadKind({ type: "video/mp4", name: "reel.m4v" })?.video, true);
  assert.equal(postUploadIssue({ type: "", name: "reel.mp4", size: 40 * 1024 * 1024 }), "");
  assert.match(postUploadIssue({ type: "video/mp4", name: "reel.mp4", size: 101 * 1024 * 1024 }), /100 MB/);
  assert.equal(postUploadKind({ type: "", name: "notes.txt" }), null);
});
