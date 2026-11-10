import { getStorage } from "firebase-admin/storage";
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { disclosurePostUrl } from "./compliance-rules";

const SCREENSHOT_BYTES = 5 * 1024 * 1024;
const SCREENSHOT_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export class DisclosureError extends Error {
  code: "invalid" | "url" | "file" | "storage" | "missing" | "unavailable" | "acknowledged";

  constructor(code: DisclosureError["code"]) {
    super(code);
    this.name = "DisclosureError";
    this.code = code;
  }
}

export type DisclosureProof = {
  id: string;
  code: string;
  postUrl: string | null;
  screenshotPath: string | null;
  contentType: string | null;
  status: "submitted" | "accepted";
  submittedAt: string | null;
};

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
  if (!affiliateFirebaseConfigured()) throw new DisclosureError("unavailable");
  return affiliateFirestore();
}

export async function disclosureAcknowledged(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized || !affiliateFirebaseConfigured()) return false;
  const snap = await affiliateFirestore().collection("disclosureAcknowledgements").doc(normalized).get();
  return snap.exists;
}

export async function acknowledgeDisclosure(code: string) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new DisclosureError("invalid");
  const db = requireDb();
  const ref = db.collection("disclosureAcknowledgements").doc(normalized);
  const snap = await ref.get();
  if (snap.exists) return false;
  await ref.create({ code: normalized, acknowledgedAt: new Date() });
  return true;
}

function proofFrom(id: string, data: DocumentData | undefined): DisclosureProof | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  if (!code) return null;
  const postUrl = typeof data.postUrl === "string" && data.postUrl ? data.postUrl : null;
  const screenshotPath = typeof data.screenshotPath === "string" && data.screenshotPath ? data.screenshotPath : null;
  return {
    id,
    code,
    postUrl,
    screenshotPath,
    contentType: typeof data.contentType === "string" ? data.contentType : null,
    status: data.status === "accepted" ? "accepted" : "submitted",
    submittedAt: asDate(data.submittedAt)?.toISOString() ?? null,
  };
}

export async function loadDisclosureProofs(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const db = affiliateFirestore();
  const query = normalized
    ? db.collection("disclosureProofs").where("code", "==", normalized)
    : db.collection("disclosureProofs");
  const snap = await query.get();
  return snap.docs
    .map((doc) => proofFrom(doc.id, doc.data()))
    .filter((proof): proof is DisclosureProof => proof != null)
    .sort((left, right) => (right.submittedAt ?? "").localeCompare(left.submittedAt ?? ""));
}

export async function loadDisclosureProof(id: string) {
  if (!affiliateFirebaseConfigured() || !id || id.includes("/")) return null;
  const snap = await affiliateFirestore().collection("disclosureProofs").doc(id).get();
  return proofFrom(snap.id, snap.data());
}

async function saveScreenshot(code: string, file: File) {
  const bucketName = storageBucket();
  if (!bucketName) throw new DisclosureError("storage");
  const extension = SCREENSHOT_TYPES[file.type as keyof typeof SCREENSHOT_TYPES];
  if (!extension) throw new DisclosureError("file");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > SCREENSHOT_BYTES) throw new DisclosureError("file");
  affiliateFirestore();
  const path = `disclosure-proof/${code}/${Date.now()}.${extension}`;
  await getStorage().bucket(bucketName).file(path).save(bytes, {
    contentType: file.type,
    resumable: false,
    metadata: { contentType: file.type },
  });
  return { path, contentType: file.type };
}

export async function submitDisclosureProof(input: { code: string; postUrl: unknown; file: File | null }) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) throw new DisclosureError("invalid");
  if (!(await disclosureAcknowledged(code))) throw new DisclosureError("acknowledged");
  const postUrl = disclosurePostUrl(input.postUrl);
  if (typeof input.postUrl === "string" && input.postUrl.trim() && !postUrl) throw new DisclosureError("url");
  const file = input.file && input.file.size > 0 ? input.file : null;
  if (!postUrl && !file) throw new DisclosureError("invalid");
  const screenshot = file ? await saveScreenshot(code, file) : null;
  const db = requireDb();
  const ref = db.collection("disclosureProofs").doc();
  await ref.set({
    code,
    postUrl,
    screenshotPath: screenshot?.path ?? null,
    contentType: screenshot?.contentType ?? null,
    status: "submitted",
    submittedAt: new Date(),
  });
  return ref.id;
}

export async function acceptDisclosureProof(id: string) {
  const db = requireDb();
  const ref = db.collection("disclosureProofs").doc(id);
  const snap = await ref.get();
  const proof = proofFrom(snap.id, snap.data());
  if (!proof) throw new DisclosureError("missing");
  if (proof.status !== "accepted") await ref.update({ status: "accepted" });
  return proof;
}

export async function readDisclosureScreenshot(path: string) {
  const bucketName = storageBucket();
  if (!bucketName || !/^disclosure-proof\/[a-z0-9-]{3,24}\/\d+\.(png|jpg|webp)$/.test(path)) {
    throw new DisclosureError("missing");
  }
  affiliateFirestore();
  const file = getStorage().bucket(bucketName).file(path);
  const [exists] = await file.exists();
  if (!exists) throw new DisclosureError("missing");
  const [bytes] = await file.download();
  const [metadata] = await file.getMetadata();
  const contentType = typeof metadata.contentType === "string" ? metadata.contentType : "application/octet-stream";
  return { bytes, contentType };
}
