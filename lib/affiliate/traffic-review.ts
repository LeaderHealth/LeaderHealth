export type TrafficEvent = {
  code: string;
  kind: "impression" | "click" | "page_view";
  payable: boolean;
  excluded?: boolean;
  createdAt: string;
};

export type TrafficAffiliate = { code: string; name: string };

export type TrafficKeep = { code: string; hour: string };

export type TrafficRowStatus = "clear" | "flagged";

export type TrafficStepTone = "done" | "current" | "next";

const COLORS = ["#33130F", "#A8706A", "#E39A93", "#6B5A57", "#C47B74", "#4A3A37"];

export function findClickSpike(times: string[]) {
  const counts = new Map<string, number>();
  for (const time of times) {
    const hour = time.slice(0, 13);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) continue;
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }
  let best: { hour: string; count: number } | null = null;
  for (const [hour, count] of counts) {
    if (!best || count > best.count) best = { hour, count };
  }
  if (!best || best.count < 10) return null;
  const rest: number[] = [];
  let skipped = false;
  for (const count of counts.values()) {
    if (!skipped && count === best.count) {
      skipped = true;
      continue;
    }
    rest.push(count);
  }
  if (rest.length === 0) return best.count >= 50 ? best : null;
  const sorted = rest.sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return best.count >= median * 5 ? best : null;
}

function inPeriod(createdAt: string, period: string) {
  return createdAt.slice(0, 7) === period;
}

function counted(event: TrafficEvent, period: string, kind: TrafficEvent["kind"]) {
  return event.kind === kind && event.payable && event.excluded !== true && inPeriod(event.createdAt, period);
}

function dayCount(period: string, today: string) {
  const [year, month] = period.split("-").map(Number);
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (today.slice(0, 7) !== period) return length;
  return Math.min(length, Math.max(1, Number(today.slice(8, 10)) || 1));
}

function dayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function trafficReview(input: {
  period: string;
  today: string;
  affiliates: TrafficAffiliate[];
  events: TrafficEvent[];
  keeps: TrafficKeep[];
}) {
  const affiliates = [...input.affiliates].sort((left, right) => left.name.localeCompare(right.name, "en"));
  const rows = affiliates.map((affiliate, index) => {
    const own = input.events.filter((event) => event.code === affiliate.code);
    const liveClicks = own.filter((event) => counted(event, input.period, "click"));
    const liveViews = own.filter((event) => counted(event, input.period, "page_view"));
    const excluded = own.filter((event) => event.kind === "click" && event.excluded === true && inPeriod(event.createdAt, input.period)).length;
    const spike = findClickSpike(liveClicks.map((event) => event.createdAt));
    const kept = spike != null && input.keeps.some((keep) => keep.code === affiliate.code && keep.hour === spike.hour);
    const flagged = spike != null && !kept;
    const status: TrafficRowStatus = flagged ? "flagged" : "clear";
    return {
      code: affiliate.code,
      name: affiliate.name,
      initials: affiliate.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?",
      color: COLORS[index % COLORS.length],
      clicks: liveClicks.length,
      pageViews: liveViews.length,
      excluded,
      status,
      spikeHour: spike?.hour ?? "",
      spikeCount: spike?.count ?? 0,
      spikeLabel: spike ? `${dayLabel(spike.hour.slice(0, 10))}, ${spike.count.toLocaleString("en-US")} clicks in 1 hour` : "",
    };
  });
  const shown = dayCount(input.period, input.today);
  const days = Array.from({ length: shown }, (_, index) => {
    const date = `${input.period}-${String(index + 1).padStart(2, "0")}`;
    const parts = rows.map((row) => {
      const clicks = input.events.filter(
        (event) => event.code === row.code && counted(event, input.period, "click") && event.createdAt.slice(0, 10) === date,
      ).length;
      const excluded = input.events.filter(
        (event) => event.code === row.code && event.kind === "click" && event.excluded === true && event.createdAt.slice(0, 10) === date,
      ).length;
      return { code: row.code, clicks, excluded, flagged: row.status === "flagged" && row.spikeHour.slice(0, 10) === date };
    });
    return { date, label: dayLabel(date), parts };
  });
  const flagged = rows.some((row) => row.status === "flagged");
  const steps = [
    ["1", "Traffic is tracked", "Bots, own devices and repeats removed"],
    ["2", "Review flags", "Check unusual spikes"],
  ].map((step, index) => ({
    n: step[0],
    label: step[1],
    sub: step[2],
    tone: (index === 0 || !flagged ? "done" : "current") as TrafficStepTone,
  }));
  return {
    rows,
    days,
    steps,
    totals: {
      clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
      pageViews: rows.reduce((sum, row) => sum + row.pageViews, 0),
      excluded: rows.reduce((sum, row) => sum + row.excluded, 0),
    },
  };
}
