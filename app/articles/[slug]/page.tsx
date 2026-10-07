import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBodyWithTableOfContents } from "@/components/articles/ArticleBodyWithTableOfContents";
import { ArticleRichText } from "@/components/articles/ArticleRichText";
import { FAQArticles } from "@/components/articles/FAQArticles";
import { ArticleExpertQuoteCard } from "@/components/ArticleExpertQuoteCard";
import { articleCovers, articles, getArticle, publishedArticles } from "@/lib/content/articles";
import { JsonLd } from "@/components/JsonLd";
import { buildArticlePageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

const reviewerPhoto =
  "https://framerusercontent.com/images/CBEORhbxaa9YtXhJqFi9Ce8oWS8.png?width=664&height=798";

const expertAuthorImage = "https://framerusercontent.com/images/fPuwIaRQp1eedTQb1QSnORO1oA.jpg";

const expertQuote =
  "Stephen Ratcliff, MD is the Chief Medical Officer of Leader Health and the board-certified physician responsible for clinical governance, medical content review, and regulatory oversight across the platform. Every article on the Leader Health blog is reviewed and approved by Dr. Ratcliff before publication.";

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

  const cover = articleCovers[article.slug];
  const related = publishedArticles()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <article>
      <JsonLd data={buildArticlePageSchema(article, cover?.src)} />
      <header
        className={`relative overflow-hidden bg-[#c96b74] px-6 pt-28 text-white sm:pt-36 md:pt-44 ${
          cover ? "pb-24 sm:pb-32 md:pb-40" : "pb-14 sm:pb-16"
        }`}
      >
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(196,84,98,0.82),rgba(168,62,78,0.88))]" />
        <div className="relative mx-auto max-w-[920px] text-center">
          <h1 className="font-sans text-[30px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-[40px] md:text-[48px]">
            {article.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[720px] text-[16px] leading-relaxed text-white/95 sm:text-[18px]">
            {article.excerpt}
          </p>
        </div>
      </header>

      <div
        className={`relative z-10 mx-auto max-w-[1080px] px-5 sm:px-6 ${
          cover ? "-mt-16 sm:-mt-24 md:-mt-28" : "pt-8"
        }`}
      >
        {cover ? (
          <figure>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-ink shadow-[0_18px_40px_rgba(50,17,16,0.12)] sm:rounded-[28px]">
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                priority
                sizes="(min-width: 1080px) 1032px, 100vw"
                className="object-cover"
              />
              <p className="absolute top-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[12px] font-medium text-ink sm:top-4 sm:left-4 sm:text-[13px]">
                {article.category}
              </p>
              <div className="absolute bottom-3 left-3 flex items-center gap-2.5 rounded-full bg-ink/45 py-1 pr-3 pl-1 text-white backdrop-blur-sm sm:bottom-4 sm:left-4 sm:gap-3 sm:pr-4">
                <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/20 sm:size-11">
                  <Image
                    src={reviewerPhoto}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover object-top"
                  />
                </span>
                <span className="leading-tight">
                  <span className="block text-[12px] font-semibold sm:text-[14px]">Stephen Ratcliff, MD</span>
                  <span className="block text-[11px] text-white/85 sm:text-[12px]">Chief Medical Officer</span>
                </span>
              </div>
              <p className="absolute right-4 bottom-4 hidden text-[11px] whitespace-nowrap text-white/90 min-[1000px]:block">
                Image is AI-generated and does not represent actual results.
              </p>
            </div>
            <p className="mt-2 text-right text-[11px] leading-snug text-taupe min-[1000px]:hidden">
              Image is AI-generated and does not represent actual results.
            </p>
          </figure>
        ) : (
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-[13px] font-medium text-ink">
            {article.category}
          </p>
        )}

        <div className="mt-4 flex items-start justify-between gap-4 text-[13px] text-taupe sm:gap-8 sm:text-[14px]">
          <p className="min-w-0 leading-snug">
            By Leader Health Editorial Team. Medically reviewed by Stephen Ratcliff, MD, MBA, Chief Medical Officer.
          </p>
          <p className="shrink-0 leading-snug">{article.date}</p>
        </div>

      </div>

      <div className="mt-12">
        <ArticleBodyWithTableOfContents
          content={<ArticleRichText blocks={article.blocks} paragraphs={article.body} />}
        />
      </div>

      {article.faqs?.length ? (
        <section className="mx-auto mt-16 w-full max-w-[827px] px-5 min-[810px]:px-[10px] min-[1200px]:px-0">
          <div className="flex flex-col items-center gap-9">
            <h2
              id="frequently-asked-questions"
              className="m-0 w-full scroll-mt-28 text-left font-sans text-[26px] leading-[1.1] font-semibold text-[#331110] min-[810px]:w-auto min-[810px]:text-center"
              style={{ letterSpacing: "-0.04em" }}
            >
              Frequently Asked Questions
            </h2>
            <FAQArticles fAQDataJSON={JSON.stringify(article.faqs)} />
          </div>
        </section>
      ) : null}

      <div className="mt-12 px-4 min-[810px]:px-6 min-[1100px]:px-10">
        <ArticleExpertQuoteCard
          heading={article.expert?.heading ?? "About Medical Reviewer"}
          quote={article.expert?.quote ?? expertQuote}
          authorImage={article.expert?.authorImage ?? expertAuthorImage}
          authorName={article.expert?.authorName ?? "Stephen Ratcliff, MD, MBA"}
          authorTitle={article.expert?.authorTitle ?? "CMO of Leader Health"}
        />
      </div>

      {related.length > 0 ? (
        <section className="px-4 pt-6 pb-16 min-[810px]:px-6 min-[1100px]:px-10">
          <div className="mx-auto max-w-[1140px] rounded-[28px] bg-[#ea8f9b] px-4 py-8 text-white min-[810px]:px-7 min-[810px]:py-10 min-[1100px]:px-10 min-[1100px]:py-12">
            <h2 className="max-w-[240px] font-sans text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] min-[810px]:mx-auto min-[810px]:max-w-none min-[810px]:text-center min-[810px]:text-[36px] min-[1100px]:text-[44px]">
              All related stories post
            </h2>
            <p className="mt-3 max-w-[340px] text-[14px] leading-snug text-white/95 min-[810px]:mx-auto min-[810px]:max-w-[560px] min-[810px]:text-center min-[810px]:text-[15px]">
              Keep reading — physician-reviewed insights on the topics that connect to your health goals.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 min-[810px]:grid-cols-3 min-[810px]:gap-4 min-[1100px]:mt-8 min-[1100px]:gap-5">
              {related.map((item) => {
                const itemCover = articleCovers[item.slug];
                return (
                  <Link
                    key={item.slug}
                    href={`/articles/${item.slug}`}
                    className="flex flex-col rounded-[18px] bg-white p-3 text-[#321110] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink min-[1100px]:p-3.5"
                  >
                    {itemCover ? (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[14px]">
                        <Image src={itemCover.src} alt={itemCover.alt} fill sizes="(min-width: 810px) 340px, 100vw" className="object-cover" />
                      </div>
                    ) : null}
                    <h3 className="mt-3 line-clamp-1 px-0.5 font-sans text-[15px] leading-snug font-semibold tracking-[-0.02em] min-[1100px]:text-[16px]">
                      {item.title}
                    </h3>
                    <span className="mt-2.5 flex items-center gap-2 px-0.5">
                      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-[#ece7e4]">
                        <Image src={reviewerPhoto} alt="" fill sizes="32px" className="object-cover object-top" />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate font-sans text-[12px] font-semibold text-[#321110]">Stephen Ratcliff, MD</span>
                        <span className="block truncate font-sans text-[11px] text-[#8a7370]">Chief Medical Officer</span>
                      </span>
                    </span>
                    <p className="mt-2.5 line-clamp-2 px-0.5 pb-1 font-sans text-[13px] leading-[1.45] text-[#6d5b58] min-[810px]:line-clamp-3">
                      {item.excerpt}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
