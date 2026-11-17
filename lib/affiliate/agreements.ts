import { getStorage } from "firebase-admin/storage";
import type { DocumentData, Timestamp, Transaction } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";

const PDF_BYTES = 10 * 1024 * 1024;
const TEXT_LIMIT = 2000;
const NOTE_LIMIT = 500;
const DELIVERABLE_LIMIT = 20;
const STATUSES = ["draft", "awaiting_signature", "signed", "ended"] as const;

export class AgreementError extends Error {
  code: "invalid" | "status" | "file" | "storage" | "missing" | "unavailable" | "note" | "signer";

  constructor(code: AgreementError["code"]) {
    super(code);
    this.name = "AgreementError";
    this.code = code;
  }
}

export type AgreementStatus = (typeof STATUSES)[number];

export type AgreementDeliverable = {
  description: string;
  dueOn: string | null;
  amountCents: number | null;
};

export type AgreementTerms = {
  effectiveOn: string | null;
  expiresOn: string | null;
  deliverables: AgreementDeliverable[];
  compensationNote: string | null;
  licensing: string | null;
  paymentConditions: string | null;
};

export type AffiliateAgreement = AgreementTerms & {
  id: string;
  code: string;
  status: AgreementStatus;
  current: boolean;
  filePath: string | null;
  contentType: "application/pdf" | null;
  signerName: string | null;
  signedAt: string | null;
  endNote: string | null;
  createdAt: string | null;
  replacedAt: string | null;
};

export function utcAgreementToday(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function agreementDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value;
}

export function formatAgreementDate(value: string | null) {
  const date = value ? agreementDate(value) : null;
  if (!date) return "—";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function agreementShowsExpired(status: AgreementStatus, expiresOn: string | null, today: string) {
  return status === "signed" && expiresOn != null && expiresOn < today;
}

export function agreementStatusLabel(status: AgreementStatus, expiresOn: string | null, today: string) {
  if (agreementShowsExpired(status, expiresOn, today)) return "Expired";
  if (status === "draft") return "Draft";
  if (status === "awaiting_signature") return "Awaiting signature";
  if (status === "signed") return "Signed";
  return "Ended";
}

export function agreementFilePath(value: string) {
  return /^affiliate-agreement\/[a-z0-9-]{3,24}\/[A-Za-z0-9]{10,40}\.pdf$/.test(value);
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

function optionalDate(value: unknown) {
  if (value == null || value === "") return { ok: true as const, date: null };
  const date = agreementDate(value);
  return date ? { ok: true as const, date } : { ok: false as const };
}

export function parseAgreementAmount(value: unknown): number | null | "invalid" {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  const raw = String(value).trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return "invalid";
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars < 0 || dollars > 1_000_000) return "invalid";
  return Math.round(dollars * 100);
}

export function parseAgreementDeliverables(input: { descriptions: unknown[]; dues: unknown[]; amounts: unknown[] }) {
  const count = Math.max(input.descriptions.length, input.dues.length, input.amounts.length);
  if (input.descriptions.length !== count || input.dues.length !== count || input.amounts.length !== count) return null;
  const deliverables: AgreementDeliverable[] = [];
  for (let index = 0; index < count; index += 1) {
    const description = cleanText(input.descriptions[index], 200);
    const due = optionalDate(input.dues[index]);
    const amount = parseAgreementAmount(input.amounts[index]);
    if (!due.ok || amount === "invalid") return null;
    if (!description && !due.date && amount == null) continue;
    if (!description) return null;
    deliverables.push({ description, dueOn: due.date, amountCents: amount });
  }
  if (deliverables.length > DELIVERABLE_LIMIT) return null;
  return deliverables;
}

export function parseAgreementTerms(input: {
  effectiveOn: unknown;
  expiresOn: unknown;
  descriptions: unknown[];
  dues: unknown[];
  amounts: unknown[];
  compensationNote: unknown;
  licensing: unknown;
  paymentConditions: unknown;
}): AgreementTerms | null {
  const effective = optionalDate(input.effectiveOn);
  const expires = optionalDate(input.expiresOn);
  const deliverables = parseAgreementDeliverables(input);
  if (!effective.ok || !expires.ok || !deliverables) return null;
  if (effective.date && expires.date && effective.date > expires.date) return null;
  return {
    effectiveOn: effective.date,
    expiresOn: expires.date,
    deliverables,
    compensationNote: cleanText(input.compensationNote, TEXT_LIMIT),
    licensing: cleanText(input.licensing, TEXT_LIMIT),
    paymentConditions: cleanText(input.paymentConditions, TEXT_LIMIT),
  };
}

export function agreementDraftPayload(input: AgreementTerms & { code: string }) {
  return {
    code: input.code,
    status: "draft" as const,
    current: true,
    effectiveOn: input.effectiveOn,
    expiresOn: input.expiresOn,
    deliverables: input.deliverables,
    compensationNote: input.compensationNote,
    licensing: input.licensing,
    paymentConditions: input.paymentConditions,
    filePath: null,
    contentType: null,
    signerName: null,
    signedAt: null,
    endNote: null,
    replacedAt: null,
  };
}

function agreementTermsFields(terms: AgreementTerms) {
  return {
    effectiveOn: terms.effectiveOn,
    expiresOn: terms.expiresOn,
    deliverables: terms.deliverables,
    compensationNote: terms.compensationNote,
    licensing: terms.licensing,
    paymentConditions: terms.paymentConditions,
  };
}

function emptyTerms(): AgreementTerms {
  return {
    effectiveOn: null,
    expiresOn: null,
    deliverables: [],
    compensationNote: null,
    licensing: null,
    paymentConditions: null,
  };
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
  if (!affiliateFirebaseConfigured()) throw new AgreementError("unavailable");
  return affiliateFirestore();
}

function deliverablesFrom(value: unknown): AgreementDeliverable[] | null {
  if (!Array.isArray(value)) return [];
  const deliverables: AgreementDeliverable[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const record = item as DocumentData;
    const description = cleanText(record.description, 200);
    const dueOn = record.dueOn == null || record.dueOn === "" ? null : agreementDate(record.dueOn);
    const amountCents =
      record.amountCents == null ? null : typeof record.amountCents === "number" && Number.isInteger(record.amountCents) ? record.amountCents : null;
    if (!description || (record.dueOn && !dueOn) || (record.amountCents != null && amountCents == null)) return null;
    deliverables.push({ description, dueOn, amountCents });
  }
  return deliverables;
}

function agreementFrom(id: string, data: DocumentData | undefined): AffiliateAgreement | null {
  if (!data) return null;
  const code = normalizeAffiliateCode(data.code);
  const status = STATUSES.find((item) => item === data.status);
  const deliverables = deliverablesFrom(data.deliverables);
  if (!code || !status || !deliverables) return null;
  const filePath = typeof data.filePath === "string" && agreementFilePath(data.filePath) ? data.filePath : null;
  return {
    id,
    code,
    status,
    current: data.current === true,
    effectiveOn: data.effectiveOn == null || data.effectiveOn === "" ? null : agreementDate(data.effectiveOn),
    expiresOn: data.expiresOn == null || data.expiresOn === "" ? null : agreementDate(data.expiresOn),
    deliverables,
    compensationNote: cleanText(data.compensationNote, TEXT_LIMIT),
    licensing: cleanText(data.licensing, TEXT_LIMIT),
    paymentConditions: cleanText(data.paymentConditions, TEXT_LIMIT),
    filePath,
    contentType: filePath && data.contentType === "application/pdf" ? "application/pdf" : null,
    signerName: cleanText(data.signerName, 120),
    signedAt: asDate(data.signedAt)?.toISOString() ?? null,
    endNote: cleanText(data.endNote, NOTE_LIMIT),
    createdAt: asDate(data.createdAt)?.toISOString() ?? null,
    replacedAt: asDate(data.replacedAt)?.toISOString() ?? null,
  };
}

async function readStored(code: string, transaction?: Transaction) {
  const query = requireDb().collection("affiliateAgreements").where("code", "==", code);
  const snap = transaction ? await transaction.get(query) : await query.get();
  return snap.docs
    .map((doc) => ({ ref: doc.ref, agreement: agreementFrom(doc.id, doc.data()) }))
    .filter((item): item is { ref: (typeof snap.docs)[number]["ref"]; agreement: AffiliateAgreement } => item.agreement != null)
    .sort((left, right) => (right.agreement.createdAt ?? "").localeCompare(left.agreement.createdAt ?? ""));
}

export async function loadAffiliateAgreements(code?: string) {
  if (!affiliateFirebaseConfigured()) return [];
  const normalized = code ? normalizeAffiliateCode(code) : null;
  if (code && !normalized) return [];
  const db = affiliateFirestore();
  const query = normalized ? db.collection("affiliateAgreements").where("code", "==", normalized) : db.collection("affiliateAgreements");
  const snap = await query.get();
  return snap.docs
    .map((doc) => agreementFrom(doc.id, doc.data()))
    .filter((agreement): agreement is AffiliateAgreement => agreement != null)
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export async function loadAffiliateAgreement(id: string) {
  if (!affiliateFirebaseConfigured() || !id || id.includes("/")) return null;
  const snap = await affiliateFirestore().collection("affiliateAgreements").doc(id).get();
  return agreementFrom(snap.id, snap.data());
}

export async function saveAgreementDraft(code: string, terms: AgreementTerms) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    if (!current) {
      transaction.set(db.collection("affiliateAgreements").doc(), {
        ...agreementDraftPayload({ code: normalized, ...terms }),
        createdAt: new Date(),
      });
      return;
    }
    if (current.agreement.status !== "draft" && current.agreement.status !== "awaiting_signature") throw new AgreementError("status");
    transaction.update(current.ref, agreementTermsFields(terms));
  });
}

export async function markAgreementAwaiting(code: string, terms: AgreementTerms) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    if (!current) {
      transaction.set(db.collection("affiliateAgreements").doc(), {
        ...agreementDraftPayload({ code: normalized, ...terms }),
        status: "awaiting_signature",
        createdAt: new Date(),
      });
      return;
    }
    if (current.agreement.status !== "draft" && current.agreement.status !== "awaiting_signature") throw new AgreementError("status");
    transaction.update(current.ref, { ...agreementTermsFields(terms), status: "awaiting_signature" });
  });
}

async function pdfBytes(file: File) {
  if (!(file instanceof File) || file.size === 0) throw new AgreementError("file");
  if (file.type && file.type !== "application/pdf") throw new AgreementError("file");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0 || bytes.length > PDF_BYTES) throw new AgreementError("file");
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new AgreementError("file");
  return bytes;
}

async function savePdf(path: string, bytes: Buffer) {
  const bucketName = storageBucket();
  if (!bucketName) throw new AgreementError("storage");
  if (!agreementFilePath(path)) throw new AgreementError("invalid");
  affiliateFirestore();
  const file = getStorage().bucket(bucketName).file(path);
  const [exists] = await file.exists();
  if (exists) return;
  await file.save(bytes, {
    contentType: "application/pdf",
    resumable: false,
    metadata: { contentType: "application/pdf" },
  });
}

export async function signAgreement(input: { code: string; signerName: unknown; file: File }) {
  const code = normalizeAffiliateCode(input.code);
  const signerName = cleanText(input.signerName, 120);
  if (!code) throw new AgreementError("invalid");
  if (!signerName) throw new AgreementError("signer");
  const bytes = await pdfBytes(input.file);
  const stored = await readStored(code);
  const current = stored.find((item) => item.agreement.current);
  if (!current) throw new AgreementError("missing");
  if ((current.agreement.status !== "draft" && current.agreement.status !== "awaiting_signature") || current.agreement.filePath) {
    throw new AgreementError("status");
  }
  const path = `affiliate-agreement/${code}/${current.agreement.id}.pdf`;
  await savePdf(path, bytes);
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(current.ref);
    const agreement = agreementFrom(snap.id, snap.data());
    if (!agreement?.current || (agreement.status !== "draft" && agreement.status !== "awaiting_signature") || agreement.filePath) {
      throw new AgreementError("status");
    }
    transaction.update(current.ref, {
      status: "signed",
      signerName,
      signedAt: new Date(),
      filePath: path,
      contentType: "application/pdf",
    });
  });
}

export async function endAgreement(code: string, note: unknown) {
  const normalized = normalizeAffiliateCode(code);
  const endNote = cleanText(note, NOTE_LIMIT);
  if (!normalized) throw new AgreementError("invalid");
  if (!endNote) throw new AgreementError("note");
  const db = requireDb();
  const today = utcAgreementToday();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    if (!current || current.agreement.status !== "signed" || agreementShowsExpired(current.agreement.status, current.agreement.expiresOn, today)) {
      throw new AgreementError("status");
    }
    transaction.update(current.ref, { status: "ended", current: false, endNote });
  });
}

export async function replaceAgreement(code: string, note: unknown) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const endNote = cleanText(note, NOTE_LIMIT);
  const db = requireDb();
  const today = utcAgreementToday();
  let endedCurrent = false;
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    if (current?.agreement.status === "signed" && agreementShowsExpired(current.agreement.status, current.agreement.expiresOn, today)) {
      if (!endNote) throw new AgreementError("note");
      endedCurrent = true;
      transaction.update(current.ref, { status: "ended", current: false, endNote, replacedAt: new Date() });
    } else if (!current && stored.some((item) => item.agreement.status === "ended")) {
      const previous = stored.find((item) => item.agreement.status === "ended");
      if (previous && !previous.agreement.replacedAt) transaction.update(previous.ref, { replacedAt: new Date() });
    } else {
      throw new AgreementError("status");
    }
    transaction.set(db.collection("affiliateAgreements").doc(), {
      ...agreementDraftPayload({ code: normalized, ...emptyTerms() }),
      createdAt: new Date(),
    });
  });
  return endedCurrent;
}

export async function readAgreementFile(path: string) {
  const bucketName = storageBucket();
  if (!bucketName || !agreementFilePath(path)) throw new AgreementError("missing");
  affiliateFirestore();
  const file = getStorage().bucket(bucketName).file(path);
  const [exists] = await file.exists();
  if (!exists) throw new AgreementError("missing");
  const [bytes] = await file.download();
  return { bytes, contentType: "application/pdf" as const };
}
