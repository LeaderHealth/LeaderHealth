"use client";

import { useState } from "react";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-ink/10 rounded-3xl bg-white">
      {items.map((item, i) => (
        <div key={item.q} className="px-5">
          <button
            type="button"
            className="flex w-full items-center justify-between py-5 text-left text-lg"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            <span className="text-accent">{open === i ? "–" : "+"}</span>
          </button>
          {open === i && <p className="pb-5 text-sm leading-relaxed text-taupe">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
