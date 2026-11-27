import Link from "next/link";
import { saveMarketingCostAction } from "@/app/admin/affiliates/actions";
import { FilterDatePicker } from "@/components/affiliate/FilterDatePicker";
import { FilterDropdown } from "@/components/affiliate/FilterDropdown";
import { MARKETING_COST_NOTE_MAX } from "@/lib/affiliate/roi";

const fieldClass =
  "min-h-11 w-full min-w-0 rounded-full border border-ink/40 bg-background px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
export const costButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50";

export function MarketingCostFields({
  today,
  amount = "",
  note = "",
  spentOn,
}: {
  today: string;
  amount?: string;
  note?: string;
  spentOn?: string;
}) {
  return (
    <>
      <label className="block min-w-0 text-sm text-brown">
        Amount
        <span className="relative mt-2 flex">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink">$</span>
          <input name="amount" required inputMode="decimal" autoComplete="off" placeholder="0.00" defaultValue={amount} className={`${fieldClass} pl-8`} />
        </span>
      </label>
      <label className="block min-w-0 text-sm text-brown">
        What for <span className="text-[#6B5A57]">(optional)</span>
        <input name="note" maxLength={MARKETING_COST_NOTE_MAX} autoComplete="off" placeholder="e.g. Event booth" defaultValue={note} className={`${fieldClass} mt-2`} />
      </label>
      <label className="block min-w-0 text-sm text-brown">
        Date spent
        <span className="mt-2 flex">
          <FilterDatePicker variant="field" label="Date spent" placeholder="Choose a date" name="spentOn" required defaultValue={spentOn ?? today} max={today} />
        </span>
      </label>
    </>
  );
}

export function MarketingCostForm({
  range,
  today,
  campaigns,
  campaign,
  stacked = false,
  className = "",
}: {
  range: string;
  today: string;
  campaigns?: string[];
  campaign?: string;
  stacked?: boolean;
  className?: string;
}) {
  const choosing = !campaign;
  const empty = choosing && (campaigns?.length ?? 0) === 0;
  const grid = stacked ? "grid gap-3" : `grid gap-4 sm:grid-cols-2 ${choosing ? "xl:grid-cols-[1.2fr_0.8fr_1.2fr_1fr_auto]" : "xl:grid-cols-[0.8fr_1.2fr_1fr_auto]"}`;
  return (
    <form action={saveMarketingCostAction} className={className}>
      <input type="hidden" name="range" value={range} />
      {campaign ? (
        <>
          <input type="hidden" name="campaign" value={campaign} />
          <input type="hidden" name="back" value="detail" />
        </>
      ) : null}
      <div className={grid}>
        {choosing ? (
          <label className="block min-w-0 text-sm text-brown">
            Campaign
            {empty ? (
              <span className={`${fieldClass} mt-2 flex items-center text-brown`}>
                <Link href="/admin/affiliates/campaigns/new" className="font-medium text-ink underline underline-offset-4">
                  Create a campaign
                </Link>
                <span className="ml-1">first.</span>
              </span>
            ) : (
              <FilterDropdown
                variant="field"
                className="mt-2"
                label="Campaign"
                name="campaign"
                required
                placeholder="Choose a campaign"
                options={(campaigns ?? []).map((name) => ({ value: name, label: name }))}
              />
            )}
          </label>
        ) : null}
        <MarketingCostFields today={today} />
        <div className="flex items-end">
          <button type="submit" className={costButtonClass} disabled={empty}>
            Save cost
          </button>
        </div>
      </div>
    </form>
  );
}
