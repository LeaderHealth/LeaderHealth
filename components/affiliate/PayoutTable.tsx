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

const statusLabel: Record<PayoutTableStatus, string> = {
  needs: "Needs approval",
  approved: "Approved · not sent",
  paid: "Paid",
  waiting: "Not ready",
};

const statusClass: Record<PayoutTableStatus, string> = {
  needs: "bg-[#fbefd6] text-[#7a4e00]",
  approved: "bg-ink text-white",
  paid: "bg-[#ddf0e4] text-[#1d6340]",
  waiting: "bg-[#efeae9] text-[#4a3a37]",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function moneyTone(cents: number) {
  return cents === 0 ? "text-[#b3a5a2]" : "text-ink";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function PayoutTable({ month, title, rows }: { month: string; title: string; rows: PayoutTableRow[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const totals = rows.reduce(
    (sum, row) => ({
      socialCents: sum.socialCents + row.socialCents,
      websiteCents: sum.websiteCents + row.websiteCents,
      labCents: sum.labCents + row.labCents,
      totalCents: sum.totalCents + row.totalCents,
    }),
    { socialCents: 0, websiteCents: 0, labCents: 0, totalCents: 0 },
  );

  function exportCsv() {
    const header = ["Affiliate", "Social + base", "Website traffic", "Lab", "Total", "Status"];
    const body = rows.map((row) => [row.name, formatCents(row.socialCents), formatCents(row.websiteCents), formatCents(row.labCents), formatCents(row.totalCents), statusLabel[row.status]]);
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
        <div className="mt-2 overflow-x-auto">
          <div className="min-w-[52rem]">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr_1.8fr] gap-4 border-b border-[#e8dedc] px-2 py-2.5 text-[13px] font-semibold tracking-wide text-[#6b5a57] uppercase">
              <span>Affiliate</span>
              <span className="text-right">Social</span>
              <span className="text-right leading-tight">Website traffic</span>
              <span className="text-right">Lab</span>
              <span className="text-right">Total</span>
              <span>Status</span>
            </div>
            {rows.map((row) => {
              const open = openKey === row.key;
              const recording = recordingKey === row.key;
              return (
                <div key={row.key} className="border-b border-[#f0e8e6]">
                  <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr_1.8fr] items-center gap-4 px-2 py-3.5">
                    <button type="button" onClick={() => setOpenKey(open ? null : row.key)} aria-expanded={open} className="flex min-h-10 items-center gap-2.5 text-left">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3cfcb] text-xs font-semibold text-ink">{initials(row.name)}</span>
                      <span>
                        <span className="block text-base font-semibold">{row.name}</span>
                        <span className="text-[13px] text-[#6b5a57] underline">{open ? "Hide breakdown" : "See breakdown"}</span>
                      </span>
                    </button>
                    <span className={`text-right tabular-nums ${moneyTone(row.socialCents)}`}>{formatCents(row.socialCents)}</span>
                    <span className={`text-right tabular-nums ${moneyTone(row.websiteCents)}`}>{formatCents(row.websiteCents)}</span>
                    <span className={`text-right tabular-nums ${moneyTone(row.labCents)}`}>{formatCents(row.labCents)}</span>
                    <span className="text-right text-[17px] font-semibold tabular-nums">{formatCents(row.totalCents)}</span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap ${statusClass[row.status]}`}>{statusLabel[row.status]}</span>
                      {row.detail ? <span className="text-sm text-[#4a3a37]">{row.detail}</span> : null}
                      {row.record && !recording ? (
                        <button type="button" onClick={() => setRecordingKey(row.key)} className="ml-auto inline-flex h-9 items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-brown">
                          Record payment
                        </button>
                      ) : null}
                      {!row.record && row.action ? <div className="ml-auto">{row.action}</div> : null}
                    </div>
                  </div>
                  {open ? (
                    <div className="mx-2 mb-3.5 ml-14 flex flex-col gap-1.5 rounded-2xl bg-[#f7f3f2] px-4 py-3.5">
                      <p className="text-sm font-semibold">What makes up this total</p>
                      {row.parts.length === 0 ? <p className="text-sm text-brown">No amounts in this total yet.</p> : null}
                      {row.parts.map((part) => (
                        <div key={part.kind} className="flex gap-3 py-1 text-sm">
                          <span className="w-20 text-[#6b5a57]">{part.kind}</span>
                          <span className="min-w-0 flex-1">{part.what}</span>
                          <span className="font-semibold tabular-nums">{formatCents(part.amountCents)}</span>
                        </div>
                      ))}
                      {row.extra ? <div className="mt-2">{row.extra}</div> : null}
                    </div>
                  ) : null}
                  {recording && row.record ? (
                    <div className="mx-2 mb-3.5 ml-14">
                      <RecordPaymentPanel record={row.record} onCancel={() => setRecordingKey(null)} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.9fr_1.8fr] gap-4 px-2 pt-3.5 text-base font-semibold">
              <span>Total</span>
              <span className="text-right tabular-nums">{formatCents(totals.socialCents)}</span>
              <span className="text-right tabular-nums">{formatCents(totals.websiteCents)}</span>
              <span className="text-right tabular-nums">{formatCents(totals.labCents)}</span>
              <span className="text-right tabular-nums">{formatCents(totals.totalCents)}</span>
              <span />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
