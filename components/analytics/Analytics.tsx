"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

type PostHogClient = {
  __loaded: boolean;
  init: (key: string, options: Record<string, unknown>) => void;
  register: (properties: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
  has_opted_in_capturing: () => boolean;
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const COOKIEYES_ID = process.env.NEXT_PUBLIC_COOKIEYES_CLIENT_ID;
const INTERNAL_HOST = "leaderhealth-platform.vercel.app";
let posthogClient: PostHogClient | null = null;
let lastPosthogUrl = "";
let lastGaPage = "";

async function loadPosthog() {
  if (!posthogClient) {
    posthogClient = (await import("posthog-js")).default as PostHogClient;
  }
  return posthogClient;
}

type ConsentDetail = {
  accepted?: string[];
  categories?: { analytics?: boolean };
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    getCkyConsent?: () => { categories?: { analytics?: boolean } };
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

function analyticsFromDetail(detail: ConsentDetail | undefined) {
  if (!detail) return null;
  if (Array.isArray(detail.accepted)) return detail.accepted.includes("analytics");
  if (detail.categories) return Boolean(detail.categories.analytics);
  return null;
}

function analyticsFromCookieYes() {
  try {
    const consent = window.getCkyConsent?.();
    if (!consent?.categories) return null;
    return Boolean(consent.categories.analytics);
  } catch {
    return null;
  }
}

export function Analytics() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const blocked = isExcluded(pathname);
  const gaId = measurementId();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const track = Boolean(COOKIEYES_ID) && analyticsAllowed && !blocked;

  useEffect(() => {
    if (!COOKIEYES_ID) return;

    const apply = (value: boolean | null) => {
      if (value !== null) setAnalyticsAllowed(value);
    };

    const onConsent = (event: Event) => {
      apply(analyticsFromDetail((event as CustomEvent<ConsentDetail>).detail));
    };

    apply(analyticsFromCookieYes());
    document.addEventListener("cookieyes_banner_load", onConsent);
    document.addEventListener("cookieyes_consent_update", onConsent);
    return () => {
      document.removeEventListener("cookieyes_banner_load", onConsent);
      document.removeEventListener("cookieyes_consent_update", onConsent);
    };
  }, []);

  useLayoutEffect(() => {
    if (!gaId) return;
    window[`ga-disable-${gaId}`] = !track;
  }, [gaId, track]);

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (!track) {
      lastPosthogUrl = "";
      posthogClient?.opt_out_capturing();
      return;
    }

    let cancelled = false;
    loadPosthog().then((posthog) => {
      if (cancelled) return;
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_KEY, {
          api_host: "/ingest",
          ui_host: posthogUiHost(),
          capture_pageview: false,
          persistence: "localStorage+cookie",
        });
        posthog.register({ site: "cursor" });
      } else if (!posthog.has_opted_in_capturing()) {
        posthog.opt_in_capturing();
      }

      const url = `${window.location.origin}${pathname}${query ? `?${query}` : ""}`;
      if (lastPosthogUrl !== url) {
        lastPosthogUrl = url;
        posthog.capture("$pageview", { $current_url: url });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, query, track]);

  useEffect(() => {
    if (!gaId || !track) {
      if (!track) lastGaPage = "";
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
  }, [gaId, pathname, query, track]);

  if (!track || !gaId) return null;

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
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {configScript}
      </Script>
    </>
  );
}
