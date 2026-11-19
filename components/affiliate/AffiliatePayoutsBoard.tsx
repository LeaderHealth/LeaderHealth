"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/affiliate/format";
import { SlidingTabs, TabPanel } from "./SlidingTabs";
import {
  PAYOUT_KINDS,
  PAYOUT_STATUSES,
  itemsInRange,
  moneyTop,
  payoutCents,
  payoutDateLabel,
  payoutKindOrder,
  payoutMonths,
  payoutReceipts,
  type PayoutBoardItem,
  type PayoutBoardRange,
  type PayoutBoardStatus,
  type PayoutLabPeriod,
  type PayoutReceipt,
} from "@/lib/affiliate/payout-board";

const selectedChip = "border-ink bg-ink text-white";
const quietChip = "border-[#CDBDBA] bg-white text-ink";

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${pressed ? selectedChip : quietChip}`}>
      {children}
    </button>
  );
}

const PAGE_SIZE = 10;

export function AffiliatePayoutsBoard({ today, items, labs }: { today: string; items: PayoutBoardItem[]; labs: PayoutLabPeriod[] }) {
  const [range, setRange] = useState<PayoutBoardRange>("90");
  const [tab, setTab] = useState<"earnings" | "history">("earnings");
  const [status, setStatus] = useState<PayoutBoardStatus | "all">("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openLab, setOpenLab] = useState<string | null>(null);
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);
  const visible = useMemo(() => itemsInRange(items, today, range), [items, today, range]);
  const labRows = useMemo(() => itemsInRange(labs, today, range), [labs, today, range]);
  const earned = visible.filter((item) => item.status === "approved" || item.status === "paid");
  const approvedWaiting = items.filter((item) => item.status === "approved");
  const months = useMemo(() => payoutMonths(items, today, range), [items, today, range]);
  const top = moneyTop(Math.max(0, ...months.map((month) => month.total)));
  const receipts = useMemo(() => payoutReceipts(items, today, range), [items, today, range]);
  const filtered = visible.filter((item) => status === "all" || item.status === status);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const cards = [
    { label: "Total earned", value: formatCents(payoutCents(earned)), detail: "Approved and paid", highlight: false },
    { label: "Pending payment", value: formatCents(payoutCents(visible.filter((item) => item.status === "approved"))), detail: "Approved, not sent yet", highlight: false },
    { label: "Paid to date", value: formatCents(payoutCents(visible.filter((item) => item.status === "paid"))), detail: "Sent to you", highlight: false },
    { label: "Next payout", value: formatCents(payoutCents(approvedWaiting)), detail: "Sent manually. We’ll email you when it goes out.", highlight: true },
  ];
  const counts = (id: PayoutBoardStatus | "all") => visible.filter((item) => id === "all" || item.status === id).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id="portal-payouts-title" className="text-[32px] font-medium leading-none">Payouts</h2>
          <p className="text-[15px] text-[#4A3A37]">What you’ve earned from marketing and lab commission, and when it’s paid.</p>
        </div>
        <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
          {([["30", "30 days"], ["90", "90 days"], ["all", "All time"]] as const).map(([id, label]) => (
            <Chip key={id} pressed={range === id} onClick={() => { setRange(id); setPage(0); setOpenId(null); setOpenLab(null); setOpenReceipt(null); }}>{label}</Chip>
          ))}
        </div>
      </div>

      <section aria-label="Payout overview" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`flex flex-col gap-1.5 rounded-[20px] bg-white px-5 py-[18px] ${card.highlight ? "border-2 border-ink" : "border-2 border-transparent"}`}>
            <span className="text-sm text-[#4A3A37]">{card.label}</span>
            <span className="text-[30px] font-medium tracking-tight">{card.value}</span>
            <span className="text-[13px] text-[#6B5A57]">{card.detail}</span>
          </div>
        ))}
      </section>

      <SlidingTabs
        variant="track"
        label="Payouts sections"
        items={([["earnings", "Earnings"], ["history", "Payout history"]] as const).map(([id, name]) => ({
          id,
          label: name,
          current: tab === id,
          onSelect: () => setTab(id),
        }))}
      />

      <TabPanel tabKey={tab} className="flex flex-col gap-5">
      {tab === "earnings" ? <div className="flex flex-col gap-5">
      <section aria-labelledby="payout-breakdown-title" className="flex flex-col gap-4 rounded-3xl bg-white px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 id="payout-breakdown-title" className="flex-1 text-xl font-semibold">Where your earnings come from</h3>
          <span className="text-[13px] text-[#6B5A57]">Approved and paid earnings</span>
        </div>
        <div className="flex flex-wrap items-start gap-7">
          <div className="flex min-w-[280px] flex-1 flex-col gap-2">
            <div className="flex gap-2.5">
              <div aria-hidden="true" className="flex h-[200px] w-11 flex-col justify-between text-right text-xs text-[#6B5A57]">
                <span>{formatCents(top)}</span>
                <span>{formatCents(top / 2)}</span>
                <span>{formatCents(0)}</span>
              </div>
              <div
                role="img"
                aria-label={`Earnings by month: ${months.map((month) => `${month.label} ${formatCents(month.total)}`).join(", ")}`}
                className="flex h-[200px] flex-1 items-end gap-4 border-b border-[#DCCFCC] bg-[linear-gradient(#F0E8E6_1px,transparent_1px)] bg-[length:100%_100px] px-2 sm:gap-7"
              >
                {months.map((month) => (
                  <div key={month.period} className="relative flex h-full max-w-[120px] flex-1 flex-col justify-end">
                    {month.total > 0 ? <span className="mb-1 text-center text-[13px] font-semibold">{formatCents(month.total)}</span> : null}
                    <Bar title={`Lab commission ${formatCents(month.lab)}`} cents={month.lab} top={top} color="#C9A27E" rounded={month.lab > 0} />
                    <Bar title={`Website performance ${formatCents(month.web)}`} cents={month.web} top={top} color="#E39A93" rounded={month.lab === 0 && month.web > 0} />
                    <Bar title={`Social performance ${formatCents(month.social)}`} cents={month.social} top={top} color="#A8706A" rounded={month.lab === 0 && month.web === 0 && month.social > 0} />
                    <Bar title={`Base payments ${formatCents(month.base)}`} cents={month.base} top={top} color="#33130F" rounded={month.lab === 0 && month.web === 0 && month.social === 0 && month.base > 0} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pl-[54px] sm:gap-7">
              {months.map((month) => (
                <span key={month.period} className="max-w-[120px] flex-1 text-center text-[13px] text-[#4A3A37]">{month.label}</span>
              ))}
            </div>
          </div>
          <div className="flex min-w-[260px] flex-1 flex-col">
            {payoutKindOrder().map((kind) => (
              <div key={kind} className="flex items-center gap-3 border-t border-[#F0E8E6] py-3">
                <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: PAYOUT_KINDS[kind].color }} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{PAYOUT_KINDS[kind].label}</span>
                  <span className="text-[13px] text-[#6B5A57]">{PAYOUT_KINDS[kind].detail}</span>
                </span>
                <span className="text-base font-semibold">{formatCents(payoutCents(earned.filter((item) => item.kind === kind)))}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-ink pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatCents(payoutCents(earned))}</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="marketing-payments-title" className="flex flex-col gap-4 rounded-3xl bg-white px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="marketing-payments-title" className="flex-1 text-xl font-semibold">My marketing payments</h3>
          <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
            {([["all", "All"], ["review", "Pending review"], ["approved", "Approved"], ["paid", "Paid"], ["hold", "On hold"]] as const).map(([id, label]) => (
              <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setPage(0); setOpenId(null); }}>{`${label} ${counts(id)}`}</Chip>
            ))}
          </div>
        </div>
        <div className="hidden grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_1fr] gap-3.5 border-b border-[#E8DEDC] px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B5A57] lg:grid">
          <span>Content or campaign</span><span>Payment type</span><span className="text-right">Amount</span><span>Status</span><span />
        </div>
        {shown.length === 0 ? <p className="px-2 text-[15px] text-[#6B5A57]">Nothing here for this filter.</p> : null}
        {shown.map((item) => {
          const open = openId === item.id;
          const tone = PAYOUT_STATUSES[item.status];
          return (
            <div key={item.id} className="border-b border-[#F0E8E6]">
              <div className="grid items-center gap-3 px-2 py-3 lg:grid-cols-[2.4fr_1.4fr_0.9fr_1.2fr_1fr]">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                  <span className="block text-[13px] text-[#6B5A57]">Earned {payoutDateLabel(item.earnedOn)}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PAYOUT_KINDS[item.kind].color }} />
                  {PAYOUT_KINDS[item.kind].label}
                </span>
                <span className="text-base font-semibold lg:text-right">{formatCents(item.amountCents)}</span>
                <span><span className="inline-flex rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background: tone.background, color: tone.color }}>{tone.label}</span></span>
                <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : item.id)} className="h-9 justify-self-start rounded-full border border-[#CDBDBA] bg-white px-3.5 text-sm font-medium text-ink lg:justify-self-end">
                  {open ? "Hide details" : "View details"}
                </button>
              </div>
              {open ? (
                <div className="mx-2 mb-3.5 grid gap-4 rounded-[18px] bg-[#F7F3F2] px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Detail label="Agreed terms" value={item.terms} />
                  <Detail label="Eligible work" value={item.work} />
                  <Detail label="Approved" value={item.approved} />
                  <Detail label="Payment" value={item.paymentNote} />
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length > PAGE_SIZE ? (
          <nav aria-label="Marketing payments pages" className="flex items-center justify-end gap-2.5 pt-1">
            <span className="mr-auto text-sm text-[#4A3A37]">Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <button type="button" aria-label="Previous 10 payments" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setOpenId(null); }} className="grid h-10 w-10 place-items-center rounded-full border border-[#CDBDBA] bg-white text-ink disabled:opacity-40">‹</button>
            <span className="min-w-12 text-center text-sm font-semibold">{currentPage + 1} of {pages}</span>
            <button type="button" aria-label="Next 10 payments" disabled={currentPage >= pages - 1} onClick={() => { setPage(currentPage + 1); setOpenId(null); }} className="grid h-10 w-10 place-items-center rounded-full border border-[#CDBDBA] bg-white text-ink disabled:opacity-40">›</button>
          </nav>
        ) : null}
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 pt-1 text-[13px] text-[#4A3A37]">
          <span><b>Pending review</b> · waiting for Leader Health</span>
          <span><b>Approved</b> · waiting to be sent</span>
          <span><b>Paid</b> · sent to you</span>
          <span><b>On hold</b> · needs a closer look</span>
        </div>
      </section>

      <section aria-labelledby="lab-period-title" className="flex flex-col gap-4 rounded-3xl bg-white px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-1">
          <h3 id="lab-period-title" className="text-xl font-semibold">Lab commission by pay period</h3>
          <p className="text-sm text-[#4A3A37]">Each lab order you referred gets a random referral ID. It can’t be traced back to a person.</p>
        </div>
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr] gap-3.5 border-b border-[#E8DEDC] px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B5A57] lg:grid">
          <span>Pay period</span><span className="text-right">Conversions</span><span className="text-right">Commission</span><span>Status</span><span />
        </div>
        {labRows.length === 0 ? <p className="px-2 text-[15px] text-[#6B5A57]">No lab commission in this range.</p> : null}
        {labRows.map((row) => {
          const open = openLab === row.id;
          const paid = row.tone === "paid";
          return (
            <div key={row.id} className="border-b border-[#F0E8E6]">
              <div className="grid items-center gap-3 px-2 py-3.5 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr_1fr]">
                <span>
                  <span className="block text-[15px] font-semibold">{row.label}</span>
                  <span className="block text-[13px] text-[#6B5A57]">{row.payNote}</span>
                </span>
                <span className="text-base lg:text-right">{row.count}</span>
                <span className="text-base font-semibold lg:text-right">{formatCents(row.amountCents)}</span>
                <span><span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${paid ? "bg-[#DDF0E4] text-[#1D6340]" : "bg-[#FBEFD6] text-[#7A4E00]"}`}>{paid ? "Paid" : "In progress"}</span></span>
                <button type="button" aria-expanded={open} onClick={() => setOpenLab(open ? null : row.id)} className="h-9 justify-self-start rounded-full border border-[#CDBDBA] bg-white px-3.5 text-sm font-medium text-ink lg:justify-self-end">
                  {open ? "Hide referral IDs" : "Referral IDs"}
                </button>
              </div>
              {open ? (
                <div className="mx-2 mb-3.5 flex flex-col gap-2.5 rounded-[18px] bg-[#F7F3F2] px-4 py-3.5">
                  <div className="flex flex-wrap gap-2">
                    {row.refs.length === 0 ? <span className="text-sm text-[#6B5A57]">No referral IDs for this period.</span> : null}
                    {row.refs.map((ref) => (
                      <span key={ref.id} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                        <span className="font-mono text-sm font-semibold">{ref.id}</span>
                        <span className="text-[13px] text-[#6B5A57]">{ref.source}</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[13px] text-[#4A3A37]">Commission is paid on the period total. No names, contact details, products, amounts per order or purchase dates are shown.</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
      </div> : null}

      {tab === "history" ? (
      <section aria-labelledby="payout-history-title" className="flex flex-col gap-4 rounded-3xl bg-white px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="payout-history-title" className="flex-1 text-xl font-semibold">Payout history</h3>
          <span className="text-sm text-[#4A3A37]">Leader Health sends each payout manually.</span>
        </div>
        <div className="hidden grid-cols-[1.2fr_2fr_1fr_1fr_auto] gap-3.5 border-b border-[#E8DEDC] px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B5A57] lg:grid">
          <span>Payment date</span><span>Description</span><span className="text-right">Amount</span><span>Status</span><span />
        </div>
        {receipts.length === 0 ? <p className="px-2 text-[15px] text-[#6B5A57]">No payments have been sent yet.</p> : null}
        {receipts.map((receipt) => {
          const open = openReceipt === receipt.key;
          return (
            <div key={receipt.key} className="border-b border-[#F0E8E6]">
              <div className="grid items-center gap-3 px-2 py-3.5 lg:grid-cols-[1.2fr_2fr_1fr_1fr_auto]">
                <span className="text-[15px] font-semibold">{payoutDateLabel(receipt.date)}</span>
                <span className="text-[15px]">{receipt.description}</span>
                <span className="text-base font-semibold lg:text-right">{formatCents(receipt.amountCents)}</span>
                <span><span className="inline-flex rounded-full bg-[#DDF0E4] px-3 py-1 text-[13px] font-semibold text-[#1D6340]">Paid</span></span>
                <span className="flex justify-self-start gap-2 lg:justify-self-end">
                  <button type="button" aria-expanded={open} onClick={() => setOpenReceipt(open ? null : receipt.key)} className="h-9 rounded-full border border-[#CDBDBA] bg-white px-3.5 text-sm font-medium text-ink">
                    {open ? "Hide receipt" : "View receipt"}
                  </button>
                  <button type="button" aria-label={`Download receipt for ${payoutDateLabel(receipt.date)}`} onClick={() => downloadReceipt(receipt)} className="h-9 text-sm text-ink underline">Download</button>
                </span>
              </div>
              {open ? (
                <div className="mx-2 mb-3.5 flex max-w-xl flex-col gap-2 rounded-[18px] border border-[#E8DEDC] px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold">Receipt · {receipt.reference}</span>
                    <span className="text-[13px] text-[#6B5A57]">{receipt.method}</span>
                  </div>
                  {receipt.lines.map((line) => (
                    <div key={line.id} className="flex justify-between gap-3 border-t border-[#F0E8E6] py-1.5 text-sm">
                      <span>{line.title} <span className="text-[#6B5A57]">· {PAYOUT_KINDS[line.kind].label}</span></span>
                      <span className="font-semibold">{formatCents(line.amountCents)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t-2 border-ink pt-2 text-[15px] font-semibold">
                    <span>Total paid</span>
                    <span>{formatCents(receipt.amountCents)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
      ) : null}
      </TabPanel>
      <p className="text-[13px] text-[#6B5A57]">Lab commission shows monthly totals only. No patient, order or treatment details are ever shown.</p>
    </div>
  );
}

function downloadReceipt(receipt: PayoutReceipt) {
  const lines = [
    `Receipt · ${receipt.reference}`,
    receipt.method,
    payoutDateLabel(receipt.date),
    receipt.description,
    ...receipt.lines.map((line) => `${line.title} · ${PAYOUT_KINDS[line.kind].label} · ${formatCents(line.amountCents)}`),
    `Total paid · ${formatCents(receipt.amountCents)}`,
  ];
  const file = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leader-health-receipt-${receipt.date}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function Bar({ title, cents, top, color, rounded }: { title: string; cents: number; top: number; color: string; rounded: boolean }) {
  if (cents <= 0) return null;
  return <div title={title} className={rounded ? "rounded-t-md" : ""} style={{ height: Math.max(2, Math.round((cents / top) * 190)), background: color }} />;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-[#6B5A57]">{label}</span>
      <span className="text-[15px] leading-snug">{value}</span>
    </div>
  );
}
