"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

type RevealState = {
  ready: boolean;
  shown: boolean;
  nextDelay: () => number;
};

const RevealContext = createContext<RevealState | null>(null);

function useReveal(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      setShown(true);
      return;
    }

    setReady(true);
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

  return { ref, ready, shown };
}

function motionStyle(
  ready: boolean,
  shown: boolean,
  hidden: string,
  visible: string,
  delay = 0,
): React.CSSProperties | undefined {
  if (!ready) return undefined;
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
  const { ref, ready, shown } = useReveal(true);

  return (
    <div ref={ref} className={className} style={motionStyle(ready, shown, "translateY(32px)", "translateY(0)", delay)}>
      {children}
    </div>
  );
}

export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, ready, shown } = useReveal(true);
  const index = useRef(0);
  index.current = 0;

  const value: RevealState = {
    ready,
    shown,
    nextDelay: () => {
      const delay = index.current * 0.12;
      index.current += 1;
      return delay;
    },
  };

  return (
    <RevealContext.Provider value={value}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </RevealContext.Provider>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const group = useContext(RevealContext);
  const own = useReveal(!group);
  const delay = useRef<number | null>(null);
  if (group && delay.current === null) delay.current = group.nextDelay();

  const ready = group ? group.ready : own.ready;
  const shown = group ? group.shown : own.shown;

  return (
    <div
      ref={group ? undefined : own.ref}
      className={className}
      style={motionStyle(ready, shown, "translateY(28px)", "translateY(0)", delay.current ?? 0)}
    >
      {children}
    </div>
  );
}

export function RevealPhoto({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, ready, shown } = useReveal(true);

  return (
    <div ref={ref} className={className} style={motionStyle(ready, shown, "scale(1.08)", "scale(1)")}>
      {children}
    </div>
  );
}

export function DrawRule({ className }: { className?: string }) {
  const { ref, ready, shown } = useReveal(true);

  return (
    <div
      ref={ref}
      aria-hidden
      className={className}
      style={motionStyle(ready, shown, "scaleX(0)", "scaleX(1)")}
    />
  );
}
