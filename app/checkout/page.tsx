import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";
import { listCatalog } from "@/lib/genhealth/catalog";
import { genHealthConfigured } from "@/lib/genhealth/client";

export const metadata: Metadata = { title: "Checkout" };
export const runtime = "nodejs";
export const revalidate = 60;

type Props = {
  searchParams: Promise<{ product?: string; variant?: string; clientProductId?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const query = await searchParams;

  if (!genHealthConfigured()) {
    return (
      <section className="bg-gradient-to-b from-[#d07a7c] to-[#a24b4e] px-6 pb-20 pt-32 text-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-5xl">Checkout</h1>
          <p className="mt-6 text-white/85">
            Checkout is temporarily unavailable. Please try again in a few minutes.
          </p>
        </div>
      </section>
    );
  }

  let catalog: Awaited<ReturnType<typeof listCatalog>> = [];
  let loadError: string | null = null;
  try {
    catalog = await listCatalog();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load treatments right now.";
    if (/genhealth/i.test(loadError)) {
      loadError = "Could not load treatments right now. Please try again.";
    }
  }

  return (
    <section className="relative bg-gradient-to-b from-[#d07a7c] to-[#a24b4e] pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/80">Get started</p>
        <h1 className="mt-3 text-5xl md:text-[60px]">
          Checkout <span className="font-serif-italic">with care</span>
        </h1>
        <p className="mt-4 max-w-xl text-white/85">
          Four short steps — your details, screening, shipping, and payment. A clinician reviews every request before anything is prescribed.
        </p>
        {loadError ? (
          <p className="mt-10 rounded-[28px] bg-white/14 p-6 backdrop-blur-md">{loadError}</p>
        ) : (
          <div className="mt-10">
            <CheckoutForm
              catalog={Array.isArray(catalog) ? catalog : []}
              seedProduct={query.product}
              seedVariant={query.variant}
            />
          </div>
        )}
      </div>
    </section>
  );
}
