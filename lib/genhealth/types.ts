export type CatalogKind = "product" | "lab";

export type CatalogItem = {
  clientProductId: string;
  name: string;
  displayName: string;
  kind: CatalogKind;
  amount: number | null;
  status: string | null;
  excludedStates: string[];
};

export function formatPrice(amount: number | null) {
  if (amount == null) return "Clinician-quoted";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export const CHECKOUT_SUCCESS_KEY = "lh-checkout-success";
