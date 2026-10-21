import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PromoCodeCard } from "@/components/affiliate/PromoCodeCard";
import { loadAssignedSavedPromos } from "@/lib/affiliate/store";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { labs, products, type Audience, type Category } from "@/lib/content/products";
import { catalogProductLabels, groupProductsByCategory, type CatalogProductLabel } from "@/lib/genhealth/catalog";
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

function localCategory(category: Category, audience: Audience) {
  if (category === "hormone") return audience === "women" ? "Hormone Therapy - Women" : "Hormone Therapy - Men";
  if (category === "sexual") return "Sexual Health";
  if (category === "weight-loss") return "Weight Loss";
  return "Longevity";
}

function localProductNames() {
  const names = new Map<string, CatalogProductLabel>();
  const add = (id: string | undefined, name: string, category: string) => {
    if (id && name && !names.has(id)) names.set(id, { name, category });
  };
  for (const product of products) {
    const category = localCategory(product.category, product.audience);
    add(product.clientProductId, product.name, category);
    add(product.threeMonthProductId, product.name, category);
    for (const variant of product.variants ?? []) {
      const label = variant.name || product.name;
      add(variant.clientProductId, label, category);
      add(variant.threeMonthProductId, label, category);
    }
  }
  for (const lab of labs) {
    add(lab.clientProductId, lab.name, "Labs");
    add(lab.clientProductIds?.Men, lab.name, "Labs");
    add(lab.clientProductIds?.Women, lab.name, "Labs");
  }
  return names;
}

function labelFor(id: string, catalog: Map<string, CatalogProductLabel>, local: Map<string, CatalogProductLabel>) {
  const fromCatalog = catalog.get(id);
  let fromLocal = local.get(id);
  if (!fromLocal) {
    for (const [key, value] of local) {
      if (key.endsWith(`_${id}`)) {
        fromLocal = value;
        break;
      }
    }
  }
  const name = fromCatalog?.name || fromLocal?.name || "";
  if (!name) return null;
  return { id, name, category: fromCatalog?.category || fromLocal?.category || "Other" };
}

function productGroups(ids: string[], catalog: Map<string, CatalogProductLabel>, local: Map<string, CatalogProductLabel>) {
  const labeled = ids.flatMap((id) => {
    const label = labelFor(id, catalog, local);
    return label ? [label] : [];
  });
  return groupProductsByCategory(labeled);
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

  let catalog = new Map<string, CatalogProductLabel>();
  if (codes.some((promo) => promo.productIds.length > 0)) {
    try {
      catalog = await catalogProductLabels();
    } catch {
      catalog = new Map();
    }
  }
  const local = localProductNames();
  let saved: string[] = [];
  try {
    saved = await loadAssignedSavedPromos(
      affiliate.code,
      codes.map((promo) => promo.code),
    );
  } catch {
    saved = [];
  }
  const savedCodes = new Set(saved);

  return (
    <div className="space-y-4">
      <div className="min-w-0 rounded-[28px] bg-white px-4 py-4 sm:px-8 sm:py-6">
        <h2 className="text-2xl">Promo codes</h2>
        <p className="mt-2 text-sm text-brown">Your promo code. The customer enters it to earn your commission.</p>
      </div>
      {codes.length === 0 ? (
        <p className="rounded-[28px] bg-white px-4 py-6 text-sm text-brown sm:px-8">No promo code is assigned to you yet.</p>
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
            products={productGroups(promo.productIds, catalog, local)}
            url={affiliateTrackingLink(affiliate.code, promo.code)}
            saved={savedCodes.has(promo.code)}
          />
        ))
      )}
    </div>
  );
}
