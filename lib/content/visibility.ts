import { getProduct } from "@/lib/content/products";
import { GET_STARTED_URL } from "@/lib/content/site";

/** Buttons that open the general intake form. Flip this to show them again. */
const intakeCtasVisible = false;

export function showIntakeCta(href: string) {
  if (intakeCtasVisible) return true;
  try {
    const url = new URL(href, "https://leaderhealth.local");
    const intake = new URL(GET_STARTED_URL);
    return !(url.origin === intake.origin && url.searchParams.get("quizOpen") === intake.searchParams.get("quizOpen"));
  } catch {
    return true;
  }
}

/** Marketing pages kept in the repo and taken off the public site until this set changes. */
const hiddenPages = new Set([
  "/advanced-peptides",
  "/energy-longevity",
  "/shop-men-products",
  "/shop-women-products",
]);

export function isPublicHref(href: string) {
  const path = href.split(/[?#]/)[0];
  if (hiddenPages.has(path)) return false;
  const match = path.match(/^\/products\/([^/]+)$/);
  if (!match) return true;
  const product = getProduct(decodeURIComponent(match[1]));
  return !!product && product.listed !== false;
}
