import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalSignIn } from "@/components/affiliate/PortalSignIn";
import { affiliateEmailConfigured } from "@/lib/affiliate/email";
import { affiliateFirebaseConfigured } from "@/lib/affiliate/firebase";
import { affiliateAdminConfigured } from "@/lib/affiliate/session";
import { loginAffiliatePortal, requestAffiliateLink } from "./actions";
import { currentAffiliate } from "./current";

export const metadata: Metadata = {
  title: "Affiliate sign-in",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  denied: "That sign-in didn't work. Check the email and password, or request a new link.",
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
  const linkMethod = emailLinks && (query.method === "link" || sent || query.error === "limited");

  return (
    <PortalSignIn
      role="affiliate"
      ready={affiliateAdminConfigured() && affiliateFirebaseConfigured()}
      emailLinks={emailLinks}
      invalid={query.error === "denied" || query.error === "limited"}
      initialMethod={linkMethod ? "link" : "password"}
      error={error}
      sent={sent}
      errorId="affiliate-portal-error"
      unconfigured="Affiliate sign-in needs AFFILIATE_ADMIN_PASSWORD and Firestore configured on the server."
      loginAction={loginAffiliatePortal}
      linkAction={requestAffiliateLink}
    />
  );
}
