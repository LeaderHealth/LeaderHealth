import Link from "next/link";
import { currentAffiliate } from "@/app/affiliates/current";
import { adminIsSignedIn } from "@/lib/affiliate/session";

export async function PortalReturnLink() {
  const affiliate = await currentAffiliate();
  const admin = affiliate ? false : await adminIsSignedIn();
  const href = affiliate ? "/affiliates/overview" : admin ? "/admin/affiliates/overview" : "/affiliates";
  const label = affiliate ? "Back to affiliate dashboard" : admin ? "Back to admin dashboard" : "Back to affiliate sign-in";

  return (
    <Link href={href} className="text-sm font-medium text-ink underline underline-offset-4">
      {label}
    </Link>
  );
}
