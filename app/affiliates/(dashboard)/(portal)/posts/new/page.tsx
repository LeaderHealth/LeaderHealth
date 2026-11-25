import type { Metadata } from "next";
import AffiliatePostsPage from "../page";

export const metadata: Metadata = {
  title: "Create post",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; offer?: string; post?: string; campaign?: string }>;
}) {
  const query = await searchParams;
  return <AffiliatePostsPage searchParams={Promise.resolve({ ...query, compose: "1" })} />;
}
