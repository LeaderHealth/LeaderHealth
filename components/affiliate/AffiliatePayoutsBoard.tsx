"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatCents } from "@/lib/affiliate/format";
import { SlidingTabs, TabPanel } from "./SlidingTabs";
import {
  PAYOUT_KINDS,
  PAYOUT_STATUSES,
  itemsInRange,
  payoutCents,
  payoutDateLabel,
  payoutKindOrder,
  payoutMonthLabel,
  payoutPeriodTotals,
  payoutRangeStart,
  payoutReceipts,
  type PayoutBoardItem,
  type PayoutBoardRange,
  type PayoutBoardStatus,
  type PayoutLabPeriod,
  type PayoutPeriodTotal,
  type PayoutReceipt,
} from "@/lib/affiliate/payout-board";

const KIND_SHORT = { base: "Agreement", social: "Social", web: "Website", lab: "Lab" } as const;
const COLUMNS = "minmax(0,1.5fr) repeat(4,minmax(0,0.8fr)) minmax(0,1fr) minmax(0,1.1fr) 40px";
const FILTER_EMPTY: Record<PayoutBoardStatus, string> = {
  review: "No months waiting for review.",
  approved: "Nothing approved and waiting to be sent.",
  paid: "No paid months yet.",
  hold: "Nothing on hold. That’s good.",
};

function amountCell(cents: number) {
  return cents > 0 ? { text: formatCents(cents), color: "#2A1714" } : { text: "—", color: "#B3A5A2" };
}

function monthsInRange(today: string, range: PayoutBoardRange) {
  if (range === "all") return [today.slice(0, 7)];
  const start = payoutRangeStart(today, range).slice(0, 7);
  const end = today.slice(0, 7);
  const periods: string[] = [];
  let cursor = start;
  while (cursor && cursor <= end) {
    periods.push(cursor);
    const [year, month] = cursor.split("-").map(Number);
    cursor = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
  }
  return periods.sort((left, right) => right.localeCompare(left));
}

function blankMonth(period: string): PayoutPeriodTotal {
  return { period, label: payoutMonthLabel(period), total: 0, base: 0, social: 0, web: 0, lab: 0, status: "review", items: [] };
}

function monthWhen(month: PayoutPeriodTotal, today: string) {
  if (month.items.length === 0) return month.period === today.slice(0, 7) ? "Month still open" : "Nothing counted";
  if (month.status === "mixed") return "See details";
  if (month.status === "paid") {
    const notes = [...new Set(month.items.map((item) => item.paymentNote))];
    return notes.length === 1 ? notes[0] : "Paid";
  }
  if (month.status === "approved") {
    const dates = [...new Set(month.items.map((item) => item.approved))].filter((note) => note !== "Not yet" && note !== "On hold" && note !== "After this month ends");
    return dates.length === 1 ? `Approved ${dates[0]}` : "In the next manual payout";
  }
  if (month.status === "hold") return "Waiting on review";
  if (month.period === today.slice(0, 7)) return "Month still open";
  const notes = [...new Set(month.items.map((item) => item.approved))];
  return notes.length === 1 && notes[0] === "After this month ends" ? notes[0] : "Waiting for review";
}

function kindSummary(rows: PayoutBoardItem[], refs: string[]) {
  const work = rows.map((item) => item.work.trim()).filter(Boolean).join(" ");
  const summary = work || "Nothing counted";
  return refs.length > 0 ? `${summary} Referral IDs: ${refs.join(", ")}.` : summary;
}

const slide = "duration-[140ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

const selectedChip = "border-ink bg-ink text-white";
const quietChip = "border-[#CDBDBA] bg-white text-ink";

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${pressed ? selectedChip : quietChip}`}>
      {children}
    </button>
  );
}

export function AffiliatePayoutsBoard({ today, items, labs }: { today: string; items: PayoutBoardItem[]; labs: PayoutLabPeriod[] }) {
  const [range, setRange] = useState<PayoutBoardRange>("90");
  const [tab, setTab] = useState<"earnings" | "history">("earnings");
  const [status, setStatus] = useState<PayoutBoardStatus | "all">("all");
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);
  const [openReceipt, setOpenReceipt] = useState<string | null>(null);
  const visible = useMemo(() => itemsInRange(items, today, range), [items, today, range]);
  const earned = visible.filter((item) => item.status === "approved" || item.status === "paid");
  const approvedWaiting = items.filter((item) => item.status === "approved");
  const receipts = useMemo(() => payoutReceipts(items, today, range), [items, today, range]);
  const filtered = visible.filter((item) => status === "all" || item.status === status);
  const periods = useMemo(() => {
    const current = today.slice(0, 7);
    const totals = new Map(payoutPeriodTotals(status === "all" ? visible : filtered).map((month) => [month.period, month]));
    const openMonth = !visible.some((item) => item.earnedOn.startsWith(current));
    const slots = [...new Set([
      ...(status === "all" ? monthsInRange(today, range) : []),
      ...(status === "review" && openMonth ? [current] : []),
      ...totals.keys(),
    ])].sort((left, right) => right.localeCompare(left));
    return slots
      .map((period) => totals.get(period) ?? blankMonth(period))
      .filter((month) => status === "all" || month.items.length > 0 || (status === "review" && month.period === today.slice(0, 7) && month.items.length === 0));
  }, [filtered, range, status, today, visible]);
  const cards = [
    { label: "Total earned", value: formatCents(payoutCents(earned)), detail: "Approved and paid", highlight: false },
    { label: "Pending payment", value: formatCents(payoutCents(visible.filter((item) => item.status === "approved"))), detail: "Approved, not sent yet", highlight: false },
    { label: "Paid to date", value: formatCents(payoutCents(visible.filter((item) => item.status === "paid"))), detail: "Sent to you", highlight: false },
    { label: "Next payout", value: formatCents(payoutCents(approvedWaiting)), detail: "Sent manually. We’ll email you when it goes out.", highlight: true },
  ];
  const counts = (id: PayoutBoardStatus | "all") => {
    if (id === "all") return new Set([...monthsInRange(today, range), ...payoutPeriodTotals(visible).map((month) => month.period)]).size;
    return payoutPeriodTotals(visible.filter((item) => item.status === id)).length + (id === "review" && !visible.some((item) => item.earnedOn.startsWith(today.slice(0, 7))) ? 1 : 0);
  };
  const shown = {
    base: periods.reduce((sum, month) => sum + month.base, 0),
    social: periods.reduce((sum, month) => sum + month.social, 0),
    web: periods.reduce((sum, month) => sum + month.web, 0),
    lab: periods.reduce((sum, month) => sum + month.lab, 0),
    total: periods.reduce((sum, month) => sum + month.total, 0),
  };
  const filters = ([["all", "All"], ["review", "Pending review"], ["approved", "Approved"], ["paid", "Paid"], ["hold", "On hold"]] as const).map(([id, label]) => {
    const count = counts(id);
    return { id, label, count, off: count === 0 && id !== "all" };
  });
  const filterKey = filters.map((item) => `${item.id}:${item.count}:${item.off ? 1 : 0}`).join("|");
  const filterRef = useRef<HTMLDivElement>(null);
  const filterNodes = useRef(new Map<string, HTMLButtonElement>());
  const [filterFrames, setFilterFrames] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
  useLayoutEffect(() => {
    const root = filterRef.current;
    if (!root) return;
    const place = () => {
      const rootBox = root.getBoundingClientRect();
      const next: Record<string, { x: number; y: number; w: number; h: number }> = {};
      for (const [id, node] of filterNodes.current) {
        const box = node.getBoundingClientRect();
        next[id] = { x: box.left - rootBox.left + root.scrollLeft, y: box.top - rootBox.top + root.scrollTop, w: box.width, h: box.height };
      }
      setFilterFrames(next);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    for (const node of filterNodes.current.values()) observer.observe(node);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [filterKey]);
  const filterFrame = filterFrames[status];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 id="portal-payouts-title" className="text-[32px] font-medium leading-none">Payouts</h2>
          <p className="text-[15px] text-[#4A3A37]">What you’ve earned from marketing and lab commission, and when it’s paid.</p>
        </div>
        <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
          {([["30", "30 days"], ["90", "90 days"], ["all", "All time"]] as const).map(([id, label]) => (
            <Chip key={id} pressed={range === id} onClick={() => { setRange(id); setOpenPeriod(null); setOpenReceipt(null); }}>{label}</Chip>
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
      {tab === "earnings" ? (
      <section aria-labelledby="monthly-payout-title" className="flex flex-col gap-5 rounded-[28px] bg-white px-4 py-7 sm:px-[30px]">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-[min(100%,20rem)] flex-1 flex-col gap-1">
            <h3 id="monthly-payout-title" className="text-[26px] font-medium">Monthly payouts</h3>
            <span className="text-[15px] text-[#4A3A37]">What you earned each month and where it is. Payments are sent manually after approval.</span>
          </div>
          <div ref={filterRef} role="group" aria-label="Status" className="relative flex flex-wrap gap-1.5 rounded-full bg-[#F7F3F2] p-[5px]">
            {filterFrame ? <span aria-hidden="true" className={`pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-ink transition-[transform,width,height] ${slide}`} style={{ width: filterFrame.w, height: filterFrame.h, transform: `translate(${filterFrame.x}px, ${filterFrame.y}px)` }} /> : null}
            {filters.map((item) => {
              const on = status === item.id;
              return (
                <button key={item.id} ref={(node) => { if (node) filterNodes.current.set(item.id, node); else filterNodes.current.delete(item.id); }} type="button" aria-pressed={on} disabled={item.off} onClick={() => { setStatus(item.id); setOpenPeriod(null); }} className={`relative z-[1] inline-flex h-[38px] items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors ${slide} ${filterFrame ? "bg-transparent" : on ? "bg-ink" : "bg-transparent"} ${on ? "text-white" : "text-ink"} ${item.off ? "opacity-45" : ""}`}>
                  {item.label}
                  {item.count > 0 ? <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-ink transition-colors ${slide} ${on ? "bg-[#F3CFCB]" : "bg-white"}`}>{item.count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div className="grid items-center gap-3.5 border-b border-[#E8DEDC] px-3 pb-2.5 text-sm font-semibold text-[#4A3A37]" style={{ gridTemplateColumns: COLUMNS }}>
              <span>Month</span>
              {payoutKindOrder().map((kind) => (
                <span key={kind} className="flex w-full items-center justify-end gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PAYOUT_KINDS[kind].color }} />
                  {KIND_SHORT[kind]}
                </span>
              ))}
              <span className="text-right">Total</span>
              <span className="pl-3">Status</span>
              <span />
            </div>
            {periods.map((month) => {
              const open = openPeriod === month.period;
              const tone = month.items.length === 0 && month.period !== today.slice(0, 7)
                ? { label: "No earnings", background: "#F7F3F2", color: "#6B5A57" }
                : month.status === "mixed"
                  ? { label: "Mixed", background: "#EFEAE9", color: "#4A3A37" }
                  : PAYOUT_STATUSES[month.status];
              const refs = month.items.some((item) => item.kind === "lab") ? labs.filter((row) => row.period === month.period).flatMap((row) => row.refs.map((ref) => ref.id)) : [];
              return (
                <div key={month.period} className="border-b border-[#F0E8E6]">
                  <button type="button" aria-expanded={open} onClick={() => setOpenPeriod(open ? null : month.period)} className="grid w-full items-center gap-3.5 bg-transparent px-3 py-4 text-left text-[#2A1714] tabular-nums" style={{ gridTemplateColumns: COLUMNS }}>
                    <span className="flex flex-col gap-2">
                      <span className="text-base font-semibold">{month.label}</span>
                      <span role="img" aria-label={`Split of ${formatCents(month.total)}`} className="flex h-1.5 w-[140px] overflow-hidden rounded-[3px] bg-[#F0E8E6]">
                        {payoutKindOrder().map((kind) => month.total > 0 && month[kind] > 0 ? <span key={kind} style={{ width: `${(month[kind] / month.total) * 100}%`, background: PAYOUT_KINDS[kind].color }} /> : null)}
                      </span>
                    </span>
                    {payoutKindOrder().map((kind) => {
                      const cell = amountCell(month[kind]);
                      return <span key={kind} className="text-right text-[15px]" style={{ color: cell.color }}>{cell.text}</span>;
                    })}
                    <span className="text-right text-[17px] font-bold">{formatCents(month.total)}</span>
                    <span className="flex flex-col items-start gap-[3px] pl-3">
                      <span className="rounded-full px-3 py-1 text-[13px] font-semibold" style={{ background: tone.background, color: tone.color }}>{tone.label}</span>
                      <span className="text-xs text-[#6B5A57]">{monthWhen(month, today)}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5A57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`justify-self-end transition-transform duration-200 ${open ? "rotate-90" : ""}`}><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                  {open ? (
                    <div className="mx-3 mb-4 grid grid-cols-2 gap-3.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5 lg:grid-cols-4">
                      {payoutKindOrder().map((kind) => (
                        <div key={kind} className="flex flex-col gap-[3px]">
                          <span className="text-[13px] text-[#6B5A57]">{KIND_SHORT[kind]}</span>
                          <span className="text-sm leading-snug">{kindSummary(month.items.filter((item) => item.kind === kind), kind === "lab" ? refs : [])}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {periods.length === 0 ? <p className="px-3 py-4 text-[15px] text-[#4A3A37]">{status === "all" ? "Nothing in this range." : FILTER_EMPTY[status]}</p> : null}
            <div className="grid gap-3.5 px-3 pt-4 text-[15px] font-bold tabular-nums" style={{ gridTemplateColumns: COLUMNS }}>
              <span>{status === "all" ? "Total" : "Total shown"}</span>
              {payoutKindOrder().map((kind) => <span key={kind} className="text-right">{formatCents(shown[kind])}</span>)}
              <span className="text-right text-[17px]">{formatCents(shown.total)}</span>
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>
      ) : null}

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
      <p className="text-[13px] text-[#6B5A57]">Each month’s total adds marketing and lab commission. No patient, order, or treatment details are shown.</p>
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


