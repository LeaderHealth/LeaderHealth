"use server";

import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { readSocialOnboarding, setSocialOnboarding } from "@/lib/affiliate/social-onboarding";

export async function skipSocialOnboarding() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  if ((await readSocialOnboarding(affiliate.code)) === "pending") {
    await setSocialOnboarding(affiliate.code, "skipped");
  }
  redirect("/affiliates/overview");
}
