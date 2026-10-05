import { SearchPage } from "@/components/SearchPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");

  return <SearchPage initialQuery={initialQuery} />;
}
