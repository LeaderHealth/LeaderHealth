import { getStorage } from "firebase-admin/storage";
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { disclosureAcknowledged } from "./disclosures";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { canonicalPostUrl, textHasTrackingCode } from "./social-match";
import { fetchInstagramMedia, readInstagramMedia, type InstagramMediaSnapshot } from "./social-fetch";
import { SocialError, loadConnectionSecrets } from "./social-store";

const IMAGE_BYTES = 8 * 1024 * 1024;
const VIDEO_BYTES = 10 * 1024 * 1024;
const CAPTION_LIMIT = 2200;
const SLIDE_LIMIT = 20;
const NOTE_LIMIT = 500;
export const DISCLOSURE_LINE = "Paid partnership with Leader Health";
export const METRICS_STALE_MS = 6 * 60 * 60 * 1000;

const FILE_TYPES = {
  "image/png": { ext: "png", video: false },
  "image/jpeg": { ext: "jpg", video: false },
  "image/webp": { ext: "webp", video: false },
  "video/mp4": { ext: "mp4", video: true },
  "video/webm": { ext: "webm", video: true },
  "video/quicktime": { ext: "mov", video: true },
} as const;

const CONTENT_STATUSES = ["draft", "submitted", "revision_requested", "rejected", "approved", "withdrawn"] as const;
export const POST_BATCH_LIMIT = 10;
const PUBLICATION_STATUSES = ["awaiting_publication", "verification_pending", "tracking_active", "verification_failed"] as const;
const METRIC_KEYS = ["likes", "comments", "shares", "saves", "reach", "views"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export type PostMetrics = Record<(typeof METRIC_KEYS)[number], number | null>;
export type ContentStep = "approve" | "request" | "reject" | "revise";
export type VerificationFailure = "not_connected" | "not_found" | "missing_disclosure" | "missing_link" | "unavailable";

export class PostReviewError extends Error {
  code: "invalid" | "file" | "storage" | "missing" | "unavailable" | "status" | "url" | "note" | "disclosure" | "link";

  constructor(code: PostReviewError["code"]) {
    super(code);
    this.name = "PostReviewError";
    this.code = code;
  }
}

export type StoredPostFile = { path: string; contentType: string; name: string };

export type PostFileSlot = { kind: "upload"; file: File } | { kind: "existing"; index: number };

export type BatchPostInput = {
  id: string;
  caption: unknown;
  file: File | null;
  slots: PostFileSlot[] | null;
  slideCaptions: string[] | null;
};

export type ContentSubmission = {
  id: string;
  code: string;
  caption: string;
  filePath: string;
  contentType: string;
  files: StoredPostFile[];
  slideCaptions: string[];
  batchId: string;
  version: number;
  submittedAt: string | null;
  contentStatus: ContentStatus;
  publicationStatus: PublicationStatus | null;
  reviewNote: string;
  postUrl: string | null;
  instagramMediaId: string | null;
  verificationNote: string;
  metricsCheckedAt: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
} & PostMetrics;

export function contentStatusLabel(status: ContentStatus) {
  if (status === "draft") return "Draft";
  if (status === "submitted") return "In review";
  if (status === "revision_requested") return "Needs changes";
  if (status === "rejected") return "Rejected";
  if (status === "withdrawn") return "Withdrawn";
  return "Approved";
}

export function publicationStatusLabel(status: PublicationStatus | null) {
  if (status === "awaiting_publication") return "Awaiting publication";
  if (status === "verification_pending") return "Verification pending";
  if (status === "tracking_active") return "Tracking active";
  if (status === "verification_failed") return "Verification failed";
  return "";
}

export function nextContentStatus(status: ContentStatus, step: ContentStep): ContentStatus | null {
  if (step === "approve" && status === "submitted") return "approved";
  if (step === "request" && status === "submitted") return "revision_requested";
  if (step === "reject" && status === "submitted") return "rejected";
  if (step === "revise" && (status === "revision_requested" || status === "submitted")) return "submitted";
  return null;
}

export type LinkCheck = { label: string; state: "pass" | "fail" | "unknown" };

const LINK_CHECK_LABELS = ["Post found on your account", "“Paid partnership with Leader Health” in caption", "Tracking link in caption"] as const;

export function instagramLinkChecks(status: PublicationStatus | null, verificationNote: string): LinkCheck[] {
  const [found, disclosure, link] = LINK_CHECK_LABELS;
  if (status === "tracking_active") return LINK_CHECK_LABELS.map((label) => ({ label, state: "pass" }));
  if (status !== "verification_failed") return [];
  if (verificationNote === verificationFailureNote("missing_link")) {
    return [
      { label: found, state: "pass" },
      { label: disclosure, state: "pass" },
      { label: link, state: "fail" },
    ];
  }
  if (verificationNote === verificationFailureNote("missing_disclosure")) {
    return [
      { label: found, state: "pass" },
      { label: disclosure, state: "fail" },
      { label: link, state: "unknown" },
    ];
  }
  if (verificationNote === verificationFailureNote("not_found")) {
    return [
      { label: found, state: "fail" },
      { label: disclosure, state: "unknown" },
      { label: link, state: "unknown" },
    ];
  }
  return [];
}

export function instagramCheckCopy(status: PublicationStatus | null, verificationNote: string) {
  if (status === "tracking_active") {
    return {
      headline: "Your post is live",
      detail: "Instagram engagement for this post shows in Stats. It does not change commission or payouts.",
    };
  }
  if (verificationNote === verificationFailureNote("missing_link")) {
    return {
      headline: "We couldn't find your tracking link in this post",
      detail: "Edit the caption on Instagram so it includes your tracking link, then check again. A link in your bio is not enough.",
    };
  }
  if (verificationNote === verificationFailureNote("missing_disclosure")) {
    return {
      headline: "The caption needs the sponsorship line",
      detail: "Add “Paid partnership with Leader Health” on Instagram, then check again.",
    };
  }
  if (verificationNote === verificationFailureNote("not_found")) {
    return {
      headline: "That post was not found on your Instagram account",
      detail: "Paste the link from the account you connected, then check again.",
    };
  }
  if (verificationNote === verificationFailureNote("not_connected")) {
    return {
      headline: "Instagram is not connected",
      detail: "Connect it from Stats, then check again. Or ask an admin to check the link.",
    };
  }
  return {
    headline: "We couldn't check this Instagram post",
    detail: verificationNote || "Check the link again in a moment.",
  };
}

export function publicationAfterApproval(status: ContentStatus): "awaiting_publication" | null {
  return status === "submitted" ? "awaiting_publication" : null;
}

export function canPasteLiveUrl(status: ContentStatus, publication: PublicationStatus | null) {
  return status === "approved" && (publication === "awaiting_publication" || publication === "verification_failed");
}

export function captionText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\u0000/g, "").trim();
  if (!text || text.length > CAPTION_LIMIT) return null;
  return text;
}

export function captionHasDisclosure(caption: string) {
  return caption.toLowerCase().includes(DISCLOSURE_LINE.toLowerCase());
}

const CLAIM_PATTERNS = [
  /\bfixed my [a-z][a-z'’\- ]{0,40}/i,
  /\bcured(?: my)? [a-z][a-z'’\- ]{0,40}/i,
  /\bhealed my [a-z][a-z'’\- ]{0,40}/i,
  /\breversed my [a-z][a-z'’\- ]{0,40}/i,
  /\bno side effects\b/i,
  /\bguaranteed (?:results|to)\b/i,
  /\bclinically proven\b/i,
];

export function treatmentClaims(caption: string) {
  const found: string[] = [];
  for (const pattern of CLAIM_PATTERNS) {
    const match = caption.match(pattern);
    if (!match) continue;
    const phrase = match[0].replace(/\s+/g, " ").trim();
    if (!found.some((item) => item.toLowerCase() === phrase.toLowerCase())) found.push(phrase);
  }
  return found.slice(0, 3);
}

export function captionIssue(caption: string, code: string) {
  if (!captionHasDisclosure(caption)) return "disclosure" as const;
  if (!textHasTrackingCode(caption, code)) return "link" as const;
  return null;
}

export function reviewNoteText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text || text.length > NOTE_LIMIT) return null;
  return text;
}

export function instagramPostUrl(value: unknown) {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "instagram.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0];
  const shortcode = parts[1];
  if ((kind !== "p" && kind !== "reel" && kind !== "tv") || !shortcode || !/^[A-Za-z0-9_-]{5,40}$/.test(shortcode)) return null;
  return `https://www.instagram.com/${kind}/${shortcode}/`;
}

export function instagramShortcode(value: string) {
  const canonical = canonicalPostUrl(value);
  if (!canonical) return null;
  const parts = canonical.split("/").filter(Boolean);
  const kind = parts[1];
  const shortcode = parts[2];
  if ((kind !== "p" && kind !== "reel" && kind !== "tv") || !shortcode || !/^[A-Za-z0-9_-]{5,40}$/.test(shortcode)) return null;
  return shortcode;
}

export function matchInstagramPost(url: string, code: string, posts: readonly InstagramMediaSnapshot[]) {
  const submitted = instagramPostUrl(url);
  const wanted = submitted ? canonicalPostUrl(submitted) : null;
  const shortcode = submitted ? instagramShortcode(submitted) : null;
  if (!wanted || !shortcode) return { ok: false as const, reason: "not_found" as const };
  const found = posts.find((post) => {
    const permalink = canonicalPostUrl(post.permalink);
    if (permalink && permalink === wanted) return true;
    return instagramShortcode(post.permalink) === shortcode;
  });
  if (!found || !/^[0-9]{5,32}$/.test(found.id)) return { ok: false as const, reason: "not_found" as const };
  if (!captionHasDisclosure(found.caption)) return { ok: false as const, reason: "missing_disclosure" as const };
  if (!textHasTrackingCode(found.caption, code)) return { ok: false as const, reason: "missing_link" as const };
  return { ok: true as const, mediaId: found.id, metrics: postMetricFields(found) };
}

export function verificationFailureNote(reason: VerificationFailure) {
  if (reason === "not_connected") return "Instagram is not connected. Connect it from Stats, or ask an admin to check the link.";
  if (reason === "not_found") return "That post was not found on the connected Instagram account.";
  if (reason === "missing_disclosure") return "The caption needs “Paid partnership with Leader Health.”";
  if (reason === "missing_link") return "The caption needs your tracking link. A link in your bio is not enough.";
  return "Instagram could not be reached. Ask an admin to check the link.";
}

export function postMetricFields(metrics: PostMetrics): PostMetrics {
  const fields = {} as PostMetrics;
  for (const key of METRIC_KEYS) {
    const value = metrics[key];
    fields[key] = typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
  }
  return fields;
}

export function metricText(value: number | null) {
  if (value == null) return "Not available from Instagram";
  return new Intl.NumberFormat("en-US").format(value);
}

export function metricLines(metrics: PostMetrics) {
  const labels: Record<(typeof METRIC_KEYS)[number], string> = {
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    saves: "Saves",
    reach: "Reach",
    views: "Views",
  };
  return METRIC_KEYS.map((key) => ({ label: labels[key], value: metricText(metrics[key]) }));
}

export function metricsAreStale(checkedAt: string | null, now = Date.now()) {
  if (!checkedAt) return true;
  const time = Date.parse(checkedAt);
  if (Number.isNaN(time)) return true;
  return now - time >= METRICS_STALE_MS;
}

export function contentFilePath(path: string) {
  return /^content-post\/[a-z0-9-]{3,24}\/[A-Za-z0-9]{10,40}(?:-s(?:[1-9]|1\d|20))?(?:-\d{10,16})?\.(png|jpg|webp|mp4|webm|mov)$/.test(path);
}

function safeFileName(name: string, path: string) {
  const cleaned = name.split(/[/\\]/).pop()?.replace(/[^\w.\- ()]+/g, "").trim().slice(0, 80) ?? "";
  if (cleaned) return cleaned;
  return path.split("/").pop() ?? "file";
}

function storedFilesFrom(data: DocumentData): StoredPostFile[] {
  if (Array.isArray(data.files)) {
    const files = data.files.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const path = "path" in item && typeof item.path === "string" ? item.path : "";
      const contentType = "contentType" in item && typeof item.contentType === "string" ? item.contentType : "";
      const name = "name" in item && typeof item.name === "string" ? item.name : "";
      return contentFilePath(path) ? [{ path, contentType, name: safeFileName(name, path) }] : [];
    }).slice(0, SLIDE_LIMIT);
    if (files.length) return files;
  }
  const filePath = typeof data.filePath === "string" ? data.filePath : "";
  if (!contentFilePath(filePath)) return [];
  return [{ path: filePath, contentType: typeof data.contentType === "string" ? data.contentType : "", name: safeFileName("", filePath) }];
}

function slideCaptionList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\u0000/g, "").trim().slice(0, CAPTION_LIMIT))
    .slice(0, SLIDE_LIMIT);
}

export function submissionFile(post: Pick<ContentSubmission, "files" | "filePath" | "contentType">, slide: number) {
  const files = post.files.length ? post.files : post.filePath ? [{ path: post.filePath, contentType: post.contentType }] : [];
  if (!Number.isInteger(slide) || slide < 1 || slide > files.length) return null;
  return files[slide - 1] ?? null;
}

function asDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = (value as Timestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function storageBucket() {
  return process.env.FIREBASE_STORAGE_BUCKET?.trim() ?? "";
}

function requireDb() {
  if (!affiliateFirebaseConfigured()) throw new PostReviewError("unavailable");
  return affiliateFirestore();
}

function metricValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function submissionFrom(id: string, data: DocumentData | undefined): ContentSubmission | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const caption = typeof data.caption === "string" ? data.caption : "";
  const files = storedFilesFrom(data);
  const filePath = files[0]?.path ?? "";
  const contentStatus = CONTENT_STATUSES.find((status) => status === data.contentStatus);
  if (!code || !contentStatus) return null;
  if (contentStatus !== "draft" && (!caption || !contentFilePath(filePath))) return null;
  const publicationStatus = PUBLICATION_STATUSES.find((status) => status === data.publicationStatus) ?? null;
  return {
    id,
    code,
    caption,
    filePath,
    contentType: files[0]?.contentType ?? "",
    files,
    slideCaptions: slideCaptionList(data.slideCaptions),
    batchId: typeof data.batchId === "string" && /^[0-9a-f-]{36}$/i.test(data.batchId) ? data.batchId : "",
    version: typeof data.version === "number" && data.version >= 1 && data.version <= 99 ? Math.floor(data.version) : 1,
    submittedAt: asDate(data.submittedAt)?.toISOString() ?? null,
    contentStatus,
    publicationStatus: contentStatus === "approved" ? publicationStatus : null,
    reviewNote: typeof data.reviewNote === "string" ? data.reviewNote : "",
    postUrl: typeof data.postUrl === "string" && data.postUrl ? data.postUrl : null,
    instagramMediaId: typeof data.instagramMediaId === "string" && /^[0-9]{5,32}$/.test(data.instagramMediaId) ? data.instagramMediaId : null,
    verificationNote: typeof data.verificationNote === "string" ? data.verificationNote : "",
    likes: metricValue(data.likes),
    comments: metricValue(data.comments),
    shares: metricValue(data.shares),
    saves: metricValue(data.saves),
    reach: metricValue(data.reach),
    views: metricValue(data.views),
    metricsCheckedAt: asDate(data.metricsCheckedAt)?.toISOString() ?? null,
    createdAt: asDate(data.createdAt)?.toISOString() ?? null,
    reviewedAt: asDate(data.reviewedAt)?.toISOString() ?? null,
  };
}

export async function loadContentSubmissions(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const db = affiliateFirestore();
  const query = normalized ? db.collection("contentSubmissions").where("code", "==", normalized) : db.collection("contentSubmissions");
  const snap = await query.get();
  return snap.docs
    .map((doc) => submissionFrom(doc.id, doc.data()))
    .filter((post): post is ContentSubmission => post != null)
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export async function loadContentSubmission(id: string) {
  if (!affiliateFirebaseConfigured() || !id || id.includes("/")) return null;
  const snap = await affiliateFirestore().collection("contentSubmissions").doc(id).get();
  return submissionFrom(snap.id, snap.data());
}

async function requireOwned(id: string, code: string) {
  const post = await loadContentSubmission(id);
  if (!post || post.code !== code) throw new PostReviewError("missing");
  return post;
}

async function savePostFile(code: string, id: string, file: File, slide = 1) {
  const bucketName = storageBucket();
  if (!bucketName) throw new PostReviewError("storage");
  const kind = FILE_TYPES[file.type as keyof typeof FILE_TYPES];
  if (!kind) throw new PostReviewError("file");
  const bytes = Buffer.from(await file.arrayBuffer());
  const limit = kind.video ? VIDEO_BYTES : IMAGE_BYTES;
  if (bytes.length === 0 || bytes.length > limit) throw new PostReviewError("file");
  affiliateFirestore();
  const bucket = getStorage().bucket(bucketName);
  const suffix = slide > 1 && slide <= SLIDE_LIMIT ? `-s${slide}` : "";
  let path = `content-post/${code}/${id}${suffix}.${kind.ext}`;
  const [primaryExists] = await bucket.file(path).exists();
  if (primaryExists) path = `content-post/${code}/${id}${suffix}-${Date.now()}.${kind.ext}`;
  const stored = bucket.file(path);
  const [exists] = await stored.exists();
  if (exists || !contentFilePath(path)) throw new PostReviewError("storage");
  await stored.save(bytes, { contentType: file.type, resumable: false, metadata: { contentType: file.type } });
  return { path, contentType: file.type, name: safeFileName(file.name, path) };
}

function fileRecord(files: StoredPostFile[]) {
  return {
    filePath: files[0]?.path ?? "",
    contentType: files[0]?.contentType ?? "",
    files,
  };
}

function knownFiles(post: ContentSubmission | null): StoredPostFile[] {
  if (!post) return [];
  if (post.files.length) return post.files;
  return post.filePath ? [{ path: post.filePath, contentType: post.contentType, name: safeFileName("", post.filePath) }] : [];
}

function filesAfterLegacyUpload(existing: ContentSubmission | null, stored: StoredPostFile) {
  const current = knownFiles(existing);
  if (current.length > 1) return current.map((file, index) => (index === 0 ? stored : file));
  return [stored];
}

async function saveSlots(code: string, id: string, slots: PostFileSlot[], existing: ContentSubmission | null) {
  if (slots.length > SLIDE_LIMIT) throw new PostReviewError("file");
  const current = knownFiles(existing);
  const saved: StoredPostFile[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    if (slot.kind === "upload") {
      saved.push(await savePostFile(code, id, slot.file, index + 1));
      continue;
    }
    const kept = current[slot.index];
    if (!kept || !contentFilePath(kept.path)) throw new PostReviewError("file");
    saved.push(kept);
  }
  return saved;
}

function blankMetrics() {
  return postMetricFields({ likes: null, comments: null, shares: null, saves: null, reach: null, views: null });
}

async function preparedCaption(code: string, value: unknown) {
  if (!(await disclosureAcknowledged(code))) throw new PostReviewError("invalid");
  const caption = captionText(value);
  if (!caption) throw new PostReviewError("invalid");
  const issue = captionIssue(caption, code);
  if (issue) throw new PostReviewError(issue);
  return caption;
}

export async function submitContentPost(input: { code: string; caption: unknown; file: File | null }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const caption = await preparedCaption(code, input.caption);
  const file = input.file && input.file.size > 0 ? input.file : null;
  if (!file) throw new PostReviewError("file");
  const db = requireDb();
  const ref = db.collection("contentSubmissions").doc();
  const stored = await savePostFile(code, ref.id, file);
  await ref.set({
    code,
    caption,
    filePath: stored.path,
    contentType: stored.contentType,
    files: [stored],
    slideCaptions: [caption],
    batchId: crypto.randomUUID(),
    version: 1,
    submittedAt: new Date(),
    contentStatus: "submitted",
    publicationStatus: null,
    reviewNote: null,
    postUrl: null,
    instagramMediaId: null,
    verificationNote: null,
    ...blankMetrics(),
    metricsCheckedAt: null,
    createdAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
  });
  return ref.id;
}

export async function reviseContentPost(input: { id: string; code: string; caption: unknown; file: File | null }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const caption = await preparedCaption(code, input.caption);
  const file = input.file && input.file.size > 0 ? input.file : null;
  const post = await requireOwned(input.id, code);
  if (!nextContentStatus(post.contentStatus, "revise")) throw new PostReviewError("status");
  const stored = file ? await savePostFile(code, post.id, file) : null;
  const files = stored ? filesAfterLegacyUpload(post, stored) : knownFiles(post);
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    caption,
    ...(stored ? fileRecord(files) : {}),
    ...(files.length <= 1 ? { slideCaptions: [caption] } : {}),
    version: Math.min(99, (post.version || 1) + 1),
    submittedAt: new Date(),
    contentStatus: "submitted",
    reviewNote: null,
  });
  return post;
}

function slideCaptionsFor(value: string[] | null, count: number, caption: string, previous: string[]) {
  const source = value ?? (previous.length === count ? previous : count === 1 ? [caption] : [caption, ...Array(count - 1).fill("")]);
  if (value && value.length !== count) throw new PostReviewError("invalid");
  const captions = source.slice(0, count).map((item) => item.replace(/\u0000/g, "").trim());
  while (captions.length < count) captions.push("");
  if (captions.some((text) => text.length > CAPTION_LIMIT)) throw new PostReviewError("invalid");
  return captions;
}

function draftCaption(value: unknown) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\u0000/g, "").trim();
  if (text.length > CAPTION_LIMIT) throw new PostReviewError("invalid");
  return text;
}

function newSubmissionFields(code: string, caption: string, files: StoredPostFile[], status: "draft" | "submitted") {
  return {
    code,
    caption,
    ...fileRecord(files),
    contentStatus: status,
    publicationStatus: null,
    reviewNote: null,
    postUrl: null,
    instagramMediaId: null,
    verificationNote: null,
    ...blankMetrics(),
    metricsCheckedAt: null,
    createdAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
  };
}

async function ownedBatchPost(id: string, code: string, allowed: ContentStatus[]) {
  if (!id) return null;
  const post = await requireOwned(id, code);
  if (!allowed.includes(post.contentStatus)) throw new PostReviewError("status");
  return post;
}

async function filesForBatchItem(code: string, id: string, item: BatchPostInput, existing: ContentSubmission | null) {
  if (item.slots) return saveSlots(code, id, item.slots, existing);
  if (item.file && item.file.size > 0) return filesAfterLegacyUpload(existing, await savePostFile(code, id, item.file));
  return null;
}

export async function saveContentDrafts(input: { code: string; posts: BatchPostInput[] }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code || input.posts.length < 1 || input.posts.length > POST_BATCH_LIMIT) throw new PostReviewError("invalid");
  if (!(await disclosureAcknowledged(code))) throw new PostReviewError("invalid");
  const db = requireDb();
  const ids: string[] = [];
  for (const item of input.posts) {
    const caption = draftCaption(item.caption);
    const existing = await ownedBatchPost(item.id, code, ["draft"]);
    if (item.slots && item.slots.some((slot) => slot.kind === "existing" && (slot.index < 0 || slot.index >= knownFiles(existing).length))) {
      throw new PostReviewError("file");
    }
    const ref = existing ? db.collection("contentSubmissions").doc(existing.id) : db.collection("contentSubmissions").doc();
    const files = await filesForBatchItem(code, ref.id, item, existing);
    if (existing) {
      await ref.update({
        caption,
        ...(files ? fileRecord(files) : {}),
        contentStatus: "draft",
      });
    } else {
      await ref.set(newSubmissionFields(code, caption, files ?? [], "draft"));
    }
    ids.push(ref.id);
  }
  return ids;
}

export async function submitContentBatch(input: { code: string; posts: BatchPostInput[] }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code || input.posts.length < 1 || input.posts.length > POST_BATCH_LIMIT) throw new PostReviewError("invalid");
  const db = requireDb();
  const ready: { caption: string; existing: ContentSubmission | null; item: BatchPostInput }[] = [];
  for (const item of input.posts) {
    const caption = await preparedCaption(code, item.caption);
    const existing = await ownedBatchPost(item.id, code, ["draft", "submitted", "revision_requested"]);
    const available = knownFiles(existing).length;
    if (item.slideCaptions && item.slots && item.slideCaptions.length !== item.slots.length) throw new PostReviewError("invalid");
    if (item.slots) {
      if (item.slots.length < 1 || item.slots.length > SLIDE_LIMIT) throw new PostReviewError("file");
      if (item.slots.some((slot) => slot.kind === "existing" && (slot.index < 0 || slot.index >= available))) throw new PostReviewError("file");
    } else if (!(item.file && item.file.size > 0) && available < 1) {
      throw new PostReviewError("file");
    }
    ready.push({ caption, existing, item });
  }
  const freshBatch = crypto.randomUUID();
  const ids: string[] = [];
  for (const entry of ready) {
    const ref = entry.existing ? db.collection("contentSubmissions").doc(entry.existing.id) : db.collection("contentSubmissions").doc();
    const uploaded = await filesForBatchItem(code, ref.id, entry.item, entry.existing);
    const files = uploaded ?? knownFiles(entry.existing);
    if (!files.length) throw new PostReviewError("file");
    const slideCaptions = slideCaptionsFor(entry.item.slideCaptions, files.length, entry.caption, entry.existing?.slideCaptions ?? []);
    const reviewMeta = {
      slideCaptions,
      batchId: entry.existing?.batchId || freshBatch,
      version: entry.existing && entry.existing.contentStatus !== "draft" ? Math.min(99, (entry.existing.version || 1) + 1) : 1,
      submittedAt: new Date(),
    };
    if (entry.existing) {
      await ref.update({
        caption: entry.caption,
        ...fileRecord(files),
        ...reviewMeta,
        contentStatus: "submitted",
        publicationStatus: null,
        reviewNote: null,
        reviewedAt: null,
      });
    } else {
      await ref.set({ ...newSubmissionFields(code, entry.caption, files, "submitted"), ...reviewMeta });
    }
    ids.push(ref.id);
  }
  return ids;
}

export async function withdrawContentPost(input: { id: string; code: string }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (post.contentStatus !== "submitted") throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    contentStatus: "withdrawn",
    reviewedAt: new Date(),
  });
  return post;
}

async function review(id: string, step: "approve" | "request" | "reject", note: unknown) {
  const post = await loadContentSubmission(id);
  if (!post) throw new PostReviewError("missing");
  const status = nextContentStatus(post.contentStatus, step);
  if (!status) throw new PostReviewError("status");
  const reviewNote = step === "approve" ? null : reviewNoteText(note);
  if (step !== "approve" && !reviewNote) throw new PostReviewError("note");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    contentStatus: status,
    publicationStatus: step === "approve" ? publicationAfterApproval(post.contentStatus) : null,
    reviewNote,
    reviewedAt: new Date(),
  });
  return post;
}

export function approveContentPost(id: string) {
  return review(id, "approve", null);
}

export function requestContentChange(id: string, note: unknown) {
  return review(id, "request", note);
}

export function rejectContentPost(id: string, note: unknown) {
  return review(id, "reject", note);
}

async function instagramPages(code: string) {
  try {
    const secrets = await loadConnectionSecrets(code);
    return secrets.flatMap((secret) => (secret.network === "facebook" ? secret.pages.filter((page) => page.instagramAccountId) : []));
  } catch (error) {
    if (error instanceof SocialError) throw new PostReviewError("unavailable");
    throw error;
  }
}

async function finishVerification(id: string, code: string, url: string) {
  const ref = requireDb().collection("contentSubmissions").doc(id);
  try {
    const pages = await instagramPages(code);
    if (pages.length === 0) {
      await ref.update({ publicationStatus: "verification_failed", verificationNote: verificationFailureNote("not_connected"), instagramMediaId: null });
      return "verification_failed" as const;
    }
    const posts = (await Promise.all(pages.map((page) => fetchInstagramMedia(page)))).flat();
    const match = matchInstagramPost(url, code, posts);
    if (!match.ok) {
      await ref.update({ publicationStatus: "verification_failed", verificationNote: verificationFailureNote(match.reason), instagramMediaId: null });
      return "verification_failed" as const;
    }
    await ref.update({
      publicationStatus: "tracking_active",
      verificationNote: null,
      instagramMediaId: match.mediaId,
      ...match.metrics,
      metricsCheckedAt: new Date(),
    });
    return "tracking_active" as const;
  } catch (error) {
    await ref.update({ publicationStatus: "verification_failed", verificationNote: verificationFailureNote("unavailable"), instagramMediaId: null });
    if (!(error instanceof SocialError) && !(error instanceof PostReviewError)) {
      console.error("[affiliate] instagram post check failed", error instanceof Error ? error.message : "unknown");
    }
    return "verification_failed" as const;
  }
}

export async function submitLiveInstagramUrl(input: { id: string; code: string; url: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  const url = instagramPostUrl(input.url);
  if (!code) throw new PostReviewError("invalid");
  if (!url) throw new PostReviewError("url");
  const post = await requireOwned(input.id, code);
  if (!canPasteLiveUrl(post.contentStatus, post.publicationStatus)) throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    postUrl: url,
    publicationStatus: "verification_pending",
    verificationNote: null,
    publishedAt: new Date(),
  });
  const publicationStatus = await finishVerification(post.id, code, url);
  return { ...post, publicationStatus };
}

export async function markContentChecked(id: string) {
  const post = await loadContentSubmission(id);
  if (!post) throw new PostReviewError("missing");
  if (post.publicationStatus !== "verification_failed") throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    publicationStatus: "tracking_active",
    verificationNote: "An admin checked this link.",
    instagramMediaId: null,
    ...blankMetrics(),
    metricsCheckedAt: null,
  });
  return post;
}

async function writeFreshMetrics(post: ContentSubmission) {
  const pages = await instagramPages(post.code);
  if (pages.length === 0) return false;
  if (post.instagramMediaId) {
    for (const page of pages) {
      const media = await readInstagramMedia(page, post.instagramMediaId);
      if (!media) continue;
      await requireDb().collection("contentSubmissions").doc(post.id).update({
        ...postMetricFields(media),
        metricsCheckedAt: new Date(),
      });
      return true;
    }
    await requireDb().collection("contentSubmissions").doc(post.id).update({ metricsCheckedAt: new Date() });
    return false;
  }
  if (!post.postUrl) return false;
  const posts = (await Promise.all(pages.map((page) => fetchInstagramMedia(page)))).flat();
  const match = matchInstagramPost(post.postUrl, post.code, posts);
  if (!match.ok) {
    await requireDb().collection("contentSubmissions").doc(post.id).update({ metricsCheckedAt: new Date() });
    return false;
  }
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    instagramMediaId: match.mediaId,
    ...match.metrics,
    metricsCheckedAt: new Date(),
  });
  return true;
}

export async function refreshDueMetrics(code?: string, limit = 8) {
  const posts = code ? await loadContentSubmissions(code) : await loadContentSubmissions();
  const due = posts
    .filter((post) => post.publicationStatus === "tracking_active" && (Boolean(post.instagramMediaId) || Boolean(post.postUrl)) && metricsAreStale(post.metricsCheckedAt))
    .slice(0, limit);
  let updated = 0;
  for (const post of due) {
    try {
      if (await writeFreshMetrics(post)) updated += 1;
    } catch (error) {
      console.error("[affiliate] post metrics refresh failed", error instanceof Error ? error.message : "unknown");
    }
  }
  return updated;
}

const READABLE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm", "video/quicktime"]);

export async function readContentFile(path: string) {
  const bucketName = storageBucket();
  if (!bucketName || !contentFilePath(path)) throw new PostReviewError("missing");
  affiliateFirestore();
  const file = getStorage().bucket(bucketName).file(path);
  const [exists] = await file.exists();
  if (!exists) throw new PostReviewError("missing");
  const [bytes] = await file.download();
  const [metadata] = await file.getMetadata();
  const stored = typeof metadata.contentType === "string" ? metadata.contentType : "";
  return { bytes, contentType: READABLE_TYPES.has(stored) ? stored : "application/octet-stream" };
}
