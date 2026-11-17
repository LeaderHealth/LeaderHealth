"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MarketingOfferError, respondToMarketingOffer } from "@/lib/affiliate/marketing-offers";
import { currentAffiliate } from "./current";

export async function respondToOfferAction(formData: FormData) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  try {
    await respondToMarketingOffer({
      id: formData.get("offerId"),
      code: affiliate.code,
      decision: formData.get("decision"),
      amount: formData.get("amount"),
      publishBy: formData.get("publishBy"),
      note: formData.get("note"),
    });
  } catch (error) {
    const code = error instanceof MarketingOfferError ? error.code : "unavailable";
    redirect(`/affiliates/offers?error=${encodeURIComponent(code)}&offer=${encodeURIComponent(String(formData.get("offerId") ?? ""))}`);
  }
  revalidatePath("/affiliates/offers");
  revalidatePath("/admin/affiliates/offers");
  const decision = String(formData.get("decision") ?? "");
  const notice = decision === "accept" ? "accepted" : decision === "decline" ? "declined" : "countered";
  redirect(`/affiliates/offers?notice=${notice}&offer=${encodeURIComponent(String(formData.get("offerId") ?? ""))}`);
}
