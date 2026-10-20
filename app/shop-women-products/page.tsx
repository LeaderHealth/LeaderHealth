import { ShopGrid } from "@/components/ShopGrid";
import { HormoneTreatmentFeature } from "@/components/HormoneTreatmentFeature";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { JsonLd } from "@/components/JsonLd";
import { labs, productsFor } from "@/lib/content/products";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop Women" };

const title = "Care made for her.";
const intro =
  "Hormones, weight, longevity, and intimacy, physician-led treatments built around a woman's biology, reviewed by clinicians who listen.";

export default function ShopWomenPage() {
  return (
    <>
      <JsonLd
        data={buildCollectionPageSchema({
          name: title,
          description: intro,
          path: "/shop-women-products",
          items: [
            ...productsFor("women").map((product) => ({ name: product.name, path: `/products/${product.slug}` })),
            ...labs.map((lab) => ({ name: lab.name, path: `/labs/${lab.slug}` })),
          ],
        })}
      />
      <ShopGrid
        audience="women"
        title={title}
        intro={intro}
        heroImage="/images/shop-women-hero.jpg"
        heroAlt="Woman standing among garden plants in warm sunlight"
        heroTitle={
          <>
            <span className="block">Care made</span>
            <span className="block">
              for <span className="font-serif-italic text-[#ee5d6c]">her.</span>
            </span>
          </>
        }
        catalogTitle="All Women's Products"
        spotlight={<HormoneTreatmentFeature />}
        feature={<RecommendedProducts />}
      />
      <ArticleLibrary />
    </>
  );
}
