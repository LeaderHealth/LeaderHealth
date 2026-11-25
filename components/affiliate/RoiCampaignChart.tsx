import { formatCents } from "@/lib/affiliate/format";
import { ROI_UNASSIGNED, type RoiRow } from "@/lib/affiliate/roi";

const HEIGHT = 260;
const TOP = 10;
const BOTTOM = 250;

const MONEY = [
  { key: "revenue", label: "Revenue", color: "#33130F" },
  { key: "cost", label: "Cost", color: "#D9534A" },
  { key: "profit", label: "Profit", color: "#1D6340" },
] as const;

const COUNTS = [
  { key: "views", label: "Views", color: "#4A3A37" },
  { key: "engagements", label: "Engagements", color: "#C4A15A" },
  { key: "orders", label: "Orders", color: "#7A4E00" },
] as const;

export type RoiChartRow = RoiRow & { views: number; engagements: number };

function dollars(cents: number) {
  return cents / 100;
}

function bound(peak: number) {
  if (peak <= 0) return 0;
  const power = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / power) * power;
}

function money(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);
  if (value >= 1000) return `${sign}$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  if (value >= 100) return `${sign}$${Math.round(value)}`;
  if (value > 0 && value < 1) return `${sign}$${value.toFixed(2)}`;
  if (value === 0) return "$0";
  return `${sign}$${Math.round(value)}`;
}

function countLabel(value: number) {
  if (value > 0 && value < 1) return value.toFixed(1);
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return Math.round(value).toLocaleString("en-US");
}

export function RoiCampaignChart({
  rows,
  costCents,
  revenueCents,
  profitCents,
}: {
  rows: RoiChartRow[];
  costCents: number;
  revenueCents: number;
  profitCents: number;
}) {
  const amounts = rows.flatMap((row) => [dollars(row.revenueCents), dollars(row.costCents), dollars(row.profitCents)]);
  const yMax = bound(Math.max(0, ...amounts)) || 1;
  const yMin = -bound(Math.max(0, ...amounts.map((value) => -value)));
  const span = yMax - yMin || 1;
  const yOf = (value: number) => BOTTOM - ((value - yMin) / span) * (BOTTOM - TOP);
  const zero = yOf(0);
  const moneyTicks = yMin < 0 ? [yMax, 0, yMin] : [yMax, yMax / 2, 0];
  const countMax = bound(Math.max(0, ...rows.flatMap((row) => [row.views, row.engagements, row.orders]))) || 1;
  const countY = (value: number) => zero - (value / countMax) * (zero - TOP);
  const countTicks = [countMax, countMax / 2, 0];
  const count = Math.max(rows.length, 1);
  const slot = 1000 / count;
  const series = MONEY.length + COUNTS.length;
  const bar = Math.min(28, slot * 0.12);
  const gap = bar * 0.28;
  const cluster = bar * series + gap * (series - 1);
  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const engagements = rows.reduce((sum, row) => sum + row.engagements, 0);
  const orders = rows.reduce((sum, row) => sum + row.orders, 0);
  const moneyTotals = { revenue: revenueCents, cost: costCents, profit: profitCents };
  const countTotals = { views, engagements, orders };

  return (
    <section aria-labelledby="roi-chart-title" className="rounded-[28px] bg-white p-4 sm:p-6">
      <h3 id="roi-chart-title" className="text-xl">Campaign results</h3>
      <p className="mt-2 max-w-2xl text-sm text-brown">Cost, revenue, and profit for each campaign in this range. Views and engagements come from posts in that campaign. Orders are sales placed during that campaign&apos;s dates. A campaign without dates uses this range.</p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#4A3A37]">
        {MONEY.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: item.color }} />
            {item.label} <b className="text-ink">{formatCents(moneyTotals[item.key])}</b>
          </span>
        ))}
        {COUNTS.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px]" style={{ background: item.color }} />
            {item.label} <b className="text-ink">{countLabel(countTotals[item.key])}</b>
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2.5">
        <div aria-hidden="true" className="relative w-14 shrink-0 text-right text-xs text-[#6B5A57]" style={{ height: HEIGHT }}>
          {moneyTicks.map((tick) => (
            <span key={`money-${tick}`} className="absolute right-0 -translate-y-1/2" style={{ top: yOf(tick) }}>
              {money(tick)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg role="img" aria-label="Cost, revenue, profit, views, engagements, and orders by campaign" viewBox={`0 0 1000 ${HEIGHT}`} preserveAspectRatio="none" className="block w-full overflow-visible" style={{ height: HEIGHT }}>
            {moneyTicks.map((tick) => (
              <line key={`grid-${tick}`} x1="0" x2="1000" y1={yOf(tick)} y2={yOf(tick)} stroke={tick === 0 ? "#DCCFCC" : "#F0E8E6"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            {rows.map((row, index) => {
              const center = slot * index + slot / 2;
              const start = center - cluster / 2;
              const moneyValues = [dollars(row.revenueCents), dollars(row.costCents), dollars(row.profitCents)];
              const countValues = [row.views, row.engagements, row.orders];
              return (
                <g key={row.campaign}>
                  {MONEY.map((item, seriesIndex) => {
                    const value = moneyValues[seriesIndex] ?? 0;
                    if (value === 0) return null;
                    const y = yOf(value);
                    return (
                      <rect key={item.key} x={start + seriesIndex * (bar + gap)} y={Math.min(y, zero)} width={bar} height={Math.max(Math.abs(y - zero), 1)} fill={item.color} rx="2">
                        <title>{`${row.campaign} ${item.label}: ${formatCents(Math.round(value * 100))}`}</title>
                      </rect>
                    );
                  })}
                  {COUNTS.map((item, seriesIndex) => {
                    const value = countValues[seriesIndex] ?? 0;
                    if (value === 0) return null;
                    const y = countY(value);
                    return (
                      <rect key={item.key} x={start + (seriesIndex + MONEY.length) * (bar + gap)} y={Math.min(y, zero)} width={bar} height={Math.max(Math.abs(y - zero), 1)} fill={item.color} rx="2">
                        <title>{`${row.campaign} ${item.label}: ${countLabel(value)}`}</title>
                      </rect>
                    );
                  })}
                </g>
              );
            })}
          </svg>
          {rows.length > 0 ? (
            <div className="flex pt-1.5 text-xs text-[#6B5A57]">
              {rows.map((row) => (
                <span key={row.campaign} className="min-w-0 flex-1 truncate px-1 text-center" title={row.campaign}>
                  {row.campaign}
                </span>
              ))}
            </div>
          ) : (
            <p className="pt-3 text-sm text-brown">No campaigns in this range.</p>
          )}
        </div>
        <div aria-hidden="true" className="relative w-12 shrink-0 text-xs text-[#4A3A37]" style={{ height: HEIGHT }}>
          {countTicks.map((tick) => (
            <span key={`count-${tick}`} className="absolute left-0 -translate-y-1/2" style={{ top: countY(tick) }}>
              {countLabel(tick)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function chartRowsFor(rows: RoiRow[], social: { campaign: string; views: number; engagements: number }[]): RoiChartRow[] {
  const byName = new Map(social.map((item) => [item.campaign.toLowerCase(), item]));
  const chartRows: RoiChartRow[] = rows.map((row) => {
    const stats = byName.get(row.campaign.toLowerCase());
    return { ...row, views: stats?.views ?? 0, engagements: stats?.engagements ?? 0 };
  });
  for (const item of social) {
    if (chartRows.some((row) => row.campaign.toLowerCase() === item.campaign.toLowerCase())) continue;
    chartRows.push({ campaign: item.campaign, orders: 0, costCents: 0, revenueCents: 0, profitCents: 0, views: item.views, engagements: item.engagements });
  }
  return chartRows.sort((left, right) => {
    if (left.campaign === ROI_UNASSIGNED) return 1;
    if (right.campaign === ROI_UNASSIGNED) return -1;
    return left.campaign.localeCompare(right.campaign);
  });
}
