import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalSignIn } from "@/components/affiliate/PortalSignIn";
import { affiliateEmailConfigured } from "@/lib/affiliate/email";
import { affiliateAdminConfigured, adminIsSignedIn } from "@/lib/affiliate/session";
import { loginAffiliateAdmin, requestSubAdminLink, requestSubAdminPasswordReset } from "./actions";
import { ADMIN_ERRORS } from "./messages";

export const metadata: Metadata = {
  title: "Affiliates",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; method?: string }>;
}) {
  if (await adminIsSignedIn()) redirect("/admin/affiliates/overview");

  const query = await searchParams;
  const error = query.error ? (ADMIN_ERRORS[query.error] ?? "") : "";
  const sent = query.sent === "1" && !error;
  const emailLinks = affiliateEmailConfigured();
  const initialMethod = !emailLinks ? "password" : query.method === "reset" ? "reset" : query.method === "link" || sent ? "link" : "password";

  return (
    <PortalSignIn
      role="admin"
      ready={affiliateAdminConfigured()}
      emailLinks={emailLinks}
      invalid={query.error === "password" || query.error === "link-denied" || query.error === "link-limited"}
      initialMethod={initialMethod}
      error={error}
      sent={sent}
      errorId="affiliate-admin-error"
      unconfigured="Set AFFILIATE_ADMIN_EMAIL, AFFILIATE_ADMIN_PASSWORD, and AFFILIATE_SESSION_SECRET in the server environment, then reload this page."
      loginAction={loginAffiliateAdmin}
      linkAction={requestSubAdminLink}
      resetAction={requestSubAdminPasswordReset}
    />
  );
}
