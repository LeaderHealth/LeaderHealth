import Image from "next/image";
import Link from "next/link";
import { articleCovers, publishedArticles } from "@/lib/content/articles";

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
    <section className="bg-white px-6 py-14">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center">
        <h2 className="max-w-[669px] text-center font-sans text-[40px] leading-[1.2] font-medium text-[#331110] sm:text-[48px] md:text-[56px]">
          Explore Our Library
        </h2>
        <p className="mt-1 max-w-[520px] text-center font-sans text-[16px] leading-snug text-[#6e5555] sm:text-[18px]">
          Expert insights, treatment breakdowns, and real answers to help you make informed decisions about your health.
        </p>
        <div className="mt-8 grid w-full max-w-[1128px] gap-[18px] md:grid-cols-3">
          {list.map((article) => {
            const cover = articleCovers[article.slug];
            return (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group flex flex-col gap-2.5 rounded-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                {cover ? (
                  <div className="relative aspect-[1200/896] overflow-hidden rounded-[13px]">
                    <Image
                      src={cover.src}
                      alt={cover.alt}
                      fill
                      sizes="(min-width: 768px) 364px, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100"
                    />
                  </div>
                ) : null}
                <h3 className="font-sans text-[20px] leading-[1.15] font-medium tracking-[-0.02em] text-[#321110] transition-colors duration-300 ease-out group-hover:text-[#e33d4d] group-focus-visible:text-[#e33d4d] motion-reduce:transition-none md:text-[24px]">
                  {article.title}
                </h3>
              </Link>
            );
          })}
        </div>
        <Link
          href="/blogs"
          className="group relative mt-8 inline-flex h-[47px] min-w-[148px] items-center justify-center overflow-hidden rounded-[39px] bg-[#DF4452] px-[26px] font-sans text-[16px] leading-none font-semibold tracking-[-0.02em] text-[#F7F3F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-full rounded-full bg-[#32120E] transition-transform duration-[400ms] ease-out group-hover:scale-[56] group-focus-visible:scale-[56] motion-reduce:scale-100! motion-reduce:transition-none"
          />
          <span className="relative z-10 whitespace-nowrap transition-transform duration-[400ms] ease-out group-hover:-translate-x-[15px] group-focus-visible:-translate-x-[15px] motion-reduce:translate-x-0! motion-reduce:transition-none">
            See More
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-0 z-10 -translate-y-1/2 translate-x-full transition-transform duration-[400ms] ease-out group-hover:translate-x-[calc(100%-35px)] group-focus-visible:translate-x-[calc(100%-35px)] motion-reduce:translate-x-full! motion-reduce:transition-none"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
