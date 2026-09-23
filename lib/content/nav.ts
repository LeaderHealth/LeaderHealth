import { assets } from "@/lib/content/site";
import { getProduct, labs } from "@/lib/content/products";

export type FeatureCard = {
  href: string;
  image: string;
  heading: string;
  subline: string;
  price: string;
};

export type MegaItem = {
  label: string;
  href: string;
  card: FeatureCard;
};

export type MegaCategory =
  | {
      id: string;
      label: string;
      kind: "link";
      href: string;
      card: FeatureCard;
    }
  | {
      id: string;
      label: string;
      kind: "drill";
      items: MegaItem[];
      card: FeatureCard;
    }
  | {
      id: string;
      label: string;
      kind: "expand-drill";
      coverHref: string;
      items: MegaItem[];
      card: FeatureCard;
    };

export function productCard(slug: string): FeatureCard {
  const product = getProduct(slug);
  return {
    href: `/products/${slug}`,
    image: product?.image ?? "",
    heading: product?.name ?? slug,
    subline: product?.tagline ?? "",
    price: product?.price ?? "",
  };
}

export function labCard(slug: string): FeatureCard {
  const lab = labs.find((item) => item.slug === slug);
  return {
    href: `/labs/${slug}`,
    image: lab?.image ?? "",
    heading: lab?.name ?? slug,
    subline: lab?.biomarkers ?? "",
    price: lab?.price ?? "",
  };
}

export function peptidesCard(): FeatureCard {
  const visual = getProduct("longevity-sermorelin");
  return {
    href: "/advanced-peptides",
    image: visual?.image ?? assets.pills,
    heading: "Peptides",
    subline:
      "Explore physician-guided peptides — prescribed after a clinician reviews your history and labs.",
    price: "",
  };
}

export const weightLossItems: MegaItem[] = [
  { label: "Semaglutide", href: "/products/weight-loss-semaglutide", card: productCard("weight-loss-semaglutide") },
  { label: "Tirzepatide", href: "/products/weight-loss-tirzepatide", card: productCard("weight-loss-tirzepatide") },
];

export const longevityItems: MegaItem[] = [
  { label: "Glutathione", href: "/products/longevity-glutathione", card: productCard("longevity-glutathione") },
  { label: "NAD+", href: "/products/longevity-nad", card: productCard("longevity-nad") },
  { label: "Sermorelin", href: "/products/longevity-sermorelin", card: productCard("longevity-sermorelin") },
];

export const peptidesCategory: MegaCategory = {
  id: "peptides",
  label: "Peptides",
  kind: "link",
  href: "/advanced-peptides",
  card: peptidesCard(),
};

export const longevityCategory: MegaCategory = {
  id: "longevity",
  label: "Longevity",
  kind: "expand-drill",
  coverHref: "/energy-longevity",
  items: longevityItems,
  card: productCard("longevity-nad"),
};

export const menDefaultCard = productCard("weight-loss-semaglutide");
export const womenDefaultCard = productCard("women-hormone-therapy");

export const menMegaCategories: MegaCategory[] = [
  {
    id: "hormone",
    label: "Hormone Therapy",
    kind: "drill",
    card: productCard("men-trt-testosterone-cypionate"),
    items: [
      { label: "Testosterone Cypionate", href: "/products/men-trt-testosterone-cypionate", card: productCard("men-trt-testosterone-cypionate") },
      { label: "Enclomiphene", href: "/products/men-trt-enclomiphene", card: productCard("men-trt-enclomiphene") },
      { label: "Testosterone Cream", href: "/products/men-trt-testosterone-cream", card: productCard("men-trt-testosterone-cream") },
    ],
  },
  {
    id: "sexual",
    label: "Sexual Health",
    kind: "drill",
    card: productCard("men-sexual-health-tadalafil"),
    items: [
      { label: "Tadalafil", href: "/products/men-sexual-health-tadalafil", card: productCard("men-sexual-health-tadalafil") },
      { label: "PT-141", href: "/products/sexual-health-pt-141-nasal", card: productCard("sexual-health-pt-141-nasal") },
      { label: "Combo Troches", href: "/products/men-sexual-health-combo-troches", card: productCard("men-sexual-health-combo-troches") },
    ],
  },
  {
    id: "weight-loss",
    label: "Weight Loss",
    kind: "drill",
    card: productCard("weight-loss-semaglutide"),
    items: weightLossItems,
  },
  longevityCategory,
  peptidesCategory,
  {
    id: "labs",
    label: "Labs",
    kind: "drill",
    card: labCard("labs-complete-panel"),
    items: [
      { label: "Complete Panel · 64 biomarkers", href: "/labs/labs-complete-panel", card: labCard("labs-complete-panel") },
      { label: "Advanced Panel · 64 biomarkers", href: "/labs/labs-advance-panel", card: labCard("labs-advance-panel") },
    ],
  },
];

export const womenMegaCategories: MegaCategory[] = [
  {
    id: "hormone",
    label: "Hormone Therapy",
    kind: "link",
    href: "/products/women-hormone-therapy",
    card: womenDefaultCard,
  },
  {
    id: "sexual",
    label: "Sexual Health",
    kind: "drill",
    card: productCard("sexual-health-pt-141-nasal"),
    items: [
      { label: "PT-141", href: "/products/sexual-health-pt-141-nasal", card: productCard("sexual-health-pt-141-nasal") },
      { label: "Combo Troches", href: "/products/women-sexual-health-combo-troches", card: productCard("women-sexual-health-combo-troches") },
    ],
  },
  {
    id: "weight-loss",
    label: "Weight Loss",
    kind: "drill",
    card: productCard("weight-loss-semaglutide"),
    items: weightLossItems,
  },
  longevityCategory,
  peptidesCategory,
  {
    id: "labs",
    label: "Labs",
    kind: "drill",
    card: labCard("labs-complete-panel"),
    items: [
      { label: "Complete Panel · 64 biomarkers", href: "/labs/labs-complete-panel", card: labCard("labs-complete-panel") },
      { label: "Advanced Panel · 100 biomarkers", href: "/labs/labs-advance-panel", card: labCard("labs-advance-panel") },
    ],
  },
];

export function findMegaCategory(
  categories: MegaCategory[],
  id: string,
): MegaCategory | undefined {
  return categories.find((category) => category.id === id);
}
