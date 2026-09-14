import Link from "next/link";
import { publishedArticles } from "@/lib/content/articles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learn" };

export default function BlogsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-32">
      <h1 className="text-5xl">Learn More</h1>
      <p className="mt-4 max-w-xl text-taupe">
        Articles on treatment, dosing, and what the research actually says.
      </p>
      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/advanced-peptides" className="rounded-full bg-white px-4 py-2">
          PEPTIDES
        </Link>
        <Link href="/energy-longevity" className="rounded-full bg-white px-4 py-2">
          ENERGY & LONGEVITY
        </Link>
      </div>
      <div className="mt-12 space-y-6">
        {publishedArticles().map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="block rounded-3xl bg-white p-6 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-wider text-accent">{article.category}</p>
            <p className="mt-2 text-sm text-taupe">{article.date} · Stephen Ratcliff, MD · Chief Medical Officer</p>
            <h2 className="mt-2 text-2xl">{article.title}</h2>
            <p className="mt-3 text-brown">{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
