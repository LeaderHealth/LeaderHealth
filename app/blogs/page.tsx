import Image from "next/image";
import Link from "next/link";
import { BlogSection } from "@/components/blogs/BlogSection";
import { HeroTitleFade } from "@/components/HeroTitleFade";
import { blogArticles, blogCategories } from "@/components/blogs/content";
import { JsonLd } from "@/components/JsonLd";
import { publishedArticles } from "@/lib/content/articles";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learn" };

const title = "Learn More";
const intro = "Articles on treatment, dosing, and what the research actually says.";

export default function BlogsPage() {
  return (
    <div>
      <JsonLd
        data={buildCollectionPageSchema({
          name: title,
          description: intro,
          path: "/blogs",
          items: publishedArticles().map((article) => ({
            name: article.title,
            path: `/articles/${article.slug}`,
          })),
        })}
      />
      <section className="relative h-[75svh] min-h-[480px] overflow-hidden bg-[#1a090c] text-white">
        <Image
          src="/images/blog-learn-hero.jpg"
          alt="Runner wearing bib 33 sprinting through red smoke on a night track"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-16 text-center">
          <div className="relative isolate flex w-full max-w-[640px] flex-col items-center">
            <HeroTitleFade />
            <h1 className="relative z-10 font-sans text-[48px] font-medium leading-[0.95] tracking-[-0.03em] text-white sm:text-[64px] md:text-[80px]">
              Learn <span className="font-serif-italic font-normal tracking-normal">More</span>
            </h1>
            <p className="relative z-10 mt-4 max-w-[26rem] font-sans text-[15px] font-normal leading-snug text-white sm:text-[17px] md:mt-5 md:text-[18px]">
              {intro}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#e33d4d]" />
      </section>
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div className="mx-auto mt-10 grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/advanced-peptides"
            className="group relative flex h-[148px] items-end overflow-hidden rounded-[24px] px-5 pb-4 text-white shadow-[0_16px_36px_rgba(50,17,16,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <Image
              src="/images/advanced-peptides-hero.jpg"
              alt=""
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="380px"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#321110]/80 via-[#321110]/25 to-[#321110]/10" />
            <span className="relative flex w-full items-end justify-between gap-3">
              <span>
                <span className="block font-sans text-[11px] font-medium tracking-[0.16em] text-white/80">GUIDES</span>
                <span className="mt-1 block font-sans text-[22px] font-medium leading-none tracking-normal">Peptides</span>
              </span>
              <span className="inline-flex items-center gap-1 font-serif-italic text-[18px] leading-none text-white">
                explore
                <span aria-hidden className="inline-block font-sans not-italic transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                  →
                </span>
              </span>
            </span>
          </Link>
          <Link
            href="/energy-longevity"
            className="group relative flex h-[148px] items-end overflow-hidden rounded-[24px] px-5 pb-4 text-white shadow-[0_16px_36px_rgba(50,17,16,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <Image
              src="/images/energy-longevity-hero.jpg"
              alt=""
              fill
              className="object-cover object-[40%_center] transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="380px"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#321110]/80 via-[#321110]/25 to-[#321110]/10" />
            <span className="relative flex w-full items-end justify-between gap-3">
              <span>
                <span className="block font-sans text-[11px] font-medium tracking-[0.16em] text-white/80">GUIDES</span>
                <span className="mt-1 block font-sans text-[22px] font-medium leading-none tracking-normal">
                  Energy & Longevity
                </span>
              </span>
              <span className="inline-flex items-center gap-1 font-serif-italic text-[18px] leading-none text-white">
                explore
                <span aria-hidden className="inline-block font-sans not-italic transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                  →
                </span>
              </span>
            </span>
          </Link>
        </div>
      </div>
      <BlogSection articles={blogArticles()} categories={blogCategories} />
    </div>
  );
}
