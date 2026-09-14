import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle, publishedArticles } from "@/lib/content/articles";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article?.title ?? "Article" };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 pt-32">
      <p className="text-xs uppercase tracking-wider text-accent">{article.category}</p>
      <p className="mt-2 text-sm text-taupe">
        {article.date} · By Leader Health Editorial Team. Medically reviewed by Stephen Ratcliff, MD, MBA, Chief Medical Officer.
      </p>
      <h1 className="mt-4 text-4xl leading-tight md:text-5xl">{article.title}</h1>
      <p className="mt-6 text-lg text-brown">{article.excerpt}</p>
      <div className="mt-10 space-y-5 text-[17px] leading-relaxed text-brown">
        {article.body.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </div>
      <aside className="mt-12 rounded-3xl bg-white p-6">
        <h2 className="text-xl">About Medical Reviewer</h2>
        <p className="mt-3 text-sm text-taupe">
          Stephen Ratcliff, MD is the Chief Medical Officer of Leader Health and the board-certified physician responsible for clinical governance and medical content review across the platform.
        </p>
      </aside>
      <div className="mt-12">
        <h2 className="text-2xl">Keep reading</h2>
        <div className="mt-4 space-y-3">
          {publishedArticles()
            .filter((a) => a.slug !== article.slug)
            .slice(0, 3)
            .map((a) => (
              <Link key={a.slug} href={`/articles/${a.slug}`} className="block underline">
                {a.title}
              </Link>
            ))}
        </div>
      </div>
    </article>
  );
}
