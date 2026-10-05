import Image from "next/image";
import Link from "next/link";

export type FeaturedArticleCardProps = {
  image: string;
  authorImage: string;
  authorName: string;
  authorOccupation: string;
  articleTitle: string;
  articleDescription?: string;
  date?: string;
  time?: string;
  label?: string;
  href?: string;
};

const cardClass =
  "relative mx-auto block h-[475px] w-[330px] max-w-full overflow-hidden rounded-[24px] font-sans shadow-[0px_6px_6px_rgba(0,0,0,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink min-[810px]:h-[609px] min-[810px]:w-[692px] min-[1200px]:h-[455px] min-[1200px]:w-[1050px]";

export function FeaturedArticleCard({
  image,
  authorImage,
  authorName,
  authorOccupation,
  articleTitle,
  label = "Featured Blog",
  href,
}: FeaturedArticleCardProps) {
  const content = (
    <>
      {image ? (
        <Image src={image} alt={articleTitle} fill sizes="(min-width: 1200px) 1050px, (min-width: 810px) 692px, 330px" className="object-cover object-center" />
      ) : null}
      <span
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(180deg, rgba(50, 17, 16, 0.28) 0%, rgba(50, 17, 16, 0.05) 34%, rgba(50, 17, 16, 0.12) 58%, rgba(50, 17, 16, 0.78) 100%)" }}
      />
      {label ? (
        <span className="absolute top-6 left-5 z-[2] font-sans text-[17px] leading-[1.2] font-bold text-[#DDD3BE] min-[810px]:top-14 min-[810px]:left-12 min-[810px]:text-[23px] min-[1200px]:left-16">
          {label}
        </span>
      ) : null}
      <span className="absolute bottom-[88px] left-5 z-[2] w-[271px] max-w-[calc(100%-2.5rem)] text-left font-sans text-[14px] leading-[1.2] font-semibold tracking-normal text-[#DDD3BE] min-[810px]:bottom-[148px] min-[810px]:left-1/2 min-[810px]:w-[556px] min-[810px]:max-w-[calc(100%-6rem)] min-[810px]:-translate-x-1/2 min-[810px]:text-center min-[810px]:text-[21px] min-[1200px]:w-[851px] min-[1200px]:max-w-[calc(100%-8rem)]">
        {articleTitle}
      </span>
      <span className="absolute bottom-5 left-5 z-[2] flex items-center gap-2 min-[810px]:bottom-12 min-[810px]:left-12 min-[810px]:gap-3.5 min-[1200px]:left-16">
        <span className="relative h-[33px] w-[34px] shrink-0 overflow-hidden rounded-full border border-white/70 min-[810px]:size-[75px]">
          <Image src={authorImage} alt="" fill sizes="75px" className="object-cover object-top" />
        </span>
        <span className="leading-[1.2]">
          <span className="block font-sans text-[9px] font-semibold text-[#f9f9f9] min-[810px]:text-[13px]">{authorName}</span>
          <span className="mt-0.5 block font-sans text-[9px] font-semibold text-[#f9f9f9]/90 min-[810px]:mt-1 min-[810px]:text-[11px]">{authorOccupation}</span>
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
}
