"use client";

import { formatCents } from "@/lib/affiliate/format";
import { useState, type ReactNode } from "react";
import { RecordPaymentPanel, type PaymentRecord } from "./RecordPaymentPanel";

export type PayoutTableStatus = "needs" | "approved" | "paid" | "waiting";

export type PayoutPart = {
  kind: string;
  what: string;
  amountCents: number;
};

export type PayoutTableRow = {
  key: string;
  name: string;
  agreementCents: number;
  socialCents: number;
  websiteCents: number;
  labCents: number;
  totalCents: number;
  status: PayoutTableStatus;
  detail: string;
  parts: PayoutPart[];
  action?: ReactNode;
  extra?: ReactNode;
  record?: PaymentRecord;
};

const COLUMNS = "minmax(0,1.7fr) repeat(4,minmax(0,0.75fr)) minmax(0,0.9fr) minmax(0,1.2fr) minmax(9rem,1.15fr) 28px";
const KINDS = [
  { key: "agreement", label: "Agreement", color: "#33130F" },
  { key: "social", label: "Social", color: "#A8706A" },
  { key: "website", label: "Website", color: "#E39A93" },
  { key: "lab", label: "Lab", color: "#C9A27E" },
] as const;

const statusLabel: Record<PayoutTableStatus, string> = {
  needs: "Pending review",
  approved: "Approved",
  paid: "Paid",
  waiting: "Not ready",
};

const statusClass: Record<PayoutTableStatus, string> = {
  needs: "bg-[#FBEFD6] text-[#7A4E00]",
  approved: "bg-[#F3E6E3] text-[#5A2A24]",
  paid: "bg-[#DDF0E4] text-[#1D6340]",
  waiting: "bg-[#EFEAE9] text-[#4A3A37]",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function amountText(cents: number) {
  return cents > 0 ? formatCents(cents) : "—";
}

function amountColor(cents: number) {
  return cents > 0 ? "#2A1714" : "#B3A5A2";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function PayoutTable({ month, title, rows }: { month: string; title: string; rows: PayoutTableRow[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const totals = rows.reduce(
    (sum, row) => ({
      agreementCents: sum.agreementCents + row.agreementCents,
      socialCents: sum.socialCents + row.socialCents,
      websiteCents: sum.websiteCents + row.websiteCents,
      labCents: sum.labCents + row.labCents,
      totalCents: sum.totalCents + row.totalCents,
    }),
    { agreementCents: 0, socialCents: 0, websiteCents: 0, labCents: 0, totalCents: 0 },
  );

  function exportCsv() {
    const header = ["Affiliate", "Agreement", "Social", "Website", "Lab", "Total", "Status"];
    const body = rows.map((row) => [row.name, formatCents(row.agreementCents), formatCents(row.socialCents), formatCents(row.websiteCents), formatCents(row.labCents), formatCents(row.totalCents), statusLabel[row.status]]);
    const csv = [header, ...body].map((cells) => cells.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `payouts-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby="payout-month-title" className="min-w-0 rounded-3xl bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 id="payout-month-title" className="min-w-0 flex-1 text-xl font-medium">
          {title}
        </h3>
        {rows.length > 0 ? (
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center justify-center rounded-full border border-[#cdbdbA] bg-white px-4 text-sm text-ink hover:bg-background">
            Export CSV
          </button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-brown">Nothing for this month.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid items-center gap-3.5 border-b border-[#E8DEDC] px-2 pb-2.5 text-sm font-semibold text-[#4A3A37]" style={{ gridTemplateColumns: COLUMNS }}>
              <span>Affiliate</span>
              {KINDS.map((kind) => (
                <span key={kind.key} className="flex items-center justify-end gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: kind.color }} />
                  {kind.label}
                </span>
              ))}
              <span className="text-right">Total</span>
              <span className="pl-3">Status</span>
              <span className="text-right">Action</span>
              <span />
            </div>
            {rows.map((row) => {
              const open = openKey === row.key;
              const recording = recordingKey === row.key;
              const amounts = [row.agreementCents, row.socialCents, row.websiteCents, row.labCents];
              return (
                <div key={row.key} className="border-b border-[#F0E8E6]">
                  <div className="grid items-center gap-3.5 px-2 py-4 tabular-nums" style={{ gridTemplateColumns: COLUMNS }}>
                    <button type="button" onClick={() => setOpenKey(open ? null : row.key)} aria-expanded={open} className="flex min-w-0 items-center gap-2.5 text-left">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold text-ink">{initials(row.name)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold">{row.name}</span>
                        <span role="img" aria-label={`Split of ${formatCents(row.totalCents)}`} className="mt-2 flex h-1.5 w-[120px] overflow-hidden rounded-[3px] bg-[#F0E8E6]">
                          {KINDS.map((kind, index) => row.totalCents > 0 && amounts[index] > 0 ? <span key={kind.key} style={{ width: `${(amounts[index] / row.totalCents) * 100}%`, background: kind.color }} /> : null)}
                        </span>
                      </span>
                    </button>
                    {KINDS.map((kind, index) => {
                      const cents = amounts[index] ?? 0;
                      return <span key={kind.key} className="text-right text-[15px]" style={{ color: amountColor(cents) }}>{amountText(cents)}</span>;
                    })}
                    <span className="text-right text-[17px] font-bold">{formatCents(row.totalCents)}</span>
                    <span className="flex flex-col items-start gap-[3px] pl-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap ${statusClass[row.status]}`}>{statusLabel[row.status]}</span>
                      {row.detail ? <span className="text-xs text-[#6B5A57]">{row.detail}</span> : null}
                    </span>
                    <span className="flex justify-end">
                      {row.record && !recording ? (
                        <button type="button" onClick={() => setRecordingKey(row.key)} className="inline-flex h-9 items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-brown">
                          Record payment
                        </button>
                      ) : null}
                      {!row.record && row.action ? row.action : null}
                    </span>
                    <button type="button" aria-expanded={open} aria-label={open ? `Hide ${row.name}` : `Show ${row.name}`} onClick={() => setOpenKey(open ? null : row.key)} className="justify-self-end text-[#6B5A57]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                  {open ? (
                    <div className="mx-2 mb-4 flex flex-col gap-1.5 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
                      <p className="text-sm font-semibold">What makes up this total</p>
                      {row.parts.length === 0 ? <p className="text-sm text-brown">No amounts in this total yet.</p> : null}
                      {row.parts.map((part) => (
                        <div key={part.kind} className="flex gap-3 py-1 text-sm">
                          <span className="w-36 text-[#6B5A57]">{part.kind}</span>
                          <span className="min-w-0 flex-1">{part.what}</span>
                          <span className="font-semibold tabular-nums">{formatCents(part.amountCents)}</span>
                        </div>
                      ))}
                      {row.extra ? <div className="mt-2">{row.extra}</div> : null}
                    </div>
                  ) : null}
                  {recording && row.record ? (
                    <div className="mx-2 mb-4">
                      <RecordPaymentPanel record={row.record} onCancel={() => setRecordingKey(null)} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="grid items-center gap-3.5 px-2 pt-4 text-[15px] font-bold tabular-nums" style={{ gridTemplateColumns: COLUMNS }}>
              <span>Total</span>
              <span className="text-right">{formatCents(totals.agreementCents)}</span>
              <span className="text-right">{formatCents(totals.socialCents)}</span>
              <span className="text-right">{formatCents(totals.websiteCents)}</span>
              <span className="text-right">{formatCents(totals.labCents)}</span>
              <span className="text-right text-[17px]">{formatCents(totals.totalCents)}</span>
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
