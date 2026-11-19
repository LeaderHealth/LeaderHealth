"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [initialPath] = useState(pathname);
  const [animate, setAnimate] = useState(false);
  const dashboard = pathname.startsWith("/affiliates") || pathname.startsWith("/admin/affiliates");

  if (!dashboard && !animate && pathname !== initialPath) {
    setAnimate(true);
  }

  if (dashboard) return <>{children}</>;

  return (
    <div key={pathname} className={animate ? "lh-page-fade" : undefined}>
      {children}
    </div>
  );
}
