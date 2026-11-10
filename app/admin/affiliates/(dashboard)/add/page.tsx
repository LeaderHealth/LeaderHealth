import { redirect } from "next/navigation";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AddAffiliateRedirect({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await adminSessionActor();
  if (!actor || !adminHasFullAccess(actor)) redirect("/admin/affiliates/overview");
  const query = await searchParams;
  const error = query.error ? `?error=${encodeURIComponent(query.error)}` : "";
  redirect(`/admin/affiliates/add-an-affiliate${error}`);
}
