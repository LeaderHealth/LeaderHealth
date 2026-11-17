import type { Metadata } from "next";
import { CheckoutCartSync } from "@/components/cart/CheckoutCartSync";
import { listCatalog } from "@/lib/genhealth/catalog";
import type { CatalogItem } from "@/lib/genhealth/types";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{
    product?: string | string[];
  }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const query = await searchParams;
  const seedProducts = (Array.isArray(query.product) ? query.product : query.product ? [query.product] : []).filter(Boolean);
  let catalog: CatalogItem[] = [];
  try {
    catalog = await listCatalog();
  } catch (error) {
    console.error("[checkout] catalog failed", error instanceof Error ? error.message : "unknown");
  }

  return (
    <section className="bg-ticker px-4 py-10 text-white md:px-8 md:py-16">
      <h1 className="sr-only">Checkout</h1>
      <div className="mx-auto max-w-6xl">
        <CheckoutCartSync />
        <CheckoutForm catalog={catalog} seedProducts={seedProducts} />
      </div>
    </section>
  );
}
