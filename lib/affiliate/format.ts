import type { CommissionMode } from "@/lib/affiliate/code";
import { formatPrice } from "@/lib/genhealth/types";

export function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

export function viewPayTerms(rateCents: number, maxPayCents: number | null, trackingDays: number) {
  const cap = maxPayCents == null ? "no maximum" : `maximum ${formatCents(maxPayCents)}`;
  const period = trackingDays === 1 ? "1 day" : `${trackingDays} days`;
  return `${formatCents(rateCents)} per 1,000 views, ${cap}, tracked for ${period}`;
}

export function formatCommissionRate(input: {
  commissionMode: CommissionMode;
  commissionPercent: number;
  commissionFixedCents: number;
}) {
  if (input.commissionMode === "fixed") return formatCents(input.commissionFixedCents);
  return `${input.commissionPercent}%`;
}

export function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const PUBLISH_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function publishDateValue(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  const match = PUBLISH_DATE.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2020 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return text;
}

export function formatPublishDate(value: string) {
  const parsed = publishDateValue(value);
  if (!parsed) return value || "—";
  const [year, month, day] = parsed.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}
