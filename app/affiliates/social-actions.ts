"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { deleteSocialConnection } from "@/lib/affiliate/social-store";

export async function disconnectSocialAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const network = formData.get("network");
  if (network !== "facebook" && network !== "tiktok") redirect("/affiliates/stats?error=social");
  try {
    await deleteSocialConnection(affiliate.code, network);
  } catch (error) {
    console.error("[affiliate] social disconnect failed", error instanceof Error ? error.message : "unknown");
    redirect("/affiliates/stats?error=social");
  }
  revalidatePath("/affiliates/stats");
  revalidatePath("/admin/affiliates/reporting");
  redirect("/affiliates/stats?notice=disconnected");
}
