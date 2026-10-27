"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "lh-a11y";

const textLevels = [0, 1, 2, 3] as const;
const contrasts = ["off", "light", "dark", "invert"] as const;
const saturations = ["off", "low", "high", "mono"] as const;
const aligns = ["off", "left", "center", "right"] as const;

type TextLevel = (typeof textLevels)[number];
type Contrast = (typeof contrasts)[number];
type Saturation = (typeof saturations)[number];
type Align = (typeof aligns)[number];

type Preferences = {
  text: TextLevel;
  cursor: boolean;
  leading: boolean;
  spacing: boolean;
  font: boolean;
  links: boolean;
  motion: boolean;
  images: boolean;
  contrast: Contrast;
  saturation: Saturation;
  guide: boolean;
  mask: boolean;
  align: Align;
  descriptions: boolean;
};

const emptyPreferences: Preferences = {
  text: 0,
  cursor: false,
  leading: false,
  spacing: false,
  font: false,
  links: false,
  motion: false,
  images: false,
  contrast: "off",
  saturation: "off",
  guide: false,
  mask: false,
  align: "off",
  descriptions: false,
};

const textLabels = ["Off", "Large", "Larger", "Largest"] as const;
const contrastLabels: Record<Contrast, string> = { off: "Off", light: "Light", dark: "Dark", invert: "Invert" };
const saturationLabels: Record<Saturation, string> = { off: "Off", low: "Low", high: "High", mono: "Mono" };
const alignLabels: Record<Align, string> = { off: "Off", left: "Left", center: "Center", right: "Right" };

function isTextLevel(value: unknown): value is TextLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isContrast(value: unknown): value is Contrast {
  return value === "off" || value === "light" || value === "dark" || value === "invert";
}

function isSaturation(value: unknown): value is Saturation {
  return value === "off" || value === "low" || value === "high" || value === "mono";
}

function isAlign(value: unknown): value is Align {
  return value === "off" || value === "left" || value === "center" || value === "right";
}

function parsePreferences(raw: string): Preferences {
  try {
    const parsed = JSON.parse(raw || "null") as unknown;
    if (!parsed || typeof parsed !== "object") return emptyPreferences;
    const stored = parsed as Record<string, unknown>;
    const text = stored.text === true ? 1 : stored.text;
    const contrast = stored.contrast === true ? "light" : stored.contrast;
    return {
      text: isTextLevel(text) ? text : 0,
      cursor: stored.cursor === true,
      leading: stored.leading === true,
      spacing: stored.spacing === true,
      font: stored.font === true,
      links: stored.links === true,
      motion: stored.motion === true,
      images: stored.images === true,
      contrast: isContrast(contrast) ? contrast : "off",
      saturation: isSaturation(stored.saturation) ? stored.saturation : "off",
      guide: stored.guide === true,
      mask: stored.mask === true,
      align: isAlign(stored.align) ? stored.align : "off",
      descriptions: stored.descriptions === true,
    };
  } catch {
    return emptyPreferences;
  }
}

function filterValue(preferences: Preferences) {
  const parts: string[] = [];
  if (preferences.contrast === "invert") parts.push("invert(1)", "hue-rotate(180deg)");
  if (preferences.saturation === "low") parts.push("saturate(0.35)");
  if (preferences.saturation === "high") parts.push("saturate(1.8)");
  if (preferences.saturation === "mono") parts.push("grayscale(1)");
  return parts.length ? parts.join(" ") : "";
}

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  const set = (name: string, value: string | null) => {
    if (value) root.dataset[name] = value;
    else delete root.dataset[name];
  };
  set("a11yText", preferences.text ? String(preferences.text) : null);
  set("a11yCursor", preferences.cursor ? "large" : null);
  set("a11yLeading", preferences.leading ? "loose" : null);
  set("a11ySpacing", preferences.spacing ? "wide" : null);
  set("a11yFont", preferences.font ? "readable" : null);
  set("a11yLinks", preferences.links ? "on" : null);
  set("a11yMotion", preferences.motion ? "reduce" : null);
  set("a11yImages", preferences.images ? "hide" : null);
  set("a11yContrast", preferences.contrast === "off" ? null : preferences.contrast);
  set("a11ySaturation", preferences.saturation === "off" ? null : preferences.saturation);
  set("a11yAlign", preferences.align === "off" ? null : preferences.align);
  const filter = filterValue(preferences);
  set("a11yFilter", filter ? "on" : null);
  if (filter) root.style.setProperty("--a11y-filters", filter);
  else root.style.removeProperty("--a11y-filters");
}

function preferencesActive(preferences: Preferences) {
  return JSON.stringify(preferences) !== JSON.stringify(emptyPreferences);
}

const preferenceListeners = new Set<() => void>();

function subscribePreferences(listener: () => void) {
  preferenceListeners.add(listener);
  return () => {
    preferenceListeners.delete(listener);
  };
}

function readStoredPreferences() {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function savePreferences(next: Preferences) {
  if (preferencesActive(next)) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(STORAGE_KEY);
  applyPreferences(next);
  preferenceListeners.forEach((listener) => listener());
}

function cycle<T>(values: readonly T[], current: T) {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length];
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

function Tool({
  pressed,
  label,
  detail,
  onClick,
  expanded,
  children,
}: {
  pressed: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
  expanded?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={expanded == null ? pressed : undefined}
      aria-expanded={expanded}
      onClick={onClick}
      className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d] ${
        pressed ? "border-[#321110] bg-[#321110] text-white" : "border-[#f2e4e0] bg-[#f7f3f5] text-[#321110] hover:border-[#321110]/30"
      }`}
    >
      {children}
      <span className="text-[12px] leading-tight font-semibold">{label}</span>
      {detail ? <span className={`text-[11px] leading-none font-medium ${pressed ? "text-white/80" : "text-[#7a5a56]"}`}>{detail}</span> : null}
    </button>
  );
}

export function AccessibilityButton() {
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const topShadeRef = useRef<HTMLDivElement>(null);
  const bottomShadeRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [headingsOpen, setHeadingsOpen] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const storedPreferences = useSyncExternalStore(subscribePreferences, readStoredPreferences, () => "");
  const preferences = useMemo(() => parsePreferences(storedPreferences), [storedPreferences]);

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setHeadingsOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!preferences.guide && !preferences.mask) return;
    const place = (y: number) => {
      const band = 128;
      const top = Math.max(0, y - band / 2);
      const bottom = Math.max(0, window.innerHeight - y - band / 2);
      if (topShadeRef.current) topShadeRef.current.style.height = `${top}px`;
      if (bottomShadeRef.current) bottomShadeRef.current.style.height = `${bottom}px`;
      if (lineRef.current) lineRef.current.style.top = `${y}px`;
    };
    place(window.innerHeight / 2);
    const onMove = (event: PointerEvent) => place(event.clientY);
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [preferences.guide, preferences.mask]);

  useEffect(() => {
    const tip = tipRef.current;
    if (!preferences.descriptions || !tip) return;
    const hide = () => {
      tip.hidden = true;
    };
    const textFor = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return "";
      const image = target.closest("img");
      if (!image || image.closest(".lh-a11y")) return "";
      return image.getAttribute("alt")?.trim() ?? "";
    };
    const show = (text: string, x: number, y: number) => {
      tip.textContent = text;
      tip.hidden = false;
      tip.style.left = `${Math.min(Math.max(8, x + 14), window.innerWidth - 272)}px`;
      tip.style.top = `${Math.min(y + 18, window.innerHeight - 72)}px`;
    };
    const onMove = (event: MouseEvent) => {
      const text = textFor(event.target);
      if (!text) {
        hide();
        return;
      }
      show(text, event.clientX, event.clientY);
    };
    const onFocus = (event: FocusEvent) => {
      const text = textFor(event.target);
      if (!text || !(event.target instanceof Element)) {
        hide();
        return;
      }
      const rect = event.target.getBoundingClientRect();
      show(text, rect.left, rect.bottom);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("focusin", onFocus);
    return () => {
      hide();
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("focusin", onFocus);
    };
  }, [preferences.descriptions]);

  function update(next: Preferences) {
    savePreferences(next);
  }

  function toggleHeadings() {
    if (headingsOpen) {
      setHeadingsOpen(false);
      return;
    }
    const items = Array.from(document.querySelectorAll("h1, h2, h3")).flatMap((node, index) => {
      if (node.closest(".lh-a11y")) return [];
      const text = (node instanceof HTMLElement ? node.innerText : node.textContent)?.replace(/\s+/g, " ").trim() ?? "";
      if (!text) return [];
      if (!node.id) node.id = `lh-a11y-heading-${index}`;
      const level = Number(node.tagName.slice(1));
      return [{ id: node.id, text, level: level === 1 || level === 2 || level === 3 ? level : 2 }];
    });
    setHeadings(items);
    setHeadingsOpen(true);
  }

  function goToHeading(id: string) {
    const node = document.getElementById(id);
    if (!(node instanceof HTMLElement)) return;
    if (!node.hasAttribute("tabindex")) node.tabIndex = -1;
    node.scrollIntoView({
      behavior: document.documentElement.dataset.a11yMotion === "reduce" ? "auto" : "smooth",
      block: "start",
    });
    node.focus();
    setOpen(false);
  }

  const active = preferencesActive(preferences);

  return (
    <div className="lh-a11y fixed bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+3.75rem))] left-4 z-[65]">
      {preferences.mask ? (
        <>
          <div ref={topShadeRef} className="pointer-events-none fixed inset-x-0 top-0 z-[64] bg-black/65" aria-hidden />
          <div ref={bottomShadeRef} className="pointer-events-none fixed inset-x-0 bottom-0 z-[64] bg-black/65" aria-hidden />
        </>
      ) : null}
      {preferences.guide ? <div ref={lineRef} className="pointer-events-none fixed inset-x-0 z-[64] h-1 -translate-y-1/2 bg-[#e33d4d]" aria-hidden /> : null}
      <div
        ref={tipRef}
        hidden
        role="tooltip"
        className="pointer-events-none fixed z-[66] max-w-64 rounded-xl bg-[#321110] px-3 py-2 text-sm leading-snug text-white shadow-lg"
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label="Accessibility options"
        tabIndex={-1}
        hidden={!open}
        className="absolute bottom-16 left-0 z-[66] flex max-h-[min(32rem,calc(100dvh-8rem))] w-[min(22.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#321110]/15 bg-white text-ink shadow-[0_16px_40px_rgba(50,17,16,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d]"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <p className="font-sans text-[13px] font-semibold tracking-[0.08em] text-[#7a5a56] uppercase">Accessibility</p>
          <button
            type="button"
            onClick={() => update(emptyPreferences)}
            disabled={!active}
            className="text-sm font-medium text-[#7a5a56] underline underline-offset-4 disabled:no-underline disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d]"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto px-3 pb-2">
          <Tool pressed={preferences.text > 0} label="Larger text" detail={textLabels[preferences.text]} onClick={() => update({ ...preferences, text: cycle(textLevels, preferences.text) })}>
            <Icon><path d="M5 18 9.5 6h1L15 18M6.4 14.5h7.2M16 18l2.4-6.4h.5L21.3 18M16.8 15.6h3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.cursor} label="Bigger cursor" detail={preferences.cursor ? "On" : "Off"} onClick={() => update({ ...preferences, cursor: !preferences.cursor })}>
            <Icon><path d="M6 4.5v12.2l3.2-3.2 2.3 5.5 2.5-1.1-2.3-5.4H16z" fill="currentColor" /></Icon>
          </Tool>
          <Tool pressed={preferences.leading} label="Line height" detail={preferences.leading ? "On" : "Off"} onClick={() => update({ ...preferences, leading: !preferences.leading })}>
            <Icon><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.spacing} label="Text spacing" detail={preferences.spacing ? "On" : "Off"} onClick={() => update({ ...preferences, spacing: !preferences.spacing })}>
            <Icon><path d="M4 8h4M16 8h4M8 8l2.2 8h3.6L16 8M4 16h4M16 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.font} label="Readable font" detail={preferences.font ? "On" : "Off"} onClick={() => update({ ...preferences, font: !preferences.font })}>
            <Icon><path d="M6 17 10 6h1.2L15.2 17M7.4 13.2h6.2M17 17V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.links} label="Highlight links" detail={preferences.links ? "On" : "Off"} onClick={() => update({ ...preferences, links: !preferences.links })}>
            <Icon><path d="M9 12h6M8 8H6.8A3.8 3.8 0 0 0 6.8 16H8M16 8h1.2a3.8 3.8 0 0 1 0 8H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.motion} label="Pause animations" detail={preferences.motion ? "On" : "Off"} onClick={() => update({ ...preferences, motion: !preferences.motion })}>
            <Icon><path d="M8 6.5v11M16 6.5v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.images} label="Hide images" detail={preferences.images ? "On" : "Off"} onClick={() => update({ ...preferences, images: !preferences.images })}>
            <Icon><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M4 15.5 8.5 11l3 3 2.2-2.2L20 16" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.contrast !== "off"} label="Contrast" detail={contrastLabels[preferences.contrast]} onClick={() => update({ ...preferences, contrast: cycle(contrasts, preferences.contrast) })}>
            <Icon><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor" /></Icon>
          </Tool>
          <Tool pressed={preferences.saturation !== "off"} label="Saturation" detail={saturationLabels[preferences.saturation]} onClick={() => update({ ...preferences, saturation: cycle(saturations, preferences.saturation) })}>
            <Icon><circle cx="8" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="14" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.6" /><circle cx="15" cy="15" r="2.4" stroke="currentColor" strokeWidth="1.6" /></Icon>
          </Tool>
          <Tool pressed={preferences.guide} label="Reading guide" detail={preferences.guide ? "On" : "Off"} onClick={() => update({ ...preferences, guide: !preferences.guide })}>
            <Icon><path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M7 7h10M7 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.mask} label="Reading mask" detail={preferences.mask ? "On" : "Off"} onClick={() => update({ ...preferences, mask: !preferences.mask })}>
            <Icon><path d="M4 5h16v4H4zM4 15h16v4H4z" fill="currentColor" /><path d="M4 11h16" stroke="currentColor" strokeWidth="1.6" /></Icon>
          </Tool>
          <Tool pressed={preferences.align !== "off"} label="Align text" detail={alignLabels[preferences.align]} onClick={() => update({ ...preferences, align: cycle(aligns, preferences.align) })}>
            <Icon><path d="M5 7h14M5 12h9M5 17h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={preferences.descriptions} label="Image descriptions" detail={preferences.descriptions ? "On" : "Off"} onClick={() => update({ ...preferences, descriptions: !preferences.descriptions })}>
            <Icon><rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 20h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
          <Tool pressed={headingsOpen} label="Page headings" expanded={headingsOpen} onClick={toggleHeadings}>
            <Icon><path d="M6 6v12M12 6v12M6 12h6M16 8.5h4M16 12h4M16 15.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>
          </Tool>
        </div>
        {headingsOpen ? (
          <ul className="mx-3 mb-2 max-h-36 overflow-y-auto rounded-2xl border border-[#f2e4e0] px-2 py-1">
            {headings.length === 0 ? <li className="px-2 py-2 text-sm text-[#7a5a56]">No headings on this page.</li> : null}
            {headings.map((heading) => (
              <li key={heading.id}>
                <button
                  type="button"
                  onClick={() => goToHeading(heading.id)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#321110] hover:bg-[#f7f3f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d]"
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-t border-[#f2e4e0] px-4 py-3">
          <Link
            href="/legal/accessibility"
            className="text-sm font-medium text-[#321110] underline decoration-[#e33d4d] underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d]"
            onClick={() => setOpen(false)}
          >
            Accessibility statement
          </Link>
        </div>
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Accessibility options"
        onClick={() => setOpen((value) => !value)}
        className="relative z-[66] grid h-14 w-14 place-items-center rounded-full border-2 border-[#e33d4d] bg-white text-[#e33d4d] shadow-[0_10px_28px_rgba(50,17,16,0.18)] hover:bg-[#f7f3f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e33d4d]"
      >
        <svg viewBox="0 0 24 24" className="pointer-events-none h-7 w-7" fill="none" aria-hidden>
          <circle cx="12" cy="4.5" r="1.7" fill="currentColor" />
          <path d="M4.5 9.2h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 9.2v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 13.4 8.2 20M12 13.4 15.8 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {active ? <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#e33d4d]" aria-hidden /> : null}
      </button>
    </div>
  );
}
