import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AddAffiliateRedirect({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const error = query.error ? `?error=${encodeURIComponent(query.error)}` : "";
  redirect(`/admin/affiliates/add-an-affiliate${error}`);
}
