"use server";

import { redirect } from "next/navigation";
import { ApplicationError, saveAffiliateApplication } from "@/lib/affiliate/applications";

function fail(error: string, link: string): never {
  const params = new URLSearchParams({ error });
  if (link) params.set("link", link);
  redirect(`/affiliates/apply?${params.toString()}`);
}

export async function submitAffiliateApplication(formData: FormData) {
  const link = String(formData.get("link") ?? "");
  try {
    await saveAffiliateApplication({
      name: formData.get("name"),
      email: formData.get("email"),
      link,
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      const code = error.code === "taken" ? "taken" : error.code === "missing" ? "missing" : error.code === "invalid" ? "invalid" : "unavailable";
      fail(code, link);
    }
    console.error("[affiliate] application failed", error instanceof Error ? error.message : "unknown");
    fail("unavailable", link);
  }
  redirect("/affiliates/apply?sent=1");
}
