"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type FilterOption = { value: string; label: string };

type DropdownProps = {
  label: string;
  options: FilterOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  variant?: "filter" | "field";
  className?: string;
};

const focusRing = "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#E39A93]";

export function FilterDropdown({ label, options, value, defaultValue = "", onChange, placeholder = "", name, required, variant = "filter", className = "" }: DropdownProps) {
  const [ownValue, setOwnValue] = useState(defaultValue);
  const current = value ?? ownValue;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = options.findIndex((option) => option.value === current);
  const shown = options[selectedIndex]?.label ?? placeholder;
  const field = variant === "field";
  const active = !field && current !== "";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[highlight]?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  function show() {
    setHighlight(Math.max(0, selectedIndex));
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (option) {
      setOwnValue(option.value);
      onChange?.(option.value);
    }
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "ArrowDown") setHighlight((index) => Math.min(options.length - 1, index + 1));
    else if (event.key === "ArrowUp") setHighlight((index) => Math.max(0, index - 1));
    else if (event.key === "Home") setHighlight(0);
    else if (event.key === "End") setHighlight(options.length - 1);
    else if (event.key === "Enter" || event.key === " ") choose(highlight);
    else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      if (event.key === "Tab") return;
    } else return;
    event.preventDefault();
  }

  const triggerTone = field
    ? `w-full border-ink/40 bg-background ${selectedIndex < 0 ? "text-brown" : "text-ink"} hover:border-ink/60`
    : active
      ? "min-w-[9.5rem] border-ink bg-ink font-medium text-white"
      : "min-w-[9.5rem] border-[#E8DEDC] bg-white font-medium text-ink hover:border-[#CDBDBA] hover:bg-[#FBF9F8]";

  return (
    <div ref={rootRef} className={`relative ${field ? "flex w-full" : "inline-flex"} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={`${label}: ${shown || "none"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required || undefined}
        aria-activedescendant={open ? `${listId}-${highlight}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`flex h-11 items-center justify-between gap-3 rounded-full border pl-[18px] pr-4 text-left text-sm transition-colors duration-[140ms] ${triggerTone} ${focusRing}`}
      >
        <span className="truncate">{shown}</span>
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-[160ms] ${open ? "rotate-180" : ""} ${active ? "text-white" : "text-[#6B5A57]"}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {name ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={current}
          required={required}
          onChange={() => {}}
          onFocus={() => buttonRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      ) : null}
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        className={`absolute left-0 top-[calc(100%+6px)] z-30 max-h-72 min-w-full overflow-y-auto rounded-[18px] border border-[#E8DEDC] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(51,19,15,0.28)] transition-[opacity,transform] duration-[140ms] ease-out ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <li
              key={option.value || "all"}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={selected}
              onPointerEnter={() => setHighlight(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-xl px-3 py-2 text-sm ${
                index === highlight ? "bg-[#F7F3F2]" : ""
              } ${selected ? "font-semibold text-ink" : "text-[#4A3532]"}`}
            >
              {option.label}
              {selected ? (
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#C2615A]">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
