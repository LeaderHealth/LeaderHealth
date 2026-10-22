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
