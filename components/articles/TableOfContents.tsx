"use client";

import { useEffect, useState, type RefObject } from "react";

export type TableOfContentsProps = {
  title?: string;
  fontSize?: number;
  activeColor?: string;
  fontFamily?: string;
  containerRef: RefObject<HTMLElement | null>;
  showTitle?: boolean;
};

type HeadingLink = { id: string; text: string };

export function TableOfContents({
  title = "In this article",
  fontSize = 14,
  activeColor = "#000000",
  fontFamily = "inherit",
  containerRef,
  showTitle = true,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingLink[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const nodes = [...root.querySelectorAll<HTMLElement>("h2[id], h3[id]")];
    const next = nodes
      .map((node) => ({ id: node.id, text: node.textContent?.trim() ?? "" }))
      .filter((item) => item.text);
    setHeadings(next);
    setActiveId(next[0]?.id ?? "");

    if (nodes.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        const current = nodes.find((node) => visible.has(node.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={title} style={{ fontFamily, fontSize }}>
      {showTitle ? <p className="mb-3 font-sans text-[14px] leading-snug font-semibold text-[#321110]">{title}</p> : null}
      <ol className="flex flex-col gap-2.5">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="block leading-snug"
                style={{ color: active ? activeColor : "#7a5a56", fontWeight: active ? 600 : 500 }}
                onClick={(event) => {
                  const target = document.getElementById(heading.id);
                  if (!target) return;
                  event.preventDefault();
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveId(heading.id);
                }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
