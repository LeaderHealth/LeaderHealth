import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalSignIn } from "@/components/affiliate/PortalSignIn";
import { affiliateEmailConfigured } from "@/lib/affiliate/email";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { loginAffiliatePortal, requestAffiliateLink, requestAffiliatePasswordReset } from "./actions";
import { currentAffiliate } from "./current";

export const metadata: Metadata = {
  title: "Affiliate sign-in",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  denied: "That sign-in didn't work. Check the email and password, or request a new link.",
  locked: "Too many tries. Wait 5 minutes, or open the email we sent to choose a new password. Saving it removes the lock right away.",
  limited: "Wait a minute, then request another link.",
  unconfigured: "Affiliate sign-in is unavailable right now.",
  unavailable: "Affiliate sign-in is unavailable right now.",
};

export default async function AffiliatePortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; method?: string }>;
}) {
  if (await currentAffiliate()) redirect("/affiliates/overview");

  const query = await searchParams;
  const error = query.error ? ERRORS[query.error] : "";
  const sent = query.sent === "1" && !error;
  const emailLinks = affiliateEmailConfigured();
  const initialMethod = !emailLinks ? "password" : query.method === "reset" ? "reset" : query.method === "link" || sent ? "link" : "password";

  return (
    <PortalSignIn
      role="affiliate"
      ready={affiliateAdminConfigured() && affiliateFirebaseConfigured()}
      emailLinks={emailLinks}
      invalid={query.error === "denied" || query.error === "locked" || query.error === "limited"}
      initialMethod={initialMethod}
      error={error}
      sent={sent}
      errorId="affiliate-portal-error"
      unconfigured="Affiliate sign-in needs AFFILIATE_ADMIN_PASSWORD, AFFILIATE_SESSION_SECRET, and Firestore configured on the server."
      loginAction={loginAffiliatePortal}
      linkAction={requestAffiliateLink}
      resetAction={requestAffiliatePasswordReset}
    />
  );
}
