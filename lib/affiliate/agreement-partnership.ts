export const AGREEMENT_PLATFORMS = ["Instagram", "Facebook", "TikTok", "YouTube"] as const;

export type AgreementPlatform = (typeof AGREEMENT_PLATFORMS)[number];

export const AGREEMENT_POST_TYPES: Record<AgreementPlatform, readonly string[]> = {
  Instagram: ["Reel", "Image post", "Carousel", "Story"],
  Facebook: ["Post", "Reel", "Story", "Video"],
  TikTok: ["Video"],
  YouTube: ["Short", "Video"],
};

export type AgreementPostCount = {
  platform: AgreementPlatform;
  type: string;
  count: number;
};

export function agreementPlatform(value: unknown): AgreementPlatform | null {
  return AGREEMENT_PLATFORMS.find((platform) => platform === value) ?? null;
}

export function parseAgreementPosts(platforms: unknown[], mixes: unknown[]): AgreementPostCount[] | null {
  const allowed = new Set<AgreementPlatform>();
  for (const value of platforms) {
    const platform = agreementPlatform(value);
    if (!platform) return null;
    allowed.add(platform);
  }
  const posts: AgreementPostCount[] = [];
  const seen = new Set<string>();
  for (const value of mixes) {
    if (typeof value !== "string") return null;
    const [platformName, type, rawCount] = value.split("::");
    const platform = agreementPlatform(platformName);
    const count = Number(rawCount);
    if (!platform || !allowed.has(platform) || !type || !AGREEMENT_POST_TYPES[platform].includes(type)) return null;
    if (!Number.isInteger(count) || count < 0 || count > 99) return null;
    const key = `${platform}::${type}`;
    if (seen.has(key)) return null;
    seen.add(key);
    if (count > 0) posts.push({ platform, type, count });
  }
  return posts;
}

export function postsFromStored(value: unknown): AgreementPostCount[] | null {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;
  const posts: AgreementPostCount[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const record = item as { platform?: unknown; type?: unknown; count?: unknown };
    const platform = agreementPlatform(record.platform);
    const type = typeof record.type === "string" ? record.type : "";
    const count = record.count;
    if (!platform || !AGREEMENT_POST_TYPES[platform].includes(type)) return null;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 99) return null;
    posts.push({ platform, type, count });
  }
  return posts;
}

export function platformsFromStored(value: unknown): AgreementPlatform[] | null {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;
  const platforms: AgreementPlatform[] = [];
  for (const item of value) {
    const platform = agreementPlatform(item);
    if (!platform || platforms.includes(platform)) return null;
    platforms.push(platform);
  }
  return platforms;
}

export function agreementPostTotal(posts: readonly AgreementPostCount[]) {
  return posts.reduce((sum, post) => sum + post.count, 0);
}

export function agreementDateRule(effectiveOn: string | null, expiresOn: string | null) {
  if (!effectiveOn || !expiresOn) return null;
  if (effectiveOn > expiresOn) return "The end date has to be on or after the start date.";
  if (!effectiveOn.endsWith("-01")) return "The start date has to be the 1st of the month.";
  const [year, month] = expiresOn.split("-").map(Number);
  if (!year || !month) return "The end date has to be the last day of the month.";
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDay = `${expiresOn.slice(0, 7)}-${String(last).padStart(2, "0")}`;
  if (expiresOn !== lastDay) return "The end date has to be the last day of the month.";
  return null;
}

export function agreementSendError(input: {
  title: string | null;
  effectiveOn: string | null;
  expiresOn: string | null;
  monthlyCents: number | null;
  platforms: readonly AgreementPlatform[];
  posts: readonly AgreementPostCount[];
  guidelines: string | null;
}) {
  if (!input.title) return "Give it a name.";
  if (!input.effectiveOn || !input.expiresOn) return "Add start and end dates.";
  const dates = agreementDateRule(input.effectiveOn, input.expiresOn);
  if (dates) return dates;
  if (input.monthlyCents == null || input.monthlyCents <= 0) return "Enter the monthly amount.";
  if (input.platforms.length === 0) return "Turn on at least one platform.";
  const empty = input.platforms.filter((platform) => !input.posts.some((post) => post.platform === platform && post.count > 0));
  if (empty.length > 0) return `Add posts for ${empty.join(" and ")}, or turn it off.`;
  if (!input.guidelines) return "Add a few lines of guidelines.";
  return null;
}
