import fs from "node:fs";
import { affiliateFirestore } from "./lib/affiliate/firebase.ts";

const text = fs.readFileSync(".env.local", "utf8");
for (const line of text.split(/\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  if (process.env[key] == null) process.env[key] = value;
}

const code = "88h4dcji";
const db = affiliateFirestore();
const ref = db.collection("contentSubmissions").doc();
await ref.set({
  code,
  caption: "Paid partnership with Leader Health\nhttp://localhost:3000/?ref=88h4dcji&utm_source=88h4dcji&utm_medium=affiliate",
  filePath: `content-post/${code}/${ref.id}.png`,
  contentType: "image/png",
  contentStatus: "approved",
  publicationStatus: "awaiting_publication",
  reviewNote: null,
  postUrl: null,
  instagramMediaId: null,
  verificationNote: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  reach: null,
  views: null,
  metricsCheckedAt: null,
  createdAt: new Date(),
  reviewedAt: new Date(),
  publishedAt: null,
});
console.log(ref.id);
