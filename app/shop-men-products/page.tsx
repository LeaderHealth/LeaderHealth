import { ShopGrid } from "@/components/ShopGrid";
import { BiomarkerRing } from "@/components/BiomarkerRing";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { JsonLd } from "@/components/JsonLd";
import { labs, productsFor } from "@/lib/content/products";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop Men" };

const title = "Built for Men who want more.";
const intro =
  "Testosterone, weight, longevity, and sexual health, physician-led protocols tuned to your labs, not an average.";

export default function ShopMenPage() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          name: title,
          description: intro,
          path: "/shop-men-products",
          items: [
            ...productsFor("men").map((product) => ({ name: product.name, path: `/products/${product.slug}` })),
            ...labs.map((lab) => ({ name: lab.name, path: `/labs/${lab.slug}` })),
          ],
        })}
      />
      <ShopGrid
        audience="men"
        title={title}
        intro={intro}
        heroImage="/images/shop-men-hero.jpg"
        heroAlt="Man in a brown shirt standing outdoors beside a stone building"
        heroTitle={
          <>
            <span className="block">
              Built for <span className="font-serif-italic text-[#ee5d6c]">Men</span>
            </span>
            <span className="block">who want more.</span>
          </>
        }
        catalogTitle="All Men's Products"
        catalogTone="dark"
        feature={<RecommendedProducts tone="men" />}
      />
      <BiomarkerRing />
      <ArticleLibrary />
    </>
  );
}
