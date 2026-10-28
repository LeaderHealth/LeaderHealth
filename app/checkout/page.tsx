import type { Metadata } from "next";
import { resolveAffiliateAttribution } from "@/lib/affiliate/code";
import { campaignForCheckout } from "@/lib/affiliate/checkoutCampaign";
import { affiliateCodeFromCookies } from "@/lib/affiliate/store";
import { CheckoutCartSync } from "@/components/cart/CheckoutCartSync";
import { EmbeddedCheckout } from "@/components/cart/EmbeddedCheckout";
import { embeddedCheckoutSrc } from "@/lib/cart/storefrontCheckout";

export const metadata: Metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{
    product?: string | string[];
    ref?: string | string[];
    utm_source?: string | string[];
    utm_campaign?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const query = await searchParams;
  const queryCampaign = firstParam(query.utm_campaign);
  const ref =
    resolveAffiliateAttribution(firstParam(query.ref), firstParam(query.utm_source), await affiliateCodeFromCookies())
      .code ?? undefined;
  const src = embeddedCheckoutSrc(query.product, ref, await campaignForCheckout(ref, queryCampaign));
  const frameKey = (Array.isArray(query.product) ? query.product : query.product ? [query.product] : []).join("|");

  return (
    <section className="lh-checkout-page">
      <h1 className="sr-only">Checkout</h1>
      <CheckoutCartSync />
      <EmbeddedCheckout src={src} frameKey={frameKey} />
    </section>
  );
}
