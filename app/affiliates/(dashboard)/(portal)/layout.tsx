import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { readSocialOnboarding } from "@/lib/affiliate/social-onboarding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AffiliatePortalGate({ children }: { children: ReactNode }) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const onboarding = await readSocialOnboarding(affiliate.code).catch(() => "skipped" as const);
  if (onboarding === "pending") redirect("/affiliates/connect");
  return children;
}
