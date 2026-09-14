import { productsFor } from "@/lib/content/products";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Energy & Longevity" };

export default function EnergyPage() {
  const list = productsFor().filter((p) => p.category === "longevity" || p.category === "weight-loss");
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">Energy & Longevity</h1>
      <p className="mt-4 max-w-2xl text-taupe">
        Support health for the years ahead — NAD+, glutathione, sermorelin, and metabolic care with clinician oversight.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
