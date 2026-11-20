import { getStorage } from "firebase-admin/storage";
import { FieldValue, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { disclosureAcknowledged } from "./disclosures";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { filesMatchFormat, formatUploadIssue, instagramPostUrl, liveLinkFor, postFormat, type PostFormat } from "./post-format";
import { IMAGE_BYTES, VIDEO_BYTES, postUploadKind } from "./post-files";
import { deliverableFeeCents } from "./deliverable-payments";
import { formatForOfferKind, lockedPayTerms, offerSlideBounds, type LockedPayTerms } from "./offer-post";
import { loadMarketingOffer } from "./marketing-offers";
import { canonicalPostUrl, selectTikTokUpdate, textHasTrackingCode, tiktokVideoId } from "./social-match";
import { fetchInstagramMedia, fetchTikTokPosts, queryTikTokVideos, readInstagramMedia, type InstagramMediaSnapshot } from "./social-fetch";
import { currentTikTokConnection } from "./social-sync";
import { SocialError, loadConnectionSecrets, loadSocialAccounts, markSocialReconnect, type TikTokConnectionSecret } from "./social-store";
import { formatWhen, publishDateValue } from "./format";
import { affiliateCanAttachCampaign } from "./campaign-record";
import { loadMarketingCampaignRecords } from "./roi-store";
import { DEFAULT_TRACKING_DAYS, MANUAL_REPORT_MS, REPORT_WINDOW_MS, manualReportDue, networkConnectedForPost, trackingDaysOf, type MetricsOrigin } from "./manual-checkpoint";
import { rateFor, standingViewRateCents } from "./payment-rates";
import { loadPaymentRates } from "./payment-store";
import { loadAffiliateAgreement, utcAgreementToday } from "./agreements";
import { agreementMatchesPost, postingAgreement, postsFillingMonth, type PostingAgreement } from "./post-agreement";
export { MANUAL_REPORT_MS, REPORT_WINDOW_MS, manualReportDue, networkConnectedForPost };
export type { MetricsOrigin };

const CAPTION_LIMIT = 2200;
const SLIDE_LIMIT = 20;
const NOTE_LIMIT = 500;
export const DISCLOSURE_LINE = "Paid partnership with Leader Health";
export const METRICS_STALE_MS = 6 * 60 * 60 * 1000;

const CONTENT_STATUSES = ["draft", "submitted", "revision_requested", "rejected", "approved", "withdrawn"] as const;
export const POST_BATCH_LIMIT = 10;
const PUBLICATION_STATUSES = ["awaiting_publication", "verification_pending", "tracking_active", "verification_failed"] as const;
const METRIC_KEYS = ["likes", "comments", "shares", "saves", "reach", "views"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export type PostMetrics = Record<(typeof METRIC_KEYS)[number], number | null>;

export type MetricChangeRequest = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  note: string;
  requestedAt: string | null;
};
export type ContentStep = "approve" | "request" | "reject" | "revise";
export type VerificationFailure = "not_connected" | "not_found" | "missing_disclosure" | "missing_link" | "unavailable";

export class PostReviewError extends Error {
  code: "invalid" | "file" | "storage" | "missing" | "unavailable" | "status" | "url" | "note" | "disclosure" | "link" | "fee" | "campaign" | "offer" | "terms" | "date" | "agreement" | "month";

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
  format: PostFormat | null;
  campaign: string | null;
  offerId: string;
  proposedPublishOn: string | null;
};

export type ContentRevision = {
  version: number;
  reviewNote: string;
  reviewedAt: string | null;
};

export type ContentSubmission = {
  id: string;
  code: string;
  caption: string;
  filePath: string;
  contentType: string;
  files: StoredPostFile[];
  slideCaptions: string[];
  format: PostFormat | null;
  batchId: string;
  campaign: string;
  proposedPublishOn: string;
  reviewedBy: string;
  revisions: ContentRevision[];
  version: number;
  submittedAt: string | null;
  contentStatus: ContentStatus;
  publicationStatus: PublicationStatus | null;
  reviewNote: string;
  postUrl: string | null;
  instagramMediaId: string | null;
  tiktokVideoId: string | null;
  verificationNote: string;
  metricsCheckedAt: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  metricsSource: MetricsOrigin | null;
  metricsRecordedAt: string | null;
  manualReportEmailedAt: string | null;
  metricChange: MetricChangeRequest | null;
  agreedFeeCents: number | null;
  viewRateCents: number | null;
  engagementRateCents: number | null;
  maxPayCents: number | null;
  trackingDays: number | null;
  offerId: string;
  agreementId: string;
  agreementLabel: string;
  postingMonth: string;
  offerKind: string;
  offerBrief: string;
  publishBy: string;
  deliverableHoldStartedAt: string | null;
  deliverableRecheckedAt: string | null;
  deliverableForfeitedAt: string | null;
  deliverableForfeitNote: string;
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

export { instagramPostUrl } from "./post-format";

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

export function metricLines(metrics: PostMetrics, empty = "Not available from Instagram") {
  const labels: Record<(typeof METRIC_KEYS)[number], string> = {
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    saves: "Saves",
    reach: "Reach",
    views: "Views",
  };
  return METRIC_KEYS.map((key) => ({ label: labels[key], value: metrics[key] == null ? empty : metricText(metrics[key]) }));
}

export function metricsOriginLabel(source: MetricsOrigin | null, recordedAt: string | null) {
  if (source === "automatic") return `Imported ${formatWhen(recordedAt)}`;
  if (source === "manual") return `Entered by you ${formatWhen(recordedAt)}`;
  return "";
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

function metricChangeFrom(value: unknown): MetricChangeRequest | null {
  if (!value || typeof value !== "object") return null;
  const change = value as Record<string, unknown>;
  const views = metricValue(change.views);
  const likes = metricValue(change.likes);
  const comments = metricValue(change.comments);
  const shares = metricValue(change.shares);
  const saves = metricValue(change.saves);
  if (views == null && likes == null && comments == null && shares == null && saves == null) return null;
  const note = typeof change.note === "string" ? change.note.trim().slice(0, NOTE_LIMIT) : "";
  return { views, likes, comments, shares, saves, note, requestedAt: asDate(change.requestedAt)?.toISOString() ?? null };
}

function revisionsFrom(value: unknown): ContentRevision[] {
  if (!Array.isArray(value)) return [];
  const items: ContentRevision[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const version = typeof row.version === "number" && row.version >= 1 && row.version <= 99 ? Math.floor(row.version) : 0;
    if (!version) continue;
    items.push({
      version,
      reviewNote: typeof row.reviewNote === "string" ? row.reviewNote.slice(0, NOTE_LIMIT) : "",
      reviewedAt: asDate(row.reviewedAt)?.toISOString() ?? null,
    });
    if (items.length >= 20) break;
  }
  return items;
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
    format: postFormat(data.format),
    batchId: typeof data.batchId === "string" && /^[0-9a-f-]{36}$/i.test(data.batchId) ? data.batchId : "",
    campaign: storedCampaign(data.campaign),
    proposedPublishOn: publishDateValue(data.proposedPublishOn) ?? "",
    reviewedBy: typeof data.reviewedBy === "string" ? data.reviewedBy.trim().slice(0, 120) : "",
    revisions: revisionsFrom(data.revisions),
    version: typeof data.version === "number" && data.version >= 1 && data.version <= 99 ? Math.floor(data.version) : 1,
    submittedAt: asDate(data.submittedAt)?.toISOString() ?? null,
    contentStatus,
    publicationStatus: contentStatus === "approved" ? publicationStatus : null,
    reviewNote: typeof data.reviewNote === "string" ? data.reviewNote : "",
    postUrl: typeof data.postUrl === "string" && data.postUrl ? data.postUrl : null,
    instagramMediaId: typeof data.instagramMediaId === "string" && /^[0-9]{5,32}$/.test(data.instagramMediaId) ? data.instagramMediaId : null,
    tiktokVideoId: typeof data.tiktokVideoId === "string" ? tiktokVideoId(data.tiktokVideoId) : null,
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
    publishedAt: asDate(data.publishedAt)?.toISOString() ?? null,
    metricsSource: data.metricsSource === "automatic" || data.metricsSource === "manual" ? data.metricsSource : null,
    metricsRecordedAt: asDate(data.metricsRecordedAt)?.toISOString() ?? null,
    manualReportEmailedAt: asDate(data.manualReportEmailedAt)?.toISOString() ?? null,
    metricChange: metricChangeFrom(data.metricChange),
    agreedFeeCents: deliverableFeeCents(data.agreedFeeCents),
    viewRateCents: deliverableFeeCents(data.viewRateCents),
    engagementRateCents: deliverableFeeCents(data.engagementRateCents),
    maxPayCents: deliverableFeeCents(data.maxPayCents),
    trackingDays: trackingDaysOf(data.trackingDays),
    offerId: typeof data.offerId === "string" && !data.offerId.includes("/") ? data.offerId : "",
    agreementId: typeof data.agreementId === "string" && !data.agreementId.includes("/") ? data.agreementId.slice(0, 128) : "",
    agreementLabel: typeof data.agreementLabel === "string" ? data.agreementLabel.trim().slice(0, 200) : "",
    postingMonth: typeof data.postingMonth === "string" && /^\d{4}-\d{2}$/.test(data.postingMonth) ? data.postingMonth : "",
    offerKind: typeof data.offerKind === "string" ? data.offerKind : "",
    offerBrief: typeof data.offerBrief === "string" ? data.offerBrief.slice(0, 800) : "",
    publishBy: typeof data.publishBy === "string" ? data.publishBy : "",
    deliverableHoldStartedAt: asDate(data.deliverableHoldStartedAt)?.toISOString() ?? null,
    deliverableRecheckedAt: asDate(data.deliverableRecheckedAt)?.toISOString() ?? null,
    deliverableForfeitedAt: asDate(data.deliverableForfeitedAt)?.toISOString() ?? null,
    deliverableForfeitNote: typeof data.deliverableForfeitNote === "string" ? data.deliverableForfeitNote : "",
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
  const kind = postUploadKind(file);
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
  await stored.save(bytes, { contentType: kind.contentType, resumable: false, metadata: { contentType: kind.contentType } });
  return { path, contentType: kind.contentType, name: safeFileName(file.name, path) };
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
  const standing = await requireStandingTerms(code);
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
    tiktokVideoId: null,
    verificationNote: null,
    ...blankMetrics(),
    metricsCheckedAt: null,
    createdAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
    ...standing,
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
  const standing = post.viewRateCents == null && post.agreedFeeCents == null ? await requireStandingTerms(code) : null;
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    caption,
    ...(stored ? fileRecord(files) : {}),
    ...(files.length <= 1 ? { slideCaptions: [caption] } : {}),
    ...(standing ?? {}),
    version: Math.min(99, (post.version || 1) + 1),
    submittedAt: new Date(),
    contentStatus: "submitted",
    reviewNote: null,
    ...revisionFields(post),
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

const CAMPAIGN_NAME = /^[A-Za-z0-9][A-Za-z0-9 '&.,-]{0,59}$/;

export function campaignName(value: unknown) {
  if (typeof value !== "string") throw new PostReviewError("campaign");
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return "";
  if (!CAMPAIGN_NAME.test(name)) throw new PostReviewError("campaign");
  return name;
}

export function assignedCampaignName(value: unknown, assigned: readonly string[]) {
  const name = campaignName(value);
  if (!name) return "";
  const match = assigned.find((item) => item.toLowerCase() === name.toLowerCase());
  if (!match) throw new PostReviewError("campaign");
  return match;
}

export function campaignChangeAllowed(status: ContentStatus) {
  return status === "draft" || status === "submitted" || status === "revision_requested";
}

export function proposedPublishDate(value: unknown) {
  if (value == null || value === "") return "";
  const date = publishDateValue(value);
  if (!date) throw new PostReviewError("date");
  return date;
}

export function revisionOnResubmit(existing: { contentStatus: ContentStatus; version: number; reviewNote: string; reviewedAt: string | null } | null) {
  if (!existing || existing.contentStatus === "draft") return null;
  return { version: existing.version, reviewNote: existing.reviewNote, reviewedAt: existing.reviewedAt };
}

export function appendContentRevision(existing: readonly ContentRevision[], entry: ContentRevision) {
  const next = [
    ...existing,
    {
      version: entry.version,
      reviewNote: entry.reviewNote.trim().slice(0, NOTE_LIMIT),
      reviewedAt: entry.reviewedAt,
    },
  ];
  return next.slice(-20);
}

function campaignFields(campaign: string | null, allowed: readonly string[], mode: "set" | "update") {
  if (campaign == null) return {};
  const name = assignedCampaignName(campaign, allowed);
  if (name) return { campaign: name };
  if (mode === "set") return {};
  return { campaign: FieldValue.delete() };
}

function proposedDateFields(value: string | null) {
  if (value == null) return {};
  const date = proposedPublishDate(value);
  if (!date) return { proposedPublishOn: FieldValue.delete() };
  return { proposedPublishOn: date };
}

function revisionFields(existing: ContentSubmission | null) {
  const entry = revisionOnResubmit(existing);
  if (!existing || !entry) return {};
  return { revisions: appendContentRevision(existing.revisions, entry), reviewedBy: FieldValue.delete() };
}

async function campaignNamesFor(code: string) {
  try {
    const records = await loadMarketingCampaignRecords();
    const posts = await loadContentSubmissions(code);
    return records
      .filter((record) => affiliateCanAttachCampaign(record, code, posts.some((post) => post.contentStatus !== "withdrawn" && post.campaign.trim().toLowerCase() === record.name.toLowerCase())))
      .map((record) => record.name);
  } catch (error) {
    if (error instanceof PostReviewError) throw error;
    throw new PostReviewError("unavailable");
  }
}

function reviewerName(value: unknown) {
  if (typeof value !== "string") return "admin";
  const name = value.trim().slice(0, 120);
  return name || "admin";
}

function storedCampaign(value: unknown) {
  if (typeof value !== "string") return "";
  const name = value.trim().replace(/\s+/g, " ");
  return CAMPAIGN_NAME.test(name) ? name : "";
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
    tiktokVideoId: null,
    verificationNote: null,
    ...blankMetrics(),
    metricsCheckedAt: null,
    createdAt: new Date(),
    reviewedAt: null,
    publishedAt: null,
  };
}

function payFieldsFor(existing: ContentSubmission | null, incoming: LockedPayTerms | null, standing: LockedPayTerms | null) {
  if (existing?.viewRateCents != null) return lockedPayTerms(existing, incoming ?? standingTerms(existing.viewRateCents, existing.maxPayCents, existing.trackingDays, existing.engagementRateCents));
  if (incoming) return incoming;
  if (existing?.agreedFeeCents != null) return { agreedFeeCents: existing.agreedFeeCents };
  return standing;
}

function standingTerms(viewRateCents: number, maxPayCents: number | null, trackingDays: number | null, engagementRateCents: number | null = 0): LockedPayTerms {
  return { viewRateCents, maxPayCents, trackingDays: trackingDays ?? DEFAULT_TRACKING_DAYS, engagementRateCents: engagementRateCents ?? 0 };
}

async function currentPaymentRates() {
  try {
    return await loadPaymentRates();
  } catch {
    return null;
  }
}

async function requirePostingAgreement(code: string, id: string): Promise<PostingAgreement> {
  const trimmed = id.trim();
  if (!trimmed || trimmed.includes("/") || trimmed.length > 128) throw new PostReviewError("agreement");
  const agreement = await loadAffiliateAgreement(trimmed);
  const today = utcAgreementToday();
  if (!agreement || !agreementMatchesPost(agreement, code, trimmed, today)) throw new PostReviewError("agreement");
  const choice = postingAgreement([agreement], today);
  if (!choice) throw new PostReviewError("agreement");
  return choice;
}

async function requireStandingTerms(code: string): Promise<LockedPayTerms> {
  const snap = await requireDb().collection("affiliates").doc(code).get();
  const data = snap.data();
  const rates = await currentPaymentRates();
  const viewRateCents = standingViewRateCents(rates);
  if (viewRateCents == null) throw new PostReviewError("fee");
  return standingTerms(
    viewRateCents,
    deliverableFeeCents(data?.deliverableMaxPayCents),
    trackingDaysOf(data?.deliverableTrackingDays),
    rates ? rateFor(rates, "engagements") : 0,
  );
}

async function ownedBatchPost(id: string, code: string, allowed: ContentStatus[]) {
  if (!id) return null;
  const post = await requireOwned(id, code);
  if (!allowed.includes(post.contentStatus)) throw new PostReviewError("status");
  return post;
}

function assertFormatUploads(format: PostFormat, item: BatchPostInput) {
  if (item.slots) {
    if (format !== "instagram_post" && item.slots.length !== 1) throw new PostReviewError("file");
    if (format === "instagram_post" && (item.slots.length < 1 || item.slots.length > SLIDE_LIMIT)) throw new PostReviewError("file");
  }
  const uploads = item.slots
    ? item.slots.flatMap((slot) => (slot.kind === "upload" ? [slot.file] : []))
    : item.file && item.file.size > 0
      ? [item.file]
      : [];
  if (uploads.some((file) => formatUploadIssue(format, file))) throw new PostReviewError("file");
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
  const allowed = await campaignNamesFor(code);
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
        ...campaignFields(item.campaign, allowed, "update"),
        ...proposedDateFields(item.proposedPublishOn),
      });
    } else {
      await ref.set({
        ...newSubmissionFields(code, caption, files ?? [], "draft"),
        ...campaignFields(item.campaign, allowed, "set"),
        ...proposedDateFields(item.proposedPublishOn),
      });
    }
    ids.push(ref.id);
  }
  return ids;
}

export async function submitContentBatch(input: { code: string; posts: BatchPostInput[]; termsAccepted: boolean; agreementId: string; postingMonth?: string }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code || input.posts.length < 1 || input.posts.length > POST_BATCH_LIMIT) throw new PostReviewError("invalid");
  const db = requireDb();
  const ready: { caption: string; existing: ContentSubmission | null; item: BatchPostInput }[] = [];
  for (const item of input.posts) {
    const caption = await preparedCaption(code, item.caption);
    const existing = await ownedBatchPost(item.id, code, ["draft", "submitted", "revision_requested"]);
    const offerId = existing?.offerId || item.offerId.trim();
    if (existing?.offerId && item.offerId.trim() && item.offerId.trim() !== existing.offerId) throw new PostReviewError("offer");
    if (existing && !existing.offerId && item.offerId.trim()) throw new PostReviewError("offer");
    const linked = offerId ? await loadMarketingOffer(offerId) : null;
    if (offerId && (!linked || linked.code !== code || linked.status !== "accepted")) throw new PostReviewError("offer");
    const format = (linked ? formatForOfferKind(linked.kind) : null) ?? item.format ?? existing?.format ?? null;
    if (!existing && !format) throw new PostReviewError("invalid");
    if (linked && item.format && item.format !== format) throw new PostReviewError("invalid");
    if (format) assertFormatUploads(format, item);
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
  const needsStandingFee = ready.some((entry) => {
    const bound = entry.existing?.offerId || entry.item.offerId.trim();
    return !bound && entry.existing?.viewRateCents == null && entry.existing?.agreedFeeCents == null;
  });
  if (needsStandingFee && !input.termsAccepted) throw new PostReviewError("terms");
  const offerIds = new Set(ready.map((entry) => entry.existing?.offerId || entry.item.offerId.trim()).filter(Boolean));
  if (offerIds.size > 1 || (offerIds.size === 1 && ready.length > 1)) throw new PostReviewError("offer");
  const standing = needsStandingFee ? await requireStandingTerms(code) : null;
  const postedUnder = await requirePostingAgreement(code, input.agreementId);
  const offerBatch = offerIds.size === 1;
  let postingPeriod = "";
  if (!offerBatch) {
    const period = (input.postingMonth ?? "").trim();
    const slot = postedUnder.months.find((month) => month.period === period);
    if (!slot) throw new PostReviewError("month");
    for (const entry of ready) {
      if (!entry.item.proposedPublishOn) continue;
      const date = proposedPublishDate(entry.item.proposedPublishOn);
      if (date && date.slice(0, 7) !== slot.period) throw new PostReviewError("date");
    }
    if (slot.limit != null) {
      const exclude = new Set(ready.flatMap((entry) => (entry.existing ? [entry.existing.id] : [])));
      const used = postsFillingMonth(await loadContentSubmissions(code), postedUnder.id, slot.period, exclude);
      if (used + ready.length > slot.limit) throw new PostReviewError("month");
    }
    postingPeriod = slot.period;
  }
  const engagementRateCents = standing?.engagementRateCents ?? (await currentPaymentRates().then((rates) => (rates ? rateFor(rates, "engagements") : 0)));
  const allowed = await campaignNamesFor(code);
  const freshBatch = crypto.randomUUID();
  const ids: string[] = [];
  for (const entry of ready) {
    const ref = entry.existing ? db.collection("contentSubmissions").doc(entry.existing.id) : db.collection("contentSubmissions").doc();
    const uploaded = await filesForBatchItem(code, ref.id, entry.item, entry.existing);
    const files = uploaded ?? knownFiles(entry.existing);
    if (!files.length) throw new PostReviewError("file");
    const boundOffer = entry.existing?.offerId || entry.item.offerId.trim();
    const offer = boundOffer ? await loadMarketingOffer(boundOffer) : null;
    if (boundOffer && (!offer || offer.code !== code || offer.status !== "accepted")) throw new PostReviewError("offer");
    const expectedFormat = offer ? formatForOfferKind(offer.kind) : null;
    const format = expectedFormat ?? entry.item.format ?? entry.existing?.format ?? null;
    if (offer && entry.item.format && entry.item.format !== expectedFormat) throw new PostReviewError("invalid");
    if (format && !filesMatchFormat(format, files)) throw new PostReviewError("file");
    if (offer) {
      const bounds = offerSlideBounds(offer.kind);
      if (!bounds || files.length < bounds.min || files.length > bounds.max) throw new PostReviewError("file");
    }
    const slideCaptions = slideCaptionsFor(entry.item.slideCaptions, files.length, entry.caption, entry.existing?.slideCaptions ?? []);
    const payFields = payFieldsFor(entry.existing, offer ? standingTerms(offer.amountCents, offer.maxPayCents, offer.trackingDays, engagementRateCents) : null, standing);
    if (!payFields) throw new PostReviewError("fee");
    const reviewMeta = {
      slideCaptions,
      ...(format ? { format } : {}),
      batchId: entry.existing?.batchId || freshBatch,
      version: entry.existing && entry.existing.contentStatus !== "draft" ? Math.min(99, (entry.existing.version || 1) + 1) : 1,
      submittedAt: new Date(),
      ...payFields,
      ...(offer
        ? {
            offerId: offer.id,
            offerKind: offer.kind,
            offerBrief: offer.brief,
            publishBy: offer.publishBy,
          }
        : {}),
    };
    const savedCampaign = offer?.campaign
      ? { campaign: offer.campaign }
      : campaignFields(entry.item.campaign, allowed, entry.existing ? "update" : "set");
    const extras = {
      ...savedCampaign,
      ...proposedDateFields(entry.item.proposedPublishOn),
      ...revisionFields(entry.existing),
      agreementId: postedUnder.id,
      agreementLabel: postedUnder.label,
      ...(postingPeriod ? { postingMonth: postingPeriod } : {}),
    };
    if (offer) {
      await db.runTransaction(async (tx) => {
        const offerSnap = await tx.get(db.collection("marketingOffers").doc(offer.id));
        const siblings = await tx.get(db.collection("contentSubmissions").where("offerId", "==", offer.id));
        const others = siblings.docs.filter((doc) => doc.id !== ref.id);
        if (others.some((doc) => {
          const status = doc.data().contentStatus;
          return status !== "withdrawn" && status !== "rejected";
        })) throw new PostReviewError("offer");
        for (const doc of others) {
          const payment = await tx.get(db.collection("deliverablePayments").doc(doc.id));
          if (payment.exists) throw new PostReviewError("offer");
        }
        const fresh = offerSnap.data();
        if (fresh?.status !== "accepted" || normalizeAffiliateCode(fresh.code) !== code) throw new PostReviewError("offer");
        const freshRate = deliverableFeeCents(fresh?.amountCents);
        const freshPay = freshRate == null ? null : payFieldsFor(entry.existing, standingTerms(freshRate, deliverableFeeCents(fresh?.maxPayCents), trackingDaysOf(fresh?.trackingDays), engagementRateCents), null);
        if (!freshPay) throw new PostReviewError("fee");
        const saved = { ...reviewMeta, ...freshPay };
        if (entry.existing) {
          tx.update(ref, {
            caption: entry.caption,
            ...fileRecord(files),
            ...saved,
            contentStatus: "submitted",
            publicationStatus: null,
            reviewNote: null,
            reviewedAt: null,
            ...extras,
          });
        } else {
          tx.set(ref, { ...newSubmissionFields(code, entry.caption, files, "submitted"), ...saved, ...extras });
        }
      });
    } else if (entry.existing) {
      await ref.update({
        caption: entry.caption,
        ...fileRecord(files),
        ...reviewMeta,
        contentStatus: "submitted",
        publicationStatus: null,
        reviewNote: null,
        reviewedAt: null,
        ...extras,
      });
    } else {
      await ref.set({ ...newSubmissionFields(code, entry.caption, files, "submitted"), ...reviewMeta, ...extras });
    }
    ids.push(ref.id);
  }
  return ids;
}

export async function assignPostCampaign(input: { id: string; code: string; campaign: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (post.offerId) throw new PostReviewError("status");
  if (!campaignChangeAllowed(post.contentStatus)) throw new PostReviewError("status");
  const allowed = await campaignNamesFor(code);
  await requireDb().collection("contentSubmissions").doc(post.id).update(campaignFields(typeof input.campaign === "string" ? input.campaign : "", allowed, "update"));
}

export async function withdrawContentPost(input: { id: string; code: string }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  const mates = (await carouselMates(post)).filter((item) => item.code === code && item.contentStatus === "submitted");
  if (!mates.length) throw new PostReviewError("status");
  const reviewedAt = new Date();
  await Promise.all(mates.map((item) => requireDb().collection("contentSubmissions").doc(item.id).update({
    contentStatus: "withdrawn",
    reviewedAt,
  })));
  return post;
}

function carouselSignature(post: ContentSubmission) {
  if (post.files.length < 2) return "";
  const names = post.files.map((file) => file.name || file.path).join("\n");
  return names ? `${post.caption}\n${names}` : "";
}

async function carouselMates(post: ContentSubmission) {
  const signature = carouselSignature(post);
  if (!signature) return [post];
  const posts = await loadContentSubmissions(post.code);
  const mates = posts.filter((item) => carouselSignature(item) === signature);
  return mates.length ? mates : [post];
}

async function review(id: string, step: "approve" | "request" | "reject", note: unknown, reviewer: unknown) {
  const post = await loadContentSubmission(id);
  if (!post) throw new PostReviewError("missing");
  const reviewNote = step === "approve" ? null : reviewNoteText(note);
  if (step !== "approve" && !reviewNote) throw new PostReviewError("note");
  const status = step === "approve" ? "approved" : step === "request" ? "revision_requested" : "rejected";
  const mates = (await carouselMates(post)).filter((item) => item.contentStatus === "submitted" || item.contentStatus === "revision_requested");
  if (!mates.length) throw new PostReviewError("status");
  const reviewedAt = new Date();
  const reviewedBy = reviewerName(reviewer);
  await Promise.all(mates.map((item) => requireDb().collection("contentSubmissions").doc(item.id).update({
    contentStatus: status,
    publicationStatus: step === "approve" ? "awaiting_publication" : null,
    reviewNote,
    reviewedAt,
    reviewedBy,
  })));
  return post;
}

export function approveContentPost(id: string, reviewer: unknown) {
  return review(id, "approve", null, reviewer);
}

export function requestContentChange(id: string, note: unknown, reviewer: unknown) {
  return review(id, "request", note, reviewer);
}

export function rejectContentPost(id: string, note: unknown, reviewer: unknown) {
  return review(id, "reject", note, reviewer);
}

async function instagramPages(code: string) {
  try {
    const secrets = await loadConnectionSecrets(code);
    return secrets.flatMap((secret) => (secret.network === "facebook" ? secret.pages.filter((page) => page.instagramAccountId) : []));
  } catch (error) {
    if (error instanceof SocialError && error.code === "expired") throw error;
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
      metricsSource: "automatic",
      metricsRecordedAt: new Date(),
      metricsCheckedAt: new Date(),
      deliverableHoldStartedAt: new Date(),
      deliverableRecheckedAt: FieldValue.delete(),
      deliverableForfeitedAt: FieldValue.delete(),
      deliverableForfeitNote: FieldValue.delete(),
    });
    await markSocialReconnect(code, "facebook", false);
    return "tracking_active" as const;
  } catch (error) {
    if (error instanceof SocialError && error.code === "expired") {
      await markSocialReconnect(code, "facebook", true);
    }
    await ref.update({ publicationStatus: "verification_failed", verificationNote: verificationFailureNote("unavailable"), instagramMediaId: null });
    if (!(error instanceof SocialError) && !(error instanceof PostReviewError)) {
      console.error("[affiliate] instagram post check failed", error instanceof Error ? error.message : "unknown");
    }
    return "verification_failed" as const;
  }
}

export async function submitLiveInstagramUrl(input: { id: string; code: string; url: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  const url = liveLinkFor(post.format, input.url);
  if (!url) throw new PostReviewError("url");
  const waitingOnTikTok = post.format === "tiktok" && post.publicationStatus === "verification_pending";
  if (!canPasteLiveUrl(post.contentStatus, post.publicationStatus) && !waitingOnTikTok) throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    postUrl: url,
    publicationStatus: "verification_pending",
    verificationNote: null,
    publishedAt: new Date(),
  });
  if (post.format === "tiktok") return { ...post, postUrl: url, publicationStatus: "verification_pending" as const };
  const publicationStatus = await finishVerification(post.id, code, url);
  return { ...post, publicationStatus };
}

export async function markContentChecked(id: string) {
  const post = await loadContentSubmission(id);
  if (!post) throw new PostReviewError("missing");
  const tiktokWaiting = post.format === "tiktok" && post.publicationStatus === "verification_pending";
  if (post.publicationStatus !== "verification_failed" && !tiktokWaiting) throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    publicationStatus: "tracking_active",
    verificationNote: "An admin checked this link.",
    instagramMediaId: null,
    ...blankMetrics(),
    metricsSource: null,
    metricsRecordedAt: null,
    metricsCheckedAt: null,
    metricChange: FieldValue.delete(),
    deliverableHoldStartedAt: new Date(),
    deliverableRecheckedAt: FieldValue.delete(),
    deliverableForfeitedAt: FieldValue.delete(),
    deliverableForfeitNote: FieldValue.delete(),
  });
  return post;
}

async function writeFreshMetrics(post: ContentSubmission) {
  try {
    if (post.format === "tiktok") return await writeTikTokPostMetrics(post);
    return await writeInstagramPostMetrics(post);
  } catch (error) {
    if (error instanceof SocialError && error.code === "expired") {
      await markSocialReconnect(post.code, post.format === "tiktok" ? "tiktok" : "facebook", true);
      return false;
    }
    throw error;
  }
}

function importedMetrics(metrics: PostMetrics) {
  return {
    ...postMetricFields(metrics),
    metricsSource: "automatic" as const,
    metricsRecordedAt: new Date(),
    metricsCheckedAt: new Date(),
    metricChange: FieldValue.delete(),
  };
}

async function writeTikTokPostMetrics(post: ContentSubmission) {
  if (!post.tiktokVideoId && !post.postUrl) return false;
  const secrets = await loadConnectionSecrets(post.code);
  const connection = secrets.find((item): item is TikTokConnectionSecret => item.network === "tiktok");
  if (!connection) return false;
  const current = await currentTikTokConnection(connection);
  const videos = await loadTikTokVideos(current, post.tiktokVideoId);
  const match = selectTikTokUpdate({ videoId: post.tiktokVideoId, postUrl: post.postUrl, videos });
  const ref = requireDb().collection("contentSubmissions").doc(post.id);
  if (!match) {
    await ref.update({ metricsCheckedAt: new Date() });
    await markSocialReconnect(post.code, "tiktok", false);
    return false;
  }
  await ref.update({
    tiktokVideoId: match.videoId,
    ...importedMetrics({
      likes: match.video.likes,
      comments: match.video.comments,
      shares: match.video.shares,
      saves: null,
      reach: null,
      views: match.video.impressions,
    }),
  });
  await markSocialReconnect(post.code, "tiktok", false);
  return true;
}

async function loadTikTokVideos(connection: TikTokConnectionSecret, videoId: string | null) {
  if (!videoId) return fetchTikTokPosts(connection);
  try {
    const queried = await queryTikTokVideos(connection, [videoId]);
    if (queried.some((video) => video.id === videoId)) return queried;
  } catch (error) {
    if (error instanceof SocialError && error.code === "expired") throw error;
  }
  const listed = await fetchTikTokPosts(connection);
  return listed.filter((video) => video.id === videoId);
}

async function writeInstagramPostMetrics(post: ContentSubmission) {
  const pages = await instagramPages(post.code);
  if (pages.length === 0) return false;
  if (post.instagramMediaId) {
    for (const page of pages) {
      const media = await readInstagramMedia(page, post.instagramMediaId);
      if (!media) continue;
      await requireDb().collection("contentSubmissions").doc(post.id).update(importedMetrics(media));
      await markSocialReconnect(post.code, "facebook", false);
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
    ...importedMetrics(match.metrics),
  });
  await markSocialReconnect(post.code, "facebook", false);
  return true;
}

function manualCount(value: unknown) {
  if (typeof value !== "string") throw new PostReviewError("invalid");
  const text = value.trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) throw new PostReviewError("invalid");
  const count = Number(text);
  if (!Number.isSafeInteger(count) || count > 1_000_000_000) throw new PostReviewError("invalid");
  return count;
}

async function manualCheckpointOpen(post: ContentSubmission) {
  let accounts: { network: string; needsReconnect: boolean }[] = [];
  try {
    accounts = await loadSocialAccounts(post.code);
  } catch (error) {
    if (error instanceof SocialError) throw new PostReviewError("unavailable");
    throw error;
  }
  return manualReportDue({
    publicationStatus: post.publicationStatus,
    publishedAt: post.publishedAt,
    metricsRecordedAt: post.metricsRecordedAt,
    metricsSource: post.metricsSource,
    connected: networkConnectedForPost(post.format, accounts),
  });
}

export async function saveManualMetrics(input: { id: string; code: string; views: unknown; likes: unknown; comments: unknown; shares: unknown; saves: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (post.publicationStatus !== "tracking_active" || post.metricsSource != null) throw new PostReviewError("status");
  if (!(await manualCheckpointOpen(post))) throw new PostReviewError("status");
  const views = manualCount(input.views);
  const likes = manualCount(input.likes);
  const comments = manualCount(input.comments);
  const shares = manualCount(input.shares);
  const saves = manualCount(input.saves);
  if (views == null && likes == null && comments == null && shares == null && saves == null) throw new PostReviewError("invalid");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    views,
    likes,
    comments,
    shares,
    saves,
    metricsSource: "manual",
    metricsRecordedAt: new Date(),
  });
}

export async function confirmManualMetrics(input: { id: string; code: string }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (post.metricsSource !== "manual" || post.publicationStatus !== "tracking_active" || post.metricChange) throw new PostReviewError("status");
  if (!(await manualCheckpointOpen(post))) throw new PostReviewError("status");
  if (post.views == null && post.likes == null && post.comments == null && post.shares == null && post.saves == null) throw new PostReviewError("invalid");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    metricsSource: "manual",
    metricsRecordedAt: new Date(),
  });
}

export async function requestMetricChange(input: { id: string; code: string; views: unknown; likes: unknown; comments: unknown; shares: unknown; saves: unknown; note: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (post.metricsSource !== "manual" || post.publicationStatus !== "tracking_active") throw new PostReviewError("status");
  const views = manualCount(input.views);
  const likes = manualCount(input.likes);
  const comments = manualCount(input.comments);
  const shares = manualCount(input.shares);
  const saves = manualCount(input.saves);
  if (views == null && likes == null && comments == null && shares == null && saves == null) throw new PostReviewError("invalid");
  const note = typeof input.note === "string" ? input.note.trim().slice(0, NOTE_LIMIT) : "";
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    metricChange: { views, likes, comments, shares, saves, note, requestedAt: new Date() },
  });
}

export async function cancelMetricChange(input: { id: string; code: string }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new PostReviewError("invalid");
  const post = await requireOwned(input.id, code);
  if (!post.metricChange) throw new PostReviewError("status");
  await requireDb().collection("contentSubmissions").doc(post.id).update({ metricChange: FieldValue.delete() });
}

export async function applyMetricChange(input: { id: string; views: unknown; likes: unknown; comments: unknown; shares: unknown; saves: unknown }) {
  const post = await loadContentSubmission(input.id);
  if (!post?.metricChange || post.metricsSource !== "manual" || post.publicationStatus !== "tracking_active") throw new PostReviewError("status");
  const views = manualCount(input.views);
  const likes = manualCount(input.likes);
  const comments = manualCount(input.comments);
  const shares = manualCount(input.shares);
  const saves = manualCount(input.saves);
  if (views == null && likes == null && comments == null && shares == null && saves == null) throw new PostReviewError("invalid");
  await requireDb().collection("contentSubmissions").doc(post.id).update({
    views,
    likes,
    comments,
    shares,
    saves,
    metricsSource: "manual",
    metricsRecordedAt: new Date(),
    metricChange: FieldValue.delete(),
  });
  return post;
}

export async function refreshDueMetrics(code?: string, limit = 8) {
  const posts = code ? await loadContentSubmissions(code) : await loadContentSubmissions();
  const due = posts
    .filter((post) => post.publicationStatus === "tracking_active" && (Boolean(post.instagramMediaId) || Boolean(post.tiktokVideoId) || Boolean(post.postUrl)) && metricsAreStale(post.metricsCheckedAt))
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

export async function signedContentReadUrl(path: string, filename: string, download = false) {
  const bucketName = storageBucket();
  if (!bucketName || !contentFilePath(path)) throw new PostReviewError("missing");
  affiliateFirestore();
  const file = getStorage().bucket(bucketName).file(path);
  const [exists] = await file.exists();
  if (!exists) throw new PostReviewError("missing");
  const safeName = filename.replace(/[^\w.\-]+/g, "") || "post";
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
    responseDisposition: `${download ? "attachment" : "inline"}; filename="${safeName}"`,
  });
  return url;
}
