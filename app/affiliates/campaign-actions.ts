"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { RoiStoreError, respondToCampaign } from "@/lib/affiliate/roi-store";

export async function respondToCampaignAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const decision = formData.get("decision") === "decline" ? "decline" : "accept";
  const name = String(formData.get("name") ?? "").trim();
  try {
    await respondToCampaign({ name, code: affiliate.code, decision });
  } catch (error) {
    const code = error instanceof RoiStoreError ? error.code : "unavailable";
    redirect(`/affiliates/campaigns?error=${encodeURIComponent(code === "choose" ? "choose" : "unavailable")}`);
  }
  revalidatePath("/affiliates/campaigns");
  revalidatePath("/affiliates/posts");
  revalidatePath("/admin/affiliates/campaigns");
  const notice = decision === "decline" ? "declined" : "accepted";
  redirect(`/affiliates/campaigns?notice=${notice}&campaign=${encodeURIComponent(name)}`);
}
