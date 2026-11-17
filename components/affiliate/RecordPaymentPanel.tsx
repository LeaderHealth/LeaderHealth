"use client";

import { formatCents } from "@/lib/affiliate/format";
import { useId, useState, type FormEvent } from "react";

const METHODS = ["ACH", "PayPal", "Check"] as const;

type Method = (typeof METHODS)[number];

export type PaymentRecord = {
  code: string;
  name: string;
  period: string;
  postId?: string;
  amountCents: number;
  paidOn: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function RecordPaymentPanel({ record, onCancel }: { record: PaymentRecord; onCancel: () => void }) {
  const baseId = useId();
  const [method, setMethod] = useState<Method>("ACH");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const reference = `${method} · ${note.trim()}`.slice(0, 80);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!note.trim()) {
      event.preventDefault();
      setError("Add the payment reference so it can be traced.");
    }
  }

  return (
    <form action={record.action} onSubmit={onSubmit} className="rounded-2xl border-2 border-ink px-4 py-4">
      <h4 className="text-base font-medium">Record the {formatCents(record.amountCents)} payment to {record.name}</h4>
      <p className="mt-1 text-sm text-brown">Send the money outside the dashboard first, then fill this in.</p>
      <input type="hidden" name="code" value={record.code} />
      <input type="hidden" name="period" value={record.period} />
      {record.postId ? <input type="hidden" name="postId" value={record.postId} /> : null}
      <input type="hidden" name="amount" value={(record.amountCents / 100).toFixed(2)} />
      <input type="hidden" name="reference" value={reference} />
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr_1fr] lg:items-end">
        <label className="text-sm font-medium" htmlFor={`${baseId}-date`}>
          Date paid
          <input id={`${baseId}-date`} name="paidOn" type="date" required defaultValue={record.paidOn} className="mt-1.5 h-11 w-full rounded-xl border border-[#cdbdbA] bg-white px-3 text-sm text-ink" />
        </label>
        <div>
          <p className="text-sm font-medium" id={`${baseId}-method`}>
            Method
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${baseId}-method`}>
            {METHODS.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={method === item}
                onClick={() => setMethod(item)}
                className={`inline-flex h-11 items-center justify-center rounded-full px-3.5 text-sm font-medium ${method === item ? "border border-ink bg-ink text-white" : "border border-[#cdbdbA] bg-white text-ink"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm font-medium" htmlFor={`${baseId}-reference`}>
          Reference
          <input
            id={`${baseId}-reference`}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            maxLength={70}
            placeholder="e.g. ACH trace or PayPal ID"
            aria-invalid={error ? true : undefined}
            className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm text-ink placeholder:text-brown ${error ? "border-[#9b2c1f]" : "border-[#cdbdbA]"}`}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[#9b2c1f]">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2.5">
        <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown">
          Mark as paid
        </button>
        <button type="button" onClick={onCancel} className="inline-flex h-11 items-center justify-center rounded-full border border-[#cdbdbA] bg-white px-4 text-sm text-ink hover:bg-background">
          Cancel
        </button>
      </div>
    </form>
  );
}
