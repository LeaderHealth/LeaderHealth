export type UtcWeek = {
  id: string;
  start: Date;
  end: Date;
  label: string;
};

export function startOfUtcWeek(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

export function previousUtcWeek(now = new Date()): UtcWeek {
  const end = startOfUtcWeek(now);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);
  const last = new Date(end);
  last.setUTCDate(last.getUTCDate() - 1);
  const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "UTC" }).format(last);
  return {
    id: start.toISOString().slice(0, 10),
    start,
    end,
    label: `${day.format(start)}–${day.format(last)}, ${year}`,
  };
}

export function instantInWeek(value: string | null, week: UtcWeek) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time >= week.start.getTime() && time < week.end.getTime();
}
