import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SavedLinks, type SavedLink } from "@/components/affiliate/SavedLinks";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { loadSavedPromoCodes } from "@/lib/affiliate/store";
import { listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Saved links",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function discountLabel(promo: PromoCodeRow) {
  if (promo.discount.kind === "price") return `Set price ${promo.discount.amount}`;
  if (promo.discount.kind === "percent") return `${promo.discount.label} off`;
  return promo.discount.label;
}

function savedLink(code: string, affiliateCode: string, promos: PromoCodeRow[]): SavedLink {
  const promo = promos.find((item) => item.code === code);
  return {
    code,
    url: affiliateTrackingLink(affiliateCode, code),
    detail: promo ? `${discountLabel(promo)} · ${promo.statusLabel}` : "Saved tracking link",
  };
}

export default async function SavedLinksPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let saved: string[] = [];
  try {
    saved = await loadSavedPromoCodes(affiliate.code);
  } catch {
    return <p className="rounded-[28px] bg-white px-8 py-6 text-sm text-ink">Saved links are unavailable right now.</p>;
  }

  let promos: PromoCodeRow[] = [];
  try {
    promos = promoRowsForAffiliate(await listPromoCodes(), affiliate.code);
  } catch {
    promos = [];
  }

  const links = [...saved]
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((code) => savedLink(code, affiliate.code, promos));

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-[28px] bg-white px-4 py-4 sm:px-8 sm:py-6">
        <h2 className="text-2xl">Saved links</h2>
        <p className="mt-2 text-sm text-brown">Tracking links you saved from your assigned promo codes.</p>
      </div>
      {links.length === 0 ? (
        <div className="rounded-[28px] bg-white px-4 py-6 sm:px-8">
          <p className="text-sm text-brown">No saved links yet.</p>
          <Link href="/affiliates/promo-codes" className="mt-3 inline-flex text-sm font-medium text-ink underline underline-offset-4">
            View promo codes
          </Link>
        </div>
      ) : (
        <SavedLinks links={links} />
      )}
    </div>
  );
}
