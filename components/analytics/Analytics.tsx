"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const INTERNAL_HOST = "leaderhealth-platform.vercel.app";
let posthogStarted = false;
let lastPosthogUrl = "";
let lastGaPage = "";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

function isExcluded(pathname: string) {
  return (
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function measurementId() {
  if (!GA_MEASUREMENT_ID || !/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return null;
  return GA_MEASUREMENT_ID;
}

function posthogUiHost() {
  if (POSTHOG_HOST?.includes("eu.")) return "https://eu.posthog.com";
  return "https://us.posthog.com";
}

export function Analytics() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const blocked = isExcluded(pathname);
  const optedOut = useRef(false);
  const gaId = measurementId();

  useLayoutEffect(() => {
    if (!gaId) return;
    window[`ga-disable-${gaId}`] = blocked;
  }, [blocked, gaId]);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (blocked) {
      lastPosthogUrl = "";
      if (posthogStarted) {
        posthog.opt_out_capturing();
        optedOut.current = true;
      }
      return;
    }

    if (!posthogStarted) {
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: posthogUiHost(),
        capture_pageview: false,
        persistence: "localStorage+cookie",
      });
      posthog.register({ site: "cursor" });
      posthogStarted = true;
    } else if (optedOut.current) {
      posthog.opt_in_capturing();
      optedOut.current = false;
    }

    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
    if (lastPosthogUrl !== url) {
      lastPosthogUrl = url;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [blocked, pathname, query]);

  useEffect(() => {
    if (!gaId || blocked) {
      if (blocked) lastGaPage = "";
      return;
    }

    let cancelled = false;
    const send = () => {
      if (cancelled || typeof window.gtag !== "function") return false;
      const page_path = query ? `${pathname}?${query}` : pathname;
      if (lastGaPage === page_path) return true;
      lastGaPage = page_path;
      const internal = window.location.hostname === INTERNAL_HOST;
      window.gtag("event", "page_view", {
        page_path,
        page_location: `${window.location.origin}${page_path}`,
        site: "cursor",
        ...(internal ? { traffic_type: "internal" } : {}),
      });
      return true;
    };

    if (send()) return;
    const id = window.setInterval(() => {
      if (send()) window.clearInterval(id);
    }, 100);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [blocked, gaId, pathname, query]);

  if (blocked || !gaId) return null;

  const configScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
var config = { send_page_view: false, site: 'cursor' };
if (location.hostname === '${INTERNAL_HOST}') config.traffic_type = 'internal';
gtag('config', '${gaId}', config);
`;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {configScript}
      </Script>
    </>
  );
}
