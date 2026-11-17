"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { savePaymentRatesAction } from "@/app/admin/affiliates/payment-actions";

type RateKey = "views" | "engagements" | "clicks" | "pageViews";

const EMPTY: Record<RateKey, string> = {
  views: "2.00",
  engagements: "0.05",
  clicks: "0.10",
  pageViews: "2.00",
};

function dollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function centsOf(value: string) {
  const raw = value.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{0,2})?$/.test(raw)) return null;
  const cents = Math.round(Number(raw) * 100);
  if (!Number.isInteger(cents) || cents < 0) return null;
  return cents;
}

function exampleDollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function socialSample(viewRate: number, engagementRate: number) {
  const views = Math.round((24_000 * viewRate) / 1000);
  const engagements = 1_200 * engagementRate;
  return { total: views + engagements, views, engagements };
}

function websiteSample(clickRate: number, pageViewRate: number) {
  const clicks = 300 * clickRate;
  const pageViews = Math.round((2_000 * pageViewRate) / 1000);
  return { total: clicks + pageViews, clicks, pageViews };
}

function Pencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function RateCard({
  title,
  formula,
  name,
  value,
  editing,
  onEdit,
  onChange,
  onCommit,
}: {
  title: string;
  formula: string;
  name: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cents = centsOf(value);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  return (
    <div className="flex min-w-[240px] flex-1 flex-col justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="whitespace-nowrap text-sm text-taupe">{formula}</p>
          {editing ? (
            <input
              ref={inputRef}
              aria-label={`${title} rate`}
              inputMode="decimal"
              value={value}
              onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ""))}
              onBlur={onCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="w-24 rounded-full bg-[#efeae8] px-3 py-1.5 text-center text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          ) : (
            <span className="rounded-full bg-[#efeae8] px-3 py-1.5 text-sm text-ink">{cents == null ? "$0.00" : exampleDollars(cents)}</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#efeae8] px-3 py-1 text-xs text-taupe">Default</span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Pencil />
          Edit rate
        </button>
      </div>
      <input type="hidden" name={name} value={cents == null ? "" : dollars(cents)} />
    </div>
  );
}

function Example({ title, detail, amount, lines }: { title: string; detail: string; amount: string; lines: string[] }) {
  return (
    <div className="flex w-full min-w-[260px] max-w-[340px] shrink-0 flex-col justify-center rounded-2xl bg-ink px-4 py-3 text-white">
      <p className="text-xs font-medium uppercase tracking-wide text-white/60">Example calculation</p>
      <p className="mt-1 text-sm font-medium text-white">{title}</p>
      <p className="text-sm leading-5 text-white/70">{detail}</p>
      <p className="mt-2 text-4xl leading-none">{amount}</p>
      <div className="mt-2 space-y-0.5">
        {lines.map((line) => (
          <p key={line} className="text-lg leading-5 text-white/90">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export function PaymentRatesPanel({
  initial,
  error,
}: {
  initial: Record<RateKey, number>;
  error: string;
}) {
  const saved = {
    views: dollars(initial.views),
    engagements: dollars(initial.engagements),
    clicks: dollars(initial.clicks),
    pageViews: dollars(initial.pageViews),
  };
  const [values, setValues] = useState(saved);
  const [editing, setEditing] = useState<RateKey | null>(null);
  const dirty = (Object.keys(saved) as RateKey[]).some((key) => values[key] !== saved[key]);
  const amounts = {
    views: centsOf(values.views) ?? 0,
    engagements: centsOf(values.engagements) ?? 0,
    clicks: centsOf(values.clicks) ?? 0,
    pageViews: centsOf(values.pageViews) ?? 0,
  };
  const social = socialSample(amounts.views, amounts.engagements);
  const website = websiteSample(amounts.clicks, amounts.pageViews);

  function commit(key: RateKey) {
    const cents = centsOf(values[key]);
    setValues((current) => ({ ...current, [key]: cents == null ? saved[key] : dollars(cents) }));
    setEditing(null);
  }

  return (
    <form action={savePaymentRatesAction} className="space-y-4">
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      <section className="rounded-[28px] bg-white p-4 sm:p-5">
        <h3 className="text-lg font-medium">Social Media Pay</h3>
        <div className="mt-4 flex flex-wrap items-stretch gap-3">
          <RateCard
            title="Views"
            formula="Views ÷ 1,000 ×"
            name="viewsRate"
            value={values.views}
            editing={editing === "views"}
            onEdit={() => setEditing("views")}
            onChange={(value) => setValues((current) => ({ ...current, views: value }))}
            onCommit={() => commit("views")}
          />
          <span className="self-center text-lg text-taupe" aria-hidden="true">+</span>
          <RateCard
            title="Engagements"
            formula="Engagements ×"
            name="engagementsRate"
            value={values.engagements}
            editing={editing === "engagements"}
            onEdit={() => setEditing("engagements")}
            onChange={(value) => setValues((current) => ({ ...current, engagements: value }))}
            onCommit={() => commit("engagements")}
          />
          <span className="self-center text-lg text-taupe" aria-hidden="true">=</span>
          <Example
            title="Posts this month"
            detail="24k views, 1.2k engagements"
            amount={exampleDollars(social.total)}
            lines={[`${exampleDollars(social.views)} from views`, `${exampleDollars(social.engagements)} from engagements`]}
          />
        </div>
        <p className="mt-4 text-sm text-taupe">Engagements = likes, comments, shares and saves.</p>
      </section>

      <section className="rounded-[28px] bg-white p-4 sm:p-5">
        <h3 className="text-lg font-medium">Website traffic pay</h3>
        <div className="mt-4 flex flex-wrap items-stretch gap-3">
          <RateCard
            title="Verified link clicks"
            formula="Clicks ×"
            name="clicksRate"
            value={values.clicks}
            editing={editing === "clicks"}
            onEdit={() => setEditing("clicks")}
            onChange={(value) => setValues((current) => ({ ...current, clicks: value }))}
            onCommit={() => commit("clicks")}
          />
          <span className="self-center text-lg text-taupe" aria-hidden="true">+</span>
          <RateCard
            title="Eligible public page views"
            formula="Page views ÷ 1,000 ×"
            name="pageViewsRate"
            value={values.pageViews}
            editing={editing === "pageViews"}
            onEdit={() => setEditing("pageViews")}
            onChange={(value) => setValues((current) => ({ ...current, pageViews: value }))}
            onCommit={() => commit("pageViews")}
          />
          <span className="self-center text-lg text-taupe" aria-hidden="true">=</span>
          <Example
            title="Site traffic this month"
            detail="300 verified link clicks, 2k eligible page views"
            amount={exampleDollars(website.total)}
            lines={[`${exampleDollars(website.clicks)} from clicks`, `${exampleDollars(website.pageViews)} from page views`]}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-white px-5 py-4">
        <p className="text-sm">
          <span className="font-medium">Lab commission</span>
          <span className="text-taupe"> · set on each affiliate&apos;s account</span>
        </p>
        <Link href="/admin/affiliates/accounts" className="text-sm text-ink underline underline-offset-4">
          Open accounts
        </Link>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <button
          type={dirty ? "submit" : "button"}
          className={`inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm ${dirty ? "bg-ink text-white hover:bg-brown" : "bg-[#e6e0de] text-taupe"}`}
        >
          {dirty ? "Save rates" : "Saved"}
        </button>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setEditing(null);
          }}
          className="text-sm text-taupe underline underline-offset-4"
        >
          Reset all to defaults
        </button>
      </div>
    </form>
  );
}
