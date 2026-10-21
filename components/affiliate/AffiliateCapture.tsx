"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveAffiliateAttribution } from "@/lib/affiliate/code";

export function AffiliateCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const utmSource = searchParams.get("utm_source");
  const code = resolveAffiliateAttribution(ref, utmSource, null).code ?? "";
  const campaign = searchParams.get("utm_campaign");

  useEffect(() => {
    if (!code) return;
    const path = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
    void fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref, utm_source: utmSource, path, campaign }),
      keepalive: true,
    });
  }, [pathname, ref, utmSource, code, campaign]);

  return null;
}
