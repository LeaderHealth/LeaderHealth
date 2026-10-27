"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

const gentle = [0.22, 1, 0.36, 1] as const;

export function MotionPreferences({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const sync = () => setReduced(document.documentElement.dataset.a11yMotion === "reduce");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-a11y-motion"] });
    return () => observer.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"} transition={{ duration: 0.7, ease: gentle }}>
      {children}
    </MotionConfig>
  );
}
