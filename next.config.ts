import type { NextConfig } from "next";

const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
  /\/$/,
  "",
);

function posthogAssetsHost(host: string) {
  try {
    const url = new URL(host);
    url.hostname = url.hostname.replace(".i.posthog.com", "-assets.i.posthog.com");
    return url.origin;
  } catch {
    return "https://us-assets.i.posthog.com";
  }
}

const nextConfig: NextConfig = {
  // The dev server treats 127.0.0.1 as a different host from localhost and
  // blocks the page scripts. Without those scripts the navbar cannot open.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "220mb",
    },
  },
  // PostHog's ingest paths use a trailing slash. Next would redirect those
  // POSTs and drop the event body. Public links on this site have no slash.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost(posthogHost)}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "framerusercontent.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
