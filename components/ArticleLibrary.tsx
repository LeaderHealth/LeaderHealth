import Link from "next/link";
import { publishedArticles } from "@/lib/content/articles";

export function ArticleLibrary({
  limit = 3,
  slugs,
}: {
  limit?: number;
  slugs?: string[];
}) {
  const all = publishedArticles();
  const list = slugs
    ? slugs.flatMap((slug) => {
        const article = all.find((a) => a.slug === slug);
        return article ? [article] : [];
      })
    : all.slice(0, limit);

  return (
    <section className="bg-background px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl">Explore Our Library</h2>
        <p className="mt-3 max-w-xl text-taupe">
          Expert insights, treatment breakdowns, and real answers to help you make informed decisions about your health.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {list.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-xl leading-snug">{article.title}</h3>
            </Link>
          ))}
        </div>
        <Link href="/blogs" className="mt-8 inline-flex text-sm font-medium underline">
          See More
        </Link>
      </div>
    </section>
  );
}
