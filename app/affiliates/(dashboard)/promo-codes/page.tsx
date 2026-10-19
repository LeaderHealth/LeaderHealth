import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PromoCodeCard } from "@/components/affiliate/PromoCodeCard";
import { loadSavedPromoCodes } from "@/lib/affiliate/store";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { labs, products } from "@/lib/content/products";
import { catalogProductNames } from "@/lib/genhealth/catalog";
import { listPromoCodes, promoRowsForAffiliate, type PromoCodeRow } from "@/lib/genhealth/promocodes";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Promo codes",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function discountLabel(promo: PromoCodeRow) {
  if (promo.discount.kind === "price") return `Set price ${promo.discount.amount}`;
  if (promo.discount.kind === "percent") return `${promo.discount.label} off`;
  return promo.discount.label;
}

function localProductNames() {
  const names = new Map<string, string>();
  for (const product of products) {
    if (product.clientProductId) names.set(product.clientProductId, product.name);
    if (product.threeMonthProductId) names.set(product.threeMonthProductId, product.name);
    for (const variant of product.variants ?? []) {
      const label = variant.name ? `${product.name} · ${variant.name}` : product.name;
      if (variant.clientProductId) names.set(variant.clientProductId, label);
      if (variant.threeMonthProductId) names.set(variant.threeMonthProductId, label);
    }
  }
  for (const lab of labs) {
    if (lab.clientProductId) names.set(lab.clientProductId, lab.name);
    if (lab.clientProductIds?.Men) names.set(lab.clientProductIds.Men, lab.name);
    if (lab.clientProductIds?.Women) names.set(lab.clientProductIds.Women, lab.name);
  }
  return names;
}

function productLabels(ids: string[], catalog: Record<string, string>, local: Map<string, string>) {
  return ids.map((id) => ({ id, name: catalog[id] || local.get(id) || id }));
}

export default async function AffiliatePromoCodesPage() {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");

  let codes: PromoCodeRow[] = [];
  try {
    codes = promoRowsForAffiliate(await listPromoCodes(), affiliate.code);
  } catch {
    return <p className="rounded-[28px] bg-white px-8 py-6 text-sm text-ink">Promo codes are unavailable right now.</p>;
  }

  let catalog: Record<string, string> = {};
  if (codes.some((promo) => promo.productIds.length > 0)) {
    try {
      catalog = await catalogProductNames();
    } catch {
      catalog = {};
    }
  }
  const local = localProductNames();
  let saved: string[] = [];
  try {
    saved = await loadSavedPromoCodes(affiliate.code);
  } catch {
    saved = [];
  }
  const savedCodes = new Set(saved);

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-[28px] bg-white px-4 py-4 sm:px-8 sm:py-6">
        <h2 className="text-2xl">Promo codes</h2>
        <p className="mt-2 text-sm text-brown">Codes assigned to your affiliate ID, with a tracking link for each one.</p>
      </div>
      {codes.length === 0 ? (
        <p className="rounded-[28px] bg-white px-4 py-6 text-sm text-brown sm:px-8">No promo codes are assigned to you yet.</p>
      ) : (
        codes.map((promo) => (
          <PromoCodeCard
            key={promo.code}
            code={promo.code}
            discount={discountLabel(promo)}
            mode={promo.mode}
            status={promo.statusLabel}
            usage={promo.usage}
            validUntil={promo.validUntil}
            products={productLabels(promo.productIds, catalog, local)}
            url={affiliateTrackingLink(affiliate.code, promo.code)}
            saved={savedCodes.has(promo.code)}
          />
        ))
      )}
    </div>
  );
}
