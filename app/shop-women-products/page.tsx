import { ShopGrid } from "@/components/ShopGrid";
import { SexualHealthBlends } from "@/components/SexualHealthBlends";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop Women" };

export default function ShopWomenPage() {
  return (
    <>
      <ShopGrid
        audience="women"
        title="Care made for her."
        intro="Hormones, weight, longevity, and intimacy — physician-led treatments built around a woman's biology, reviewed by clinicians who listen."
        >
        <p className="mt-16 max-w-xl text-lg text-brown">
          Hormone imbalances are becoming increasingly common in younger women. Personalized care can help you restore balance and feel your best.
        </p>
        <SexualHealthBlends audience="women" />
      </ShopGrid>
      <ArticleLibrary />
    </>
  );
}
