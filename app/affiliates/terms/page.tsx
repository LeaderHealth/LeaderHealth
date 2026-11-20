import type { Metadata } from "next";
import Link from "next/link";
import { PortalReturnLink } from "@/components/affiliate/PortalReturnLink";
import { LAB_COMMISSIONS_ENABLED } from "@/lib/affiliate/code";

export const metadata: Metadata = {
  title: "Affiliate Terms of Service",
  robots: { index: false, follow: false },
};

const linkClass = "font-medium text-ink underline underline-offset-4";

export default function AffiliateTermsPage() {
  return (
    <article className="bg-background px-4 pb-20 pt-32 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl">
        <PortalReturnLink />
        <h1 className="mt-6 text-4xl">Affiliate Terms of Service</h1>
        <p className="mt-3 text-sm text-taupe">Effective Date: November 20, 2026</p>
        <p className="mt-10 leading-relaxed text-brown">
          These terms cover the Leader Health affiliate portal, operated by LH Ventures LLC d/b/a Leader Health. They apply to affiliates and to team admins who use the portal. They are separate from the patient Terms of Service on the public site.
        </p>

        <h2 className="mt-10 text-2xl">Your account</h2>
        <p className="mt-4 leading-relaxed text-brown">
          An affiliate account is created after an application is approved or from an invitation. A team admin account is created from an invitation. You choose the portal password. Connecting TikTok, YouTube, Facebook, or Instagram is optional and does not ask for that network’s password.
        </p>

        <h2 className="mt-10 text-2xl">Posts</h2>
        <p className="mt-4 leading-relaxed text-brown">
          Send each post, including a reel, for review before you publish it. Put “Paid partnership with Leader Health” and your tracking link in the caption. A link in your bio is not enough.
        </p>

        <h2 className="mt-10 text-2xl">Pay</h2>
        <p className="mt-4 leading-relaxed text-brown">
          Marketing pay is a rate per 1,000 views, with a maximum and a tracking period. Those terms lock when the post is sent. The dollar amount is recorded views ÷ 1,000 × that rate, capped at the maximum, after the tracking period. {LAB_COMMISSIONS_ENABLED ? "Lab orders earn the commission set for that affiliate. Treatment orders do not." : "Lab commission is not active."}
        </p>

        <h2 className="mt-10 text-2xl">Connected accounts</h2>
        <p className="mt-4 leading-relaxed text-brown">
          TikTok, YouTube, Facebook, and Instagram connections are optional. Leader Health reads the account and post information described in the{" "}
          <Link href="/affiliates/privacy" className={linkClass}>
            Affiliate Privacy Policy
          </Link>
          . Leader Health does not post, edit, or delete content on those accounts. To delete a connection, follow the deletion steps in that policy.
        </p>

        <h2 className="mt-10 text-2xl">Post numbers</h2>
        <p className="mt-4 leading-relaxed text-brown">
          When the account for a post is not connected, you enter views, likes, comments, and shares on that post’s weekly checkpoint. After the first save, you can request a correction. A sub-admin, admin, or the main admin applies that change. An open weekly checkpoint has to be entered or confirmed before that post, or your payout, can be paid.
        </p>

        <h2 className="mt-10 text-2xl">Campaigns</h2>
        <p className="mt-4 leading-relaxed text-brown">
          A campaign is an optional name you put on a post. The utm_campaign value on a referral link or promo link is your affiliate id or promo code. Those are different.
        </p>

        <p className="mt-10 text-sm">
          <Link href="/affiliates/privacy" className={linkClass}>
            Affiliate Privacy Policy
          </Link>
        </p>
      </div>
    </article>
  );
}
