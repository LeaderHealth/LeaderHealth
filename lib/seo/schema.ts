import type { Article } from "@/lib/content/articles";
import type { Audience, Category, Product } from "@/lib/content/products";
import { assets, site } from "@/lib/content/site";

/** Production origin from the project README. Override with NEXT_PUBLIC_SITE_URL when the domain changes. */
const productionOrigin = "https://leaderhealth.clinic";

const categoryNames: Record<Category, string> = {
  hormone: "Hormone Therapy",
  sexual: "Sexual Health",
  longevity: "Longevity",
  "weight-loss": "Weight Loss",
};

const shopParents: Record<Audience, { name: string; path: string }> = {
  all: { name: "All Products", path: "/shop-all-products" },
  men: { name: "Shop All Men", path: "/shop-men-products" },
  women: { name: "Shop All Women", path: "/shop-women-products" },
};

export type JsonLdNode = {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqEntry = {
  q?: string;
  a?: string;
  question?: string;
  answer?: string;
};

export type CollectionEntry = {
  name: string;
  path: string;
};

type OfferSource = {
  name: string;
  description: string;
  path: string;
  image?: string;
  price?: string;
  category?: string;
  variants?: { price?: string; priceAmount?: string }[];
};

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return productionOrigin;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalized}`;
}

function defined(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output;
}

function node(type: string, fields: Record<string, unknown>): JsonLdNode {
  return { "@context": "https://schema.org", "@type": type, ...defined(fields) };
}

function dollarAmounts(text: string | undefined) {
  if (!text) return [];
  return [...text.matchAll(/\$(\d+(?:\.\d{1,2})?)/g)]
    .map((match) => Number(match[1]))
    .filter((amount) => Number.isFinite(amount));
}

function offerFor(source: OfferSource) {
  const variantPrices = (source.variants ?? []).flatMap((variant) => {
    const fromAmount = dollarAmounts(variant.priceAmount);
    return fromAmount.length > 0 ? fromAmount : dollarAmounts(variant.price);
  });
  const unique = [...new Set(variantPrices)];
  if (unique.length > 1) {
    return {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: String(Math.min(...unique)),
      highPrice: String(Math.max(...unique)),
      offerCount: unique.length,
    };
  }
  if (unique.length === 1) {
    return { "@type": "Offer", priceCurrency: "USD", price: String(unique[0]) };
  }

  const listed = dollarAmounts(source.price);
  if (listed.length !== 1) return undefined;
  if (source.price && /starting|from/i.test(source.price)) {
    return { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: String(listed[0]) };
  }
  return { "@type": "Offer", priceCurrency: "USD", price: String(listed[0]) };
}

function postalAddress() {
  const match = site.address.match(/^(.*)\s+([^,\s]+),\s*([A-Z]{2})\s+(\d{5})$/);
  if (!match) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: match[1],
    addressLocality: match[2],
    addressRegion: match[3],
    postalCode: match[4],
    addressCountry: "US",
  };
}

function openingHours() {
  const open = site.hours.find((line) => /tue-sat/i.test(line) && /9am-5pm/i.test(line));
  return open ? "Tu-Sa 09:00-17:00" : undefined;
}

function isoDate(display: string) {
  const match = display.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return undefined;
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const month = months[match[1].slice(0, 3).toLowerCase()];
  if (!month) return undefined;
  return `${match[3]}-${month}-${match[2].padStart(2, "0")}`;
}

function faqPairs(faqs: readonly FaqEntry[] | undefined) {
  if (!Array.isArray(faqs)) return [];
  return faqs.flatMap((entry) => {
    const question = (entry.q ?? entry.question)?.trim();
    const answer = (entry.a ?? entry.answer)?.trim();
    if (!question || !answer) return [];
    return [{ question, answer }];
  });
}

export function buildOrganizationSchema(): JsonLdNode {
  const origin = siteOrigin();
  return node("Organization", {
    "@id": `${origin}/#organization`,
    name: site.name,
    url: origin,
    logo: absoluteUrl(assets.logo),
    description: site.description,
    email: site.email,
    telephone: site.phone,
    address: postalAddress(),
    openingHours: openingHours(),
  });
}

export function buildWebSiteSchema(): JsonLdNode {
  const origin = siteOrigin();
  return node("WebSite", {
    "@id": `${origin}/#website`,
    name: site.name,
    url: origin,
    description: site.description,
    publisher: { "@id": `${origin}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
}

export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): JsonLdNode | null {
  const crumbs = items.filter((item) => item.name.trim() && item.path.trim());
  if (crumbs.length === 0) return null;
  return node("BreadcrumbList", {
    itemListElement: crumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

export function buildFaqSchema(faqs: readonly FaqEntry[]): JsonLdNode | null {
  const pairs = faqPairs(faqs);
  if (pairs.length === 0) return null;
  return node("FAQPage", {
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: pair.answer,
      },
    })),
  });
}

export function buildProductSchema(source: OfferSource): JsonLdNode {
  const url = absoluteUrl(source.path);
  return node("Product", {
    "@id": `${url}#product`,
    name: source.name,
    description: source.description,
    url,
    image: source.image ? absoluteUrl(source.image) : undefined,
    sku: source.path.split("/").filter(Boolean).at(-1),
    category: source.category,
    offers: offerFor(source),
  });
}

export function buildProductPageSchema(product: Product, faqs: readonly FaqEntry[] = []): Array<JsonLdNode | null> {
  const path = `/products/${product.slug}`;
  return [
    buildProductSchema({
      name: product.name,
      description: product.description,
      path,
      image: product.image,
      price: product.price,
      category: categoryNames[product.category],
      variants: product.variants,
    }),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      shopParents[product.audience],
      { name: product.name, path },
    ]),
    buildFaqSchema(faqs),
  ];
}

export function buildLabPageSchema(
  lab: { slug: string; name: string; description: string; image?: string; price?: string },
  faqs: readonly FaqEntry[] = [],
): Array<JsonLdNode | null> {
  const path = `/labs/${lab.slug}`;
  return [
    buildProductSchema({
      name: lab.name,
      description: lab.description,
      path,
      image: lab.image,
      price: lab.price,
      category: "Labs",
    }),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: lab.name, path },
    ]),
    buildFaqSchema(faqs),
  ];
}

export function buildArticleSchema(article: Article, image?: string): JsonLdNode {
  const origin = siteOrigin();
  const path = `/articles/${article.slug}`;
  const url = absoluteUrl(path);
  return node("BlogPosting", {
    "@id": `${url}#article`,
    headline: article.title,
    description: article.excerpt,
    datePublished: isoDate(article.date),
    articleSection: article.category,
    image: image ? absoluteUrl(image) : undefined,
    url,
    mainEntityOfPage: url,
    author: {
      "@type": "Organization",
      name: "Leader Health Editorial Team",
      url: origin,
    },
    publisher: { "@id": `${origin}/#organization` },
  });
}

export function buildArticlePageSchema(article: Article, image?: string): Array<JsonLdNode | null> {
  const path = `/articles/${article.slug}`;
  return [
    buildArticleSchema(article, image),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Learn", path: "/blogs" },
      { name: article.title, path },
    ]),
    buildFaqSchema(article.faqs ?? []),
  ];
}

export function buildCollectionSchema(input: {
  name: string;
  description?: string;
  path: string;
  items: readonly CollectionEntry[];
}): JsonLdNode {
  const url = absoluteUrl(input.path);
  const items = input.items.filter((item) => item.name.trim() && item.path.trim());
  return node("CollectionPage", {
    "@id": `${url}#collection`,
    name: input.name,
    description: input.description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  });
}

export function buildCollectionPageSchema(input: {
  name: string;
  description?: string;
  path: string;
  items: readonly CollectionEntry[];
}): Array<JsonLdNode | null> {
  return [
    buildCollectionSchema(input),
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: input.name, path: input.path },
    ]),
  ];
}
