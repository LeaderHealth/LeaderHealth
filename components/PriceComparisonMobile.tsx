"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export type CompareSpotlightRow = {
  label: string;
  val1: string;
  val2: string;
  val3: string;
  val4: string;
};

type CompareSpotlightGridProps = {
  brand1?: string;
  brand2?: string;
  brand3?: string;
  brand4?: string;
  logo?: string;
  logoHeight?: number;
  rows?: CompareSpotlightRow[];
  autoRotate?: boolean;
  rotateSeconds?: number;
  espresso?: string;
  paper?: string;
  gold?: string;
  ink?: string;
  mutedInk?: string;
  labelColor?: string;
  serifFont?: string;
  sansFont?: string;
  cornerRadius?: number;
  style?: CSSProperties;
};

function stagger(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

function ComparisonText({ value }: { value: string }) {
  const dash = value.indexOf("–");
  if (dash === -1) return value;
  return (
    <>
      {value.slice(0, dash + 1)}
      <wbr />
      {value.slice(dash + 1)}
    </>
  );
}

const defaultRows: CompareSpotlightRow[] = [
  {
    label: "Monthly price",
    val1: "$49–$109",
    val2: "$50–$120+",
    val3: "$50–$120+",
    val4: "$40–$120+",
  },
  {
    label: "Price ceiling",
    val1: "$109 max",
    val2: "no",
    val3: "no",
    val4: "no",
  },
  {
    label: "Baseline labs included",
    val1: "yes",
    val2: "yes",
    val3: "yes",
    val4: "no",
  },
  {
    label: "1-on-1 clinician consult",
    val1: "Every plan",
    val2: "yes",
    val3: "no",
    val4: "no",
  },
  {
    label: "Hidden fees",
    val1: "None",
    val2: "Varies",
    val3: "Varies",
    val4: "Varies",
  },
  {
    label: "Cancel anytime",
    val1: "yes",
    val2: "yes",
    val3: "yes",
    val4: "yes",
  },
];

export function CompareSpotlightGrid({
  brand1 = "Leader Health",
  brand2 = "Maximus",
  brand3 = "Hone Health",
  brand4 = "Hims",
  logo = "",
  logoHeight = 40,
  rows = defaultRows,
  autoRotate = true,
  rotateSeconds = 5,
  espresso = "#331110",
  paper = "#ffffff",
  gold = "#ffffff",
  ink = "#2a2a2a",
  mutedInk = "#a39e99",
  labelColor = "#9a9590",
  serifFont = "inherit",
  sansFont = "inherit",
  cornerRadius = 36,
  style,
}: CompareSpotlightGridProps) {
  const uid = useId().replace(/[:]/g, "");
  const cls = `lhsp-${uid}`;
  const brands = [brand1, brand2, brand3, brand4];
  const compBrands = [brand2, brand3, brand4];

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    if (!autoRotate || pausedRef.current) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % 3),
      Math.max(2, rotateSeconds) * 1000,
    );
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
    // Restart only when the rotation settings change, matching the source component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate, rotateSeconds]);

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) clearTimer();
    else startTimer();
  };

  const pick = (i: number) => {
    setActive(i);
    startTimer();
  };

  const step = (dir: number) => pick((active + dir + 3) % 3);

  const parse = (raw: string) => {
    const v = String(raw ?? "")
      .trim()
      .toLowerCase();
    if (["yes", "true", "y", "✓", "check", "1"].includes(v)) return "check";
    if (["no", "false", "n", "✗", "x", "cross", "0", "-"].includes(v)) return "cross";
    return "text";
  };

  const Badge = ({ kind, lead }: { kind: "check" | "cross"; lead?: boolean }) => {
    const on = kind === "check";
    const ring = lead ? "rgba(255,255,255,0.75)" : "#d9d9d9";
    const fill = "transparent";
    const stroke = lead ? "#ffffff" : "#8d8d8d";
    return (
      <span
        aria-label={on ? "Included" : "Not included"}
        className={`${cls}-badge`}
        style={{ border: `1px solid ${ring}`, background: fill }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          {on ? (
            <path
              d="M5 12.5l4 4L19 7"
              stroke={stroke}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </span>
    );
  };

  const Val = ({ raw, lead }: { raw: string; lead?: boolean }) => {
    const kind = parse(raw);
    if (kind === "text") {
      return (
        <span className={`${cls}-cellval ${lead ? "lead" : "other"}`}>
          <ComparisonText value={raw} />
        </span>
      );
    }
    return <Badge kind={kind} lead={lead} />;
  };

  const data = Array.isArray(rows) ? rows : [];
  const compCls = (i: number) => `${cls}-cell comp${i === active ? " on" : ""}`;

  return (
    <div
      className={`${cls} font-sans`}
      style={{
        containerType: "inline-size",
        width: "100%",
        fontFamily: sansFont,
        ...style,
      }}
    >
      <style>{`
                .${cls} * { box-sizing: border-box; }
                .${cls}-card {
                    position: relative;
                    background: ${paper};
                    border-radius: ${cornerRadius}px;
                    padding: 48px 32px 36px;
                    overflow: visible;
                    box-shadow: 0 16px 48px rgba(74,52,32,0.08);
                }
                .${cls}-inner { position: relative; }

                .${cls}-overlay {
                    position: absolute;
                    inset: -76px 0 -64px 0;
                    display: grid;
                    grid-template-columns: minmax(0,1.4fr) repeat(4,minmax(0,1fr));
                    column-gap: 14px;
                    pointer-events: none;
                    z-index: 0;
                }
                .${cls}-spot {
                    grid-column: 2;
                    border-radius: 36px;
                    background: linear-gradient(180deg,#c45d66 0%,#a44650 16%,#7a333c 40%,#4c2028 68%,#2a1016 100%);
                    box-shadow: 0 18px 36px rgba(36,12,16,0.26);
                }

                .${cls}-grid {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: minmax(0,1.4fr) repeat(4,minmax(0,1fr));
                    column-gap: 14px;
                }
                .${cls}-row { display: contents; }

                .${cls}-rowlabel {
                    grid-column: 1;
                    display: flex;
                    align-items: center;
                    min-width: 0;
                    padding: 18px 16px 18px 4px;
                    font-size: 15px;
                    line-height: 1.35;
                    color: ${labelColor};
                }
                .${cls}-cell {
                    min-width: 0;
                    min-height: 92px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 18px 12px;
                }
                .${cls}-cellval {
                    font-family: ${serifFont};
                    font-weight: 600;
                    letter-spacing: -0.02em;
                    line-height: 1.15;
                    text-align: center;
                    text-wrap: balance;
                }
                .${cls}-cellval.lead { color: ${gold}; font-size: 24px; }
                .${cls}-cellval.other { color: ${ink}; font-size: 22px; }
                .${cls}-badge {
                    width: 32px; height: 32px; border-radius: 50%;
                    display: inline-flex; align-items: center; justify-content: center;
                    flex: 0 0 auto;
                }

                .${cls}-head .${cls}-cell { padding-bottom: 24px; padding-top: 4px; }
                .${cls}-head .${cls}-cell.lead { padding-left: 12px; padding-right: 12px; min-width: 0; }
                .${cls}-htitle {
                    font-family: ${serifFont};
                    font-size: 17px;
                    font-weight: 400;
                    line-height: 1.25;
                    letter-spacing: 0;
                    text-align: center;
                    text-wrap: balance;
                    color: ${mutedInk};
                }
                .${cls}-head .${cls}-rowlabel,
                .${cls}-head .${cls}-cell.comp { border-bottom: 1px solid #eceae8; }

                .${cls}-row + .${cls}-row:not(.${cls}-head) .${cls}-rowlabel,
                .${cls}-row + .${cls}-row:not(.${cls}-head) .${cls}-cell.comp {
                    border-top: 1px solid #eceae8;
                }

                .${cls}-pager { display: none; }

                @keyframes ${cls}-fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @container (max-width: 960px) {
                    .${cls}-card { padding: 40px 16px 28px; border-radius: 28px; }
                    .${cls}-grid, .${cls}-overlay {
                        grid-template-columns: minmax(0,1.2fr) repeat(4,minmax(0,1fr));
                        column-gap: 8px;
                    }
                    .${cls}-rowlabel { font-size: 14px; padding-right: 8px; }
                    .${cls}-cell { min-height: 80px; padding: 14px 6px; }
                    .${cls}-cellval.lead { font-size: 20px; }
                    .${cls}-cellval.other { font-size: 17px; }
                    .${cls}-htitle { font-size: 15px; }
                    .${cls}-badge { width: 28px; height: 28px; }
                    .${cls}-overlay { inset: -56px 0 -48px 0; }
                    .${cls}-spot { border-radius: 28px; }
                }

                @container (max-width: 620px) {
                    .${cls}-card { padding: 36px 14px 18px; border-radius: 22px; }

                    .${cls}-grid, .${cls}-overlay {
                        grid-template-columns: minmax(0,1.25fr) minmax(0,1.1fr) minmax(0,1fr);
                        column-gap: 8px;
                    }
                    .${cls}-cell.comp { display: none; }
                    .${cls}-cell.comp.on {
                        display: flex;
                        animation: ${cls}-fade 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
                    }

                    .${cls}-overlay { inset: -28px 0 -24px 0; }
                    .${cls}-spot { border-radius: 22px; }

                    .${cls}-rowlabel { font-size: 12px; padding: 12px 8px 12px 2px; }
                    .${cls}-cell { padding: 12px 6px; min-height: 56px; }
                    .${cls}-cellval.lead { font-size: 16px; line-height: 1.2; }
                    .${cls}-cellval.other { font-size: 13px; line-height: 1.2; }
                    .${cls}-htitle { font-size: 13px; line-height: 1.25; }
                    .${cls}-badge { width: 24px; height: 24px; }
                    .${cls}-head .${cls}-cell {
                        padding-bottom: 16px;
                        min-height: 66px;
                        align-items: flex-end;
                    }

                    .${cls}-pager {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                        padding: 40px 0 2px;
                    }
                    .${cls}-pagerrow {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 14px;
                    }
                    .${cls}-arrow {
                        appearance: none;
                        cursor: pointer;
                        width: 48px; height: 48px;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        background: ${paper};
                        border: 1.5px solid #d9d9d9;
                        color: ${espresso};
                        transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
                        padding: 0;
                    }
                    .${cls}-arrow:hover { border-color: ${espresso}; }
                    .${cls}-arrow:active { background: rgba(46,27,22,0.06); }
                    .${cls}-arrow:focus-visible {
                        outline: 3px solid ${espresso};
                        outline-offset: 3px;
                    }
                    .${cls}-pause {
                        width: 44px; height: 44px;
                        border-style: dashed;
                        color: ${labelColor};
                    }
                    .${cls}-pause[aria-pressed="true"] {
                        background: ${espresso};
                        border-color: ${espresso};
                        border-style: solid;
                        color: ${paper};
                    }
                    .${cls}-pagerlabel {
                        min-width: 118px;
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }
                    .${cls}-pagerbrand {
                        font-size: 14px;
                        font-weight: 600;
                        color: ${ink};
                        line-height: 1.2;
                    }
                    .${cls}-pagercount {
                        font-size: 11px;
                        letter-spacing: 0.08em;
                        color: ${labelColor};
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .${cls}-cell.comp.on { animation: none; }
                    .${cls}-arrow { transition: none; }
                }
            `}</style>

      <div className={`${cls}-card price-compare-card`}>
        <div className={`${cls}-inner`}>
          <div className={`${cls}-overlay`} aria-hidden="true">
            <div className={`${cls}-spot price-compare-leader`} />
          </div>

          <div className={`${cls}-grid`} role="table">
            <div className={`${cls}-row ${cls}-head`} role="row">
              <div className={`${cls}-rowlabel price-compare-cell`} style={stagger(220)} aria-hidden="true" />
              <div className={`${cls}-cell lead price-compare-cell`} style={stagger(260)} role="columnheader">
                {logo ? (
                  // The supplied component renders the brand mark with an img so the spotlight sizing stays intact.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={brand1}
                    style={{
                      maxHeight: logoHeight,
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <span className={`${cls}-htitle`} style={{ color: "#ffffff" }}>
                    {brand1}
                  </span>
                )}
              </div>
              {compBrands.map((b, i) => (
                <div key={brands[i + 1]} className={`${compCls(i)} price-compare-cell`} style={stagger(300 + i * 40)} role="columnheader">
                  <span className={`${cls}-htitle`}>{b}</span>
                </div>
              ))}
            </div>

            {data.map((r, i) => {
              const compVals = [r.val2, r.val3, r.val4];
              return (
                <div key={r.label} className={`${cls}-row`} role="row">
                  <div className={`${cls}-rowlabel price-compare-cell`} style={stagger(420 + i * 70)} role="rowheader">
                    {r.label}
                  </div>
                  <div className={`${cls}-cell lead price-compare-cell`} style={stagger(460 + i * 70)} role="cell">
                    <Val raw={r.val1} lead />
                  </div>
                  {compVals.map((v, c) => (
                    <div
                      key={compBrands[c]}
                      className={`${compCls(c)} price-compare-cell`}
                      style={stagger(500 + i * 70 + c * 35)}
                      role="cell"
                    >
                      <Val raw={v} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cls}-pager`}>
          <div className={`${cls}-pagerrow`}>
            <button
              type="button"
              className={`${cls}-arrow`}
              aria-label={`Previous comparison (${compBrands[(active + 2) % 3]})`}
              onClick={() => step(-1)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <span className={`${cls}-pagerlabel`} aria-live="polite">
              <span className={`${cls}-pagerbrand`}>vs {compBrands[active]}</span>
              <span className={`${cls}-pagercount`}>
                {active + 1} of {compBrands.length}
                {autoRotate && paused ? " · paused" : ""}
              </span>
            </span>

            <button
              type="button"
              className={`${cls}-arrow`}
              aria-label={`Next comparison (${compBrands[(active + 1) % 3]})`}
              onClick={() => step(1)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {autoRotate && (
            <button
              type="button"
              className={`${cls}-arrow ${cls}-pause`}
              aria-label={paused ? "Resume rotation" : "Pause rotation"}
              aria-pressed={paused}
              onClick={togglePause}
            >
              {paused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
                  <rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
