"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const focusRing = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function Chevron({ direction }: { direction: "left" | "right" | "down" }) {
  const path = direction === "left" ? "M15 6l-6 6 6 6" : direction === "right" ? "M9 6l6 6-6 6" : "M6 9l6 6 6-6";
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d={path} />
    </svg>
  );
}

type DatePickerProps = {
  label: string;
  placeholder: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  variant?: "filter" | "field";
  max?: string;
};

export function FilterDatePicker({ label, placeholder, value: controlled, defaultValue = "", onChange, name, required, variant = "filter", max }: DatePickerProps) {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const value = controlled ?? ownValue;
  const field = variant === "field";
  const [open, setOpen] = useState(false);
  const [focusDay, setFocusDay] = useState(() => fromKey(value) ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const selected = fromKey(value);
  const todayKey = toKey(new Date());
  const focusKey = toKey(focusDay);
  const active = !field && value !== "";
  const shown = selected ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : placeholder;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusKey}"]`)?.focus();
  }, [open, focusKey]);

  function show() {
    setFocusDay(selected ?? new Date());
    setOpen(true);
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(key: string) {
    setOwnValue(key);
    onChange?.(key);
    close();
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      Home: () => addDays(focusDay, -focusDay.getDay()),
      End: () => addDays(focusDay, 6 - focusDay.getDay()),
      PageUp: () => addMonths(focusDay, -1),
      PageDown: () => addMonths(focusDay, 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move();
    const limit = max && toKey(next) > max ? fromKey(max) : null;
    setFocusDay(limit ?? next);
  }

  const month = new Date(focusDay.getFullYear(), focusDay.getMonth(), 1);
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div ref={rootRef} className={`relative ${field ? "flex w-full" : "inline-flex"}`} onKeyDown={(event) => { if (open && event.key === "Escape") { event.preventDefault(); close(); } }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`${label}: ${selected ? shown : "any date"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => (open ? setOpen(false) : show())}
        className={`flex h-11 items-center justify-between gap-3 rounded-full border pl-[18px] pr-4 text-sm transition-colors duration-[140ms] ${
          field
            ? `w-full border-ink/40 bg-background hover:border-ink/60 ${selected ? "text-ink" : "text-brown"}`
            : active
              ? "min-w-[9.5rem] border-ink bg-ink font-medium text-white"
              : "min-w-[9.5rem] border-[#E8DEDC] bg-white font-medium text-ink hover:border-[#CDBDBA] hover:bg-[#FBF9F8]"
        } ${focusRing}`}
      >
        <span className="flex items-center gap-2">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-white" : "text-[#6B5A57]"}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
          {shown}
        </span>
        <span className={`transition-transform duration-[160ms] ${open ? "rotate-180" : ""} ${active ? "text-white" : "text-[#6B5A57]"}`}>
          <Chevron direction="down" />
        </span>
      </button>
      {name ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={value}
          required={required}
          onChange={() => {}}
          onFocus={() => buttonRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      ) : null}
      <div
        id={dialogId}
        role="dialog"
        aria-label={label}
        className={`absolute left-0 top-[calc(100%+6px)] z-30 w-[18.5rem] rounded-[20px] border border-[#E8DEDC] bg-white p-3 shadow-[0_12px_32px_-12px_rgba(51,19,15,0.28)] transition-[opacity,transform] duration-[140ms] ease-out ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-1 pb-2">
          <button type="button" aria-label="Previous month" onClick={() => setFocusDay(addMonths(focusDay, -1))} className={`grid size-8 place-items-center rounded-full text-ink hover:bg-[#F7F3F2] ${focusRing}`}>
            <Chevron direction="left" />
          </button>
          <p aria-live="polite" className="text-sm font-semibold text-ink">{monthLabel}</p>
          <button type="button" aria-label="Next month" onClick={() => setFocusDay(addMonths(focusDay, 1))} className={`grid size-8 place-items-center rounded-full text-ink hover:bg-[#F7F3F2] ${focusRing}`}>
            <Chevron direction="right" />
          </button>
        </div>
        <div className="grid grid-cols-7 pb-1">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} aria-hidden="true" className="grid h-8 place-items-center text-[11px] font-semibold uppercase tracking-wide text-[#6B5A57]">{weekday}</span>
          ))}
        </div>
        <div ref={gridRef} role="grid" aria-label={monthLabel} onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-y-0.5">
          {monthGrid(month).map((date) => {
            const key = toKey(date);
            const inMonth = date.getMonth() === month.getMonth();
            const isSelected = key === value;
            const isToday = key === todayKey;
            const blocked = Boolean(max && key > max);
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                data-day={key}
                tabIndex={key === focusKey ? 0 : -1}
                aria-selected={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-disabled={blocked || undefined}
                disabled={blocked}
                aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                onClick={() => choose(key)}
                className={`mx-auto grid size-9 place-items-center rounded-full text-sm transition-colors duration-[120ms] ${focusRing} ${
                  blocked
                    ? "cursor-not-allowed text-[#D6CBC9]"
                    : isSelected
                    ? "bg-ink font-semibold text-white"
                    : isToday
                      ? "font-semibold text-ink ring-1 ring-inset ring-[#E39A93] hover:bg-[#F7F3F2]"
                      : inMonth
                        ? "text-ink hover:bg-[#F7F3F2]"
                        : "text-[#B8A9A6] hover:bg-[#F7F3F2]"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#F0E8E6] px-1 pt-2">
          <button type="button" onClick={() => choose("")} disabled={value === ""} className={`rounded-full px-3 py-1.5 text-sm font-medium text-[#6B5A57] hover:bg-[#F7F3F2] disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}>
            Clear
          </button>
          <button type="button" onClick={() => choose(max && todayKey > max ? max : todayKey)} className={`rounded-full px-3 py-1.5 text-sm font-medium text-ink underline underline-offset-4 hover:bg-[#F7F3F2] ${focusRing}`}>
            Today
          </button>
        </div>
      </div>
    </div>
  );
}
