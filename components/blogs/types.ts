export type BlogCategory = {
  id: string;
  label: string;
};

export type BlogArticle = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  date: string;
  authorName: string;
  authorImage: string;
  authorOccupation: string;
  categoryId: string;
  topic: string;
  slug: string;
  featured?: boolean;
};

export type BlogSectionProps = {
  articles: BlogArticle[];
  categories: BlogCategory[];
  selectedCategory?: string | null;
  featured?: boolean | null;
  onCategoryChange?: (categoryId: string | null) => void;
};
