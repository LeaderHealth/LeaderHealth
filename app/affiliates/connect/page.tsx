import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { skipSocialOnboarding } from "@/app/affiliates/connect-actions";
import { PortalLegalLinks } from "@/components/affiliate/PortalLegalLinks";
import { currentAffiliate } from "@/app/affiliates/current";
import { metaConfigured, tiktokConfigured, youtubeConfigured } from "@/lib/affiliate/social-oauth";
import { loadSocialAccounts, type SocialAccountView } from "@/lib/affiliate/social-store";

export const metadata: Metadata = {
  title: "Connect accounts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const connectClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const laterClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/15 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function connectionStatus(accounts: SocialAccountView[]) {
  if (accounts.some((account) => account.needsReconnect)) return "Reconnect required";
  if (accounts.length > 0) return "Connected";
  return "Not connected";
}

export default async function ConnectAccountsPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const accounts = await loadSocialAccounts(affiliate.code).catch(() => [] as SocialAccountView[]);
  const facebook = accounts.filter((account) => account.network === "facebook");
  const instagram = accounts.filter((account) => account.network === "instagram");
  const tiktok = accounts.filter((account) => account.network === "tiktok");
  const rows = [
    {
      name: "TikTok",
      status: connectionStatus(tiktok),
      detail: "Leader Health reads the display name and video list to verify an approved post. Leader Health does not post to TikTok.",
      href: tiktokConfigured() ? "/api/affiliate/social/tiktok/start" : null,
      unavailable: tiktokConfigured() ? "" : "TikTok reporting is not set up.",
    },
    {
      name: "Instagram",
      status: connectionStatus(instagram),
      detail: "Instagram connects with the Facebook Page. That is the official Meta connection.",
      href: metaConfigured() ? "/api/affiliate/social/meta/start" : null,
      unavailable: metaConfigured() ? "" : "Instagram reporting is not set up.",
    },
    {
      name: "Facebook",
      status: connectionStatus(facebook),
      detail: "Connecting reads the Facebook Page so a linked professional Instagram account can be included.",
      href: metaConfigured() ? "/api/affiliate/social/meta/start" : null,
      unavailable: metaConfigured() ? "" : "Facebook reporting is not set up.",
    },
    {
      name: "YouTube",
      status: "Not connected",
      detail: youtubeConfigured()
        ? "YouTube reporting stays off until Google approves the app."
        : "YouTube reporting is not set up.",
      href: null,
      unavailable: youtubeConfigured() ? "YouTube reporting is not available yet." : "YouTube reporting is not set up.",
    },
  ];

  return (
    <section className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-4xl">Connect accounts</h1>
        <p className="mt-4 text-sm leading-relaxed text-brown">
          Connecting at least one account lets Leader Health verify an approved promotional post and fill in its views, likes, comments, shares, reach, and impressions. Connecting is encouraged and is not required to finish. Leader Health does not post for you and does not ask for a password.
        </p>
        <div className="mt-6 grid gap-4">
          {rows.map((row) => (
            <article key={row.name} className="rounded-[28px] bg-white p-4 sm:p-6">
              <h2 className="text-lg">{row.name}</h2>
              <p className="mt-1 text-sm font-medium">{row.status}</p>
              <p className="mt-2 text-sm leading-relaxed text-brown">{row.detail}</p>
              {row.name === "TikTok" ? (
                <p className="mt-2 text-sm leading-relaxed text-brown">
                  <a href="/affiliates/privacy#tiktok-accounts" className="underline underline-offset-4">
                    Affiliate Privacy Policy
                  </a>
                </p>
              ) : null}
              {row.href ? (
                <a href={row.href} className={`${connectClass} mt-4`}>
                  Connect account
                </a>
              ) : (
                <button type="button" disabled className={`${connectClass} mt-4 cursor-not-allowed opacity-70`}>
                  {row.unavailable}
                </button>
              )}
            </article>
          ))}
        </div>
        <form action={skipSocialOnboarding} className="mt-4">
          <button type="submit" className={laterClass}>
            I&apos;ll do this later
          </button>
        </form>
        <PortalLegalLinks className="mt-8" />
      </div>
    </section>
  );
}
