import { ShopGrid } from "@/components/ShopGrid";
import { SexualHealthBlends } from "@/components/SexualHealthBlends";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop Men" };

export default function ShopMenPage() {
  return (
    <>
      <ShopGrid
        audience="men"
        title="Built for Men who want more."
        intro="Testosterone, weight, longevity, and sexual health — physician-led protocols tuned to your labs, not an average."
      >
        <SexualHealthBlends audience="men" />
      </ShopGrid>
      <ArticleLibrary />
    </>
  );
}
