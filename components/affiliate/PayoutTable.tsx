"use client";

import { formatCents } from "@/lib/affiliate/format";
import { useState, type ReactNode } from "react";
import { RecordPaymentPanel, type PaymentRecord } from "./RecordPaymentPanel";

export type PayoutTableStatus = "needs" | "approved" | "hold" | "paid" | "waiting";

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
  action?: ReactNode;
  extra?: ReactNode;
  record?: PaymentRecord;
};

const COLUMNS = "minmax(8rem,1.6fr) minmax(7rem,0.9fr) minmax(5.25rem,0.7fr) minmax(5.75rem,0.75fr) minmax(3.75rem,0.55fr) minmax(4.75rem,0.7fr) minmax(11rem,1.15fr)";
const KINDS = [
  { key: "agreement", label: "Agreement", color: "#33130F" },
  { key: "social", label: "Social", color: "#A8706A" },
  { key: "website", label: "Website", color: "#E39A93" },
  { key: "lab", label: "Lab", color: "#C9A27E" },
] as const;

const statusLabel: Record<PayoutTableStatus, string> = {
  needs: "Needs approval",
  approved: "Approved, not sent",
  hold: "On hold",
  paid: "Paid",
  waiting: "Not ready",
};

const statusClass: Record<PayoutTableStatus, string> = {
  needs: "bg-[#DBD4BD] text-[#331110]",
  approved: "bg-[#F3E6E3] text-[#5A2A24]",
  hold: "bg-[#FBE3DF] text-[#9B2C1F]",
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

function PaymentControl({ row, recording, onRecord }: { row: PayoutTableRow; recording: boolean; onRecord: () => void }) {
  if (row.record && !recording) {
    return (
      <button type="button" onClick={onRecord} className="inline-flex h-9 items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-brown">
        Record payment
      </button>
    );
  }
  if (!row.record && row.action) return <>{row.action}</>;
  return null;
}

function PayoutExtra({ row }: { row: PayoutTableRow }) {
  return <div className="mt-3 rounded-2xl bg-[#F7F3F2] px-4 py-3.5 xl:mx-2 xl:mb-4">{row.extra}</div>;
}

function NameToggle({ row, open, onToggle, className, children }: { row: PayoutTableRow; open: boolean; onToggle: () => void; className: string; children: ReactNode }) {
  if (!row.extra) return <div className={className}>{children}</div>;
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className={`${className} text-left`}>
      {children}
    </button>
  );
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
        <>
        <div className="mt-4 xl:hidden">
          {rows.map((row) => {
            const open = openKey === row.key;
            const recording = recordingKey === row.key;
            const amounts = [row.agreementCents, row.socialCents, row.websiteCents, row.labCents];
            return (
              <div key={row.key} className="border-b border-[#F0E8E6] py-4">
                <NameToggle row={row} open={open} onToggle={() => setOpenKey(open ? null : row.key)} className="flex w-full min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold text-ink">{initials(row.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{row.name}</span>
                    <span role="img" aria-label={`Split of ${formatCents(row.totalCents)}`} className="mt-2 flex h-1.5 w-full max-w-[140px] overflow-hidden rounded-[3px] bg-[#F0E8E6]">
                      {KINDS.map((kind, index) => row.totalCents > 0 && amounts[index] > 0 ? <span key={kind.key} style={{ width: `${(amounts[index] / row.totalCents) * 100}%`, background: kind.color }} /> : null)}
                    </span>
                  </span>
                </NameToggle>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                  {KINDS.map((kind, index) => {
                    const cents = amounts[index] ?? 0;
                    return (
                      <div key={kind.key}>
                        <dt className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: kind.color }} />
                          {kind.label}
                        </dt>
                        <dd className="mt-0.5 text-[15px] tabular-nums" style={{ color: amountColor(cents) }}>{amountText(cents)}</dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex flex-col items-start gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12px] leading-none font-semibold whitespace-nowrap ${statusClass[row.status]}`}>
                      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
                      {statusLabel[row.status]}
                    </span>
                    {row.detail ? (
                      <span className="inline-flex items-center gap-1 pl-0.5 text-[12px] leading-none text-[#6B5A57]">
                        <span className="size-1 shrink-0 rounded-full bg-[#C4B8A4]" aria-hidden />
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-col items-end gap-2">
                    <span className="text-[17px] font-bold tabular-nums">{formatCents(row.totalCents)}</span>
                    <PaymentControl row={row} recording={recording} onRecord={() => setRecordingKey(row.key)} />
                  </span>
                </div>
                {open && row.extra ? <PayoutExtra row={row} /> : null}
                {recording && row.record ? (
                  <div className="mt-3">
                    <RecordPaymentPanel record={row.record} onCancel={() => setRecordingKey(null)} />
                  </div>
                ) : null}
              </div>
            );
          })}
          <section className="mt-4 rounded-2xl bg-[#F7F3F2] px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-[15px] font-bold">Total</h4>
              <p className="text-[17px] font-bold tabular-nums">{formatCents(totals.totalCents)}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#E8DEDC] pt-3 sm:grid-cols-4">
              {([
                ["Agreement", totals.agreementCents],
                ["Social", totals.socialCents],
                ["Website", totals.websiteCents],
                ["Lab", totals.labCents],
              ] as const).map(([label, cents]) => (
                <div key={label}>
                  <dt className="text-sm font-bold text-ink">{label}</dt>
                  <dd className="mt-0.5 text-[15px] tabular-nums">{formatCents(cents)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <div className="mt-4 hidden overflow-x-auto xl:block">
          <div className="min-w-[54rem]">
            <div className="grid items-center gap-3.5 border-b border-[#E8DEDC] px-2 pb-2.5 text-sm font-bold whitespace-nowrap text-ink" style={{ gridTemplateColumns: COLUMNS }}>
              <span>Affiliate</span>
              {KINDS.map((kind) => (
                <span key={kind.key} className="flex items-center justify-end gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: kind.color }} />
                  {kind.label}
                </span>
              ))}
              <span className="text-right">Total</span>
              <span className="pl-3">Status</span>
            </div>
            {rows.map((row) => {
              const open = openKey === row.key;
              const recording = recordingKey === row.key;
              const amounts = [row.agreementCents, row.socialCents, row.websiteCents, row.labCents];
              return (
                <div key={row.key} className="border-b border-[#F0E8E6]">
                  <div className="grid items-center gap-3.5 px-2 py-4 tabular-nums" style={{ gridTemplateColumns: COLUMNS }}>
                    <NameToggle row={row} open={open} onToggle={() => setOpenKey(open ? null : row.key)} className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold text-ink">{initials(row.name)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold">{row.name}</span>
                        <span role="img" aria-label={`Split of ${formatCents(row.totalCents)}`} className="mt-2 flex h-1.5 w-[120px] overflow-hidden rounded-[3px] bg-[#F0E8E6]">
                          {KINDS.map((kind, index) => row.totalCents > 0 && amounts[index] > 0 ? <span key={kind.key} style={{ width: `${(amounts[index] / row.totalCents) * 100}%`, background: kind.color }} /> : null)}
                        </span>
                      </span>
                    </NameToggle>
                    {KINDS.map((kind, index) => {
                      const cents = amounts[index] ?? 0;
                      return <span key={kind.key} className="text-right text-[15px]" style={{ color: amountColor(cents) }}>{amountText(cents)}</span>;
                    })}
                    <span className="text-right text-[17px] font-bold">{formatCents(row.totalCents)}</span>
                    <span className="flex flex-col items-start gap-1.5 pl-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12px] leading-none font-semibold whitespace-nowrap ${statusClass[row.status]}`}>
                        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
                        {statusLabel[row.status]}
                      </span>
                      {row.detail ? (
                        <span className="inline-flex items-center gap-1 pl-0.5 text-[12px] leading-none text-[#6B5A57]">
                          <span className="size-1 shrink-0 rounded-full bg-[#C4B8A4]" aria-hidden />
                          {row.detail}
                        </span>
                      ) : null}
                      <PaymentControl row={row} recording={recording} onRecord={() => setRecordingKey(row.key)} />
                    </span>
                  </div>
                  {open && row.extra ? <PayoutExtra row={row} /> : null}
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
            </div>
          </div>
        </div>
        </>
      )}
    </section>
  );
}
