import { labs, products } from "@/lib/content/products";

export type CartRuleLine = {
  slug: string;
  quantity?: number;
};

type Slot = "testosterone" | "weight-loss" | "nad" | "lab";

const TESTOSTERONE = new Set([
  "men-trt-testosterone-cypionate",
  "men-trt-testosterone-cream",
  "women-hrt-testosterone-cream",
  "women-hrt-testosterone-injection-low-dose",
]);

const NAD = new Set(["nad-injectable", "longevity-nad", "longevity-nad-nasal-spray"]);

const SLOT_CONFLICT: Record<Slot, string> = {
  testosterone: "Your cart already has a testosterone treatment. Remove it to add a different one.",
  "weight-loss":
    "Your cart already has a weight-loss medication. Semaglutide and tirzepatide cannot be ordered together, and only one form of the same medication can be in the cart.",
  nad: "Your cart already has an NAD plan. Only one NAD plan can be ordered at a time.",
  lab: "Your cart already has a lab panel. Only one Complete or Advanced panel can be ordered at a time.",
};

export const QUANTITY_LIMIT_MESSAGE = "This item is limited to one per order.";

export function cartSlot(slug: string): Slot | null {
  if (TESTOSTERONE.has(slug)) return "testosterone";
  if (NAD.has(slug)) return "nad";
  const product = products.find((item) => item.slug === slug);
  if (product?.category === "weight-loss") return "weight-loss";
  if (labs.some((lab) => lab.slug === slug)) return "lab";
  return null;
}

export function cartQuantityCap(slug: string) {
  return cartSlot(slug) ? 1 : null;
}

export function isQuantityCapped(item: CartRuleLine) {
  const cap = cartQuantityCap(item.slug);
  return cap != null && (item.quantity ?? 1) >= cap;
}

/** Patient-facing reason a cart breaks combination or quantity rules, if any. */
export function cartRuleIssue(items: CartRuleLine[]): string | null {
  const seen = new Set<Slot>();
  for (const item of items) {
    const slot = cartSlot(item.slug);
    if (!slot) continue;
    const quantity = item.quantity ?? 1;
    if (!Number.isFinite(quantity) || quantity > 1) return QUANTITY_LIMIT_MESSAGE;
    if (seen.has(slot)) return SLOT_CONFLICT[slot];
    seen.add(slot);
  }
  return null;
}
