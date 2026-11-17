import { normalizeAffiliateCode } from "./code";

export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type MarketingReportFields = {
  code: string;
  month: string;
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  spendCents: number;
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const COUNT_MAX = 1_000_000_000;

function wholeCount(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!/^\d+$/.test(raw)) return null;
  const count = Number(raw);
  if (!Number.isSafeInteger(count) || count > COUNT_MAX) return null;
  return count;
}

export function spendCents(value: unknown) {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,]/g, "") : "";
  if (!raw) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars < 0 || dollars > 100000) return null;
  return Math.round(dollars * 100);
}

export function reportMonth(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function normalizeReportMonth(value: unknown) {
  if (typeof value !== "string" || !MONTH.test(value)) return null;
  return value;
}

export function currentReportMonth(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatReportMonth(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

const ACCOUNT_ID = /^[A-Za-z0-9._-]{1,128}$/;

export function socialNetwork(value: unknown): SocialNetwork | null {
  return SOCIAL_NETWORKS.find((network) => network === value) ?? null;
}

export function networkLabel(network: SocialNetwork) {
  if (network === "facebook") return "Facebook";
  if (network === "instagram") return "Instagram";
  return "TikTok";
}

export function marketingReportFields(input: {
  code: unknown;
  month: unknown;
  network: unknown;
  accountId: unknown;
  accountName: unknown;
  impressions: unknown;
  reach: unknown;
  likes: unknown;
  comments: unknown;
  shares: unknown;
  saves: unknown;
}): MarketingReportFields | null {
  const code = normalizeAffiliateCode(input.code);
  const month = normalizeReportMonth(input.month);
  const network = socialNetwork(input.network);
  const accountId = typeof input.accountId === "string" && ACCOUNT_ID.test(input.accountId) ? input.accountId : null;
  const accountName = accountLabel(input.accountName);
  const impressions = wholeCount(input.impressions);
  const reach = wholeCount(input.reach);
  const likes = wholeCount(input.likes);
  const comments = wholeCount(input.comments);
  const shares = wholeCount(input.shares);
  const saves = wholeCount(input.saves);
  if (!code || !month || !network || !accountId || !accountName) return null;
  if (impressions == null || reach == null || likes == null || comments == null || shares == null || saves == null) return null;
  return {
    code,
    month,
    network,
    accountId,
    accountName,
    impressions,
    reach,
    likes,
    comments,
    shares,
    saves,
    spendCents: 0,
  };
}

function accountLabel(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!text || text.length > 120) return null;
  return text;
}

export function costPerMilleCents(spend: number, impressions: number) {
  if (impressions <= 0) return null;
  return Math.round((spend / impressions) * 1000);
}

export function advertisingEfficiencyCents(spend: number, visits: number) {
  if (visits <= 0) return null;
  return Math.round(spend / visits);
}

export function visitsInMonth(clickTimes: readonly (string | null)[], month: string) {
  return clickTimes.reduce((sum, createdAt) => (reportMonth(createdAt) === month ? sum + 1 : sum), 0);
}

export type ReportSection = {
  code: string;
  network: SocialNetwork;
  accountId: string;
  accountName: string;
  months: MarketingReportFields[];
};

export function visibleReportSections(
  reports: readonly MarketingReportFields[],
  accounts: readonly { code: string; network: SocialNetwork; accountId: string; accountName: string }[],
  now = new Date(),
) {
  return accounts.flatMap((account) => {
    const months = reports
      .filter((report) => report.code === account.code && report.network === account.network && report.accountId === account.accountId)
      .sort((left, right) => right.month.localeCompare(left.month));
    if (months.length > 0) return [{ ...account, months }];
    const blank = marketingReportFields({
      code: account.code,
      month: currentReportMonth(now),
      network: account.network,
      accountId: account.accountId,
      accountName: account.accountName,
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    });
    return blank ? [{ ...account, months: [blank] }] : [];
  });
}

export function reportMetricsBlank(report: Pick<MarketingReportFields, "impressions" | "reach" | "likes" | "comments" | "shares" | "saves">) {
  return report.impressions + report.reach + report.likes + report.comments + report.shares + report.saves === 0;
}
