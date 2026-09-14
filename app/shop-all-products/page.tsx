import { ShopGrid } from "@/components/ShopGrid";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

export default function ShopAllPage() {
  return (
    <>
      <ShopGrid
        title="All Products"
        intro="Explore our complete collection of physician-led solutions designed to help you look, feel, and perform at your best."
      />
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
