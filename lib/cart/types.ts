export type CartItem = {
  id: string;
  slug: string;
  name: string;
  variant?: string;
  href: string;
  image: string;
  priceLabel: string;
  amount: number | null;
  quantity: number;
};

export function parsePriceAmount(label?: string | null) {
  if (!label) return null;
  const match = label.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function cartLineId(slug: string, variant?: string) {
  return variant ? `${slug}::${variant}` : slug;
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (item.amount ?? 0) * item.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
