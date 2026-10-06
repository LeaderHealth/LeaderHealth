"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const revealOverride =
  "motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:transition-none!";

function withRevealClass(className?: string) {
  return className ? `${className} ${revealOverride}` : revealOverride;
}

function useReveal(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, shown };
}

function motionStyle(shown: boolean, hidden: string, visible: string, delay = 0): React.CSSProperties {
  if (!shown) return { opacity: 0, transform: hidden };
  return {
    opacity: 1,
    transform: visible,
    transition: `opacity 0.75s ${ease} ${delay}s, transform 0.75s ${ease} ${delay}s`,
  };
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal(true);

  return (
    <div
      ref={ref}
      className={withRevealClass(className)}
      style={motionStyle(shown, "translateY(32px)", "translateY(0)", delay)}
    >
      {children}
    </div>
  );
}

type GroupedItemProps = {
  delay?: number;
  shown?: boolean;
  grouped?: boolean;
};

export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, shown } = useReveal(true);

  const items = Children.toArray(children).map((child, index) => {
    if (!isValidElement<GroupedItemProps>(child)) return child;
    return cloneElement(child, { delay: index * 0.12, shown, grouped: true });
  });

  return (
    <div ref={ref} className={className}>
      {items}
    </div>
  );
}

export function RevealItem({
  children,
  className,
  delay = 0,
  shown: shownFromGroup = false,
  grouped = false,
}: GroupedItemProps & {
  children: ReactNode;
  className?: string;
}) {
  const own = useReveal(!grouped);
  const shown = grouped ? shownFromGroup : own.shown;

  return (
    <div
      ref={grouped ? undefined : own.ref}
      className={withRevealClass(className)}
      style={motionStyle(shown, "translateY(28px)", "translateY(0)", delay)}
    >
      {children}
    </div>
  );
}

export function RevealPhoto({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, shown } = useReveal(true);

  return (
    <div ref={ref} className={withRevealClass(className)} style={motionStyle(shown, "scale(1.08)", "scale(1)")}>
      {children}
    </div>
  );
}

export function DrawRule({ className }: { className?: string }) {
  const { ref, shown } = useReveal(true);

  return (
    <div
      ref={ref}
      aria-hidden
      className={withRevealClass(className)}
      style={motionStyle(shown, "scaleX(0)", "scaleX(1)")}
    />
  );
}
