import { idsForLab, labs, products, type Audience, type Category } from "@/lib/content/products";
import { catalogProductLabels, groupProductsByCategory, type CatalogProductLabel } from "@/lib/genhealth/catalog";

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
    for (const id of idsForLab(lab)) add(id, lab.name, "Labs");
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

export async function eligibleProductGroups(ids: string[]) {
  if (ids.length === 0) return [];
  let catalog = new Map<string, CatalogProductLabel>();
  try {
    catalog = await catalogProductLabels();
  } catch {
    catalog = new Map();
  }
  const local = localProductNames();
  const labeled = ids.flatMap((id) => {
    const label = labelFor(id, catalog, local);
    return label ? [label] : [];
  });
  return groupProductsByCategory(labeled);
}
