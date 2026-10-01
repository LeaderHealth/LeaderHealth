import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewerCard } from "@/components/ReviewerCard";
import { articleCovers, articles, getArticle, publishedArticles } from "@/lib/content/articles";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

const reviewerPhoto =
  "https://framerusercontent.com/images/CBEORhbxaa9YtXhJqFi9Ce8oWS8.png?width=664&height=798";

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
              <p className="absolute right-3 bottom-3 hidden max-w-[220px] text-right text-[11px] leading-snug text-white/90 md:block">
                Image is AI-generated and does not represent actual results.
              </p>
            </div>
            <p className="mt-2 text-right text-[11px] leading-snug text-taupe md:hidden">
              Image is AI-generated and does not represent actual results.
            </p>
          </figure>
        ) : (
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-[13px] font-medium text-ink">
            {article.category}
          </p>
        )}

        <p className="mt-3 text-right text-[14px] text-taupe">{article.date}</p>
        <p className="mx-auto mt-6 max-w-[760px] text-center text-[13px] leading-relaxed text-taupe sm:text-[14px]">
          By Leader Health Editorial Team. Medically reviewed by Stephen Ratcliff, MD, MBA, Chief Medical Officer.
        </p>

        <div className="mx-auto mt-12 max-w-[782px] space-y-6 text-[16px] leading-[1.7] text-brown sm:mt-14 sm:text-[17px] sm:leading-[1.75]">
          {article.body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <ReviewerCard />
      </div>

      {related.length > 0 ? (
        <section className="mt-16 bg-[linear-gradient(180deg,#f0b4b8_0%,#e07d88_100%)] px-5 py-14 text-white sm:px-6 sm:py-16">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center font-sans text-[32px] leading-tight font-semibold tracking-[-0.02em] sm:text-[40px]">
              Keep reading
            </h2>
            <p className="mx-auto mt-2 max-w-[520px] text-center text-[15px] leading-snug text-white/95 sm:text-[17px]">
              Physician-reviewed insights on the topics that connect to your health goals.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
              {related.map((item) => {
                const itemCover = articleCovers[item.slug];
                return (
                  <Link
                    key={item.slug}
                    href={`/articles/${item.slug}`}
                    className="group flex flex-col rounded-[22px] bg-white p-3 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                  >
                    {itemCover ? (
                      <div className="relative aspect-[16/11] overflow-hidden rounded-[16px]">
                        <Image
                          src={itemCover.src}
                          alt={itemCover.alt}
                          fill
                          sizes="(min-width: 768px) 340px, 100vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                      </div>
                    ) : null}
                    <h3 className="mt-3 line-clamp-2 px-1 font-sans text-[18px] leading-[1.25] font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent motion-reduce:transition-none sm:text-[20px]">
                      {item.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-2.5 px-1">
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-[#ece7e4]">
                        <Image
                          src={reviewerPhoto}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover object-top"
                        />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-[13px] font-semibold">Stephen Ratcliff, MD</span>
                        <span className="block text-[12px] text-taupe">Chief Medical Officer</span>
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 px-1 pb-2 text-[13px] leading-relaxed text-taupe">
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
