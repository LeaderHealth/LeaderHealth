import type { MarketingCampaignRecord } from "./campaign-record";

export type CampaignListStatus = "draft" | "sent" | "active" | "completed" | "cancelled";
export type CampaignAffiliateState = "invited" | "progress" | "completed" | "declined";
export type CampaignPostState = "todo" | "pending" | "changes" | "ready" | "published" | "verified" | "rejected" | "failed";

export type CampaignListPost = {
  id: string;
  code: string;
  campaign: string;
  contentStatus: string;
  publicationStatus: string | null;
  createdAt: string | null;
};

export type CampaignListAffiliate = {
  code: string;
  name: string;
};

export type CampaignListModel = {
  id: string;
  name: string;
  dates: string;
  affiliateLine: string;
  progress: string;
  progressPct: number;
  budgetLabel: string;
  status: CampaignListStatus;
  meta: string;
  pending: number;
  performance: "On" | "Off";
  stats: { label: string; value: string }[];
  affiliates: {
    code: string;
    name: string;
    initials: string;
    state: CampaignAffiliateState;
    posts: { text: string; state: CampaignPostState }[];
    terms: string;
    earnedLabel: string;
  }[];
};

const FILTERS: CampaignListStatus[] = ["draft", "sent", "active", "completed", "cancelled"];

export function campaignListFilters(rows: CampaignListModel[]) {
  return (["all", ...FILTERS] as const).map((id) => ({
    id,
    label: id === "all" ? "All" : statusLabel(id),
    count: id === "all" ? rows.length : rows.filter((row) => row.status === id).length,
  }));
}

export function statusLabel(status: CampaignListStatus) {
  if (status === "draft") return "Draft";
  if (status === "sent") return "Sent";
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

export function affiliateStateLabel(state: CampaignAffiliateState) {
  if (state === "invited") return "New invitation";
  if (state === "progress") return "In progress";
  if (state === "declined") return "Declined";
  return "Completed";
}

export function postStateLabel(state: CampaignPostState) {
  if (state === "todo") return "Not started";
  if (state === "pending") return "Pending review";
  if (state === "changes") return "Changes requested";
  if (state === "ready") return "Approved";
  if (state === "published") return "Published · verifying";
  if (state === "verified") return "Verified";
  if (state === "rejected") return "Rejected";
  return "Verification failed";
}

export function campaignPostState(post: { contentStatus: string; publicationStatus: string | null }): CampaignPostState {
  if (post.contentStatus === "submitted") return "pending";
  if (post.contentStatus === "revision_requested") return "changes";
  if (post.contentStatus === "rejected") return "rejected";
  if (post.contentStatus === "approved") {
    if (post.publicationStatus === "tracking_active") return "verified";
    if (post.publicationStatus === "verification_pending") return "published";
    if (post.publicationStatus === "verification_failed") return "failed";
    return "ready";
  }
  return "todo";
}

function money(cents: number) {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function dayLabel(value: string, withYear: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function dateSpan(startsOn: string, endsOn: string) {
  if (startsOn && endsOn) {
    const sameYear = startsOn.slice(0, 4) === endsOn.slice(0, 4);
    return `${dayLabel(startsOn, !sameYear)} – ${dayLabel(endsOn, true)}`;
  }
  if (startsOn) return `Starts ${dayLabel(startsOn, true)}`;
  if (endsOn) return `Ends ${dayLabel(endsOn, true)}`;
  return "—";
}

function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || "?";
}

function rateCents(record: MarketingCampaignRecord, code: string) {
  return record.affiliatePay.find((row) => row.code === code)?.amountCents ?? record.baseAmountCents;
}

function sameCampaign(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function campaignListRows(input: {
  records: MarketingCampaignRecord[];
  posts: CampaignListPost[];
  affiliates: CampaignListAffiliate[];
  today?: string;
}): CampaignListModel[] {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const names = new Map(input.affiliates.map((affiliate) => [affiliate.code, affiliate.name]));
  return [...input.records]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((record) => {
      const posts = input.posts
        .filter((post) => post.campaign && sameCampaign(post.campaign, record.name))
        .sort((left, right) => (left.createdAt ?? "").localeCompare(right.createdAt ?? "") || left.id.localeCompare(right.id));
      const byCode = new Map<string, CampaignListPost[]>();
      for (const post of posts) {
        const list = byCode.get(post.code) ?? [];
        list.push(post);
        byCode.set(post.code, list);
      }
      const affiliates = record.assignedCodes.map((code) => {
        const own = byCode.get(code) ?? [];
        const states = own.map(campaignPostState);
        const verified = states.filter((state) => state === "verified").length;
        const required = record.postsRequired;
        const answer = record.responses.find((row) => row.code === code)?.status ?? null;
        const state: CampaignAffiliateState =
          answer === "declined" && own.length === 0 ? "declined" : own.length === 0 && answer !== "accepted" ? "invited" : required > 0 && verified >= required ? "completed" : "progress";
        const chips = states.map((item, index) => ({ text: `#${index + 1} ${postStateLabel(item)}`, state: item }));
        if (state === "progress" || state === "completed") {
          for (let index = chips.length; index < required; index += 1) chips.push({ text: `#${index + 1} Not started`, state: "todo" });
        }
        if (chips.length === 0) chips.push({ text: state === "declined" ? "Declined" : "Waiting for answer", state: "todo" });
        const rate = rateCents(record, code);
        const earned = required > 0 && verified >= required ? rate : 0;
        const terms = money(rate);
        return {
          code,
          name: names.get(code) ?? code,
          initials: initials(names.get(code) ?? code),
          state,
          posts: chips,
          terms: `${terms} for the campaign`,
          earned,
          verified,
        };
      });
      const joined = affiliates.filter((affiliate) => affiliate.state === "progress" || affiliate.state === "completed");
      const verified = affiliates.reduce((sum, affiliate) => sum + affiliate.verified, 0);
      const required = joined.length * record.postsRequired;
      const pending = posts.filter((post) => campaignPostState(post) === "pending").length;
      const ended = Boolean(record.endsOn && record.endsOn < today);
      const done = record.postsRequired > 0 && verified >= required && required > 0;
      const status: CampaignListStatus =
        record.status === "draft" ? "draft" : (ended && (required === 0 || done)) || (!record.endsOn && done) ? "completed" : joined.length > 0 ? "active" : "sent";
      const budget = joined.reduce((sum, affiliate) => {
        const rate = rateCents(record, affiliate.code);
        return sum + rate;
      }, 0);
      const earned = affiliates.reduce((sum, affiliate) => sum + affiliate.earned, 0);
      const platforms = record.platforms.join(", ");
      const content = record.postsRequired > 0 ? `${record.postsRequired} × ${record.contentTypes.join(" or ") || "post"}` : "";
      const pay = record.baseAmountCents > 0 ? `${money(record.baseAmountCents)} per campaign` : "";
      return {
        id: record.name.toLowerCase(),
        name: record.name,
        dates: dateSpan(record.startsOn, record.endsOn),
        affiliateLine: record.assignedCodes.length ? `${joined.length} of ${record.assignedCodes.length} joined` : "—",
        progress: required > 0 ? `${verified} of ${required}` : "—",
        progressPct: required > 0 ? Math.round((verified / required) * 100) : 0,
        budgetLabel: money(budget),
        status,
        meta: [dateSpan(record.startsOn, record.endsOn), platforms, content, pay].filter((part) => part && part !== "—").join(" · "),
        pending,
        performance: record.performancePay ? "On" : "Off",
        stats: [
          { label: "Affiliates joined", value: record.assignedCodes.length ? `${joined.length} of ${record.assignedCodes.length}` : "0 of 0" },
          { label: "Posts verified", value: `${verified} of ${required}` },
          { label: "Waiting for review", value: String(pending) },
          { label: "Base earned so far", value: money(earned) },
        ],
        affiliates: affiliates.map((affiliate) => ({
          code: affiliate.code,
          name: affiliate.name,
          initials: affiliate.initials,
          state: affiliate.state,
          posts: affiliate.posts,
          terms: affiliate.terms,
          earnedLabel: money(affiliate.earned),
        })),
      };
    });
}
