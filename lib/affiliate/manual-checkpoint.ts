export const MANUAL_REPORT_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_TRACKING_DAYS = 30;
export const REPORT_WINDOW_MS = DEFAULT_TRACKING_DAYS * 24 * 60 * 60 * 1000;

export function trackingDaysOf(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 365) return null;
  return value;
}

export function resolvedTrackingDays(value: number | null | undefined) {
  return value == null ? DEFAULT_TRACKING_DAYS : value;
}

export function trackingWindowMs(days: number | null | undefined) {
  return resolvedTrackingDays(days) * 24 * 60 * 60 * 1000;
}

export function viewPayCents(views: number, rateCents: number, maxPayCents: number | null = null) {
  if (!Number.isInteger(views) || views < 0 || !Number.isInteger(rateCents) || rateCents < 0) return null;
  const amount = Math.round((views * rateCents) / 1000);
  if (maxPayCents == null) return amount;
  if (!Number.isInteger(maxPayCents) || maxPayCents < 0) return null;
  return Math.min(amount, maxPayCents);
}

export function engagementCount(input: { likes?: number | null; comments?: number | null; shares?: number | null; saves?: number | null }) {
  const parts = [input.likes, input.comments, input.shares, input.saves];
  let total = 0;
  for (const part of parts) {
    if (part == null) continue;
    if (!Number.isInteger(part) || part < 0) return null;
    total += part;
  }
  return total;
}

export function engagementPayCents(count: number, rateCents: number) {
  if (!Number.isInteger(count) || count < 0 || !Number.isInteger(rateCents) || rateCents < 0) return null;
  return count * rateCents;
}

export function socialPayCents(input: {
  views?: number | null;
  viewRateCents: number;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  engagementRateCents?: number | null;
  maxPayCents?: number | null;
}) {
  const views = viewPayCents(input.views ?? 0, input.viewRateCents, null);
  const engagements = engagementCount(input);
  const engagement = engagements == null ? null : engagementPayCents(engagements, input.engagementRateCents ?? 0);
  if (views == null || engagement == null) return null;
  const amount = views + engagement;
  if (input.maxPayCents == null) return amount;
  if (!Number.isInteger(input.maxPayCents) || input.maxPayCents < 0) return null;
  return Math.min(amount, input.maxPayCents);
}

export function viewWindowEnded(publishedAt: string | null, now = Date.now(), trackingDays?: number | null) {
  if (!publishedAt) return false;
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  return now >= published + trackingWindowMs(trackingDays);
}

export type MetricsOrigin = "automatic" | "manual";

export type CheckpointInput = {
  publicationStatus: string | null;
  publishedAt: string | null;
  metricsRecordedAt: string | null;
  metricsSource: MetricsOrigin | null;
  connected: boolean;
  trackingDays?: number | null;
};

export function networkConnectedForPost(format: string | null, accounts: readonly { network: string; needsReconnect: boolean }[]) {
  const network = format === "tiktok" ? "tiktok" : "instagram";
  return accounts.some((account) => account.network === network && !account.needsReconnect);
}

export function checkpointOpensAt(input: CheckpointInput) {
  if (!input.publishedAt) return null;
  const published = Date.parse(input.publishedAt);
  if (Number.isNaN(published)) return null;
  const windowEnd = published + trackingWindowMs(input.trackingDays);
  const recorded = input.metricsSource === "manual" && input.metricsRecordedAt ? Date.parse(input.metricsRecordedAt) : Number.NaN;
  const opens = Number.isNaN(recorded) ? published + MANUAL_REPORT_MS : recorded + MANUAL_REPORT_MS;
  if (opens >= windowEnd) return null;
  return opens;
}

export function manualReportDue(input: CheckpointInput, now = Date.now()) {
  if (input.connected || input.publicationStatus !== "tracking_active" || input.metricsSource === "automatic") return false;
  const opens = checkpointOpensAt(input);
  if (opens == null) return false;
  return now >= opens;
}
