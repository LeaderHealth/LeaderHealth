import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/content/products";
import { productFaqs, tirzepatideFaqs, tadalafilFaqs } from "@/lib/content/faqs";
import { ProductHero } from "@/components/ProductHero";
import { PriceCompare } from "@/components/PriceCompare";
import { ProductVariants } from "@/components/ProductVariants";
import { Testimonials } from "@/components/Testimonials";
import { ArticleLibrary } from "@/components/ArticleLibrary";
import { FaqList } from "@/components/FaqList";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function faqsFor(slug: string) {
  if (slug === "weight-loss-tirzepatide") return tirzepatideFaqs;
  if (slug === "men-sexual-health-tadalafil") return tadalafilFaqs;
  return productFaqs;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product?.seoTitle ?? product?.name ?? "Treatment" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <ProductHero product={product} />
      {product.compare !== false && <PriceCompare />}
      <Testimonials variant="featured" />
      {product.variants && <ProductVariants product={product} />}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl">FAQ: We&apos;ve Got Answers.</h2>
          <div className="mt-8">
            <FaqList items={product.faqs ?? faqsFor(slug)} />
          </div>
        </div>
      </section>
      <ArticleLibrary
        slugs={[
          "semaglutide-vs-tirzepatide-comparison-guide",
          "recovery-peptides-anti-doping-sourcing-guide",
          "low-libido-in-women-causes-evaluation-guide",
        ]}
      />
    </>
  );
}
