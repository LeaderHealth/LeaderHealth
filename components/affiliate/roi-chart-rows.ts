import { ROI_UNASSIGNED, type RoiRow } from "@/lib/affiliate/roi";

export type RoiChartRow = RoiRow & { views: number; engagements: number };

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
