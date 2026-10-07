import { ShopGrid } from "@/components/ShopGrid";
import { SexualHealthBlends } from "@/components/SexualHealthBlends";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { JsonLd } from "@/components/JsonLd";
import { labs, productsFor } from "@/lib/content/products";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop Women" };

const title = "Care made for her.";
const intro =
  "Hormones, weight, longevity, and intimacy — physician-led treatments built around a woman's biology, reviewed by clinicians who listen.";

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
      <ShopGrid audience="women" title={title} intro={intro}>
        <p className="mt-16 max-w-xl text-lg text-brown">
          Hormone imbalances are becoming increasingly common in younger women. Personalized care can help you restore balance and feel your best.
        </p>
        <SexualHealthBlends audience="women" />
      </ShopGrid>
      <ArticleLibrary />
    </>
  );
}
