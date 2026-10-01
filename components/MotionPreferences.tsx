"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

const gentle = [0.22, 1, 0.36, 1] as const;

export function MotionPreferences({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: gentle }}>
      {children}
    </MotionConfig>
  );
}
