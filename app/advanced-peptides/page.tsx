import { products } from "@/lib/content/products";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Peptides" };

export default function PeptidesPage() {
  const list = products.filter((p) =>
    [
      "longevity-sermorelin",
      "longevity-glutathione",
      "sexual-health-pt-141-nasal",
      "oxytocin-nasal-spray",
      "nad-injectable",
      "longevity-nad-nasal-spray",
    ].includes(p.slug),
  );
  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">Peptides</h1>
      <p className="mt-4 max-w-2xl text-taupe">
        Explore physician-guided peptides — prescribed after a clinician reviews your history and labs.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
