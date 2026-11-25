"use client";

import { useLayoutEffect, useRef, useState } from "react";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33130F]";
const pillEase = "duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const [frame, setFrame] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const node = nodes.current.get(value);
      if (!node) return;
      const rootBox = root.getBoundingClientRect();
      const box = node.getBoundingClientRect();
      setFrame({
        x: box.left - rootBox.left,
        y: box.top - rootBox.top,
        w: box.width,
        h: box.height,
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    for (const node of nodes.current.values()) observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={rootRef} role="group" aria-label={label} className={`relative flex w-fit gap-1 rounded-full bg-[#F7F3F2] p-1 ${className}`}>
      {frame ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 left-0 rounded-full bg-[#33130F] transition-[transform,width,height] ${pillEase}`}
          style={{ width: frame.w, height: frame.h, transform: `translate(${frame.x}px, ${frame.y}px)` }}
        />
      ) : null}
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            ref={(node) => {
              if (node) nodes.current.set(option.id, node);
              else nodes.current.delete(option.id);
            }}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.id)}
            className={`relative z-[1] h-9 rounded-full px-3.5 text-sm font-medium transition-colors ${pillEase} ${frame ? "bg-transparent" : on ? "bg-[#33130F]" : ""} ${on ? "text-white" : "text-[#33130F]"} ${focusRing}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
