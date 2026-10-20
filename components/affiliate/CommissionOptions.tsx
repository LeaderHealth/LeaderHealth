"use client";

import { useState } from "react";
import { DEFAULT_COMMISSION_PERCENT, type CommissionMode } from "@/lib/affiliate/code";

const modes: { id: CommissionMode; label: string }[] = [
  { id: "default", label: `Default (${DEFAULT_COMMISSION_PERCENT}%)` },
  { id: "percent", label: "Percentage" },
  { id: "fixed", label: "Fixed per order" },
];

const inputClass =
  "mt-2 w-full min-h-11 rounded-full border border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function percentValue(value: string) {
  const percent = Number(value);
  if (!value.trim() || !Number.isFinite(percent)) return null;
  return percent;
}

function fixedLabel(value: string) {
  const dollars = Number(value);
  if (!value.trim() || !Number.isFinite(dollars)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(dollars);
}

export function CommissionOptions() {
  const [mode, setMode] = useState<CommissionMode>("default");
  const [percent, setPercent] = useState(String(DEFAULT_COMMISSION_PERCENT));
  const [fixed, setFixed] = useState("");

  const customPercent = percentValue(percent);
  const fixedAmount = fixedLabel(fixed);
  const rate =
    mode === "fixed" ? (fixedAmount ?? "—") : mode === "percent" ? (customPercent == null ? "—" : `${customPercent}%`) : `${DEFAULT_COMMISSION_PERCENT}%`;
  const detail =
    mode === "default"
      ? "The standard affiliate rate. Pick Percentage or Fixed per order to set a different one."
      : mode === "percent"
        ? "This percent applies to the total of each completed order."
        : "This amount is paid for each completed order.";

  return (
    <div className="rounded-[24px] bg-background px-4 py-5 sm:px-6 md:col-span-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-brown">Commission</p>
      <input type="hidden" name="commissionMode" value={mode} />
      <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3" role="radiogroup" aria-label="Commission">
        {modes.map((option) => {
          const selected = mode === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(option.id)}
              className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                selected ? "bg-coral text-white" : "border border-ink/10 bg-white text-ink hover:border-ink/25"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {mode === "percent" ? (
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="affiliate-commission">
          Percent
          <input
            id="affiliate-commission"
            name="commissionPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            required
            inputMode="decimal"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}
      {mode === "fixed" ? (
        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="affiliate-fixed">
          Amount per order
          <input
            id="affiliate-fixed"
            name="commissionFixed"
            type="number"
            min={0}
            max={10000}
            step="0.01"
            required
            inputMode="decimal"
            placeholder="25.00"
            value={fixed}
            onChange={(event) => setFixed(event.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}
      <div className="mt-5 border-t border-ink/10 pt-4">
        {rate === "—" ? null : (
          <p className="flex flex-wrap items-baseline gap-x-2 text-ink">
            <span className="text-3xl font-medium leading-none">{rate}</span>
            <span className="text-sm leading-none text-brown">{mode === "fixed" ? "on each completed order" : "of each completed order"}</span>
          </p>
        )}
        <p className={`${rate === "—" ? "" : "mt-2"} max-w-xl text-sm leading-6 text-taupe`}>{detail}</p>
      </div>
    </div>
  );
}
