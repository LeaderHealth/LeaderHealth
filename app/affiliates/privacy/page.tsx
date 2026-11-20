import type { Metadata } from "next";
import Link from "next/link";
import { PortalReturnLink } from "@/components/affiliate/PortalReturnLink";

export const metadata: Metadata = {
  title: "Affiliate Privacy Policy",
  robots: { index: false, follow: false },
};

export default function AffiliatePrivacyPage() {
  return (
    <article className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PortalReturnLink />
        <h1 className="mt-6 text-4xl">Affiliate Privacy Policy</h1>
        <p className="mt-3 text-sm text-taupe">Effective Date: November 20, 2026</p>
        <h2 className="mt-10 text-2xl">Affiliates</h2>
        <h3 id="tiktok-accounts" className="mt-6 text-xl">
          TikTok accounts
        </h3>
        <p className="mt-4 leading-relaxed text-brown">
          An affiliate can connect a TikTok account from Connected accounts. Connecting is optional. When an affiliate connects TikTok, Leader Health receives the TikTok display name and that account’s video list. The video list includes each video’s caption, link, and public counts for views, likes, comments, and shares. Leader Health uses this information to show that affiliate which of their videos include their Leader Health tracking link or match a post URL they submitted. Leader Health does not post, edit, or delete TikTok videos.
        </p>
        <p className="mt-4 leading-relaxed text-brown">
          To delete this information, email privacy@myleaderhealth.com from the email on the affiliate account and ask Leader Health to delete the TikTok connection. Leader Health then deletes the display name and video list. The affiliate can also remove Leader Health in the TikTok app under Settings, Security, Manage app permissions. Removing Leader Health there stops new access. The email deletes the copy Leader Health already stored.
        </p>
        <h3 id="youtube-accounts" className="mt-6 text-xl">
          YouTube accounts
        </h3>
        <p className="mt-4 leading-relaxed text-brown">
          An affiliate can connect a YouTube channel from Connected accounts. Connecting is optional. When an affiliate connects YouTube, Leader Health receives the channel name. Leader Health uses the channel name to recognize that channel when the affiliate submits a YouTube link. Leader Health does not post, edit, or delete YouTube videos.
        </p>
        <p className="mt-4 leading-relaxed text-brown">
          To delete this information, email privacy@myleaderhealth.com from the email on the affiliate account and ask Leader Health to delete the YouTube connection. Leader Health then deletes the channel name. The affiliate can also remove Leader Health in their Google Account under Security, Third-party apps and services. Removing Leader Health there stops new access. The email deletes the copy Leader Health already stored.
        </p>
        <h3 id="facebook-instagram-accounts" className="mt-6 text-xl">
          Facebook and Instagram accounts
        </h3>
        <p className="mt-4 leading-relaxed text-brown">
          An affiliate can connect Facebook and Instagram from Connected accounts. Connecting is optional. Facebook connects through a Facebook Page. Leader Health receives the Page name and that Page’s posts. Each post includes its caption, link, and counts for reactions, comments, shares, impressions, and reach. Instagram connects through Instagram’s own login with a professional account. Leader Health receives the account name and that account’s media. Each media item includes its caption, link, and counts for likes, comments, shares, saves, reach, and views. Leader Health uses this information to show that affiliate which of their Facebook or Instagram posts include their Leader Health tracking link or match a post URL they submitted. Leader Health does not post, edit, or delete Facebook or Instagram content.
        </p>
        <p className="mt-4 leading-relaxed text-brown">
          To delete this information, email privacy@myleaderhealth.com from the email on the affiliate account and ask Leader Health to delete the Facebook or Instagram connection. Leader Health then deletes the Page name, the Instagram account name, and the saved post and media lists. The affiliate can also remove Leader Health in Facebook under Settings and privacy, Settings, Apps and websites, and remove Leader Health from the Instagram account’s apps and websites settings. Removing Leader Health there stops new access. The email deletes the copy Leader Health already stored.
        </p>
        <p className="mt-10 text-sm">
          <Link href="/affiliates/terms" className="font-medium text-ink underline underline-offset-4">
            Affiliate Terms of Service
          </Link>
        </p>
      </div>
    </article>
  );
}
