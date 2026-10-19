"use client";

import { useId, useState } from "react";

export function AttachedSlugs({ slugs }: { slugs: { slug: string; name: string }[] }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  if (slugs.length === 0) return null;

  const label = `${slugs.length} ${slugs.length === 1 ? "slug" : "slugs"}`;

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 text-sm text-brown hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={open ? "rotate-180" : ""}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <ul id={listId} className="mt-1 space-y-1 text-xs leading-5 text-brown">
          {slugs.map((item) => (
            <li key={item.slug} className="break-all">
              {item.slug}
              {item.name ? <span className="text-ink"> · {item.name}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
