import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { skipSocialOnboarding } from "@/app/affiliates/connect-actions";
import { disconnectSocialAction } from "@/app/affiliates/social-actions";
import { currentAffiliate } from "@/app/affiliates/current";
import { SocialConnectLink } from "@/components/affiliate/SocialConnectPrompt";
import { instagramConfigured, metaConfigured, tiktokConfigured, youtubeConfigured } from "@/lib/affiliate/social-oauth";
import { readSocialOnboarding } from "@/lib/affiliate/social-onboarding";
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

const disconnectNotice: Record<string, string> = {
  disconnected: "Account disconnected. Connect the account you want to use.",
  "disconnected-instagram": "Leader Health is disconnected. You can also remove Leader Health in Instagram or Facebook under Settings, Security, Apps and websites.",
  "disconnected-facebook": "Leader Health is disconnected. You can also remove Leader Health in Facebook under Settings, Security, Apps and websites.",
  "disconnected-tiktok": "Leader Health is disconnected. You can also remove Leader Health in TikTok under Settings, Security, Manage app permissions.",
  "disconnected-youtube": "Leader Health is disconnected. You can also remove Leader Health in your Google Account under Security, Third-party apps and services.",
};

export default async function ConnectAccountsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const onboarding = await readSocialOnboarding(affiliate.code).catch(() => "skipped" as const);
  const accounts = await loadSocialAccounts(affiliate.code).catch(() => [] as SocialAccountView[]);
  const facebook = accounts.filter((account) => account.network === "facebook");
  const instagram = accounts.filter((account) => account.network === "instagram");
  const tiktok = accounts.filter((account) => account.network === "tiktok");
  const rows = [
    {
      name: "TikTok",
      network: "tiktok" as const,
      accounts: tiktok,
      detail: "Leader Health reads the display name and video list to verify an approved post. Leader Health does not post to TikTok.",
      href: tiktokConfigured() ? "/api/affiliate/social/tiktok/start" : null,
      unavailable: tiktokConfigured() ? "" : "TikTok reporting is not set up.",
      changeLabel: "Change TikTok account",
    },
    {
      name: "Instagram",
      network: "instagram" as const,
      accounts: instagram,
      detail: "Connect the Instagram account you post from. Leader Health reads its posts and stats. Leader Health does not post for you.",
      href: instagramConfigured() ? "/api/affiliate/social/instagram/start" : null,
      unavailable: instagramConfigured() ? "" : "Instagram reporting is not set up.",
      changeLabel: "Change Instagram account",
    },
    {
      name: "Facebook",
      network: "facebook" as const,
      accounts: facebook,
      detail: "Connect a Facebook Page you manage. Leader Health reads its posts and stats. Leader Health does not post for you.",
      href: metaConfigured() ? "/api/affiliate/social/meta/start" : null,
      unavailable: metaConfigured() ? "" : "Facebook reporting is not set up.",
      changeLabel: "Change Facebook account",
    },
    {
      name: "YouTube",
      network: "youtube" as const,
      accounts: accounts.filter((account) => account.network === "youtube"),
      detail: "Connecting reads the YouTube channel name. Leader Health does not post to YouTube.",
      href: youtubeConfigured() ? "/api/affiliate/social/youtube/start" : null,
      unavailable: "YouTube reporting is not set up.",
      changeLabel: "Change YouTube channel",
    },
  ];

  return (
    <div className="min-w-0">
      <h2 className="text-2xl">Connect accounts</h2>
      {query.error === "social" ? <p role="alert" className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">That account could not be disconnected.</p> : null}
      {query.notice && disconnectNotice[query.notice] ? <p role="status" className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink">{disconnectNotice[query.notice]}</p> : null}
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-brown">
        Connecting at least one account lets Leader Health verify an approved promotional post and fill in its views, likes, comments, shares, reach, and impressions. Connecting is encouraged and is not required to finish. Leader Health does not post for you and does not ask for a password.
      </p>
      <div className="mt-6 grid items-stretch gap-4 md:grid-cols-2">
        {rows.map((row) => {
          const names = row.accounts.map((account) => account.accountName).filter(Boolean);
          const connected = row.accounts.length > 0 && !row.accounts.some((account) => account.needsReconnect);
          const reconnect = row.accounts.some((account) => account.needsReconnect);
          return (
            <article key={row.name} className="flex h-full flex-col rounded-[28px] bg-white p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg">{row.name}</h3>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-[#DDF0E4] text-[#1D6340]" : reconnect ? "bg-rose text-ink" : "bg-background text-brown"}`}>
                  {connected ? "Connected" : reconnect ? "Reconnect required" : "Not connected"}
                </span>
              </div>
              {names.length > 0 ? <p className="mt-3 text-sm font-medium">{names.join(", ")}</p> : null}
              {connected ? <p className="mt-1 text-sm text-brown">This account is already connected.</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-brown">{row.detail}</p>
              {row.name === "TikTok" ? (
                <p className="mt-2 text-sm leading-relaxed text-brown">
                  <a href="/affiliates/privacy#tiktok-accounts" className="underline underline-offset-4">
                    Affiliate Privacy Policy
                  </a>
                </p>
              ) : null}
              {row.name === "YouTube" ? (
                <p className="mt-2 text-sm leading-relaxed text-brown">
                  <a href="/affiliates/privacy#youtube-accounts" className="underline underline-offset-4">
                    Affiliate Privacy Policy
                  </a>
                </p>
              ) : null}
              <div className="mt-auto pt-4">
                {row.href && connected ? (
                  <SocialConnectLink href={row.href} className={laterClass}>
                    {row.changeLabel}
                  </SocialConnectLink>
                ) : null}
                {row.href && !connected ? (
                  <SocialConnectLink href={row.href} className={connectClass}>
                    {reconnect ? row.changeLabel : "Connect account"}
                  </SocialConnectLink>
                ) : null}
                {!row.href ? (
                  <button type="button" disabled className={`${connectClass} cursor-not-allowed opacity-70`}>
                    {row.unavailable}
                  </button>
                ) : null}
                {row.accounts.length > 0 ? (
                  <form action={disconnectSocialAction} className="mt-3">
                    <input type="hidden" name="network" value={row.network} />
                    <button type="submit" className={laterClass}>
                      Disconnect
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {onboarding === "pending" ? (
        <form action={skipSocialOnboarding} className="mt-4">
          <button type="submit" className={laterClass}>
            I&apos;ll do this later
          </button>
        </form>
      ) : null}
    </div>
  );
}
