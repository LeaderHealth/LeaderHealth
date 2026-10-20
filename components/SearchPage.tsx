"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchHref, searchSite, type SearchHit, type SearchSection } from "@/lib/search";

const sections: { id: SearchSection; label: string }[] = [
  { id: "treatments", label: "Treatments" },
  { id: "articles", label: "Articles" },
  { id: "faq", label: "FAQ" },
  { id: "labs", label: "Diagnostic Labs" },
];

const DEBOUNCE_MS = 200;

function ResultCard({ hit }: { hit: SearchHit }) {
  return (
    <Link
      href={hit.href}
      className="flex min-h-[148px] flex-col rounded-3xl bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-accent">{hit.category}</p>
      <h3 className="mt-2 text-xl leading-tight sm:text-2xl">{hit.title}</h3>
      {hit.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-brown">{hit.description}</p> : null}
    </Link>
  );
}

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    if (current === debounced) return;
    router.replace(searchHref(debounced), { scroll: false });
  }, [debounced, router]);

  useEffect(() => {
    const onPop = () => {
      const next = new URLSearchParams(window.location.search).get("q") ?? "";
      window.clearTimeout(timer.current);
      setQuery(next);
      setDebounced(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function onQuery(value: string) {
    setQuery(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebounced(value), DEBOUNCE_MS);
  }

  function submitQuery(value = query) {
    window.clearTimeout(timer.current);
    setQuery(value);
    setDebounced(value);
  }

  const results = useMemo(() => searchSite(debounced), [debounced]);
  const term = debounced.trim();
  const total = sections.reduce((count, section) => count + results[section.id].length, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-32">
      <h1 className="text-4xl sm:text-5xl">Search</h1>
      <label className="relative mt-6 block max-w-xl">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink/45">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            submitQuery(event.currentTarget.value);
          }}
          placeholder="Search treatments, articles, FAQs, and labs"
          aria-label="Search"
          autoComplete="off"
          enterKeyHint="search"
          className="h-12 w-full rounded-full border border-ink/10 bg-white pr-5 pl-11 text-base text-ink outline-none placeholder:text-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
      </label>

      {term ? (
        <p className="mt-8 text-lg text-ink" aria-live="polite">
          Results for: &quot;{term}&quot;
        </p>
      ) : (
        <p className="mt-8 text-lg text-taupe">Browse treatments, articles, FAQs, and diagnostic labs.</p>
      )}

      {term && total === 0 ? (
        <div className="mt-8 rounded-3xl bg-white px-6 py-10 text-center sm:px-10">
          <h2 className="text-2xl sm:text-3xl">No results found for &quot;{term}&quot;</h2>
          <p className="mx-auto mt-3 max-w-md text-brown">Try another search term or explore all treatments.</p>
          <Link
            href="/shop-all-products"
            className="group relative mt-6 inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[#DF4452] px-6 font-sans text-sm font-semibold text-[#F7F3F5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#E33D4E] transition-transform duration-[400ms] ease-out group-hover:scale-[36] motion-reduce:scale-100! motion-reduce:transition-none"
            />
            <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
              Shop All Treatments
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-28px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {sections.map((section) => {
            const hits = results[section.id];
            if (hits.length === 0) return null;
            return (
              <section key={section.id} aria-label={section.label}>
                <h2 className="text-3xl">{section.label}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {hits.map((hit) => (
                    <ResultCard key={`${section.id}-${hit.id}`} hit={hit} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
