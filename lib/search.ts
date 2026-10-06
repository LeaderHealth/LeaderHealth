import { publishedArticles } from "@/lib/content/articles";
import { faqCategories } from "@/lib/content/faqs";
import { labs, products, type Category } from "@/lib/content/products";

export type SearchSection = "treatments" | "articles" | "faq" | "labs";

export type SearchHit = {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
};

const categoryLabels: Record<Category, string> = {
  hormone: "Hormone Therapy",
  sexual: "Sexual Health",
  longevity: "Longevity",
  "weight-loss": "Weight Loss",
};

const audienceLabels = {
  men: "Men",
  women: "Women",
  all: "",
} as const;

function snippet(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function treatmentCategory(category: Category, audience: "men" | "women" | "all") {
  const label = categoryLabels[category];
  const who = audienceLabels[audience];
  return who ? `${label} · ${who}` : label;
}

function textHasQuery(text: string, query: string) {
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const words = wordsOf(text);
  return tokens.every((token) => tokenMatches(words, token));
}

function preview(primary: string, secondary: string, query: string) {
  if (query && textHasQuery(secondary, query) && !textHasQuery(primary, query)) {
    return snippet(secondary);
  }
  return snippet(primary || secondary);
}

type IndexedHit = SearchHit & {
  section: SearchSection;
  fields: { text: string; weight: number }[];
};

function index(): IndexedHit[] {
  const treatments: IndexedHit[] = products
    .filter((product) => product.listed !== false)
    .map((product) => {
      const category = treatmentCategory(product.category, product.audience);
      const keywords = [
        product.seoTitle,
        product.eyebrow,
        product.badge,
        ...product.benefits.map((benefit) => benefit.title),
        ...(product.variants?.map((variant) => `${variant.name} ${variant.eyebrow ?? ""}`) ?? []),
      ]
        .filter(Boolean)
        .join(" ");
      return {
        id: product.slug,
        section: "treatments" as const,
        title: product.name,
        category,
        description: preview(product.tagline, product.description, ""),
        href: `/products/${product.slug}`,
        fields: [
          { text: product.name, weight: 10 },
          { text: category, weight: 6 },
          { text: keywords, weight: 4 },
          { text: `${product.tagline} ${product.description}`, weight: 2 },
        ],
      };
    });

  const articles: IndexedHit[] = publishedArticles().map((article) => ({
    id: article.slug,
    section: "articles" as const,
    title: article.title,
    category: article.category,
    description: snippet(article.excerpt),
    href: `/articles/${article.slug}`,
    fields: [
      { text: article.title, weight: 10 },
      { text: article.category, weight: 6 },
      { text: article.excerpt, weight: 3 },
      { text: article.body.join(" "), weight: 1 },
    ],
  }));

  const faq: IndexedHit[] = faqCategories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      section: "faq" as const,
      title: item.q,
      category: category.title,
      description: snippet(item.a),
      href: `/faq#${item.id}`,
      fields: [
        { text: item.q, weight: 10 },
        { text: category.title, weight: 5 },
        { text: item.a, weight: 2 },
      ],
    })),
  );

  const diagnosticLabs: IndexedHit[] = labs.map((lab) => ({
    id: lab.slug,
    section: "labs" as const,
    title: lab.name,
    category: `Diagnostic Labs · ${lab.price}`,
    description: snippet(`${lab.biomarkers}. ${lab.description}`),
    href: `/labs/${lab.slug}`,
    fields: [
      { text: lab.name, weight: 10 },
      { text: `Diagnostic Labs ${lab.biomarkers} ${lab.price}`, weight: 6 },
      { text: lab.description, weight: 2 },
    ],
  }));

  return [...treatments, ...articles, ...faq, ...diagnosticLabs];
}

const catalog = index();

function wordsOf(text: string) {
  return text.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
}

function tokenMatches(words: string[], token: string) {
  return words.some((word) => word.startsWith(token));
}

function fieldScore(text: string, query: string, tokens: string[], weight: number) {
  const words = wordsOf(text);
  if (words.length === 0) return 0;
  let score = 0;
  const hay = words.join(" ");
  if (hay === query) score += 6;
  else if (hay.startsWith(query)) score += 4;
  else if (words.some((word) => word === query || word.startsWith(query))) score += 3;

  for (const token of tokens) {
    if (words.some((word) => word === token)) score += 3;
    else if (tokenMatches(words, token)) score += 2;
  }
  return score * weight;
}

function scoreHit(hit: IndexedHit, query: string, tokens: string[]) {
  const words = wordsOf(hit.fields.map((field) => field.text).join(" "));
  if (!tokens.every((token) => tokenMatches(words, token))) return 0;
  return hit.fields.reduce((total, field) => total + fieldScore(field.text, query, tokens, field.weight), 0);
}

function withQueryPreview(hit: IndexedHit, query: string): SearchHit {
  if (hit.section === "treatments") {
    const product = products.find((item) => item.slug === hit.id);
    if (product) {
      return { ...hit, description: preview(product.tagline, product.description, query) };
    }
  }
  if (hit.section === "articles") {
    const article = publishedArticles().find((item) => item.slug === hit.id);
    if (article && query && !textHasQuery(article.excerpt, query) && textHasQuery(article.body.join(" "), query)) {
      const sentence = article.body.find((paragraph) => textHasQuery(paragraph, query));
      if (sentence) return { ...hit, description: snippet(sentence) };
    }
  }
  return hit;
}

export function searchHref(rawQuery: string) {
  const term = rawQuery.trim();
  return term ? `/search?q=${encodeURIComponent(term)}` : "/search";
}

const suggestionOrder: SearchSection[] = ["treatments", "articles", "faq", "labs"];

export function searchSuggestions(rawQuery: string, limit = 6): SearchHit[] {
  if (!rawQuery.trim()) return [];
  const grouped = searchSite(rawQuery);
  const picked: SearchHit[] = [];
  const seen = new Set<string>();

  let added = true;
  while (picked.length < limit && added) {
    added = false;
    for (const section of suggestionOrder) {
      const next = grouped[section].find((hit) => !seen.has(hit.href));
      if (!next) continue;
      seen.add(next.href);
      picked.push(next);
      added = true;
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

export function searchSite(rawQuery: string): Record<SearchSection, SearchHit[]> {
  const query = rawQuery.trim().toLowerCase();
  const grouped: Record<SearchSection, SearchHit[]> = {
    treatments: [],
    articles: [],
    faq: [],
    labs: [],
  };

  if (!query) {
    for (const hit of catalog) grouped[hit.section].push(hit);
    return grouped;
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  const ranked = catalog
    .map((hit) => ({ hit, score: scoreHit(hit, query, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title));

  for (const item of ranked) {
    grouped[item.hit.section].push(withQueryPreview(item.hit, query));
  }
  return grouped;
}
