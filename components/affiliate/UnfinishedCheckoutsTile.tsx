import { memo } from "@/lib/affiliate/memo";
import { loadUncommissionedPendingOrders } from "@/lib/affiliate/store";

export async function loadUnfinishedCheckoutCount() {
  return memo("unpaid-orders", () => loadUncommissionedPendingOrders()).then(
    (rows) => rows.size,
    () => null,
  );
}

export function UnfinishedCheckoutsTile({ count, className = "" }: { count: number | null; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-1 rounded-[20px] bg-white px-[18px] py-4 ${className}`}>
      <h3 className="text-sm text-[#4A3A37]">Checkouts not finished</h3>
      <p className="text-[28px] tabular-nums">{count == null ? "—" : count.toLocaleString("en-US")}</p>
      <p className="text-[13px] text-[#7A4E00]">{count == null ? "Unavailable right now" : "Not counted"}</p>
    </section>
  );
}
