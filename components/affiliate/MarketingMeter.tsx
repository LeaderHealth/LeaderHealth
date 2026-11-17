"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { marketingPayPath } from "@/lib/affiliate/marketing-path";

function send(kind: "impression" | "page_view", path: string, placement?: string) {
  const body = JSON.stringify({ kind, path, placement });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/affiliate/marketing", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/affiliate/marketing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export function MarketingMeter() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const path = marketingPayPath(pathname);
    if (!path) return;
    if (search.get("ref") || search.get("utm_source")) return;
    send("page_view", path);
  }, [pathname, search]);
  return null;
}

export function MarketingPlacement({ id = "public-banner" }: { id?: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const path = marketingPayPath(pathname);
    if (!path) return;
    send("impression", path, id);
  }, [pathname, id]);
  return null;
}
