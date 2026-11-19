import { getStorage } from "firebase-admin/storage";
import type { DocumentData, DocumentReference, Timestamp, Transaction } from "firebase-admin/firestore";
import { normalizeAffiliateCode } from "./code";
import { postingMonthsOverlap } from "./agreement-earnings";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import {
  agreementDateRule,
  platformsFromStored,
  postsFromStored,
  agreementPlatform,
  parseAgreementPosts,
  type AgreementPlatform,
  type AgreementPostCount,
} from "./agreement-partnership";

const PDF_BYTES = 10 * 1024 * 1024;
const TEXT_LIMIT = 2000;
const NOTE_LIMIT = 500;
const DELIVERABLE_LIMIT = 20;
const STATUSES = ["draft", "awaiting_signature", "signed", "ended", "declined"] as const;

export class AgreementError extends Error {
  code: "invalid" | "status" | "file" | "pdf" | "storage" | "missing" | "unavailable" | "note" | "signer" | "question" | "overlap";

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

export type AgreementQuestion = {
  id: string;
  text: string;
  askedAt: string;
  reply: string | null;
  repliedAt: string | null;
};

export type AgreementTerms = {
  title: string | null;
  effectiveOn: string | null;
  expiresOn: string | null;
  monthlyCents: number | null;
  platforms: AgreementPlatform[];
  posts: AgreementPostCount[];
  guidelines: string | null;
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
  fileName: string | null;
  contentType: "application/pdf" | null;
  signerName: string | null;
  signedAt: string | null;
  sentAt: string | null;
  endedAt: string | null;
  endNote: string | null;
  createdAt: string | null;
  replacedAt: string | null;
  questions: AgreementQuestion[];
};

const QUESTION_LIMIT = 1000;
const QUESTION_COUNT = 20;
const REVISED_REPLY = "Leader Health updated the agreement. Please review the new version.";

export function openAgreementQuestion(agreement: { questions: readonly AgreementQuestion[] }) {
  return agreement.questions.find((question) => question.reply == null) ?? null;
}

function questionsFrom(value: unknown): AgreementQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as DocumentData;
    const id = typeof record.id === "string" && /^[A-Za-z0-9]{6,40}$/.test(record.id) ? record.id : "";
    const text = cleanText(record.text, QUESTION_LIMIT);
    const askedAt = typeof record.askedAt === "string" && !Number.isNaN(Date.parse(record.askedAt)) ? record.askedAt : "";
    if (!id || !text || !askedAt) return [];
    const reply = cleanText(record.reply, QUESTION_LIMIT);
    const repliedAt = reply && typeof record.repliedAt === "string" && !Number.isNaN(Date.parse(record.repliedAt)) ? record.repliedAt : null;
    return [{ id, text, askedAt, reply, repliedAt }];
  });
}

function answerOpen(questions: readonly AgreementQuestion[], reply: string) {
  const now = new Date().toISOString();
  return questions.map((question) => (question.reply == null ? { ...question, reply, repliedAt: now } : question));
}

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
  if (status === "declined") return "Declined";
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
  title?: unknown;
  effectiveOn: unknown;
  expiresOn: unknown;
  monthlyAmount?: unknown;
  platforms?: unknown[];
  postMix?: unknown[];
  guidelines?: unknown;
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
  const monthly = parseAgreementAmount(input.monthlyAmount);
  const platforms: AgreementPlatform[] = [];
  for (const value of input.platforms ?? []) {
    const platform = agreementPlatform(value);
    if (!platform || platforms.includes(platform)) return null;
    platforms.push(platform);
  }
  const posts = parseAgreementPosts(platforms, input.postMix ?? []);
  if (!effective.ok || !expires.ok || !deliverables || monthly === "invalid" || !posts) return null;
  if (effective.date && expires.date && agreementDateRule(effective.date, expires.date)) return null;
  return {
    title: cleanText(input.title, 120),
    effectiveOn: effective.date,
    expiresOn: expires.date,
    monthlyCents: monthly,
    platforms,
    posts,
    guidelines: cleanText(input.guidelines, TEXT_LIMIT),
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
    title: input.title,
    effectiveOn: input.effectiveOn,
    expiresOn: input.expiresOn,
    monthlyCents: input.monthlyCents,
    platforms: input.platforms,
    posts: input.posts,
    guidelines: input.guidelines,
    deliverables: input.deliverables,
    compensationNote: input.compensationNote,
    licensing: input.licensing,
    paymentConditions: input.paymentConditions,
    filePath: null,
    fileName: null,
    contentType: null,
    signerName: null,
    signedAt: null,
    sentAt: null,
    endedAt: null,
    endNote: null,
    replacedAt: null,
    questions: [],
  };
}

function agreementTermsFields(terms: AgreementTerms) {
  return {
    title: terms.title,
    effectiveOn: terms.effectiveOn,
    expiresOn: terms.expiresOn,
    monthlyCents: terms.monthlyCents,
    platforms: terms.platforms,
    posts: terms.posts,
    guidelines: terms.guidelines,
    deliverables: terms.deliverables,
    compensationNote: terms.compensationNote,
    licensing: terms.licensing,
    paymentConditions: terms.paymentConditions,
  };
}

function emptyTerms(): AgreementTerms {
  return {
    title: null,
    effectiveOn: null,
    expiresOn: null,
    monthlyCents: null,
    platforms: [],
    posts: [],
    guidelines: null,
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
  const platforms = platformsFromStored(data.platforms);
  const posts = postsFromStored(data.posts);
  if (!code || !status || !deliverables || !platforms || !posts) return null;
  const filePath = typeof data.filePath === "string" && agreementFilePath(data.filePath) ? data.filePath : null;
  return {
    id,
    code,
    status,
    current: data.current === true,
    title: cleanText(data.title, 120),
    effectiveOn: data.effectiveOn == null || data.effectiveOn === "" ? null : agreementDate(data.effectiveOn),
    expiresOn: data.expiresOn == null || data.expiresOn === "" ? null : agreementDate(data.expiresOn),
    monthlyCents: data.monthlyCents == null ? null : typeof data.monthlyCents === "number" && Number.isInteger(data.monthlyCents) && data.monthlyCents >= 0 ? data.monthlyCents : null,
    platforms,
    posts,
    guidelines: cleanText(data.guidelines, TEXT_LIMIT),
    deliverables,
    compensationNote: cleanText(data.compensationNote, TEXT_LIMIT),
    licensing: cleanText(data.licensing, TEXT_LIMIT),
    paymentConditions: cleanText(data.paymentConditions, TEXT_LIMIT),
    filePath,
    fileName: filePath ? cleanText(data.fileName, 120) : null,
    contentType: filePath && data.contentType === "application/pdf" ? "application/pdf" : null,
    signerName: cleanText(data.signerName, 120),
    signedAt: asDate(data.signedAt)?.toISOString() ?? null,
    sentAt: asDate(data.sentAt)?.toISOString() ?? null,
    endedAt: asDate(data.endedAt)?.toISOString() ?? null,
    endNote: cleanText(data.endNote, NOTE_LIMIT),
    createdAt: asDate(data.createdAt)?.toISOString() ?? null,
    replacedAt: asDate(data.replacedAt)?.toISOString() ?? null,
    questions: questionsFrom(data.questions),
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

export type AgreementPdfInput = { file: File | null; remove: boolean };

const NO_PDF_CHANGE: AgreementPdfInput = { file: null, remove: false };

function editable(status: AgreementStatus) {
  return status === "draft" || status === "awaiting_signature";
}

async function uploadAgreementPdf(code: string, id: string, file: File) {
  const bytes = await pdfBytes(file);
  const filePath = `affiliate-agreement/${code}/${id}${Date.now()}.pdf`;
  await savePdf(filePath, bytes);
  return { filePath, fileName: cleanText(file.name, 120) ?? "agreement.pdf", contentType: "application/pdf" as const };
}

async function prepareCurrent(code: string, pdf: AgreementPdfInput) {
  const db = requireDb();
  const existing = (await readStored(code)).find((item) => item.agreement.current) ?? null;
  if (existing && !editable(existing.agreement.status)) throw new AgreementError("status");
  const ref = existing?.ref ?? db.collection("affiliateAgreements").doc();
  const upload = pdf.file && pdf.file.size > 0 ? await uploadAgreementPdf(code, ref.id, pdf.file) : null;
  const pdfFields = upload ?? (pdf.remove ? { filePath: null, fileName: null, contentType: null } : {});
  const keptPath = upload ? upload.filePath : pdf.remove ? null : (existing?.agreement.filePath ?? null);
  return { db, ref, hadCurrent: Boolean(existing), pdfFields, keptPath };
}

function assertPostingMonths(stored: { agreement: AffiliateAgreement }[], id: string, terms: AgreementTerms) {
  if (postingMonthsOverlap(stored.map((item) => item.agreement), { id, effectiveOn: terms.effectiveOn, expiresOn: terms.expiresOn })) {
    throw new AgreementError("overlap");
  }
}

export async function saveAgreementDraft(code: string, terms: AgreementTerms, pdf: AgreementPdfInput = NO_PDF_CHANGE) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const { db, ref, hadCurrent, pdfFields } = await prepareCurrent(normalized, pdf);
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    assertPostingMonths(stored, current?.agreement.id ?? ref.id, terms);
    if (!current) {
      if (hadCurrent) throw new AgreementError("status");
      transaction.set(ref, {
        ...agreementDraftPayload({ code: normalized, ...terms }),
        ...pdfFields,
        createdAt: new Date(),
      });
      return;
    }
    if (current.ref.id !== ref.id || !editable(current.agreement.status)) throw new AgreementError("status");
    transaction.update(current.ref, { ...agreementTermsFields(terms), ...pdfFields, ...revisedQuestions(current.agreement), ...agreementSentHold(current.agreement) });
  });
}

function revisedQuestions(agreement: AffiliateAgreement) {
  if (agreement.status !== "awaiting_signature" || !openAgreementQuestion(agreement)) return {};
  return { questions: answerOpen(agreement.questions, REVISED_REPLY) };
}

export async function askAgreementQuestion(input: { code: string; agreementId: string; text: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  const text = cleanText(input.text, QUESTION_LIMIT);
  if (!code || !input.agreementId) throw new AgreementError("invalid");
  if (!text) throw new AgreementError("question");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(code, transaction);
    const current = stored.find((item) => item.agreement.id === input.agreementId);
    if (!current || current.agreement.status !== "awaiting_signature") throw new AgreementError("status");
    if (current.agreement.questions.length >= QUESTION_COUNT) throw new AgreementError("status");
    const question: AgreementQuestion = { id: db.collection("affiliateAgreements").doc().id, text, askedAt: new Date().toISOString(), reply: null, repliedAt: null };
    transaction.update(current.ref, { questions: [...current.agreement.questions, question] });
  });
  return text;
}

export function agreementReplyUpdate(questions: AgreementQuestion[]) {
  return { questions };
}

export function agreementSentHold(agreement: { status: AgreementStatus }) {
  if (agreement.status !== "awaiting_signature") return {};
  return { status: "awaiting_signature" as const, current: true as const };
}

export function agreementCanWithdraw(agreement: { status: AgreementStatus }) {
  return agreement.status === "awaiting_signature";
}

export function agreementWithdrawUpdate() {
  return { status: "draft" as const };
}

export async function replyAgreementQuestion(input: { code: string; questionId: string; reply: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  const reply = cleanText(input.reply, QUESTION_LIMIT);
  if (!code || !input.questionId) throw new AgreementError("invalid");
  if (!reply) throw new AgreementError("question");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(code, transaction);
    const current = stored.find((item) => item.agreement.status === "awaiting_signature" && item.agreement.questions.some((question) => question.id === input.questionId));
    const question = current?.agreement.questions.find((item) => item.id === input.questionId);
    if (!current || current.agreement.status !== "awaiting_signature" || !question || question.reply != null) throw new AgreementError("status");
    const repliedAt = new Date().toISOString();
    transaction.update(current.ref, agreementReplyUpdate(current.agreement.questions.map((item) => (item.id === question.id ? { ...item, reply, repliedAt } : item))));
  });
  return reply;
}

export async function markAgreementAwaiting(code: string, terms: AgreementTerms, pdf: AgreementPdfInput = NO_PDF_CHANGE) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const { db, ref, hadCurrent, pdfFields, keptPath } = await prepareCurrent(normalized, pdf);
  if (!keptPath) throw new AgreementError("pdf");
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = stored.find((item) => item.agreement.current);
    assertPostingMonths(stored, current?.agreement.id ?? ref.id, terms);
    if (!current) {
      if (hadCurrent) throw new AgreementError("status");
      transaction.set(ref, {
        ...agreementDraftPayload({ code: normalized, ...terms }),
        ...pdfFields,
        status: "awaiting_signature",
        sentAt: new Date(),
        createdAt: new Date(),
      });
      return;
    }
    if (current.ref.id !== ref.id || !editable(current.agreement.status)) throw new AgreementError("status");
    transaction.update(current.ref, {
      ...agreementTermsFields(terms),
      ...pdfFields,
      ...revisedQuestions(current.agreement),
      status: "awaiting_signature",
      ...(current.agreement.sentAt ? {} : { sentAt: new Date() }),
    });
  });
}

export async function acceptAgreement(code: string, signerName: unknown, id: unknown = "") {
  const normalized = normalizeAffiliateCode(code);
  const signer = cleanText(signerName, 120);
  if (!normalized) throw new AgreementError("invalid");
  if (!signer) throw new AgreementError("signer");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = awaitingAgreement(stored, id);
    if (!current.agreement.filePath) throw new AgreementError("status");
    if (openAgreementQuestion(current.agreement)) throw new AgreementError("question");
    claimCurrent(transaction, stored, current.ref.id);
    transaction.update(current.ref, { status: "signed", signerName: signer, signedAt: new Date(), current: true });
  });
}

export async function declineAgreement(code: string, id: unknown = "") {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const db = requireDb();
  let title = "Agreement";
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = awaitingAgreement(stored, id);
    title = current.agreement.title || "Agreement";
    transaction.update(current.ref, { status: "declined", current: false, declinedAt: new Date() });
  });
  return title;
}

export function agreementDraftDeletable(agreement: { status: AgreementStatus; sentAt: string | null; questions: readonly unknown[] }) {
  return agreement.status === "draft" && !agreement.sentAt && agreement.questions.length === 0;
}

export async function deleteAgreementDraft(code: string, id: unknown) {
  const normalized = normalizeAffiliateCode(code);
  const agreementId = typeof id === "string" && /^[A-Za-z0-9]{10,40}$/.test(id) ? id : "";
  if (!normalized || !agreementId) throw new AgreementError("invalid");
  const db = requireDb();
  let filePath: string | null = null;
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const match = stored.find((item) => item.agreement.id === agreementId);
    if (!match || !agreementDraftDeletable(match.agreement)) throw new AgreementError("status");
    filePath = match.agreement.filePath;
    transaction.delete(match.ref);
  });
  if (filePath) await removeStoredPdf(filePath);
}

async function removeStoredPdf(path: string) {
  const bucketName = storageBucket();
  if (!bucketName || !agreementFilePath(path)) return;
  affiliateFirestore();
  await getStorage().bucket(bucketName).file(path).delete({ ignoreNotFound: true });
}

export async function withdrawAgreement(code: string, id: unknown = "") {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new AgreementError("invalid");
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const stored = await readStored(normalized, transaction);
    const current = awaitingAgreement(stored, id);
    if (!agreementCanWithdraw(current.agreement)) throw new AgreementError("status");
    transaction.update(current.ref, agreementWithdrawUpdate());
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

export async function signAgreement(input: { code: string; signerName: unknown; file: File; agreementId?: unknown }) {
  const code = normalizeAffiliateCode(input.code);
  const signerName = cleanText(input.signerName, 120);
  const agreementId = knownAgreementId(input.agreementId);
  if (!code) throw new AgreementError("invalid");
  if (!signerName) throw new AgreementError("signer");
  const bytes = await pdfBytes(input.file);
  const stored = await readStored(code);
  const current = agreementId ? stored.find((item) => item.agreement.id === agreementId) : stored.find((item) => item.agreement.current);
  if (!current) throw new AgreementError("missing");
  if ((current.agreement.status !== "draft" && current.agreement.status !== "awaiting_signature") || current.agreement.filePath) {
    throw new AgreementError("status");
  }
  if (openAgreementQuestion(current.agreement)) throw new AgreementError("question");
  const path = `affiliate-agreement/${code}/${current.agreement.id}.pdf`;
  await savePdf(path, bytes);
  const db = requireDb();
  await db.runTransaction(async (transaction) => {
    const fresh = await readStored(code, transaction);
    const match = fresh.find((item) => item.agreement.id === current.agreement.id);
    if (!match || (match.agreement.status !== "draft" && match.agreement.status !== "awaiting_signature") || match.agreement.filePath) {
      throw new AgreementError("status");
    }
    claimCurrent(transaction, fresh, match.agreement.id);
    transaction.update(match.ref, {
      status: "signed",
      current: true,
      signerName,
      signedAt: new Date(),
      filePath: path,
      fileName: cleanText(input.file.name, 120),
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
    transaction.update(current.ref, { status: "ended", current: false, endNote, endedAt: new Date() });
  });
}

function knownAgreementId(id: unknown) {
  return typeof id === "string" && /^[A-Za-z0-9]{10,40}$/.test(id) ? id : "";
}

type StoredAgreement = { ref: DocumentReference; agreement: AffiliateAgreement };

function awaitingAgreement(stored: StoredAgreement[], id: unknown) {
  const agreementId = knownAgreementId(id);
  const match = agreementId ? stored.find((item) => item.agreement.id === agreementId) : stored.find((item) => item.agreement.current);
  if (!match || match.agreement.status !== "awaiting_signature") throw new AgreementError("status");
  return match;
}

function claimCurrent(transaction: Transaction, stored: StoredAgreement[], keepId: string) {
  for (const item of stored) {
    if (item.agreement.id !== keepId && item.agreement.current) transaction.update(item.ref, { current: false });
  }
}

export function shelveForNewAgreement(agreement: { status: AgreementStatus; sentAt: string | null }) {
  if (agreement.status === "awaiting_signature") throw new AgreementError("status");
  return { status: "draft" as const, current: false as const, sentAt: agreement.sentAt };
}

export function parkSentAgreement(agreement: { status: AgreementStatus }) {
  if (agreement.status !== "awaiting_signature") throw new AgreementError("status");
  return { current: false as const };
}

export async function replaceAgreement(code: string, note: unknown, seed: AgreementTerms | null = null) {
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
      transaction.update(current.ref, { status: "ended", current: false, endNote, endedAt: new Date(), replacedAt: new Date() });
    } else if (current?.agreement.status === "signed") {
      throw new AgreementError("status");
    } else if (current?.agreement.status === "awaiting_signature") {
      transaction.update(current.ref, parkSentAgreement(current.agreement));
    } else if (current) {
      transaction.update(current.ref, shelveForNewAgreement(current.agreement));
    } else {
      const previous = stored.find((item) => item.agreement.status === "ended" && !item.agreement.replacedAt);
      if (previous) transaction.update(previous.ref, { replacedAt: new Date() });
    }
    transaction.set(db.collection("affiliateAgreements").doc(), {
      ...agreementDraftPayload({ code: normalized, ...(seed ?? emptyTerms()) }),
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
