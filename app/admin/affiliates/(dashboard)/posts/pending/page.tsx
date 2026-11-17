import type { Metadata } from "next";
import { AdminSubmissions } from "../page";

export const metadata: Metadata = {
  title: "Pending approvals",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function PendingApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; post?: string }>;
}) {
  return <AdminSubmissions view="pending" searchParams={searchParams} />;
}
