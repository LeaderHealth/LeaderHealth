"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArticleCard } from "./ArticleCard";
import { ArticleCardCompact } from "./ArticleCardCompact";
import { CategoryTabs } from "./CategoryTabs";
import { formatMediumDate } from "./content";
import { FeaturedArticleCard } from "./FeaturedArticleCard";
import { SidebarArticleCard } from "./SidebarArticleCard";
import type { BlogArticle } from "./types";
import type { BlogSectionProps } from "./types";

const headingContainer = {
  hidden: {},
  show: { transition: { delayChildren: 0.4, staggerChildren: 0.05 } },
};

const headingWord = {
  hidden: { opacity: 0, y: 10, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, duration: 0.4, bounce: 0 },
  },
};

const reveal = {
  duration: 0.4,
  ease: [0.44, 0, 0.56, 1] as const,
  delay: 0,
};

const layoutSpring = { type: "spring" as const, duration: 0.4, bounce: 0.2, delay: 0 };

const words = [
  { text: "New", italic: false },
  { text: "reads,", italic: true },
  { text: "fresh", italic: false },
  { text: "thinking.", italic: false },
];

const leadSlugs = [
  "hormone-replacement-therapy-perimenopause-guide",
  "testosterone-replacement-therapy-men-guide",
];

export function BlogSection({
  articles,
  categories,
  selectedCategory,
  featured = null,
  onCategoryChange,
}: BlogSectionProps) {
  const reduce = useReducedMotion();
  const controlled = onCategoryChange != null;
  const [internalCategory, setInternalCategory] = useState<string | null>(selectedCategory ?? "new");
  const category = controlled ? (selectedCategory ?? "new") : internalCategory;

  function changeCategory(next: string | null) {
    if (!controlled) setInternalCategory(next);
    onCategoryChange?.(next);
  }

  const filtered = useMemo(() => {
    if (!category || category === "new") return articles;
    return articles.filter((article) => article.categoryId === category);
  }, [articles, category]);

  const featuredArticle =
    featured === false ? null : (filtered.find((article) => article.featured) ?? (featured === true ? filtered[0] : null));

  const library = filtered.filter((article) => article.id !== featuredArticle?.id);
  const pinnedLead = leadSlugs.flatMap((slug) => {
    const article = library.find((item) => item.slug === slug);
    return article ? [article] : [];
  });
  const lead = pinnedLead.length === 2 ? pinnedLead : library.slice(0, 2);
  const sidebar = library.filter((article) => !lead.some((item) => item.id === article.id)).slice(0, 3);
  const desktopGrid = library.filter((article) => !lead.some((item) => item.id === article.id));
  const mobileGrid = library.filter((article) => !sidebar.some((item) => item.id === article.id));
  const featuredOnly = featured === true;

  return (
    <section className="mx-auto w-full max-w-[1145px] px-4 pt-[50px] pb-16 min-[810px]:px-6 min-[1100px]:px-0">
      <motion.div layout transition={layoutSpring} className="flex w-full flex-col gap-8 rounded-[16px]">
        {!featuredOnly ? (
          <div className="hidden grid-cols-[293px_293px_293px] justify-between gap-y-[30px] min-[1100px]:grid">
            <div className="col-span-2 self-center">
              <SectionHeading reduce={reduce} className="text-left text-[48px] leading-none min-[1280px]:text-[56px]" />
            </div>
            <div className="self-center">
              <CategoryTabs categories={categories} selectedCategory={category} onChange={changeCategory} />
            </div>
            {lead.map((article) => (
              <CompactGridCard key={article.id} article={article} />
            ))}
            {sidebar.length > 0 ? (
              <div className="flex h-full flex-col justify-between gap-4 py-1">
                {sidebar.map((article) => (
                  <SidebarArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div />
            )}
            {desktopGrid.map((article) => (
              <CompactGridCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="hidden min-[1100px]:block">
            <SectionHeading reduce={reduce} className="text-left text-[48px] leading-none min-[1280px]:text-[56px]" />
          </div>
        )}

        <div className="flex flex-col gap-5 min-[810px]:items-center min-[1100px]:hidden">
          <div className="flex w-full justify-start">
            <CategoryTabs categories={categories} selectedCategory={category} onChange={changeCategory} />
          </div>
          {sidebar.length > 0 && !featuredOnly ? <ArticleTicker articles={sidebar} paused={Boolean(reduce)} /> : null}
          <SectionHeading reduce={reduce} className="max-w-[333px] text-left text-[30px] leading-[1.1] min-[810px]:max-w-[712px] min-[810px]:text-center min-[810px]:text-[48px] min-[810px]:leading-[1.05]" />
        </div>

        {!featuredOnly && mobileGrid.length > 0 ? (
          <motion.div
            className="hidden w-full grid-cols-[293px_293px] justify-center gap-x-5 gap-y-[30px] min-[810px]:grid min-[1100px]:hidden"
            initial={reduce ? false : { opacity: 0, y: 150 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: "some" }}
            transition={reveal}
          >
            {mobileGrid.map((article) => (
              <CompactGridCard key={article.id} article={article} />
            ))}
          </motion.div>
        ) : null}

        {!featuredOnly && mobileGrid.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-x-[19px] gap-y-[37px] min-[810px]:hidden">
            {mobileGrid.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : null}

        {mobileGrid.length === 0 && desktopGrid.length === 0 && lead.length === 0 && !featuredArticle ? (
          <p className="py-10 font-sans text-[15px] text-[#6e5555]">No articles in this category yet.</p>
        ) : null}

        {featuredArticle ? (
          <FeaturedArticleCard
            image={featuredArticle.image}
            authorImage={featuredArticle.authorImage}
            authorName={featuredArticle.authorName}
            authorOccupation={featuredArticle.authorOccupation}
            articleTitle={featuredArticle.title}
            articleDescription={featuredArticle.description}
            date={featuredArticle.date}
            label="Featured Blog"
            href={`/articles/${featuredArticle.slug}`}
          />
        ) : null}
      </motion.div>
    </section>
  );
}

function CompactGridCard({ article }: { article: BlogArticle }) {
  return (
    <ArticleCardCompact
      blogTitle={article.title}
      blogDescription={article.description}
      blogImage={article.image}
      blogDate={formatMediumDate(article.date)}
      blogAuthor={article.authorName}
      blogAuthorImage={article.authorImage}
      blogAuthorOccupation={article.authorOccupation}
      href={`/articles/${article.slug}`}
    />
  );
}

function ArticleTicker({ articles, paused }: { articles: BlogArticle[]; paused: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || paused) return;

    const apply = () => {
      const distance = track.scrollWidth / 2;
      if (!distance) return;
      const pxPerSecond = window.innerWidth < 810 ? 80 : 100;
      track.style.animationDuration = `${distance / pxPerSecond}s`;
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(track);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [paused, articles]);

  return (
    <div className="relative w-full overflow-hidden min-[810px]:w-[755px] min-[810px]:max-w-full">
      <div ref={trackRef} className={`flex w-max items-center ${paused ? "" : "article-ticker-track"}`}>
        <TickerGroup articles={articles} />
        {paused ? null : <TickerGroup articles={articles} copy />}
      </div>
    </div>
  );
}

function TickerGroup({ articles, copy = false }: { articles: BlogArticle[]; copy?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-[10px] pr-[10px]" aria-hidden={copy || undefined} inert={copy || undefined}>
      {articles.map((article) => (
        <SidebarArticleCard key={copy ? `${article.id}-copy` : article.id} article={article} />
      ))}
    </div>
  );
}

function SectionHeading({ reduce, className }: { reduce: boolean | null; className: string }) {
  return (
    <motion.h2
      aria-label="New reads, fresh thinking."
      className={`font-sans font-medium tracking-[-0.04em] text-[#321110] ${className}`}
      variants={headingContainer}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
    >
      {words.map((word) => (
        <motion.span
          key={word.text}
          variants={reduce ? undefined : headingWord}
          className={`mr-[0.28em] inline-block ${word.italic ? "font-serif-italic font-normal tracking-normal text-[#e23d4c]" : ""}`}
        >
          {word.text}
        </motion.span>
      ))}
    </motion.h2>
  );
}
