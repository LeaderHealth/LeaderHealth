import { ShopGrid } from "@/components/ShopGrid";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { JsonLd } from "@/components/JsonLd";
import { labs, productsFor } from "@/lib/content/products";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

const title = "All Products";
const intro =
  "Explore our complete collection of physician-led solutions designed to help you look, feel, and perform at your best.";

export default function ShopAllPage() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          name: title,
          description: intro,
          path: "/shop-all-products",
          items: [
            ...productsFor().map((product) => ({ name: product.name, path: `/products/${product.slug}` })),
            ...labs.map((lab) => ({ name: lab.name, path: `/labs/${lab.slug}` })),
          ],
        })}
      />
      <ShopGrid centeredHero title={title} intro={intro} />
      <ArticleLibrary
        slugs={[
          "hormone-therapy-options-when-estrogen-format-runs-short",
          "recovery-peptides-evidence-vs-hype",
          "perimenopause-or-low-desire-reading-the-signals",
        ]}
      />
    </>
  );
}
