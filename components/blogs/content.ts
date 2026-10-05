import { articleCovers, publishedArticles } from "@/lib/content/articles";
import type { BlogArticle, BlogCategory } from "./types";

export const blogAuthor = {
  authorName: "Stephen Ratcliff, MD",
  authorImage: "https://framerusercontent.com/images/CBEORhbxaa9YtXhJqFi9Ce8oWS8.png?width=664&height=798",
  authorOccupation: "Chief Medical Officer",
};

export const blogCategories: BlogCategory[] = [
  { id: "new", label: "New Released" },
  { id: "popular", label: "Popular" },
  { id: "hot", label: "Hot topics" },
];

const featuredSlug = "stopping-glp-1-maintenance-decision-guide";

function categoryIdFor(category: string, title: string) {
  if (/peptide|sermorelin|bremelanotide|pt-141|longevity|glutathione|nad/i.test(`${category} ${title}`)) return "hot";
  return "popular";
}

export function formatMediumDate(date: string | Date) {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return String(date);
  return value.toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function blogArticles(): BlogArticle[] {
  return publishedArticles()
    .map((article) => {
      const cover = articleCovers[article.slug];
      return {
        id: article.slug,
        title: article.title,
        description: article.excerpt,
        image: cover?.src ?? "",
        imageAlt: cover?.alt ?? article.title,
        date: article.date,
        ...blogAuthor,
        categoryId: categoryIdFor(article.category, article.title),
        topic: article.category,
        slug: article.slug,
        featured: article.slug === featuredSlug,
      };
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
