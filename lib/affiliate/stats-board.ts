export type StatsBoardPost = {
  id: string;
  title: string;
  platform: "instagram" | "facebook" | "tiktok" | "youtube" | "other";
  kind: string;
  campaign: string;
  postedOn: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export type StatsBoardDay = {
  day: string;
  clicks: number;
  pageViews: number;
};

export type BoardRange = "7" | "30" | "90" | "custom";
export type BoardPlatform = "all" | "instagram" | "facebook" | "tiktok" | "youtube";
export type BoardPostFilter = "all" | "campaign" | "independent";

const CUSTOM_LENGTHS = [7, 14, 21, 45, 60, 90];

export function customLengths() {
  return CUSTOM_LENGTHS;
}

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function shiftDay(day: string, offset: number) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return utcDay(date);
}

export function daySpan(end: string, days: number) {
  const count = Math.max(1, Math.floor(days));
  const start = shiftDay(end, -(count - 1));
  const daysOut: string[] = [];
  for (let index = 0; index < count; index += 1) daysOut.push(shiftDay(start, index));
  return daysOut;
}

export function rangeLength(range: BoardRange, fromDays: number) {
  if (range === "custom") return CUSTOM_LENGTHS.includes(fromDays) ? fromDays : 14;
  return Number(range);
}

export function compactCount(value: number) {
  const amount = Math.max(0, Math.round(value));
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US").format(amount);
}

export function shortDay(day: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00.000Z`));
}

export function fullDay(day: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00.000Z`));
}

export function rangeLabel(start: string, end: string) {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${sameYear ? shortDay(start) : fullDay(start)} – ${fullDay(end)}`;
}

function inDays(day: string, days: string[]) {
  return days.includes(day);
}

function countOf(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function postEngagement(post: Pick<StatsBoardPost, "likes" | "comments" | "shares" | "saves">) {
  return countOf(post.likes) + countOf(post.comments) + countOf(post.shares) + countOf(post.saves);
}

export function postsIn(posts: StatsBoardPost[], days: string[], platform: BoardPlatform = "all") {
  return posts.filter((post) => inDays(post.postedOn, days) && (platform === "all" || post.platform === platform));
}

export function trafficIn(series: StatsBoardDay[], days: string[]) {
  const wanted = new Set(days);
  return series.reduce(
    (sum, day) => {
      if (!wanted.has(day.day)) return sum;
      return { clicks: sum.clicks + day.clicks, pageViews: sum.pageViews + day.pageViews };
    },
    { clicks: 0, pageViews: 0 },
  );
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function deltaLabel(current: number, previous: number, points = false) {
  const change = points ? current - previous : percentChange(current, previous);
  const up = change >= 0;
  const amount = Math.abs(change).toFixed(1);
  return { text: `${up ? "▲" : "▼"} ${amount}${points ? " pts" : "%"}`, up };
}

export function chartMax(values: number[]) {
  const peak = Math.max(0, ...values);
  if (peak <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / power) * power;
}

export function linePath(values: number[], max: number, top: number, bottom: number) {
  if (values.length === 0) return "";
  const x = (index: number) => (values.length === 1 ? 500 : (index / (values.length - 1)) * 1000);
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  return values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(" ");
}

export function barPath(values: number[], max: number) {
  if (values.length === 0 || max <= 0) return "";
  const width = Math.max(2, (1000 / values.length) * 0.6);
  return values
    .map((value, index) => {
      const x = ((index + 0.5) * 1000) / values.length - width / 2;
      const height = (value / max) * 200;
      return `M${x.toFixed(1)} 210 h${width.toFixed(1)} v-${height.toFixed(1)} h-${width.toFixed(1)} Z`;
    })
    .join(" ");
}

export function pageViewPath(values: number[], max: number) {
  if (values.length === 0 || max <= 0) return "";
  return values
    .map((value, index) => {
      const x = ((index + 0.5) * 1000) / values.length;
      const y = 210 - (value / max) * 200;
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function contentPosts(posts: StatsBoardPost[], days: string[], filter: BoardPostFilter) {
  return postsIn(posts, days).filter((post) => {
    if (filter === "campaign") return Boolean(post.campaign);
    if (filter === "independent") return !post.campaign;
    return true;
  });
}
