import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalSignIn } from "@/components/affiliate/PortalSignIn";
import { affiliateAdminConfigured, adminIsSignedIn } from "@/lib/affiliate/session";
import { loginAffiliateAdmin } from "./actions";
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
  searchParams: Promise<{ error?: string }>;
}) {
  if (await adminIsSignedIn()) redirect("/admin/affiliates/overview");

  const query = await searchParams;
  const error = query.error ? ADMIN_ERRORS[query.error] : "";

  return (
    <PortalSignIn
      role="admin"
      ready={affiliateAdminConfigured()}
      emailLinks={false}
      invalid={query.error === "password"}
      initialMethod="password"
      error={error}
      sent={false}
      errorId="affiliate-admin-error"
      unconfigured="Set AFFILIATE_ADMIN_EMAIL and AFFILIATE_ADMIN_PASSWORD in the server environment, then reload this page."
      loginAction={loginAffiliateAdmin}
    />
  );
}
