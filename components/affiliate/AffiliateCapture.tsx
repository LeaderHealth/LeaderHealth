"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AFFILIATE_CODE } from "@/lib/affiliate/code";

export function AffiliateCapture() {
  const pathname = usePathname();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toLowerCase() ?? "";
    if (!AFFILIATE_CODE.test(ref)) return;
    const path = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: ref, path }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
