import type { Metadata } from "next";
import { normalizeAffiliateCode } from "@/lib/affiliate/code";
import { affiliateCodeFromCookies } from "@/lib/affiliate/store";
import { CheckoutCartSync } from "@/components/cart/CheckoutCartSync";
import { embeddedCheckoutSrc } from "@/lib/cart/storefrontCheckout";
import { campaignForAffiliateCode } from "@/lib/genhealth/promocodes";

export const metadata: Metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{ product?: string | string[]; ref?: string | string[] }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const query = await searchParams;
  const fromQuery = Array.isArray(query.ref) ? query.ref[0] : query.ref;
  const ref = normalizeAffiliateCode(fromQuery) ?? (await affiliateCodeFromCookies()) ?? undefined;
  const src = embeddedCheckoutSrc(query.product, ref, ref ? await campaignForAffiliateCode(ref) : null);
  const frameKey = (Array.isArray(query.product) ? query.product : query.product ? [query.product] : []).join("|");

  return (
    <section className="bg-background pt-28">
      <h1 className="sr-only">Checkout</h1>
      <CheckoutCartSync />
      <iframe
        key={frameKey}
        title="Checkout"
        src={src}
        className="block h-[calc(100dvh-7rem)] w-full border-0"
        allow="payment"
      />
    </section>
  );
}
