"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveCampaignFlowAction } from "@/app/admin/affiliates/actions";
import { TimedNotice } from "@/components/affiliate/TimedNotice";
import {
  CAMPAIGN_CONTENT_TYPES,
  CAMPAIGN_PLATFORMS,
  DEFAULT_CAMPAIGN_DISCLOSURE,
  DEFAULT_CAMPAIGN_LINK_INSTRUCTIONS,
  campaignStepError,
  type CampaignFlowInput,
} from "@/lib/affiliate/campaign-record";

export type CampaignAffiliateOption = {
  code: string;
  name: string;
  email: string;
};

export type CampaignPerformanceRates = {
  views: string;
  engagements: string;
  clicks: string;
  pageViews: string;
};

const EMPTY_RATES: CampaignPerformanceRates = {
  views: "Not set",
  engagements: "Not set",
  clicks: "Not set",
  pageViews: "Not set",
};

const PERFORMANCE_METRICS: { key: keyof CampaignPerformanceRates; title: string; detail: string }[] = [
  { key: "views", title: "Views", detail: "Recorded views on the live post, paid per 1,000. Counted after the tracking period, the same way as Payouts." },
  { key: "engagements", title: "Engagements", detail: "Each like, comment, share, or save. Added to the view amount. A post still cannot go over its maximum." },
  { key: "clicks", title: "Verified link clicks", detail: "A person opens the affiliate tracking link. Paid per click. Impressions are not paid." },
  { key: "pageViews", title: "Eligible public page views", detail: "A later view of a public page from that visit, paid per 1,000." },
];

const STEPS = ["1 Details", "2 Content", "3 Payment", "4 Affiliates", "5 Review"];
const inputClass = "h-[46px] w-full rounded-xl border bg-white px-3.5 text-[15px] font-normal text-ink outline-none";
const quiet = "text-sm font-normal text-[#6B5A57]";

function money(cents: number) {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function showDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function paymentCents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return 0;
  const dollars = Number(value);
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${pressed ? "border-ink bg-ink text-white" : "border-[#CDBDBA] bg-white text-ink"}`}
    >
      {children}
    </button>
  );
}

export function CampaignCreate({ affiliates, rates = EMPTY_RATES }: { affiliates: CampaignAffiliateOption[]; rates?: CampaignPerformanceRates }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [goal, setGoal] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [plats, setPlats] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [posts, setPosts] = useState("2");
  const [guide, setGuide] = useState("");
  const [disc, setDisc] = useState(DEFAULT_CAMPAIGN_DISCLOSURE);
  const [linkI, setLinkI] = useState(DEFAULT_CAMPAIGN_LINK_INSTRUCTIONS);
  const [performance, setPerformance] = useState(false);
  const [amt, setAmt] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [over, setOver] = useState<Record<string, string>>({});
  const campaignPrice = useRef(amt);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const postsN = /^\d+$/.test(posts.trim()) ? Number(posts) : 0;
  const flow = (): CampaignFlowInput => ({
    mode: "sent",
    name,
    description: desc,
    goals: goal,
    startsOn: start,
    endsOn: end,
    platforms: plats,
    contentTypes: types,
    posts,
    guidelines: guide,
    disclosure: disc,
    linkInstructions: linkI,
    baseMode: "campaign",
    amount: amt,
    performancePay: performance,
    affiliates: sel.map((code) => ({ code, amount: over[code] ?? amt })),
  });
  const firstBad = [0, 1, 2, 3].find((item) => campaignStepError(item, flow())) ?? -1;
  const badBorder = (empty: boolean) => (err && empty ? "#9B2C1F" : "#CDBDBA");
  const priceFor = (code: string) => over[code] ?? amt;
  const unitCents = (code: string) => paymentCents(priceFor(code));
  const budget = sel.reduce((sum, code) => sum + unitCents(code), 0);
  const baseCents = paymentCents(amt);
  const estimate = baseCents;

  useEffect(() => {
    if (campaignPrice.current === amt) return;
    const previous = campaignPrice.current;
    campaignPrice.current = amt;
    setOver((current) => {
      let changed = false;
      const next = { ...current };
      for (const [code, value] of Object.entries(next)) {
        if (value === previous) {
          delete next[code];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [amt]);

  function setAffiliatePrice(code: string, value: string) {
    setOver((current) => {
      const next = { ...current };
      if (value === amt) delete next[code];
      else next[code] = value;
      return next;
    });
    setErr("");
  }

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setErr("");
  }

  function go(next: number) {
    setStep(next);
    setErr("");
    setToast("");
  }

  async function save(mode: "draft" | "sent") {
    if (mode === "draft") {
      const error = campaignStepError(3, flow());
      if (error) {
        setErr(error);
        setToast("");
        setStep(3);
        return;
      }
    }
    setSaving(true);
    const result = await saveCampaignFlowAction({ ...flow(), mode });
    setSaving(false);
    if (!result.ok) {
      setErr(result.error);
      setToast("");
      return;
    }
    if (mode === "draft") {
      setErr("");
      setToast("Draft saved. Only admins can see it.");
      return;
    }
    setSentCount(result.count);
    setToast("");
    setErr("");
    setSent(true);
  }

  function next() {
    const steps = step === 4 ? [0, 1, 2, 3] : [step];
    for (const item of steps) {
      const error = campaignStepError(item, flow());
      if (error) {
        setErr(error);
        setToast("");
        if (item !== step) setStep(item);
        return;
      }
    }
    if (step === 4) {
      void save("sent");
      return;
    }
    go(step + 1);
  }

  function startOver() {
    setSent(false);
    setStep(0);
    setSel([]);
    setOver({});
    setName("");
    setDesc("");
    setGoal("");
    setGuide("");
    setErr("");
    setToast("");
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin/affiliates/campaigns" className="self-start text-sm text-ink">
        ← Campaigns
      </Link>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-normal">Create campaign</h2>
          <p className="mt-1.5 text-[15px] text-[#4A3A37]">Invite at least one affiliate. Only the people you invite will see it. Payment terms are set before they accept.</p>
        </div>
        {sent ? null : (
          <button
            type="button"
            onClick={() => void save("draft")}
            disabled={saving}
            className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink disabled:opacity-50"
          >
            Save draft
          </button>
        )}
      </div>
      {toast ? <TimedNotice message={toast} onDismiss={() => setToast("")} /> : null}
      {sent ? (
        <section className="flex flex-col items-start gap-5 rounded-3xl bg-white p-7">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-[#DDF0E4] text-[#1D6340]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </span>
          <h3 className="text-2xl font-semibold">Sent to {sentCount} {sentCount === 1 ? "affiliate" : "affiliates"}</h3>
          <p className="text-[15px] text-[#4A3A37]">They’ll see it on My campaigns, with the payment terms. You’ll see each affiliate on the campaign page.</p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/admin/affiliates/campaigns" className="inline-flex h-[46px] items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white">
              View campaign
            </Link>
            <button type="button" onClick={startOver} className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink">
              Create another
            </button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-5">
          <ol aria-label="Steps" className="grid list-none grid-cols-5 gap-2 p-0">
            {STEPS.map((label, index) => {
              const locked = index > step && firstBad !== -1 && firstBad < index;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={locked}
                    aria-current={index === step ? "step" : undefined}
                    onClick={() => go(index)}
                    className="flex w-full flex-col gap-2 text-left disabled:cursor-not-allowed"
                  >
                    <span className="h-[5px] rounded-[3px]" style={{ background: index <= step ? "#33130F" : "#E8DEDC" }} />
                    <span className="text-sm sm:text-[15px]" style={{ fontWeight: index === step ? 600 : 400, color: index <= step ? "#2A1714" : "#6B5A57" }}>
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-col items-start gap-5 xl:flex-row">
            <section className="flex min-w-0 flex-1 flex-col gap-5 rounded-3xl bg-white p-5 sm:p-7">
              {step === 0 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[22px] font-semibold">Campaign details</h3>
                  <label htmlFor="cName" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Campaign name <span className="text-[#9B2C1F]">*</span></span>
                    <input id="cName" value={name} onChange={(event) => { setName(event.target.value); setErr(""); }} placeholder="e.g. Holiday TRT push" className={inputClass} style={{ borderColor: badBorder(!name.trim()) }} />
                  </label>
                  <label htmlFor="cDesc" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Description <span className="text-[#9B2C1F]">*</span></span>
                    <textarea id="cDesc" rows={3} value={desc} onChange={(event) => { setDesc(event.target.value); setErr(""); }} placeholder="What the campaign is about, in a few sentences" className="resize-y rounded-xl border bg-white px-3.5 py-2.5 text-[15px] font-normal leading-normal text-ink outline-none" style={{ borderColor: badBorder(!desc.trim()) }} />
                  </label>
                  <label htmlFor="cGoal" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Marketing goal <span className={quiet}>(optional)</span></span>
                    <input id="cGoal" value={goal} onChange={(event) => { setGoal(event.target.value); setErr(""); }} placeholder="e.g. More first-time consult bookings" className={inputClass} style={{ borderColor: "#CDBDBA" }} />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label htmlFor="cStart" className="flex flex-col gap-1.5 text-sm font-semibold">
                      <span>Start date <span className="text-[#9B2C1F]">*</span></span>
                      <input id="cStart" type="date" value={start} onChange={(event) => { setStart(event.target.value); setErr(""); }} className={inputClass} style={{ borderColor: badBorder(!start.trim()) }} />
                    </label>
                    <label htmlFor="cEnd" className="flex flex-col gap-1.5 text-sm font-semibold">
                      <span>End date <span className="text-[#9B2C1F]">*</span></span>
                      <input id="cEnd" type="date" value={end} onChange={(event) => { setEnd(event.target.value); setErr(""); }} className={inputClass} style={{ borderColor: badBorder(!end.trim()) }} />
                    </label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Platforms <span className="text-[#9B2C1F]">*</span></span>
                    <div role="group" aria-label="Platforms" className="flex flex-wrap gap-2">
                      {CAMPAIGN_PLATFORMS.map((platform) => (
                        <Chip key={platform} pressed={plats.includes(platform)} onClick={() => toggle(plats, platform, setPlats)}>
                          {platform}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              {step === 1 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[22px] font-semibold">Content requirements</h3>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Content type <span className="text-[#9B2C1F]">*</span></span>
                    <div role="group" aria-label="Content type" className="flex flex-wrap gap-2">
                      {CAMPAIGN_CONTENT_TYPES.map((type) => (
                        <Chip key={type} pressed={types.includes(type)} onClick={() => toggle(types, type, setTypes)}>
                          {type}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex max-w-[260px] flex-col gap-1.5">
                    <label htmlFor="cPosts" className="text-sm font-semibold">Posts required per affiliate <span className="text-[#9B2C1F]">*</span></label>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Fewer posts" onClick={() => { setPosts(String(Math.max(1, postsN - 1))); setErr(""); }} className="inline-flex size-[46px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white text-[15px] font-medium text-ink">−</button>
                      <input id="cPosts" inputMode="numeric" value={posts} onChange={(event) => { setPosts(event.target.value); setErr(""); }} className={`${inputClass} w-20 text-center`} style={{ borderColor: badBorder(postsN < 1) }} />
                      <button type="button" aria-label="More posts" onClick={() => { setPosts(String(postsN + 1)); setErr(""); }} className="inline-flex size-[46px] items-center justify-center rounded-full border border-[#CDBDBA] bg-white text-[15px] font-medium text-ink">+</button>
                    </div>
                  </div>
                  <label htmlFor="cGuide" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Guidelines and instructions <span className="text-[#9B2C1F]">*</span></span>
                    <textarea id="cGuide" rows={3} value={guide} onChange={(event) => { setGuide(event.target.value); setErr(""); }} placeholder="What to show, key points, anything to avoid" className="resize-y rounded-xl border bg-white px-3.5 py-2.5 text-[15px] font-normal leading-normal text-ink outline-none" style={{ borderColor: badBorder(!guide.trim()) }} />
                  </label>
                  <label htmlFor="cDisc" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Required FTC disclosure <span className="text-[#9B2C1F]">*</span></span>
                    <input id="cDisc" value={disc} onChange={(event) => { setDisc(event.target.value); setErr(""); }} className={inputClass} style={{ borderColor: "#CDBDBA" }} />
                    <span className="text-[13px] font-normal text-[#6B5A57]">Optional in the caption. It is not required for the post to track.</span>
                  </label>
                  <label htmlFor="cLink" className="flex flex-col gap-1.5 text-sm font-semibold">
                    <span>Tracking link instructions <span className="text-[#9B2C1F]">*</span></span>
                    <input id="cLink" value={linkI} onChange={(event) => { setLinkI(event.target.value); setErr(""); }} className={inputClass} style={{ borderColor: "#CDBDBA" }} />
                    <span className="text-[13px] font-normal text-[#6B5A57]">Optional in the caption. The post tracks when it tags @myleaderhealth.</span>
                  </label>
                </div>
              ) : null}
              {step === 2 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[22px] font-semibold">Payment</h3>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Fixed base payment <span className="text-[#9B2C1F]">*</span></span>
                    <p className="inline-flex h-10 w-fit items-center rounded-full bg-ink px-4 text-sm font-medium text-white">Per campaign</p>
                  </div>
                  <label htmlFor="cAmt" className="flex max-w-xs flex-col gap-1.5 text-sm font-semibold">
                    <span>Amount for the whole campaign</span>
                    <span className="flex h-[50px] items-center rounded-xl border bg-white px-3.5" style={{ borderColor: badBorder(paymentCents(amt) === 0) }}>
                      <span aria-hidden="true" className="pr-1.5 text-lg text-[#6B5A57]">$</span>
                      <input id="cAmt" inputMode="decimal" value={amt} onChange={(event) => { setAmt(event.target.value); setErr(""); }} className="min-w-0 flex-1 border-0 bg-transparent text-lg font-normal text-ink outline-none" />
                    </span>
                  </label>
                  <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DEDC] bg-[#FBF9F8] p-4">
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={performance}
                        aria-label="Performance-based payments"
                        onClick={() => { setPerformance((on) => !on); setErr(""); }}
                        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full ${performance ? "bg-ink" : "bg-[#DCCFCC]"}`}
                      >
                        <span className={`absolute top-[3px] size-[18px] rounded-full bg-white ${performance ? "left-[19px]" : "left-[3px]"}`} />
                      </button>
                      <span className="flex flex-col gap-1">
                        <span className="text-[15px] font-semibold text-ink">Add performance-based payments</span>
                        <span className="text-sm font-normal text-[#6B5A57]">
                          {performance
                            ? "Included with this campaign, on top of the fixed base. Amounts are calculated after the results are recorded, so they are not in the estimate."
                            : "Off for this campaign. Turn it on to add these amounts on top of the fixed base. The rates are the same for every affiliate."}
                        </span>
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PERFORMANCE_METRICS.map((metric) => (
                        <div key={metric.key} className="flex flex-col gap-1 rounded-xl bg-white px-3.5 py-3">
                          <span className="text-sm font-semibold">{metric.title}</span>
                          <span className="text-sm text-ink">{rates[metric.key]}</span>
                          <span className="text-[13px] leading-snug text-[#6B5A57]">{metric.detail}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[13px] leading-snug text-[#6B5A57]">Lab commission stays on the affiliate account and is not part of this campaign payment.</p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl bg-[#F7F3F2] px-4 py-4">
                    <span className="text-sm text-[#4A3A37]">Estimated payment per affiliate</span>
                    <span className="text-[26px] font-semibold">{money(estimate)}</span>
                    <span className="text-[13px] text-[#6B5A57]">
                      One payment when all posts are verified
                      {performance ? " · performance pay is added after results" : ""}
                    </span>
                  </div>
                </div>
              ) : null}
              {step === 3 ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-[22px] font-semibold">Invite affiliates <span className="text-[#9B2C1F]">*</span></h3>
                  <p className="text-sm text-[#4A3A37]">Invite at least one affiliate. Only these affiliates will see the campaign. Each one is paid the campaign price. Change the amount only when that affiliate has a different price.</p>
                  {affiliates.length === 0 ? <p className="text-sm text-[#6B5A57]">No affiliate accounts yet.</p> : null}
                  {affiliates.map((affiliate) => {
                    const on = sel.includes(affiliate.code);
                    return (
                      <div key={affiliate.code} className="flex flex-wrap items-center gap-3.5 rounded-2xl border-[1.5px] px-3.5 py-3" style={{ borderColor: on ? "#33130F" : "#E8DEDC" }}>
                        <label className="flex min-h-11 min-w-[260px] flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => {
                              setSel(on ? sel.filter((code) => code !== affiliate.code) : [...sel, affiliate.code]);
                              setErr("");
                            }}
                            className="size-5 accent-ink"
                          />
                          <span className="flex size-9 items-center justify-center rounded-full bg-[#F3CFCB] text-xs font-semibold">{initials(affiliate.name)}</span>
                          <span className="flex flex-col">
                            <span className="text-base font-semibold">{affiliate.name}</span>
                            <span className="text-[13px] text-[#6B5A57]">{affiliate.email}</span>
                          </span>
                        </label>
                        {on ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] text-[#6B5A57]">for the campaign</span>
                            <span className="flex h-10 items-center rounded-[10px] border border-[#CDBDBA] px-2.5">
                              <span aria-hidden="true" className="text-[#6B5A57]">$</span>
                              <input
                                aria-label={`Payment for ${affiliate.name}`}
                                inputMode="decimal"
                                value={priceFor(affiliate.code)}
                                onChange={(event) => setAffiliatePrice(affiliate.code, event.target.value)}
                                className="w-[70px] border-0 bg-transparent text-[15px] font-semibold text-ink outline-none"
                              />
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {step === 4 ? (
                <div className="flex flex-col gap-3.5">
                  <h3 className="text-[22px] font-semibold">Review and send</h3>
                  {[
                    { title: "Details", lines: [name, `${showDay(start)} – ${showDay(end)} · ${plats.join(", ")}`, ...(goal.trim() ? [`Goal: ${goal.trim()}`] : [])], edit: 0 },
                    { title: "Content", lines: [`${postsN} × ${types.join(" or ")} per affiliate`, `Disclosure: “${disc}”`], edit: 1 },
                    { title: "Payment", lines: [`${money(baseCents)} per campaign, fixed`, performance ? "Performance-based pay: on. Views, engagements, verified link clicks, and eligible page views." : "Performance-based pay: off"], edit: 2 },
                    {
                      title: "Affiliates",
                      lines: sel.length ? sel.map((code) => {
                        const affiliate = affiliates.find((item) => item.code === code);
                        const unit = money(unitCents(code));
                        const total = `${unit} for the campaign`;
                        return `${affiliate?.name ?? code} · ${total}`;
                      }) : ["Invite at least one affiliate."],
                      edit: 3,
                    },
                  ].map((block) => (
                    <div key={block.title} className="flex items-start gap-3.5 rounded-2xl border border-[#E8DEDC] px-4 py-3.5">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="text-[13px] font-semibold tracking-[0.06em] text-[#6B5A57] uppercase">{block.title}</span>
                        {block.lines.map((line) => (
                          <span key={line} className="text-[15px]">{line}</span>
                        ))}
                      </div>
                      <button type="button" onClick={() => go(block.edit)} className="h-8 text-sm text-ink underline">
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {err ? <p role="alert" className="text-sm text-[#9B2C1F]">{err}</p> : null}
              <div className="flex items-center gap-2.5 border-t border-[#E8DEDC] pt-5">
                {step > 0 ? (
                  <button type="button" onClick={() => go(step - 1)} className="inline-flex h-[46px] items-center rounded-full border border-[#CDBDBA] bg-white px-5 text-[15px] font-medium text-ink">
                    Back
                  </button>
                ) : null}
                <span className="flex-1" />
                <button type="button" onClick={next} disabled={saving} className="inline-flex h-[46px] items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white disabled:opacity-50">
                  {step === 4 ? "Create & send campaign" : "Continue"}
                </button>
              </div>
            </section>
            <aside className="flex w-full flex-col gap-3 rounded-3xl bg-white p-5 xl:w-80 xl:shrink-0">
              <span className="text-[13px] font-semibold tracking-[0.06em] text-[#6B5A57] uppercase">Summary</span>
              <span className="text-lg font-semibold">{name.trim() || "Untitled campaign"}</span>
              <span className="text-sm text-[#4A3A37]">{showDay(start)} – {showDay(end)}</span>
              <span className="text-sm text-[#4A3A37]">
                {postsN} × {types.join(" or ") || "content"} · {plats.join(", ") || "no platform"}
              </span>
              <div className="flex flex-col gap-1 border-t border-[#F0E8E6] pt-3">
                <span className="text-[13px] text-[#6B5A57]">{sel.length ? `${sel.length} ${sel.length === 1 ? "affiliate" : "affiliates"} invited` : "Invite at least one affiliate"}</span>
                <span className="text-2xl font-semibold">{money(budget)}</span>
                <span className="text-[13px] text-[#6B5A57]">Estimated total, base payments only</span>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
