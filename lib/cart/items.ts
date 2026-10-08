import { labs, products, type Lab, type Product } from "@/lib/content/products";
import { cartLineId, parsePriceAmount, type CartItem } from "./types";

type Variant = NonNullable<Product["variants"]>[number];

export function cartItemFromProduct(product: Product, variant?: Variant): CartItem {
  const priceLabel = variant?.priceAmount ?? variant?.price ?? product.price;
  return {
    id: cartLineId(product.slug, variant?.name),
    slug: product.slug,
    name: variant?.name ?? product.name,
    variant: variant?.name,
    href: `/products/${product.slug}`,
    image: variant?.image ?? product.image,
    priceLabel,
    amount: parsePriceAmount(priceLabel),
    quantity: 1,
    clientProductId: variant?.clientProductId ?? product.clientProductId,
  };
}

export function cartItemFromLab(lab: Lab, gender?: "Men" | "Women"): CartItem {
  return {
    id: cartLineId(lab.slug, gender),
    slug: lab.slug,
    name: lab.name,
    variant: gender ? `For ${gender}` : undefined,
    href: `/labs/${lab.slug}`,
    image: lab.image,
    priceLabel: lab.price,
    amount: parsePriceAmount(lab.price),
    quantity: 1,
    clientProductId: (gender && lab.clientProductIds?.[gender]) || lab.clientProductId,
  };
}

export function cartItemFromSlug(slug: string, variantName?: string) {
  const product = products.find((item) => item.slug === slug);
  if (product) {
    const variant = variantName
      ? product.variants?.find((item) => item.name === variantName)
      : undefined;
    return cartItemFromProduct(product, variant);
  }
  const lab = labs.find((item) => item.slug === slug);
  return lab ? cartItemFromLab(lab) : null;
}
