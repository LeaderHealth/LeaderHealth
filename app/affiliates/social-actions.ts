"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import { currentAffiliate } from "@/app/affiliates/current";
import { revokeMetaPermissions, revokeTikTokToken } from "@/lib/affiliate/social-oauth";
import { deleteSocialConnection, loadConnectionSecrets, type FacebookConnectionSecret, type TikTokConnectionSecret } from "@/lib/affiliate/social-store";

export async function disconnectSocialAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const network = formData.get("network");
  if (network !== "facebook" && network !== "tiktok") redirect("/affiliates/stats?error=social");
  let notice = "disconnected";
  try {
    if (network === "tiktok") {
      const secrets = await loadConnectionSecrets(affiliate.code);
      const connection = secrets.find((item): item is TikTokConnectionSecret => item.network === "tiktok");
      const revoked = connection ? await revokeStoredTikTok(connection) : true;
      if (!revoked) notice = "disconnected-tiktok";
    }
    if (network === "facebook") {
      const secrets = await loadConnectionSecrets(affiliate.code);
      const connection = secrets.find((item): item is FacebookConnectionSecret => item.network === "facebook");
      const revoked = connection?.userAccessToken ? await revokeMetaPermissions(connection.userAccessToken) : false;
      if (!revoked) notice = "disconnected-facebook";
    }
    await deleteSocialConnection(affiliate.code, network);
  } catch (error) {
    console.error("[affiliate] social disconnect failed", error instanceof Error ? error.name : "unknown");
    redirect("/affiliates/stats?error=social");
  }
  clearAffiliateMemo();
  revalidatePath("/affiliates/stats");
  revalidatePath("/admin/affiliates/reporting");
  redirect(`/affiliates/stats?notice=${notice}`);
}

async function revokeStoredTikTok(connection: TikTokConnectionSecret) {
  const access = await revokeTikTokToken(connection.accessToken);
  if (access) return true;
  if (!connection.refreshToken || connection.refreshToken === connection.accessToken) return false;
  return revokeTikTokToken(connection.refreshToken);
}
