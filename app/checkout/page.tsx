import type { Metadata } from "next";
import { embeddedCheckoutSrc } from "@/lib/cart/storefrontCheckout";

export const metadata: Metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{ product?: string | string[] }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const query = await searchParams;
  const src = embeddedCheckoutSrc(query.product);

  return (
    <section className="bg-background pt-28">
      <h1 className="sr-only">Checkout</h1>
      <iframe
        title="Checkout"
        src={src}
        className="block h-[calc(100dvh-7rem)] w-full border-0"
        allow="payment"
      />
    </section>
  );
}
